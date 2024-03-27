import { Schema } from "@effect/schema";
import * as Sqlite from "@sqlfx/sqlite/Client";
import { Effect } from "effect";

export class User extends Schema.Class<User>("@schema/User")({
  id: Schema.propertySignature(Schema.string).pipe(Schema.fromKey("user_id")),
  email: Schema.string,
  username: Schema.string,
  bio: Schema.string,
  image: Schema.optionFromNullable(Schema.string),

  created_at: Schema.Date,
  updated_at: Schema.Date,
}) {
  readonly _tag = "User";
}

export const make = Effect.gen(function*($) {
  const sql = yield* $(Sqlite.tag);

  const userById = sql.resolverId("UserById", {
    id: Schema.string,
    result: User,
    resultId: _ => _.user_id,
    run: reqs => sql`SELECT * FROM users WHERE user_id IN ${sql(reqs)}`,
  });

  const userByEmail = sql.resolverId("UserByEmail", {
    id: Schema.string,
    resultId: _ => _.email,
    result: User,
    run: reqs => sql`SELECT * FROM users WHERE email IN ${sql(reqs)}`,
  });

  const getById = (id: string) =>
    userById.execute(id).pipe(
      Effect.tap(u =>
        Effect.ignore(
          Effect.flatMap(u, _ => userByEmail.populateCache(_.email, u)),
        )
      ),
    );

  const getByEmail = (email: string) =>
    userByEmail.execute(email).pipe(
      Effect.tap(u =>
        Effect.ignore(
          Effect.flatMap(u, _ => userById.populateCache(_.id, u)),
        )
      ),
    );

  return {
    getById,
    getByEmail,
  };
});

export class Users extends Effect.Tag("@services/Users")<Users, Effect.Effect.Success<typeof make>>() {}
