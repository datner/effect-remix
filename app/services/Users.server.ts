import { HttpServer } from "@effect/platform";
import { Schema } from "@effect/schema";
import * as Sql from "@effect/sql-sqlite-node";
import { Console, Effect, Layer, Option } from "effect";
import { User, UserUpdate } from "~/models/User";
import { SqliteLive } from "./Database.server";

export const make = Effect.gen(function*($) {
  const sql = yield* $(Sql.client.SqliteClient);

  const userById = yield* $(Sql.resolver.findById("UserById", {
    Id: Schema.String,
    Result: User,
    ResultId: _ => _.id,
    execute: ids => sql`SELECT * FROM users WHERE user_id IN ${sql.in(ids)}`,
  }));

  const userByEmail = yield* $(Sql.resolver.findById("UserByEmail", {
    Id: Schema.String,
    ResultId: _ => _.email,
    Result: User,
    execute: emails => sql`SELECT * FROM users WHERE email IN ${sql.in(emails)}`,
  }));

  const getById = (id: string) =>
    userById.execute(id).pipe(
      Effect.tap(u =>
        Effect.ignore(
          Effect.flatMap(u, _ => userByEmail.cachePopulate(_.email, u)),
        )
      ),
    );

  const getByEmail = (email: string) =>
    userByEmail.execute(email).pipe(
      Effect.tap(u =>
        Effect.ignore(
          Effect.flatMap(u, _ => userById.cachePopulate(_.id, u)),
        )
      ),
    );

  const insertUser = Sql.schema.single({
    Request: User,
    Result: User,
    execute: u => sql`INSERT INTO users ${sql.insert(u)}`,
  });

  const updateUser = Sql.schema.single({
    Request: UserUpdate,
    Result: User,
    execute: u =>
      sql`
UPDATE users 
SET ${sql.update(u, ["userId", "_tag"])}
WHERE user_id = ${u.userId}
`,
  });

  const update = (user: UserUpdate) =>
    updateUser(user).pipe(
      Effect.tap(u => userById.cachePopulate(u.id, Option.some(u))),
      Effect.tap(u => userByEmail.cachePopulate(u.email, Option.some(u))),
      Effect.tapError(Console.error),
      Effect.mapError(() => HttpServer.response.empty({ status: 400 })),
      Effect.withSpan("Users.update"),
    );

  const make = (user: User) =>
    insertUser(user).pipe(
      Effect.tap(u => userById.cachePopulate(u.id, Option.some(u))),
      Effect.tap(u => userByEmail.cachePopulate(u.email, Option.some(u))),
      Effect.tapError(Console.error),
      Effect.mapError(() => HttpServer.response.empty({ status: 400 })),
      Effect.withSpan("Users.make"),
    );

  return {
    getById,
    getByEmail,
    update,
    make,
  };
});

export class Users extends Effect.Tag("@services/Users")<Users, Effect.Effect.Success<typeof make>>() {
  static live = Layer.effect(this, make);
  static layer = Layer.provide(this.live, SqliteLive);
}
