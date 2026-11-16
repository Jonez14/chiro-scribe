import { PDFDocument } from "pdf-lib";
import type { FormDiagnosis } from "../diagnosis.js";
import { FormEngineError } from "../errors.js";

export async function diagnosePdf(file: Uint8Array): Promise<FormDiagnosis> {
  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(file);
  } catch {
    throw new FormEngineError("invalid_file", "File is not a readable PDF.");
  }
  return {
    format: "pdf",
    findings: [
      { label: "pages", count: pdf.getPageCount() },
      { label: "form fields", count: pdf.getForm().getFields().length },
    ],
  };
}
