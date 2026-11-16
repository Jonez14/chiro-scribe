import type { ClinicalDocument, TemplateDefinition, TemplateFormat } from "@chiro-scribe/domain";
import { docxFiller } from "./docx/docx-filler.js";
import type { Assignment, FormFiller, TemplateSlot } from "./filler.js";
import { pdfFiller } from "./pdf/pdf-filler.js";

const fillers: Record<TemplateFormat, FormFiller> = { docx: docxFiller, pdf: pdfFiller };

export function fillerFor(format: TemplateFormat): FormFiller {
  return fillers[format];
}

/** Only filled fields are written. Empty and intentionally blank fields leave the form untouched. */
export function toAssignments(
  template: TemplateDefinition,
  document: ClinicalDocument,
): Assignment[] {
  return template.fields.flatMap((field) => {
    const state = document.fields[field.id];
    return state?.status === "filled" ? [{ binding: field.binding, value: state.value }] : [];
  });
}

export async function renderDocument(
  template: TemplateDefinition,
  document: ClinicalDocument,
  templateFile: Uint8Array,
): Promise<Uint8Array> {
  return fillerFor(template.format).fill(templateFile, toAssignments(template, document));
}

export interface BindingAudit {
  /** Mapped fields with no matching slot in the file. Must be empty before a template goes live. */
  readonly unbound: readonly string[];
  /** Slots in the file that no field maps to. Informational: likely unmapped form areas. */
  readonly unmapped: readonly TemplateSlot[];
}

const key = (binding: TemplateSlot["binding"]) => JSON.stringify(binding);

/** Onboarding check: does this mapping actually line up with this file? */
export async function auditBindings(
  template: TemplateDefinition,
  templateFile: Uint8Array,
): Promise<BindingAudit> {
  const slots = await fillerFor(template.format).inspect(templateFile);
  const inFile = new Set(slots.map((slot) => key(slot.binding)));
  const mapped = new Set(template.fields.map((field) => key(field.binding)));
  return {
    unbound: template.fields.filter((f) => !inFile.has(key(f.binding))).map((f) => f.id),
    unmapped: slots.filter((slot) => !mapped.has(key(slot.binding))),
  };
}
