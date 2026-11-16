import { draftFromDictation } from "@chiro-scribe/application";
import type { ClinicalExtractor } from "@chiro-scribe/extraction";
import type { EvalSuite } from "./eval-case.js";
import { scoreCase, type CaseScore } from "./score.js";

/** Runs every case through the real pipeline (extract, ground, draft) and scores the drafts. */
export async function runSuite(
  suite: EvalSuite,
  extractor: ClinicalExtractor,
): Promise<readonly CaseScore[]> {
  const scores: CaseScore[] = [];
  for (const [index, evalCase] of suite.cases.entries()) {
    const result = await draftFromDictation(
      {
        template: suite.template,
        transcript: evalCase.transcript,
        target: { id: `eval_${index}`, patientRef: "pt_synthetic", encounterDate: "2026-01-01" },
      },
      extractor,
    );
    if (!result.ok)
      throw new Error(`Case "${evalCase.name}" could not be drafted: ${result.error.kind}`);
    scores.push(scoreCase(suite, evalCase, result.value.document, result.value.rejected));
  }
  return scores;
}
