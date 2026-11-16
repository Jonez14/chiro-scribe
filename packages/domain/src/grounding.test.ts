import { describe, expect, it } from "vitest";
import { groundProposals, type ProposedField } from "./grounding.js";
import { lumbarDailyVisit, sampleDictation } from "./test-support/index.js";

const ground = (...proposals: ProposedField[]) =>
  groundProposals(lumbarDailyVisit, sampleDictation, proposals);

describe("groundProposals", () => {
  it("accepts a value whose quote is in the transcript", () => {
    const outcome = ground({
      fieldId: "objective.lumbar_flexion_deg",
      value: 45,
      evidence: ["Lumbar flexion 45 degrees"],
    });
    expect(outcome.rejected).toEqual([]);
    expect(outcome.accepted[0]).toMatchObject({
      fieldId: "objective.lumbar_flexion_deg",
      value: 45,
    });
  });

  it("matches across case, whitespace and typographic apostrophes", () => {
    const outcome = ground({
      fieldId: "objective.kemps_right",
      value: true,
      evidence: ["positive  KEMP'S on the right"],
    });
    expect(outcome.accepted).toHaveLength(1);
  });

  it("rejects a finding the clinician never dictated", () => {
    const outcome = ground({
      fieldId: "subjective.chief_complaint",
      value: "Radiating pain into the left leg",
      evidence: ["pain radiates into the left leg"],
    });
    expect(outcome.accepted).toEqual([]);
    expect(outcome.rejected).toEqual([
      { fieldId: "subjective.chief_complaint", reason: "evidence_not_in_transcript" },
    ]);
  });

  it("rejects a number that the quoted words do not contain", () => {
    const outcome = ground({
      fieldId: "objective.lumbar_flexion_deg",
      value: 60,
      evidence: ["Lumbar flexion 45 degrees"],
    });
    expect(outcome.rejected[0]?.reason).toBe("value_not_in_evidence");
  });

  it.each([
    ["no evidence", { fieldId: "objective.kemps_right", value: true, evidence: [] }, "no_evidence"],
    [
      "blank evidence",
      { fieldId: "objective.kemps_right", value: true, evidence: ["  "] },
      "no_evidence",
    ],
    [
      "unknown field",
      { fieldId: "objective.slr_left", value: true, evidence: ["x"] },
      "unknown_field",
    ],
    [
      "out of range",
      { fieldId: "objective.lumbar_flexion_deg", value: 450, evidence: ["45 degrees"] },
      "out_of_range",
    ],
    [
      "option outside the form",
      { fieldId: "subjective.pain_side", value: "central", evidence: ["right-sided"] },
      "invalid_option",
    ],
    [
      "wrong type",
      { fieldId: "objective.lumbar_flexion_deg", value: "45", evidence: ["45 degrees"] },
      "type_mismatch",
    ],
  ] as const)("rejects %s", (_name, proposal, reason) => {
    expect(ground(proposal).rejected[0]?.reason).toBe(reason);
  });

  it("keeps the first proposal for a field and rejects repeats", () => {
    const proposal = { fieldId: "subjective.pain_side", value: "right", evidence: ["right-sided"] };
    const outcome = ground(proposal, { ...proposal, value: "left" });
    expect(outcome.accepted).toHaveLength(1);
    expect(outcome.rejected).toEqual([
      { fieldId: "subjective.pain_side", reason: "duplicate_field" },
    ]);
  });
});
