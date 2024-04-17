import { HttpServer } from "@effect/platform";
import { Schema } from "@effect/schema";
import * as Sql from "@effect/sql-sqlite-node";
import { Effect, Layer, Option } from "effect";
import { Article, ArticleTag, ArticleUpdate } from "~/models/Article";
import { Tag } from "~/models/Tag";
import { SqliteLive } from "./Database.server";

export const make = Effect.gen(function*($) {
  const sql = yield* $(Sql.client.SqliteClient);

  const getById = yield* $(Sql.resolver.findById("ArticleById", {
    Id: Schema.String,
    Result: Article,
    ResultId: _ => _.id,
    execute: ids => sql`SELECT * FROM articles WHERE user_id IN ${sql.in(ids)}`,
  }));

  const articleTags = yield* $(Sql.resolver.grouped("ArticleTags", {
    Request: Article,
    RequestGroupKey: _ => _.articleId,
    Result: ArticleTag,
    ResultGroupKey: _ => _.articleId,
    execute: (reqs) =>
      sql`
SELECT tag_id, name, article_tags.article_tag
FROM tags 
  INNER JOIN article_tags ON article_tags.tag_id = tags.tag_id
WHERE article_tags.article_id IN ${sql.in(reqs.map(_ => _.articleId))}`,
  }));

  const insertArticle = Sql.schema.single({
    Request: Article,
    Result: Article,
    execute: article => sql`INSERT INTO articles ${sql.insert(article)}`,
  });

  const updateArticle = Sql.schema.single({
    Request: ArticleUpdate,
    Result: Article,
    execute: article =>
      sql`
UPDATE users 
SET ${sql.update(article, ["articleId", "_tag"])}
WHERE article_id = ${article.articleId}`,
  });

  const makeTags = Sql.schema.void({
    Request: Schema.Array(Tag),
    execute: tags => sql`INSERT INTO tags ${sql.insert(tags)}`,
  });

  const addTags = Sql.schema.void({
    Request: Schema.Array(ArticleTag),
    execute: at =>
      sql`INSERT INTO article_tags ${sql.insert(at)}`.pipe(
        Effect.tap(Effect.forEach(at, _ => getById.cacheInvalidate(_.articleId), { batching: true })),
      ),
  });

  const update = (article: ArticleUpdate) =>
    updateArticle(article).pipe(
      Effect.tap(u => getById.cachePopulate(u.id, Option.some(u))),
      Effect.mapError(() => HttpServer.response.empty({ status: 400 })),
      Effect.withSpan("Articles.update"),
    );

  const make = (article: Article) =>
    insertArticle(article).pipe(
      Effect.tap(u => getById.cachePopulate(u.id, Option.some(u))),
      Effect.mapError(() => HttpServer.response.empty({ status: 400 })),
      Effect.withSpan("Articles.make"),
    );

  const getTags = (article: Article) => articleTags.execute(article);

  return {
    getById,
    update,
    getTags,
    makeTags,
    addTags,
    make,
  };
});

export class Articles extends Effect.Tag("@services/Articles")<Articles, Effect.Effect.Success<typeof make>>() {
  static live = Layer.effect(this, make);
  static layer = Layer.provide(this.live, SqliteLive);
}
