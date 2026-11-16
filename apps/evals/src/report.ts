import { isSafe, summarize, type CaseScore } from "./score.js";

const pct = (part: number, whole: number) =>
  whole === 0 ? "n/a" : `${((100 * part) / whole).toFixed(1)}%`;

/** Plain-text report. Contains field ids and verdicts only, never dictation text or values. */
export function formatReport(model: string, scores: readonly CaseScore[]): string[] {
  const summary = summarize(scores);
  const lines = [
    `Model: ${model}`,
    `Cases: ${summary.cases}, fields scored: ${summary.fields}`,
    "",
  ];

  for (const score of scores) {
    const problems = score.fields.filter((field) => field.verdict !== "correct");
    const status =
      problems.length === 0 ? "ok" : problems.map((p) => `${p.verdict} ${p.fieldId}`).join(", ");
    const withheld = score.withheld > 0 ? ` (grounding withheld ${score.withheld})` : "";
    lines.push(`  ${score.name.padEnd(22)} ${status}${withheld}`);
  }

  const { counts } = summary;
  lines.push(
    "",
    `Correct:      ${counts.correct} (${pct(counts.correct, summary.fields)})`,
    `Missed:       ${counts.missed}  dictated but left empty: costs time, safe`,
    `Wrong:        ${counts.wrong}  filled with the wrong value: UNSAFE`,
    `Unsupported:  ${counts.unsupported}  filled without support: UNSAFE`,
    `Withheld:     ${summary.withheld}  proposals stopped by the grounding check`,
    "",
    isSafe(summary)
      ? "RESULT: no unsafe fills."
      : "RESULT: UNSAFE FILLS PRESENT. Do not proceed to a pilot.",
  );
  return lines;
}
