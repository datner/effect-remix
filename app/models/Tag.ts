import { Schema } from "@effect/schema";
import { createId } from "@paralleldrive/cuid2";

export class Tag extends Schema.Class<Tag>("@schema/Tag")({
  tagId: Schema.String,
  name: Schema.String,
}) {
  readonly _tag = "Tag";
  static make = (name: string) => new this({ tagId: createId(), name });
}
