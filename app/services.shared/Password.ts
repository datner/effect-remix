import { Schema } from "@effect/schema";
import { Brand } from "effect";

export class PasswordHashingError
  extends Schema.TaggedError<PasswordHashingError>("@services/Password/PasswordHashingError")("PasswordHashingError", {
    message: Schema.optional(Schema.String),
    type: Schema.Literal("Hashing", "Salting"),
    reason: Schema.Unknown,
  })
{}

export class PasswordValidatingError
  extends Schema.TaggedError<PasswordValidatingError>("@services/Password/PasswordValidatingError")(
    "PasswordValidatingError",
    {
      message: Schema.optional(Schema.String),
      reason: Schema.Unknown,
    },
  )
{}

export class PasswordInvalidError
  extends Schema.TaggedError<PasswordInvalidError>("@services/Password/PasswordInvalidError")(
    "PasswordInvalidError",
    {
      message: Schema.optional(Schema.String),
      reason: Schema.optional(Schema.Unknown),
    },
  )
{}

export type Salt = Brand.Branded<string, "@services/Password/Salt">;
export const Salt: Schema.BrandSchema<Salt, string> = Schema.String.pipe(Schema.brand("@services/Password/Salt"));

export type Hash = Brand.Branded<string, "@services/Password/Hash">;
export const Hash: Schema.BrandSchema<Hash, string> = Schema.String.pipe(Schema.brand("@services/Password/Hash"));
