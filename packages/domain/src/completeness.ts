import type { ClinicalDocument } from "./document.js";
import type { ClinicalSection, TemplateDefinition } from "./template.js";

export interface MissingField {
  readonly fieldId: string;
  readonly label: string;
  readonly section: ClinicalSection;
}

export interface Completeness {
  /** Required fields nobody has filled or deliberately left blank. These block approval. */
  readonly missingRequired: readonly MissingField[];
  readonly filledCount: number;
  readonly totalCount: number;
}

export function assessCompleteness(
  template: TemplateDefinition,
  document: ClinicalDocument,
): Completeness {
  const statusOf = (fieldId: string) => document.fields[fieldId]?.status ?? "empty";
  const missingRequired = template.fields
    .filter((field) => field.required && statusOf(field.id) === "empty")
    .map(({ id, label, section }) => ({ fieldId: id, label, section }));
  const filledCount = template.fields.filter((field) => statusOf(field.id) === "filled").length;
  return { missingRequired, filledCount, totalCount: template.fields.length };
}
