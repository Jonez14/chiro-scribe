import { describe, expect, it } from "vitest";
import { FormEngineError } from "../errors.js";
import type { Assignment } from "../filler.js";
import { buildDocxFixture, readDocumentXml } from "../test-support/index.js";
import { docxFiller } from "./docx-filler.js";

const text = (tag: string, value: string | number): Assignment => ({
  binding: { kind: "docx.content_control", tag },
  value,
});
const box = (tag: string, value: boolean): Assignment => ({
  binding: { kind: "docx.content_control", tag },
  value,
});
const fixture = () => buildDocxFixture(["complaint", "flexion"], ["kemps_right"]);

describe("docxFiller", () => {
  it("discovers tagged content controls and their kinds", async () => {
    const slots = await docxFiller.inspect(await fixture());
    expect(slots).toEqual([
      { binding: { kind: "docx.content_control", tag: "complaint" }, kind: "text" },
      { binding: { kind: "docx.content_control", tag: "flexion" }, kind: "text" },
      { binding: { kind: "docx.content_control", tag: "kemps_right" }, kind: "checkbox" },
    ]);
  });

  it("writes text in place, keeping run formatting and dropping placeholder state", async () => {
    const xml = await readDocumentXml(
      await docxFiller.fill(await fixture(), [
        text("complaint", "Right-sided LBP"),
        text("flexion", 45),
      ]),
    );
    expect(xml).toContain(">Right-sided LBP</w:t>");
    expect(xml).toContain(">45</w:t>");
    expect(xml).not.toContain("Click to enter");
    expect(xml).not.toContain("PlaceholderText");
    expect(xml).not.toContain("showingPlcHdr");
    expect(xml.match(/<w:b\/>/g)).toHaveLength(2);
  });

  it("leaves everything outside the filled controls byte-for-byte alone", async () => {
    const original = await readDocumentXml(await docxFiller.fill(await fixture(), []));
    const filled = await readDocumentXml(
      await docxFiller.fill(await fixture(), [box("kemps_right", true)]),
    );
    const strip = (xml: string) => xml.replace(/<w:sdt>[\s\S]*?<\/w:sdt>/g, "<sdt/>");
    expect(strip(filled)).toBe(strip(original));
    expect((filled.match(/<w:tr>/g) ?? []).length).toBe(3);
  });

  it("turns line breaks into Word breaks", async () => {
    const xml = await readDocumentXml(
      await docxFiller.fill(await fixture(), [text("complaint", "a\nb")]),
    );
    expect(xml).toMatch(/>a<\/w:t><w:br\/><w:t[^>]*>b<\/w:t>/);
  });

  it("escapes characters that would corrupt the file", async () => {
    const xml = await readDocumentXml(
      await docxFiller.fill(await fixture(), [text("complaint", "L4 < L5 & S1")]),
    );
    expect(xml).toContain("L4 &lt; L5 &amp; S1");
  });

  it("sets both the checkbox flag and its visible glyph", async () => {
    const checked = await readDocumentXml(
      await docxFiller.fill(await fixture(), [box("kemps_right", true)]),
    );
    expect(checked).toContain('<w14:checked w14:val="1"/>');
    expect(checked).toContain("☒");

    const unchecked = await readDocumentXml(
      await docxFiller.fill(await fixture(), [box("kemps_right", false)]),
    );
    expect(unchecked).toContain('<w14:checked w14:val="0"/>');
    expect(unchecked).toContain("☐");
  });

  it.each([
    ["a tag the file does not contain", [text("nope", "x")], "binding_not_found"],
    ["text into a checkbox", [text("kemps_right", "yes")], "binding_type_mismatch"],
    ["a boolean into a text control", [box("complaint", true)], "binding_type_mismatch"],
    [
      "a PDF binding",
      [{ binding: { kind: "pdf.acro_field", name: "x" }, value: "x" }],
      "unsupported_binding",
    ],
  ] as const)("refuses %s", async (_name, assignments, code) => {
    await expect(docxFiller.fill(await fixture(), assignments)).rejects.toMatchObject({ code });
  });

  it("refuses a tag used twice, since the target would be a guess", async () => {
    const file = await buildDocxFixture(["dup", "dup"], []);
    await expect(docxFiller.fill(file, [text("dup", "x")])).rejects.toMatchObject({
      code: "binding_ambiguous",
    });
  });

  it("rejects a file that is not a .docx", async () => {
    await expect(docxFiller.inspect(new Uint8Array([1, 2, 3]))).rejects.toBeInstanceOf(
      FormEngineError,
    );
  });
});
