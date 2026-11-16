import { describe, expect, it } from "vitest";
import { createDocument, type ClinicalDocument } from "./document.js";
import { applyEdits } from "./edits.js";
import { transition, type Actor } from "./lifecycle.js";
import { lumbarDailyVisit as template } from "./test-support/index.js";

const clinician: Actor = { id: "usr_dc", role: "clinician" };
const staff: Actor = { id: "usr_front_desk", role: "staff" };
const system: Actor = { id: "pipeline", role: "system" };

const blank = (): ClinicalDocument =>
  createDocument(template, {
    id: "doc_1",
    patientRef: "pt_synthetic",
    encounterDate: "2026-11-16",
  });

function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: unknown }): T {
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

function completed(): ClinicalDocument {
  const edited = applyEdits(
    template,
    blank(),
    [
      { op: "set", fieldId: "subjective.chief_complaint", value: "Right-sided low back pain" },
      { op: "set", fieldId: "plan.treatment_performed", value: "Lumbar adjustment" },
    ],
    clinician,
  );
  return unwrap(edited).document;
}

const inReview = (document: ClinicalDocument) =>
  unwrap(transition(template, document, "submit_for_review", system));

describe("document lifecycle", () => {
  it("walks drafting to filed with a clinician approval in the middle", () => {
    const approved = unwrap(transition(template, inReview(completed()), "approve", clinician));
    const filed = unwrap(transition(template, approved, "mark_filed", staff));
    expect(filed.status).toBe("filed");
  });

  it.each([staff, system])("never lets $role approve", (actor) => {
    const result = transition(template, inReview(completed()), "approve", actor);
    expect(result).toEqual({
      ok: false,
      error: { kind: "forbidden", role: actor.role, action: "approve" },
    });
  });

  it("blocks approval while required fields are unaddressed", () => {
    const result = transition(template, inReview(blank()), "approve", clinician);
    expect(result).toEqual({
      ok: false,
      error: {
        kind: "incomplete",
        missingFieldIds: ["subjective.chief_complaint", "plan.treatment_performed"],
      },
    });
  });

  it("treats a deliberate blank as addressed", () => {
    const kept = unwrap(
      applyEdits(
        template,
        blank(),
        [
          { op: "keep_blank", fieldId: "subjective.chief_complaint" },
          { op: "keep_blank", fieldId: "plan.treatment_performed" },
        ],
        clinician,
      ),
    ).document;
    expect(transition(template, inReview(kept), "approve", clinician).ok).toBe(true);
  });

  it("rejects skipping review", () => {
    const result = transition(template, completed(), "approve", clinician);
    expect(result).toMatchObject({ ok: false, error: { kind: "invalid_transition" } });
  });

  it("freezes an approved document against edits", () => {
    const approved = unwrap(transition(template, inReview(completed()), "approve", clinician));
    const result = applyEdits(
      template,
      approved,
      [{ op: "clear", fieldId: "plan.treatment_performed" }],
      clinician,
    );
    expect(result).toEqual({ ok: false, error: { kind: "not_editable" } });
  });
});
