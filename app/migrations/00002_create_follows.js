import * as Sql from "@sqlfx/sqlite/Client";
import * as Effect from "effect/Effect";

export default Effect.flatMap(
  Sql.tag,
  sql =>
    sql`
      CREATE TABLE follows (
        follower_id TEXT NOT NULL,
        followee_id TEXT NOT NULL,

        created_at DATETIME NOT NULL DEFAULT current_timestamp,
        updated_at DATETIME NOT NULL DEFAULT current_timestamp,

        FOREIGN KEY (follower_id)
        REFERENCES users (user_id) 
           ON UPDATE CASCADE
           ON DELETE CASCADE,

        FOREIGN KEY (followee_id)
        REFERENCES users (user_id) 
           ON UPDATE CASCADE
           ON DELETE CASCADE,

        UNIQUE(follower_id, followee_id)
      )`,
);
