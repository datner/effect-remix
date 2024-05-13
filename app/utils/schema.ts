import { Schema as S } from "@effect/schema";

export function structOptional<NER extends S.Struct.Fields>(
  t: NER, // TODO: enforce non empty
): {
  [K in keyof NER]: S.PropertySignature<
    "?:",
    S.Schema.Type<NER[K]>,
    never,
    "?:",
    S.Schema.Encoded<NER[K]>,
    false,
    S.Schema.Context<NER[K]>
  >;
} {
  return Object.keys(t).reduce((prev, cur) => {
    if (S.isSchema(t[cur])) {
      prev[cur] = S.optional(t[cur] as any);
    }
    return prev;
  }, {} as any);
}
