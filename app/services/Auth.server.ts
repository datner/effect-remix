import { HttpServer } from "@effect/platform";
import { Schema } from "@effect/schema";
import { createCookieSessionStorage, Session as RemixSession } from "@remix-run/node";
import { Config, Context, Duration, Effect, Equal, Layer, Option } from "effect";
import { redirect } from "./utils.server";

class SessionData
  extends Schema.TaggedClass<SessionData>("@schema/SessionData")("SessionData", { test: Schema.string })
{
}

type FlashDataKey<Key extends string> = `__flash_${Key}__`;
export type FlashSessionData<Data, FlashData> = Partial<
  & Data
  & {
    [Key in keyof FlashData as FlashDataKey<Key & string>]: FlashData[Key];
  }
>;

export const IsProd = Config.string("node.env").pipe(
  Config.withDefault("production"),
  Config.map(Equal.equals("production")),
);

const Cookie = Schema.struct({
  cookie: Schema.optional(Schema.string, { as: "Option" }),
});

export const make = Effect.gen(function*($) {
  const isProd = yield* $(IsProd);
  const secret = yield* $(Config.string("SESSION_SECRET"));
  const storage = createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [secret],
      secure: isProd,
    },
  });

  const sessionFromSelf = (session: RemixSession<SessionData>) => {
    const sess: Context.Tag.Service<Session> = {
      source: session,
      get: _ => Effect.sync(() => Option.fromNullable(session.get(_) as never)),
      set: (n, v) => Effect.sync(() => session.set(n, v)),
      unset: (n) => Effect.sync(() => session.unset(n)),
      has: (n) => Effect.sync(() => session.has(n)),
      flash: (n, v) => Effect.sync(() => session.flash(n, v)),
      id: session.id,
      data: session.data as never,
      get logout() {
        return redirect("/login").pipe(
          destroySessionCookie,
          Effect.provideService(Session, sess),
        );
      },
      get initialize(): Effect.Effect<HttpServer.response.ServerResponse> {
        return redirect("/").pipe(
          setSessionCookie("7 days"),
          Effect.provideService(Session, sess),
        );
      },
    };
    return sess;
  };

  const sessionFromCookie = HttpServer.request.schemaHeaders(Cookie).pipe(
    Effect.flatMap(_ => _.cookie),
    Effect.andThen(storage.getSession),
    Effect.map(sessionFromSelf),
    Effect.orDie, // Sessions always exist (?)
  );

  const setSessionCookie = (maxAge?: Duration.DurationInput) => (req: HttpServer.response.ServerResponse) =>
    Session.pipe(
      Effect.andThen(_ =>
        storage.commitSession(_.source, {
          maxAge: maxAge ? Duration.toSeconds(maxAge) : undefined,
        })
      ),
      Effect.map(_ => HttpServer.response.setHeader(req, "Set-Cookie", _)),
      Effect.orDie,
    );

  const destroySessionCookie = (req: HttpServer.response.ServerResponse) =>
    Session.pipe(
      Effect.andThen(_ => storage.destroySession(_.source)),
      Effect.map(_ => HttpServer.response.setHeader(req, "Set-Cookie", _)),
      Effect.orDie,
    );

  return {
    sessionFromCookie,
    setSessionCookie,
    destroySessionCookie,
  };
});

export class Auth extends Effect.Tag("@services/Auth")<Auth, Effect.Effect.Success<typeof make>>() {
  static live = Layer.effect(this, make);
  static layer = this.live;
}

export class Session extends Context.Tag("@services/Session")<Session, {
  source: RemixSession<SessionData>;
  get: <Key extends keyof SessionData>(name: Key) => Effect.Effect<Option.Option<SessionData[Key]>>;
  set: <Key extends keyof SessionData>(
    name: Key,
    value: Schema.Struct.Encoded<typeof SessionData["fields"]>[Key],
  ) => Effect.Effect<void>;
  unset: <Key extends keyof SessionData>(name: Key) => Effect.Effect<void>;
  has: <Key extends keyof SessionData>(name: Key) => Effect.Effect<boolean>;
  flash: <Key extends keyof SessionData>(
    name: Key,
    value: Schema.Struct.Encoded<typeof SessionData["fields"]>[Key],
  ) => Effect.Effect<void>;
  id: string;
  data: FlashSessionData<SessionData, SessionData>;
  logout: Effect.Effect<HttpServer.response.ServerResponse>;
  initialize: Effect.Effect<HttpServer.response.ServerResponse>;
}>() {
  static live = Layer.effect(this, Auth.sessionFromCookie);
  static layer = Layer.provide(this.live, Auth.layer);
}
