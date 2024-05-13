import { HttpServer } from "@effect/platform";
import { Schema } from "@effect/schema";
import { Effect } from "effect";
import { Email } from "~/models/User";
import { Auth, Password, Remix, Users } from "~/services.server/prelude";
import { UserDto } from "./api.users";

export class LoginPayload extends Schema.Class<LoginPayload>("@schema/api/users/login")({
  user: Schema.Struct({
    email: Email,
    password: Schema.String,
  }),
}) {}

export const action = Remix.unwrapActionGen(function*() {
  const users = yield* Users.Users;
  const password = yield* Password.Password;
  const auth = yield* Auth.Auth;
  const response = HttpServer.response.schemaJson(UserDto);
  return Effect.gen(function*() {
    const payload = yield* HttpServer.request.schemaBodyJson(LoginPayload);
    const session = yield* auth.currentSession;
    const user = yield* Effect.flatten(users.getByEmail(payload.user.email));
    yield* password.validate(payload.user.password, user.passwordHash);
    yield* session.set("userId", user.id);
    console.log(session.data);

    return yield* response(new UserDto({ user: { ...user, token: yield* session.export } }));
  });
});
