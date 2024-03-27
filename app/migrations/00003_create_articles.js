import * as Sql from "@sqlfx/sqlite/Client";
import * as Effect from "effect/Effect";

export default Effect.flatMap(
  Sql.tag,
  sql =>
    sql.withTransaction(Effect.all([
      sql`
      CREATE TABLE tags (
        tag_id TEXT PRIMARY KEY NOT NULL,
        name TEXT
      )`,
      sql`
      CREATE TABLE articles (
        article_id TEXT PRIMARY KEY NOT NULL,
        author_id TEXT,

        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        body TEXT NOT NULL,

        created_at DATETIME NOT NULL DEFAULT current_timestamp,
        updated_at DATETIME NOT NULL DEFAULT current_timestamp,

        FOREIGN KEY (author_id)
        REFERENCES users (user_id) 
           ON UPDATE CASCADE
           ON DELETE SET NULL
      )`,
      sql`
      CREATE TABLE article_tags (
        article_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,

        FOREIGN KEY (article_id)
        REFERENCES articles (article_id) 
           ON UPDATE CASCADE
           ON DELETE SET NULL,

        FOREIGN KEY (tag_id)
        REFERENCES tags (tag_id) 
           ON UPDATE CASCADE
           ON DELETE SET NULL,

        UNIQUE(article_id, tag_id)
      )`,
      sql`
      CREATE TABLE liked_articles (
        article_id TEXT NOT NULL,
        user_id TEXT NOT NULL,

        FOREIGN KEY (article_id)
        REFERENCES articles (article_id) 
           ON UPDATE CASCADE
           ON DELETE SET NULL,

        FOREIGN KEY (user_id)
        REFERENCES users (user_id) 
           ON UPDATE CASCADE
           ON DELETE SET NULL,

        UNIQUE(article_id, user_id)
      )`,
    ])),
);
