import { applyEdits, createDocument } from "@chiro-scribe/domain";
import { lumbarDailyVisit as template } from "@chiro-scribe/domain/testing";
import { describe, expect, it, vi } from "vitest";
import { ExtractionError } from "../ports.js";
import { createAnthropicEditInterpreter } from "./anthropic-edit-interpreter.js";
import type { MessagesClient } from "./messages-client.js";

function clientReturning(input: unknown) {
  const create = vi.fn<MessagesClient["create"]>(() =>
    Promise.resolve({ content: [{ type: "tool_use", name: "record_edits", input }] }),
  );
  return { create };
}

function documentWithTreatment() {
  const blank = createDocument(template, {
    id: "doc_1",
    patientRef: "pt_synthetic",
    encounterDate: "2026-11-16",
  });
  const edited = applyEdits(
    template,
    blank,
    [{ op: "set", fieldId: "plan.treatment_performed", value: "Adjustment, lumbar traction" }],
    { id: "usr_dc", role: "clinician" },
  );
  if (!edited.ok) throw new Error("fixture");
  return edited.value.document;
}

describe("createAnthropicEditInterpreter", () => {
  it("shows the model the current values so partial removals can be resolved", async () => {
    const client = clientReturning({ operations: [] });
    await createAnthropicEditInterpreter({ client, model: "m" }).interpret({
      template,
      document: documentWithTreatment(),
      instruction: "Remove the lumbar traction treatment.",
    });
    const message = client.create.mock.calls[0]![0].messages[0]!.content;
    expect(message).toContain('- plan.treatment_performed: "Adjustment, lumbar traction"');
    expect(message).toContain("- objective.kemps_right: (empty)");
    expect(message).toContain("Remove the lumbar traction treatment.");
  });

  it("maps each kind of operation", async () => {
    const client = clientReturning({
      operations: [
        { op: "set", field_id: "objective.lumbar_flexion_deg", value: 55 },
        { op: "clear", field_id: "objective.kemps_right" },
        { op: "keep_blank", field_id: "subjective.pain_side" },
      ],
    });
    const operations = await createAnthropicEditInterpreter({ client, model: "m" }).interpret({
      template,
      document: documentWithTreatment(),
      instruction: "x",
    });
    expect(operations).toEqual([
      { op: "set", fieldId: "objective.lumbar_flexion_deg", value: 55 },
      { op: "clear", fieldId: "objective.kemps_right" },
      { op: "keep_blank", fieldId: "subjective.pain_side" },
    ]);
  });

  it("fails closed on a set without a value", async () => {
    const client = clientReturning({
      operations: [{ op: "set", field_id: "objective.kemps_right" }],
    });
    const interpreter = createAnthropicEditInterpreter({ client, model: "m" });
    await expect(
      interpreter.interpret({ template, document: documentWithTreatment(), instruction: "x" }),
    ).rejects.toBeInstanceOf(ExtractionError);
  });
});
