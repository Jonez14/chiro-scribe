import { applyEdits, createDocument, type Actor, type EditOperation } from "@chiro-scribe/domain";
import { lumbarDailyVisit as template } from "@chiro-scribe/domain/testing";
import { scriptedEditInterpreter } from "@chiro-scribe/extraction/testing";
import { describe, expect, it } from "vitest";
import { editByVoice } from "./edit-by-voice.js";

const clinician: Actor = { id: "usr_dc", role: "clinician" };

function draft() {
  const blank = createDocument(template, {
    id: "doc_1",
    patientRef: "pt_synthetic",
    encounterDate: "2026-11-16",
  });
  const seeded = applyEdits(
    template,
    blank,
    [
      { op: "set", fieldId: "objective.lumbar_flexion_deg", value: 45 },
      { op: "set", fieldId: "plan.treatment_performed", value: "Adjustment, lumbar traction" },
    ],
    clinician,
  );
  if (!seeded.ok) throw new Error("fixture");
  return seeded.value.document;
}

const speak = (instruction: string, operations: EditOperation[], document = draft()) =>
  editByVoice(
    { template, document, instruction, actor: clinician },
    scriptedEditInterpreter(operations),
  );

describe("editByVoice", () => {
  it("changes only the named field and records the spoken instruction as provenance", async () => {
    const before = draft();
    const instruction = "Change lumbar flexion to 55 degrees.";
    const result = await speak(instruction, [
      { op: "set", fieldId: "objective.lumbar_flexion_deg", value: 55 },
    ]);
    if (!result.ok) throw new Error("expected ok");

    expect(result.value.changes.map((change) => change.fieldId)).toEqual([
      "objective.lumbar_flexion_deg",
    ]);
    expect(result.value.document.fields["objective.lumbar_flexion_deg"]).toEqual({
      status: "filled",
      value: 55,
      provenance: { source: "voice_edit", actorId: "usr_dc", instruction },
    });
    expect(result.value.document.fields["plan.treatment_performed"]).toEqual(
      before.fields["plan.treatment_performed"],
    );
  });

  it("removes part of a text field", async () => {
    const result = await speak("Remove the lumbar traction treatment.", [
      { op: "set", fieldId: "plan.treatment_performed", value: "Adjustment" },
    ]);
    expect(result).toMatchObject({
      ok: true,
      value: { document: { fields: { "plan.treatment_performed": { value: "Adjustment" } } } },
    });
  });

  it("keeps a field deliberately blank", async () => {
    const result = await speak("Keep the side field blank.", [
      { op: "keep_blank", fieldId: "subjective.pain_side" },
    ]);
    expect(result).toMatchObject({
      ok: true,
      value: {
        document: { fields: { "subjective.pain_side": { status: "intentionally_blank" } } },
      },
    });
  });

  it("refuses a misheard number and leaves the document untouched", async () => {
    const result = await speak("Change lumbar flexion to 55 degrees.", [
      { op: "set", fieldId: "objective.lumbar_flexion_deg", value: 65 },
    ]);
    expect(result).toMatchObject({ ok: false, error: { kind: "unsupported" } });
  });

  it("refuses a value the form does not allow", async () => {
    const result = await speak("Flexion 500.", [
      { op: "set", fieldId: "objective.lumbar_flexion_deg", value: 500 },
    ]);
    expect(result).toMatchObject({
      ok: false,
      error: { kind: "invalid", error: { kind: "invalid_value", reason: "out_of_range" } },
    });
  });

  it("says so when it did not understand, instead of guessing", async () => {
    const result = await speak("Uh, the thing from before.", []);
    expect(result).toEqual({
      ok: false,
      error: { kind: "unsupported", rejection: { kind: "not_understood" } },
    });
  });
});
