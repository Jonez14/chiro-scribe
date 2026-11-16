import type { ProposedField } from "@chiro-scribe/domain";
import { scriptedExtractor } from "@chiro-scribe/extraction/testing";
import { describe, expect, it } from "vitest";
import { lumbarDailyVisitSuite as suite } from "./cases/lumbar-daily-visit.js";
import type { EvalSuite } from "./eval-case.js";
import { formatReport } from "./report.js";
import { runSuite } from "./run-suite.js";
import { isSafe, summarize } from "./score.js";

const only = (name: string): EvalSuite => ({
  ...suite,
  cases: suite.cases.filter((evalCase) => evalCase.name === name),
});

const verdicts = async (name: string, proposals: ProposedField[]) => {
  const [score] = await runSuite(only(name), scriptedExtractor(proposals));
  return Object.fromEntries(score!.fields.map((field) => [field.fieldId, field.verdict]));
};

const complaint = {
  fieldId: "subjective.chief_complaint",
  value: "Left-sided low back pain",
  evidence: ["Left-sided low back pain for a week"],
};

describe("eval scoring", () => {
  it("has well-formed cases: every expected field exists on the form", () => {
    const ids = new Set(suite.template.fields.map((field) => field.id));
    for (const evalCase of suite.cases) {
      expect(Object.keys(evalCase.expected).filter((id) => !ids.has(id))).toEqual([]);
    }
  });

  it("separates safe misses from unsafe fills", async () => {
    const result = await verdicts("wrong-side trap", [
      complaint,
      // Wrong value, grounded in real words: the dangerous kind of error.
      { fieldId: "subjective.pain_side", value: "right", evidence: ["Left-sided low back pain"] },
      // The trap: a left-sided test recorded in the right-sided field.
      { fieldId: "objective.kemps_right", value: true, evidence: ["Positive Kemp's on the left"] },
    ]);
    expect(result).toEqual({
      "subjective.chief_complaint": "correct",
      "subjective.pain_side": "wrong",
      "objective.kemps_right": "unsupported",
      "objective.lumbar_flexion_deg": "missed",
      "plan.treatment_performed": "missed",
    });
  });

  it("counts an invented finding as withheld, not as an unsafe fill", async () => {
    const scores = await runSuite(
      only("test not performed"),
      scriptedExtractor([
        { fieldId: "objective.lumbar_flexion_deg", value: 45, evidence: ["flexion 45 degrees"] },
      ]),
    );
    const summary = summarize(scores);
    expect(summary.withheld).toBe(1);
    expect(summary.counts.unsupported).toBe(0);
    expect(isSafe(summary)).toBe(true);
  });

  it("reports verdicts without echoing dictation text or values", async () => {
    const scores = await runSuite(only("wrong-side trap"), scriptedExtractor([complaint]));
    const report = formatReport("model-under-test", scores).join("\n");
    expect(report).toContain("RESULT: no unsafe fills.");
    expect(report).toContain("missed subjective.pain_side");
    expect(report).not.toContain("low back pain");
  });
});
