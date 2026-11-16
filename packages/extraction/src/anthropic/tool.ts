import type { ProposedField, TemplateDefinition } from "@chiro-scribe/domain";
import { z } from "zod";
import type { ToolDefinition } from "./messages-client.js";

export const TOOL_NAME = "record_form_fields";

/** JSON Schema for the forced tool call. Field ids are an enum so the model cannot invent fields. */
export function buildTool(template: TemplateDefinition): ToolDefinition {
  return {
    name: TOOL_NAME,
    description: "Record the form fields that the dictation explicitly supports.",
    input_schema: {
      type: "object",
      required: ["fields"],
      properties: {
        fields: {
          type: "array",
          items: {
            type: "object",
            required: ["field_id", "value", "evidence"],
            properties: {
              field_id: { type: "string", enum: template.fields.map((field) => field.id) },
              value: { type: ["string", "number", "boolean"] },
              evidence: {
                type: "array",
                minItems: 1,
                items: { type: "string" },
                description: "Verbatim quotes from the dictation that support this value.",
              },
            },
          },
        },
      },
    },
  };
}

const ToolInput = z.object({
  fields: z.array(
    z.object({
      field_id: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()]),
      evidence: z.array(z.string()),
    }),
  ),
});

/** Shape check only. Whether any of it is true is decided by grounding in the domain. */
export function parseToolInput(input: unknown): ProposedField[] | undefined {
  const parsed = ToolInput.safeParse(input);
  if (!parsed.success) return undefined;
  return parsed.data.fields.map(({ field_id, value, evidence }) => ({
    fieldId: field_id,
    value,
    evidence,
  }));
}
