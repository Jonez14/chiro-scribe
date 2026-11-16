import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { Assignment } from "../filler.js";
import { buildPdfFixture } from "../test-support/index.js";
import { pdfFiller } from "./pdf-filler.js";

const set = (name: string, value: string | number | boolean): Assignment => ({
  binding: { kind: "pdf.acro_field", name },
  value,
});

describe("pdfFiller", () => {
  it("discovers form fields and their kinds", async () => {
    const slots = await pdfFiller.inspect(await buildPdfFixture());
    expect(slots.map((slot) => slot.kind)).toEqual(["text", "text", "checkbox", "choice"]);
  });

  it("fills text, number, checkbox and choice fields and keeps them editable", async () => {
    const filled = await pdfFiller.fill(await buildPdfFixture(), [
      set("chief_complaint", "Right-sided low back pain"),
      set("flexion", 45),
      set("kemps_right", true),
      set("pain_side", "right"),
    ]);
    const form = (await PDFDocument.load(filled)).getForm();
    expect(form.getTextField("chief_complaint").getText()).toBe("Right-sided low back pain");
    expect(form.getTextField("flexion").getText()).toBe("45");
    expect(form.getCheckBox("kemps_right").isChecked()).toBe(true);
    expect(form.getDropdown("pain_side").getSelected()).toEqual(["right"]);
  });

  it.each([
    ["a field the file does not contain", set("nope", "x"), "binding_not_found"],
    ["an option the form does not offer", set("pain_side", "central"), "binding_type_mismatch"],
    ["text into a checkbox", set("kemps_right", "yes"), "binding_type_mismatch"],
  ] as const)("refuses %s", async (_name, assignment, code) => {
    await expect(pdfFiller.fill(await buildPdfFixture(), [assignment])).rejects.toMatchObject({
      code,
    });
  });
});
