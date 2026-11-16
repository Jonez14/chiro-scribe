import type {
  ClinicalDocument,
  FieldDefinition,
  TemplateDefinition,
  TemplateFormat,
} from "@chiro-scribe/domain";
import type { FormDiagnosis } from "./diagnosis.js";
import { diagnoseDocx } from "./docx/diagnose-docx.js";
import { docxFiller } from "./docx/docx-filler.js";
import type { Assignment, FormFiller, SlotKind, TemplateSlot } from "./filler.js";
import { diagnosePdf } from "./pdf/diagnose-pdf.js";
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

export function diagnoseForm(format: TemplateFormat, file: Uint8Array): Promise<FormDiagnosis> {
  return format === "docx" ? diagnoseDocx(file) : diagnosePdf(file);
}

export interface KindMismatch {
  readonly fieldId: string;
  readonly fieldType: FieldDefinition["type"];
  readonly slotKind: SlotKind;
}

export interface BindingAudit {
  /** Mapped fields with no matching slot in the file. Must be empty before a template goes live. */
  readonly unbound: readonly string[];
  /** Fields bound to a slot that cannot hold their type. Must be empty too. */
  readonly mismatched: readonly KindMismatch[];
  /** Slots in the file that no field maps to. Informational: likely unmapped form areas. */
  readonly unmapped: readonly TemplateSlot[];
}

/** Which slot kinds can physically hold each field type. */
const compatible: Record<FieldDefinition["type"], readonly SlotKind[]> = {
  text: ["text"],
  number: ["text"],
  checkbox: ["checkbox"],
  choice: ["choice", "text"],
};

const key = (binding: TemplateSlot["binding"]) => JSON.stringify(binding);

/** Onboarding check: does this mapping actually line up with this file? */
export async function auditBindings(
  template: TemplateDefinition,
  templateFile: Uint8Array,
): Promise<BindingAudit> {
  const slots = await fillerFor(template.format).inspect(templateFile);
  const kinds = new Map(slots.map((slot) => [key(slot.binding), slot.kind]));
  const mapped = new Set(template.fields.map((field) => key(field.binding)));

  const unbound: string[] = [];
  const mismatched: KindMismatch[] = [];
  for (const field of template.fields) {
    const slotKind = kinds.get(key(field.binding));
    if (slotKind === undefined) unbound.push(field.id);
    else if (!compatible[field.type].includes(slotKind)) {
      mismatched.push({ fieldId: field.id, fieldType: field.type, slotKind });
    }
  }
  return { unbound, mismatched, unmapped: slots.filter((slot) => !mapped.has(key(slot.binding))) };
}
