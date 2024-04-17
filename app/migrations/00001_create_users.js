import * as Sql from "@effect/sql-sqlite-node";
import * as Effect from "effect/Effect";

export default Effect.flatMap(
  Sql.client.SqliteClient,
  sql =>
    sql`
      CREATE TABLE users (
        user_id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        bio TEXT NOT NULL,
        image TEXT,

        password_hash TEXT NOT NULL,

        created_at DATETIME NOT NULL DEFAULT current_timestamp,
        updated_at DATETIME NOT NULL DEFAULT current_timestamp
      )
    `,
);
