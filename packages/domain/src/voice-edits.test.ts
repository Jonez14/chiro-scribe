import { describe, expect, it } from "vitest";
import { lumbarDailyVisit as template } from "./test-support/index.js";
import { checkVoiceEdits } from "./voice-edits.js";

const flexion = (value: number) =>
  ({ op: "set", fieldId: "objective.lumbar_flexion_deg", value }) as const;

describe("checkVoiceEdits", () => {
  it("accepts a number the clinician actually spoke", () => {
    const result = checkVoiceEdits(template, "Change lumbar flexion to 55 degrees.", [flexion(55)]);
    expect(result.ok).toBe(true);
  });

  it("rejects a number that is not in the instruction", () => {
    const result = checkVoiceEdits(template, "Change lumbar flexion to 55 degrees.", [flexion(65)]);
    expect(result).toEqual({
      ok: false,
      error: { kind: "number_not_spoken", fieldId: "objective.lumbar_flexion_deg", value: 65 },
    });
  });

  it("rejects an instruction the interpreter could not map to anything", () => {
    expect(checkVoiceEdits(template, "Hmm, never mind.", [])).toEqual({
      ok: false,
      error: { kind: "not_understood" },
    });
  });

  it("rejects the whole batch when one operation targets a field the form lacks", () => {
    const result = checkVoiceEdits(template, "Add positive left Spurling's and flexion 55.", [
      flexion(55),
      { op: "set", fieldId: "objective.spurlings_left", value: true },
    ]);
    expect(result).toEqual({
      ok: false,
      error: { kind: "unknown_field", fieldId: "objective.spurlings_left" },
    });
  });

  it("rejects two operations on the same field", () => {
    const result = checkVoiceEdits(template, "Flexion 55, no, 60.", [flexion(55), flexion(60)]);
    expect(result).toMatchObject({ ok: false, error: { kind: "duplicate_field" } });
  });
});
