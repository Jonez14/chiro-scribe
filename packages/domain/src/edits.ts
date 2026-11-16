import { isEditable, type ClinicalDocument, type FieldState, type Provenance } from "./document.js";
import { validateFieldValue, type ValueRejection } from "./field-value.js";
import type { Actor } from "./lifecycle.js";
import { err, ok, type Result } from "./result.js";
import { findField, type TemplateDefinition } from "./template.js";

/** Typed or spoken, every correction reduces to these operations. */
export type EditOperation =
  | { readonly op: "set"; readonly fieldId: string; readonly value: unknown }
  | { readonly op: "clear"; readonly fieldId: string }
  | { readonly op: "keep_blank"; readonly fieldId: string };

/** How the clinician expressed the edit. Recorded in provenance. */
export type EditOrigin =
  { readonly kind: "typed" } | { readonly kind: "voice"; readonly instruction: string };

export interface FieldChange {
  readonly fieldId: string;
  readonly before: FieldState;
  readonly after: FieldState;
}

export type EditError =
  | { readonly kind: "not_editable" }
  | { readonly kind: "forbidden" }
  | { readonly kind: "unknown_field"; readonly fieldId: string }
  | { readonly kind: "invalid_value"; readonly fieldId: string; readonly reason: ValueRejection };

export interface EditOutcome {
  readonly document: ClinicalDocument;
  /** Exactly what changed, so the reviewer sees a diff instead of re-reading the form. */
  readonly changes: readonly FieldChange[];
}

function nextState(
  template: TemplateDefinition,
  operation: EditOperation,
  actor: Actor,
  origin: EditOrigin,
): Result<FieldState, EditError> {
  const field = findField(template, operation.fieldId);
  if (field === undefined) return err({ kind: "unknown_field", fieldId: operation.fieldId });
  if (operation.op === "clear") return ok({ status: "empty" });
  if (operation.op === "keep_blank")
    return ok({ status: "intentionally_blank", actorId: actor.id });

  const checked = validateFieldValue(field, operation.value);
  if (!checked.ok) return err({ kind: "invalid_value", fieldId: field.id, reason: checked.error });
  const provenance: Provenance =
    origin.kind === "voice"
      ? { source: "voice_edit", actorId: actor.id, instruction: origin.instruction }
      : { source: "clinician_edit", actorId: actor.id };
  return ok({ status: "filled", value: checked.value, provenance });
}

/** All-or-nothing: a batch with one bad operation changes nothing. */
export function applyEdits(
  template: TemplateDefinition,
  document: ClinicalDocument,
  operations: readonly EditOperation[],
  actor: Actor,
  origin: EditOrigin = { kind: "typed" },
): Result<EditOutcome, EditError> {
  if (!isEditable(document)) return err({ kind: "not_editable" });
  if (actor.role === "system") return err({ kind: "forbidden" });

  const fields: Record<string, FieldState> = { ...document.fields };
  const changes: FieldChange[] = [];
  for (const operation of operations) {
    const next = nextState(template, operation, actor, origin);
    if (!next.ok) return next;
    const before = fields[operation.fieldId] ?? { status: "empty" };
    fields[operation.fieldId] = next.value;
    changes.push({ fieldId: operation.fieldId, before, after: next.value });
  }
  return ok({ document: { ...document, fields }, changes });
}
