import type { EditOperation, TemplateDefinition } from "@chiro-scribe/domain";
import { z } from "zod";
import type { JsonSchema } from "./messages-client.js";

function operationShape(op: string, fieldIds: string[], withValue: boolean): JsonSchema {
  const value = { anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }] };
  return {
    type: "object",
    additionalProperties: false,
    required: withValue ? ["op", "field_id", "value"] : ["op", "field_id"],
    properties: {
      op: { type: "string", enum: [op] },
      field_id: { type: "string", enum: fieldIds },
      ...(withValue ? { value } : {}),
    },
  };
}

/** Output schema for edit interpretation: one shape per operation, so "set" always has a value. */
export function buildEditSchema(template: TemplateDefinition): JsonSchema {
  const fieldIds = template.fields.map((field) => field.id);
  return {
    type: "object",
    additionalProperties: false,
    required: ["operations"],
    properties: {
      operations: {
        type: "array",
        description: "The edits the instruction asks for. Empty if the instruction is unclear.",
        items: {
          anyOf: [
            operationShape("set", fieldIds, true),
            operationShape("clear", fieldIds, false),
            operationShape("keep_blank", fieldIds, false),
          ],
        },
      },
    },
  };
}

const Value = z.union([z.string(), z.number(), z.boolean()]);
const EditOutput = z.object({
  operations: z.array(
    z.discriminatedUnion("op", [
      z.object({ op: z.literal("set"), field_id: z.string(), value: Value }),
      z.object({ op: z.literal("clear"), field_id: z.string() }),
      z.object({ op: z.literal("keep_blank"), field_id: z.string() }),
    ]),
  ),
});

/** Shape check only. The domain decides whether the operations are supported and valid. */
export function parseEditOutput(output: unknown): EditOperation[] | undefined {
  const parsed = EditOutput.safeParse(output);
  if (!parsed.success) return undefined;
  return parsed.data.operations.map((operation) =>
    operation.op === "set"
      ? { op: "set", fieldId: operation.field_id, value: operation.value }
      : { op: operation.op, fieldId: operation.field_id },
  );
}
