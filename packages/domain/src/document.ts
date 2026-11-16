import type { FieldValue } from "./field-value.js";
import type { TemplateDefinition } from "./template.js";

/** A verbatim span of the clinician's own words that supports a value. */
export interface Evidence {
  readonly quote: string;
}

export type Provenance =
  | { readonly source: "dictation"; readonly evidence: readonly Evidence[] }
  | { readonly source: "clinician_edit"; readonly actorId: string }
  /** A spoken correction, interpreted by the pipeline. The instruction is kept as its evidence. */
  | { readonly source: "voice_edit"; readonly actorId: string; readonly instruction: string };

export type FieldState =
  | { readonly status: "empty" }
  | { readonly status: "filled"; readonly value: FieldValue; readonly provenance: Provenance }
  /** The clinician decided this field stays blank. Distinct from "nobody addressed it". */
  | { readonly status: "intentionally_blank"; readonly actorId: string };

export type DocumentStatus = "drafting" | "in_review" | "approved" | "filed";

export interface ClinicalDocument {
  readonly id: string;
  readonly templateId: string;
  readonly templateVersion: number;
  /** Opaque reference. The domain never holds patient demographics. */
  readonly patientRef: string;
  /** ISO calendar date of the encounter (YYYY-MM-DD). */
  readonly encounterDate: string;
  readonly status: DocumentStatus;
  readonly fields: Readonly<Record<string, FieldState>>;
}

export interface NewDocumentInput {
  readonly id: string;
  readonly patientRef: string;
  readonly encounterDate: string;
}

export function createDocument(
  template: TemplateDefinition,
  input: NewDocumentInput,
): ClinicalDocument {
  const fields = Object.fromEntries(
    template.fields.map((field): [string, FieldState] => [field.id, { status: "empty" }]),
  );
  return {
    ...input,
    templateId: template.id,
    templateVersion: template.version,
    status: "drafting",
    fields,
  };
}

export function withField(
  document: ClinicalDocument,
  fieldId: string,
  state: FieldState,
): ClinicalDocument {
  return { ...document, fields: { ...document.fields, [fieldId]: state } };
}

export function isEditable(document: ClinicalDocument): boolean {
  return document.status === "drafting" || document.status === "in_review";
}
