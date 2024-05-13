import { Schema } from "@effect/schema";
import { createId } from "@paralleldrive/cuid2";
import { Brand, Struct } from "effect";
import { Hash } from "~/services.shared/Password";
import { structOptional } from "~/utils/schema";

// @datner: keep in mind, this is a "meh, good enough" regex for an email. Super naive
const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

export type Email = Brand.Branded<string, "@schema/User/Email">;
export const Email: Schema.BrandSchema<Email, string> = Schema.String.pipe(
  Schema.pattern(emailRegex),
  Schema.brand("@schema/User/Email"),
);

export class User extends Schema.Class<User>("@schema/User")({
  id: Schema.propertySignature(Schema.String).pipe(Schema.fromKey("userId")),
  email: Email,
  username: Schema.String,
  bio: Schema.String,
  image: Schema.OptionFromNullOr(Schema.String),
  passwordHash: Hash,

  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {
  readonly _tag = "User";
  static make = (u: Omit<ConstructorParameters<typeof this>[0], "id" | "createdAt" | "updatedAt">) =>
    new this({ id: createId(), ...u, createdAt: new Date(), updatedAt: new Date() });
}

export class UserUpdate extends Schema.TaggedClass<UserUpdate>("@schema/User/Update")("UserUpdate", {
  ...(structOptional(Struct.omit(User.fields, "createdAt", "id"))),
  id: User.fields.id,
}) {
  static make = (u: Omit<ConstructorParameters<typeof this>[0], "updatedAt">) =>
    new this({ ...u, updatedAt: new Date() });
}

export class LikedArticle extends Schema.Class<LikedArticle>("@schema/LikedArticle")({
  articleId: Schema.String,
  userId: Schema.String,
}) {}
