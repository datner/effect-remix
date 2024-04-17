import { HttpServer } from "@effect/platform";
import { Method } from "@effect/platform/Http/Method";
import { Schema } from "@effect/schema";
import { Effect, Match } from "effect";
import { Email, UserUpdate } from "~/models/User";
import { Auth } from "~/services/Auth.server";
import { Remix } from "~/services/prelude.server";
import { Users } from "~/services/Users.server";
import { UserDto } from "./api.users";

export class UpdateUserPayload extends Schema.Class<UpdateUserPayload>("@schema/api/users#PUT")({
  user: Schema.Struct({
    email: Email,
  }),
}) {}

export const action = Remix.unwrapActionGen(function*($) {
  const users = yield* $(Users);
  const auth = yield* $(Auth);

  const response = HttpServer.response.schemaJson(UserDto);

  const PUT = Effect.gen(function*($) {
    const session = yield* $(auth.currentSession);
    const id = yield* $(Effect.flatten(session.get("userId")));
    const payload = yield* $(HttpServer.request.schemaBodyJson(UpdateUserPayload));

    const user = yield* $(users.update(UserUpdate.make({ id, email: payload.user.email })));
    yield* $(session.set("userId", user.id));

    return yield* $(response(new UserDto({ user: { ...user, token: yield* $(session.export) } })));
  }).pipe(Effect.withSpan("PUT /api/user"));

  const handlers = Match.type<Method>().pipe(
    Match.when("PUT", () => PUT),
    Match.orElse(() =>
      Effect.fail(HttpServer.response.empty({
        headers: HttpServer.headers.fromInput({
          "Allow": "PUT",
        }),
        status: 405,
      }))
    ),
  );
  return HttpServer.request.ServerRequest.pipe(
    Effect.map(_ => _.method),
    Effect.flatMap(handlers),
  );
});

export const loader = Remix.unwrapLoaderGen(function*($) {
  const users = yield* $(Users);
  const auth = yield* $(Auth);

  const response = HttpServer.response.schemaJson(UserDto);

  return Effect.gen(function*($) {
    const session = yield* $(auth.currentSession);
    const user = yield* $(
      session.get("userId"),
      Effect.flatten,
      Effect.flatMap(users.getById),
      Effect.flatten,
    );

    return yield* $(response(new UserDto({ user: { ...user, token: yield* $(session.export) } })));
  }).pipe(Effect.withSpan("GET /api/user"));
});
