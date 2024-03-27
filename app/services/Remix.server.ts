import { HttpServer } from "@effect/platform";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Params as RemixParams } from "@remix-run/react";
import { Context, Effect, Layer, ManagedRuntime } from "effect";
import { Auth, Session } from "./Auth.server";
import { MigratorLive } from "./Database.server";

const AppLayer = Layer.merge(
  Auth.layer,
  MigratorLive,
);

const runtime = ManagedRuntime.make(AppLayer);

Effect.once;

interface Params {
  readonly _: unique symbol;
}
const Params = Context.GenericTag<Params, RemixParams>("@services/Params");

type AppEnv = Layer.Layer.Success<typeof Auth.layer>;

type RequestEnv = HttpServer.request.ServerRequest | Params | Session;

export interface RemixHandler<E, R> extends
  Effect.Effect<
    HttpServer.response.ServerResponse,
    E | HttpServer.response.ServerResponse,
    R | AppEnv | RequestEnv
  >
{}

export const makeServerContext = (args: LoaderFunctionArgs | ActionFunctionArgs) =>
  Layer.provideMerge(
    Session.layer,
    Layer.succeedContext(
      Context.empty().pipe(
        Context.add(HttpServer.request.ServerRequest, HttpServer.request.fromWeb(args.request)),
        Context.add(Params, args.params),
      ),
    ),
  );

export const loader =
  <E, R extends AppEnv | RequestEnv>(effect: RemixHandler<E, R>) => async (args: LoaderFunctionArgs) =>
    effect.pipe(
      Effect.map(HttpServer.response.toWeb),
      Effect.provide(makeServerContext(args)),
      runtime.runPromise,
    );

export const loaderGen: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <Eff extends Effect.EffectGen<any, any, AppEnv | RequestEnv>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    f: (resume: Effect.Adapter) => Generator<Eff, HttpServer.response.ServerResponse, any>,
  ): (args: LoaderFunctionArgs) => Promise<Response>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <Self, Eff extends Effect.EffectGen<any, any, AppEnv | RequestEnv>>(
    self: Self,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    f: (this: Self, resume: Effect.Adapter) => Generator<Eff, HttpServer.response.ServerResponse, any>,
  ): (args: LoaderFunctionArgs) => Promise<Response>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} = (...args: [any]) => loader(Effect.gen(...args));

export const action = <E>(effect: RemixHandler<E, Env>) => async (args: ActionFunctionArgs) =>
  effect.pipe(
    Effect.map(HttpServer.response.toWeb),
    Effect.provide(makeServerContext(args)),
    runtime.runPromise,
  );
