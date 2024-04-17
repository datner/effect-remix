import { Schema } from "@effect/schema";
import { createId } from "@paralleldrive/cuid2";
import { Struct } from "effect";
import { structOptional } from "~/utils/schema";
import { Tag } from "./Tag";

export class Article extends Schema.Class<Article>("@schema/Article")({
  id: Schema.propertySignature(Schema.String).pipe(Schema.fromKey("articleId")),
  authorId: Schema.OptionFromNullOr(Schema.String),
  title: Schema.String,
  description: Schema.String,
  body: Schema.String,

  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {
  readonly _tag = "Article";
  static make = (u: Omit<ConstructorParameters<typeof this>[0], "id" | "createdAt" | "updatedAt">) =>
    new this({ id: createId(), ...u, createdAt: new Date(), updatedAt: new Date() });
}

export class ArticleUpdate extends Schema.TaggedClass<ArticleUpdate>("@schema/Article#Update")("ArticleUpdate", {
  ...(structOptional(Struct.omit(Article.fields, "createdAt", "id", "authorId"))),
  id: Article.fields.id,
  authorId: Schema.String,
}) {
  static make = (u: Omit<ConstructorParameters<typeof this>[0], "updatedAt">) =>
    new this({ ...u, updatedAt: new Date() });
}

export class ArticleTag extends Tag.extend<ArticleTag>("@schema/Article/Tag")({
  articleId: Schema.String,
}) {}
