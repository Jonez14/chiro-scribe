import { PDFDocument } from "pdf-lib";

/** A synthetic AcroForm PDF built in memory. */
export async function buildPdfFixture(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([400, 300]);
  const form = pdf.getForm();
  form
    .createTextField("chief_complaint")
    .addToPage(page, { x: 20, y: 240, width: 300, height: 20 });
  form.createTextField("flexion").addToPage(page, { x: 20, y: 200, width: 80, height: 20 });
  form.createCheckBox("kemps_right").addToPage(page, { x: 20, y: 160, width: 14, height: 14 });
  const side = form.createDropdown("pain_side");
  side.addOptions(["left", "right", "bilateral"]);
  side.addToPage(page, { x: 20, y: 120, width: 120, height: 20 });
  return pdf.save();
}
