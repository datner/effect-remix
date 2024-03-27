import * as Sql from "@sqlfx/sqlite/Client";
import * as Effect from "effect/Effect";

export default Effect.flatMap(
  Sql.tag,
  sql =>
    sql`
      CREATE TABLE comments (
        comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_id TEXT,

        body TEXT NOT NULL,

        created_at DATETIME NOT NULL DEFAULT current_timestamp,
        updated_at DATETIME NOT NULL DEFAULT current_timestamp,

        FOREIGN KEY (author_id)
        REFERENCES users (user_id) 
           ON UPDATE CASCADE
           ON DELETE CASCADE
      )`,
);
