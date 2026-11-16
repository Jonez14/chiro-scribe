import { isEditable, type ClinicalDocument, type FieldState } from "./document.js";
import type { GroundedField } from "./grounding.js";

/**
 * Writes grounded dictation into a draft. A field the clinician has already touched
 * (edited, or deliberately left blank) is never overwritten by the pipeline.
 */
export function applyGroundedFields(
  document: ClinicalDocument,
  grounded: readonly GroundedField[],
): ClinicalDocument {
  if (!isEditable(document)) return document;
  const fields: Record<string, FieldState> = { ...document.fields };
  for (const { fieldId, value, evidence } of grounded) {
    const current = fields[fieldId];
    if (current === undefined || clinicianOwned(current)) continue;
    fields[fieldId] = { status: "filled", value, provenance: { source: "dictation", evidence } };
  }
  return { ...document, fields };
}

function clinicianOwned(state: FieldState): boolean {
  if (state.status === "intentionally_blank") return true;
  return state.status === "filled" && state.provenance.source !== "dictation";
}
