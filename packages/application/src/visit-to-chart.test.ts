import { applyEdits, transition, type Actor, type Result } from "@chiro-scribe/domain";
import { lumbarDailyVisit as template, sampleDictation } from "@chiro-scribe/domain/testing";
import { scriptedExtractor } from "@chiro-scribe/extraction/testing";
import { auditBindings } from "@chiro-scribe/form-engine";
import { buildDocxFixture, readDocumentXml } from "@chiro-scribe/form-engine/testing";
import { describe, expect, it } from "vitest";
import { draftFromDictation } from "./draft-from-dictation.js";
import { exportApprovedDocument, renderPreview } from "./export-document.js";

const clinician: Actor = { id: "usr_dc", role: "clinician" };
const pipeline: Actor = { id: "pipeline", role: "system" };
const target = { id: "doc_1", patientRef: "pt_synthetic", encounterDate: "2026-11-16" };

function unwrap<T>(result: Result<T, unknown>): T {
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

const formFile = () =>
  buildDocxFixture(
    [
      "subjective.chief_complaint",
      "subjective.pain_side",
      "objective.lumbar_flexion_deg",
      "plan.treatment_performed",
    ],
    ["objective.kemps_right"],
  );

/** A realistic model response: mostly right, plus one finding that was never dictated. */
const extractor = scriptedExtractor([
  {
    fieldId: "subjective.chief_complaint",
    value: "Right-sided low back pain for three weeks",
    evidence: ["right-sided low back pain for three weeks"],
  },
  { fieldId: "subjective.pain_side", value: "right", evidence: ["right-sided low back pain"] },
  { fieldId: "objective.kemps_right", value: true, evidence: ["Positive Kemp's on the right"] },
  { fieldId: "objective.lumbar_flexion_deg", value: 45, evidence: ["Lumbar flexion 45 degrees"] },
  {
    fieldId: "plan.treatment_performed",
    value: "Lumbar adjustments, myofascial release, lumbar traction",
    evidence: ["Performed lumbar adjustments, myofascial release and lumbar traction"],
  },
]);

describe("visit to chart", () => {
  it("has a mapping that lines up with the form file", async () => {
    expect(await auditBindings(template, await formFile())).toEqual({
      unbound: [],
      mismatched: [],
      unmapped: [],
    });
  });

  it("drafts from dictation, withholds the invented finding, and flags the gap", async () => {
    const draft = unwrap(
      await draftFromDictation({ template, transcript: sampleDictation, target }, extractor),
    );

    expect(draft.rejected).toEqual([
      { fieldId: "plan.treatment_performed", reason: "evidence_not_in_transcript" },
    ]);
    expect(draft.document.fields["plan.treatment_performed"]).toEqual({ status: "empty" });
    expect(draft.completeness.missingRequired.map((m) => m.fieldId)).toEqual([
      "plan.treatment_performed",
    ]);
    expect(draft.completeness.filledCount).toBe(4);
  });

  it("goes from dictation to an approved, filled copy of the clinic's own form", async () => {
    const file = await formFile();
    const draft = unwrap(
      await draftFromDictation({ template, transcript: sampleDictation, target }, extractor),
    );

    const inReview = unwrap(transition(template, draft.document, "submit_for_review", pipeline));
    expect(await exportApprovedDocument(template, inReview, file)).toEqual({
      ok: false,
      error: { kind: "not_approved", status: "in_review" },
    });
    expect((await renderPreview(template, inReview, file)).ok).toBe(true);

    const corrected = unwrap(
      applyEdits(
        template,
        inReview,
        [
          {
            op: "set",
            fieldId: "plan.treatment_performed",
            value: "Lumbar adjustments, myofascial release",
          },
        ],
        clinician,
      ),
    );
    expect(corrected.changes).toHaveLength(1);

    const approved = unwrap(transition(template, corrected.document, "approve", clinician));
    const xml = await readDocumentXml(
      unwrap(await exportApprovedDocument(template, approved, file)),
    );

    expect(xml).toContain(">Right-sided low back pain for three weeks</w:t>");
    expect(xml).toContain(">45</w:t>");
    expect(xml).toContain('<w14:checked w14:val="1"/>');
    expect(xml).toContain(">Lumbar adjustments, myofascial release</w:t>");
    expect(xml).not.toContain("traction");
  });

  it("refuses an empty dictation instead of producing an empty note", async () => {
    const result = await draftFromDictation({ template, transcript: "   ", target }, extractor);
    expect(result).toEqual({ ok: false, error: { kind: "empty_transcript" } });
  });
});
