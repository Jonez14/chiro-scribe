import type { ClinicalDocument, FieldValue, RejectedProposal } from "@chiro-scribe/domain";
import type { EvalCase, EvalSuite } from "./eval-case.js";

export type FieldVerdict =
  /** Right value, or correctly left empty. */
  | "correct"
  /** Dictated but not filled. Costs the clinician time. Safe. */
  | "missed"
  /** Filled with the wrong value. Unsafe: a reviewer could approve it. */
  | "wrong"
  /** Filled although the dictation did not support it. Unsafe. */
  | "unsupported";

export interface FieldScore {
  readonly fieldId: string;
  readonly verdict: FieldVerdict;
}

export interface CaseScore {
  readonly name: string;
  readonly fields: readonly FieldScore[];
  /** Proposals the grounding check withheld. Each one is the safety net doing its job. */
  readonly withheld: number;
}

function matches(type: string, expected: FieldValue, actual: FieldValue): boolean {
  return type === "text" ? true : expected === actual;
}

function verdictFor(
  type: string,
  expected: FieldValue | undefined,
  actual: FieldValue | undefined,
): FieldVerdict {
  if (expected === undefined) return actual === undefined ? "correct" : "unsupported";
  if (actual === undefined) return "missed";
  return matches(type, expected, actual) ? "correct" : "wrong";
}

export function scoreCase(
  suite: EvalSuite,
  evalCase: EvalCase,
  document: ClinicalDocument,
  rejected: readonly RejectedProposal[],
): CaseScore {
  const fields = suite.template.fields.map((field): FieldScore => {
    const state = document.fields[field.id];
    const actual = state?.status === "filled" ? state.value : undefined;
    return {
      fieldId: field.id,
      verdict: verdictFor(field.type, evalCase.expected[field.id], actual),
    };
  });
  return { name: evalCase.name, fields, withheld: rejected.length };
}

export interface Summary {
  readonly cases: number;
  readonly fields: number;
  readonly counts: Readonly<Record<FieldVerdict, number>>;
  readonly withheld: number;
}

export function summarize(scores: readonly CaseScore[]): Summary {
  const counts: Record<FieldVerdict, number> = { correct: 0, missed: 0, wrong: 0, unsupported: 0 };
  for (const score of scores) for (const field of score.fields) counts[field.verdict] += 1;
  return {
    cases: scores.length,
    fields: scores.reduce((total, score) => total + score.fields.length, 0),
    counts,
    withheld: scores.reduce((total, score) => total + score.withheld, 0),
  };
}

/** The bar for clinical use: time-costing misses are tolerable, unsafe fills are not. */
export function isSafe(summary: Summary): boolean {
  return summary.counts.wrong === 0 && summary.counts.unsupported === 0;
}
