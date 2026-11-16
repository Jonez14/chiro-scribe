import type { FieldValue } from "@chiro-scribe/domain";
import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFRadioGroup,
  PDFTextField,
  type PDFField,
} from "pdf-lib";
import { FormEngineError } from "../errors.js";
import type { Assignment, FormFiller, SlotKind, TemplateSlot } from "../filler.js";

async function open(file: Uint8Array): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(file);
  } catch {
    throw new FormEngineError("invalid_file", "File is not a readable PDF.");
  }
}

function kindOf(field: PDFField): SlotKind | undefined {
  if (field instanceof PDFTextField) return "text";
  if (field instanceof PDFCheckBox) return "checkbox";
  if (field instanceof PDFDropdown || field instanceof PDFRadioGroup) return "choice";
  return undefined;
}

function mismatch(name: string, expected: string): FormEngineError {
  return new FormEngineError("binding_type_mismatch", `PDF field "${name}" expects ${expected}.`);
}

function write(field: PDFField, value: FieldValue): void {
  const name = field.getName();
  if (field instanceof PDFCheckBox) {
    if (typeof value !== "boolean") throw mismatch(name, "a checkbox value");
    if (value) field.check();
    else field.uncheck();
  } else if (field instanceof PDFTextField) {
    if (typeof value === "boolean") throw mismatch(name, "text");
    field.setText(String(value));
  } else if (field instanceof PDFDropdown || field instanceof PDFRadioGroup) {
    if (typeof value !== "string" || !field.getOptions().includes(value)) {
      throw mismatch(name, `one of: ${field.getOptions().join(", ")}`);
    }
    field.select(value);
  } else {
    throw new FormEngineError(
      "unsupported_binding",
      `PDF field "${name}" has an unsupported type.`,
    );
  }
}

function nameOf(assignment: Assignment): string {
  if (assignment.binding.kind !== "pdf.acro_field") {
    throw new FormEngineError(
      "unsupported_binding",
      `A PDF template cannot use binding ${assignment.binding.kind}.`,
    );
  }
  return assignment.binding.name;
}

/** Fills AcroForm fields. Fields stay live (not flattened) so the clinician can still correct them. */
export const pdfFiller: FormFiller = {
  async inspect(file): Promise<readonly TemplateSlot[]> {
    const fields = (await open(file)).getForm().getFields();
    return fields.flatMap((field) => {
      const kind = kindOf(field);
      return kind
        ? [{ binding: { kind: "pdf.acro_field" as const, name: field.getName() }, kind }]
        : [];
    });
  },

  async fill(file, assignments): Promise<Uint8Array> {
    const pdf = await open(file);
    const form = pdf.getForm();
    for (const assignment of assignments) {
      const name = nameOf(assignment);
      const field = form.getFieldMaybe(name);
      if (!field)
        throw new FormEngineError("binding_not_found", `No PDF form field named "${name}".`);
      write(field, assignment.value);
    }
    return pdf.save();
  },
};
