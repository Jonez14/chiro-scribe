import type { EditOperation } from "./edits.js";
import { wordsContainNumber } from "./numeric-evidence.js";
import { err, ok, type Result } from "./result.js";
import { findField, type TemplateDefinition } from "./template.js";

/**
 * A spoken correction is interpreted by a model, so its output gets the same treatment as
 * extraction: checked against what the clinician actually said before it touches a document.
 */
export type VoiceEditRejection =
  | { readonly kind: "not_understood" }
  | { readonly kind: "unknown_field"; readonly fieldId: string }
  | { readonly kind: "duplicate_field"; readonly fieldId: string }
  | { readonly kind: "number_not_spoken"; readonly fieldId: string; readonly value: number };

function checkOne(
  template: TemplateDefinition,
  instruction: string,
  operation: EditOperation,
): VoiceEditRejection | undefined {
  const field = findField(template, operation.fieldId);
  if (field === undefined) return { kind: "unknown_field", fieldId: operation.fieldId };
  if (operation.op !== "set" || field.type !== "number" || typeof operation.value !== "number") {
    return undefined;
  }
  return wordsContainNumber(instruction, operation.value)
    ? undefined
    : { kind: "number_not_spoken", fieldId: field.id, value: operation.value };
}

/** All-or-nothing: if any interpreted operation is unsupported, none of them are applied. */
export function checkVoiceEdits(
  template: TemplateDefinition,
  instruction: string,
  operations: readonly EditOperation[],
): Result<readonly EditOperation[], VoiceEditRejection> {
  if (operations.length === 0) return err({ kind: "not_understood" });
  const seen = new Set<string>();
  for (const operation of operations) {
    if (seen.has(operation.fieldId))
      return err({ kind: "duplicate_field", fieldId: operation.fieldId });
    seen.add(operation.fieldId);
    const rejection = checkOne(template, instruction, operation);
    if (rejection) return err(rejection);
  }
  return ok(operations);
}
