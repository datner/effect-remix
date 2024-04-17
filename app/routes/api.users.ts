import { HttpServer } from "@effect/platform";
import { Method } from "@effect/platform/Http/Method";
import { Schema } from "@effect/schema";
import { Effect, Match, Option, Struct } from "effect";
import { Email, User } from "~/models/User";
import { Auth } from "~/services/Auth.server";
import { Password } from "~/services/Password.server";
import { Remix } from "~/services/prelude.server";
import { Users } from "~/services/Users.server";

export class UserDto extends Schema.TaggedClass<UserDto>("@schema/User/Dto")("UserDto", {
  user: Schema.Struct({
    ...Struct.omit(User.fields, "createdAt", "id", "updatedAt", "passwordHash"),
    token: Schema.String,
  }),
}) {}

export class RegisterPayload extends Schema.Class<RegisterPayload>("@schema/api/users#POST")({
  user: Schema.Struct({
    username: Schema.String,
    email: Email,
    password: Schema.String,
  }),
}) {}

export const action = Remix.unwrapActionGen(function*($) {
  const users = yield* $(Users);
  const password = yield* $(Password);
  const auth = yield* $(Auth);

  const response = HttpServer.response.schemaJson(UserDto);

  const POST = Effect.gen(function*($) {
    const payload = yield* $(HttpServer.request.schemaBodyJson(RegisterPayload));
    const passwordHash = yield* $(password.hash(payload.user.password));
    const user = yield* $(users.make(User.make({
      email: payload.user.email,
      username: payload.user.username,
      passwordHash,
      bio: "",
      image: Option.none(),
    })));
    const session = yield* $(auth.currentSession);
    yield* $(session.set("userId", user.id));

    return yield* $(response(new UserDto({ user: { ...user, token: yield* $(session.export) } })));
  });

  const handlers = Match.type<Method>().pipe(
    Match.when("POST", () => POST),
    Match.orElse(() =>
      Effect.fail(HttpServer.response.empty({
        headers: HttpServer.headers.fromInput({
          "Allow": "POST",
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
