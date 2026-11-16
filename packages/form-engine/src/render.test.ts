import { lumbarDailyVisit as template } from "@chiro-scribe/domain/testing";
import { describe, expect, it } from "vitest";
import { auditBindings, diagnoseForm } from "./render.js";
import { buildDocxFixture, buildPdfFixture } from "./test-support/index.js";

describe("auditBindings", () => {
  it("reports missing slots, wrong slot kinds, and unmapped slots", async () => {
    // Kemp's is a checkbox on the form definition but a text control in this file.
    const file = await buildDocxFixture(
      ["subjective.chief_complaint", "objective.kemps_right", "notes.extra"],
      [],
    );
    const audit = await auditBindings(template, file);

    expect(audit.unbound).toEqual([
      "subjective.pain_side",
      "objective.lumbar_flexion_deg",
      "plan.treatment_performed",
    ]);
    expect(audit.mismatched).toEqual([
      { fieldId: "objective.kemps_right", fieldType: "checkbox", slotKind: "text" },
    ]);
    expect(audit.unmapped).toEqual([
      { binding: { kind: "docx.content_control", tag: "notes.extra" }, kind: "text" },
    ]);
  });
});

describe("diagnoseForm", () => {
  it("sizes the binding work in a Word form without exposing its text", async () => {
    const diagnosis = await diagnoseForm("docx", await buildDocxFixture(["a"], ["b"]));
    expect(Object.fromEntries(diagnosis.findings.map((f) => [f.label, f.count]))).toEqual({
      tables: 1,
      "content controls without a tag": 0,
      "legacy Word form fields": 0,
      "checkbox symbols (bound or typed)": 1,
      "underscore blanks": 0,
    });
  });

  it("counts pages and fields in a PDF", async () => {
    const diagnosis = await diagnoseForm("pdf", await buildPdfFixture());
    expect(diagnosis.findings).toEqual([
      { label: "pages", count: 1 },
      { label: "form fields", count: 4 },
    ]);
  });
});
