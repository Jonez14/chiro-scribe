import { describe, expect, it } from "vitest";
import { createDocument } from "./document.js";
import { applyGroundedFields } from "./drafting.js";
import { applyEdits } from "./edits.js";
import type { Actor } from "./lifecycle.js";
import { lumbarDailyVisit as template } from "./test-support/index.js";

const clinician: Actor = { id: "usr_dc", role: "clinician" };
const draft = () =>
  createDocument(template, {
    id: "doc_1",
    patientRef: "pt_synthetic",
    encounterDate: "2026-11-16",
  });

describe("applyEdits", () => {
  it("changes only the targeted field and reports the diff", () => {
    const result = applyEdits(
      template,
      draft(),
      [{ op: "set", fieldId: "objective.lumbar_flexion_deg", value: 55 }],
      clinician,
    );
    if (!result.ok) throw new Error("expected ok");
    expect(result.value.changes).toEqual([
      {
        fieldId: "objective.lumbar_flexion_deg",
        before: { status: "empty" },
        after: {
          status: "filled",
          value: 55,
          provenance: { source: "clinician_edit", actorId: "usr_dc" },
        },
      },
    ]);
    expect(result.value.document.fields["subjective.chief_complaint"]).toEqual({ status: "empty" });
  });

  it("applies nothing when any operation in the batch is invalid", () => {
    const result = applyEdits(
      template,
      draft(),
      [
        { op: "set", fieldId: "objective.kemps_right", value: true },
        { op: "set", fieldId: "objective.lumbar_flexion_deg", value: 900 },
      ],
      clinician,
    );
    expect(result).toEqual({
      ok: false,
      error: {
        kind: "invalid_value",
        fieldId: "objective.lumbar_flexion_deg",
        reason: "out_of_range",
      },
    });
  });

  it("does not let the pipeline edit as if it were a person", () => {
    const result = applyEdits(
      template,
      draft(),
      [{ op: "clear", fieldId: "objective.kemps_right" }],
      { id: "pipeline", role: "system" },
    );
    expect(result).toEqual({ ok: false, error: { kind: "forbidden" } });
  });
});

describe("applyGroundedFields", () => {
  it("never overwrites a field the clinician already decided", () => {
    const edited = applyEdits(
      template,
      draft(),
      [
        { op: "set", fieldId: "objective.lumbar_flexion_deg", value: 55 },
        { op: "keep_blank", fieldId: "subjective.pain_side" },
      ],
      clinician,
    );
    if (!edited.ok) throw new Error("expected ok");

    const redrafted = applyGroundedFields(edited.value.document, [
      { fieldId: "objective.lumbar_flexion_deg", value: 45, evidence: [{ quote: "45 degrees" }] },
      { fieldId: "subjective.pain_side", value: "right", evidence: [{ quote: "right-sided" }] },
      { fieldId: "objective.kemps_right", value: true, evidence: [{ quote: "Positive Kemp's" }] },
    ]);

    expect(redrafted.fields["objective.lumbar_flexion_deg"]).toMatchObject({ value: 55 });
    expect(redrafted.fields["subjective.pain_side"]?.status).toBe("intentionally_blank");
    expect(redrafted.fields["objective.kemps_right"]).toMatchObject({
      status: "filled",
      value: true,
    });
  });
});
