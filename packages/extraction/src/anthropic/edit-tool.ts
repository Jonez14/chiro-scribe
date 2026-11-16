import type { EditOperation, TemplateDefinition } from "@chiro-scribe/domain";
import { z } from "zod";
import type { ToolDefinition } from "./messages-client.js";

export function buildEditTool(template: TemplateDefinition): ToolDefinition {
  return {
    name: "record_edits",
    description: "Record the edit operations the clinician's instruction asks for.",
    input_schema: {
      type: "object",
      required: ["operations"],
      properties: {
        operations: {
          type: "array",
          items: {
            type: "object",
            required: ["op", "field_id"],
            properties: {
              op: { type: "string", enum: ["set", "clear", "keep_blank"] },
              field_id: { type: "string", enum: template.fields.map((field) => field.id) },
              value: {
                type: ["string", "number", "boolean"],
                description: 'Required for "set". Omit otherwise.',
              },
            },
          },
        },
      },
    },
  };
}

const Value = z.union([z.string(), z.number(), z.boolean()]);
const EditToolInput = z.object({
  operations: z.array(
    z.discriminatedUnion("op", [
      z.object({ op: z.literal("set"), field_id: z.string(), value: Value }),
      z.object({ op: z.literal("clear"), field_id: z.string() }),
      z.object({ op: z.literal("keep_blank"), field_id: z.string() }),
    ]),
  ),
});

/** Shape check only. The domain decides whether the operations are supported and valid. */
export function parseEditToolInput(input: unknown): EditOperation[] | undefined {
  const parsed = EditToolInput.safeParse(input);
  if (!parsed.success) return undefined;
  return parsed.data.operations.map((operation) =>
    operation.op === "set"
      ? { op: "set", fieldId: operation.field_id, value: operation.value }
      : { op: operation.op, fieldId: operation.field_id },
  );
}
