import type { ProposedField, TemplateDefinition } from "@chiro-scribe/domain";
import { z } from "zod";
import type { JsonSchema } from "./messages-client.js";

/** Output schema for extraction. Field ids are an enum so the model cannot invent fields. */
export function buildExtractionSchema(template: TemplateDefinition): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["fields"],
    properties: {
      fields: {
        type: "array",
        description: "Only the fields the dictation explicitly supports. Omit every other field.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field_id", "value", "evidence"],
          properties: {
            field_id: { type: "string", enum: template.fields.map((field) => field.id) },
            value: { anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }] },
            evidence: {
              type: "array",
              items: { type: "string" },
              description: "Verbatim quotes from the dictation that support this value.",
            },
          },
        },
      },
    },
  };
}

const ExtractionOutput = z.object({
  fields: z.array(
    z.object({
      field_id: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()]),
      evidence: z.array(z.string()),
    }),
  ),
});

/** Shape check only. Whether any of it is true is decided by grounding in the domain. */
export function parseExtractionOutput(output: unknown): ProposedField[] | undefined {
  const parsed = ExtractionOutput.safeParse(output);
  if (!parsed.success) return undefined;
  return parsed.data.fields.map(({ field_id, value, evidence }) => ({
    fieldId: field_id,
    value,
    evidence,
  }));
}
