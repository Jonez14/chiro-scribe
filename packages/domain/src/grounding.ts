import type { Evidence } from "./document.js";
import { validateFieldValue, type FieldValue, type ValueRejection } from "./field-value.js";
import { wordsContainNumber } from "./numeric-evidence.js";
import { findField, type FieldDefinition, type TemplateDefinition } from "./template.js";

/**
 * Grounding is the "no invented findings" rule, enforced in code rather than in a prompt.
 * An extractor may propose anything. A value only reaches a document if the clinician's
 * own words, quoted verbatim, are present in the transcript and actually carry the value.
 */

/** What an extractor proposes. Untrusted until grounded. */
export interface ProposedField {
  readonly fieldId: string;
  readonly value: unknown;
  readonly evidence: readonly string[];
}

export type GroundingRejection =
  | ValueRejection
  | "unknown_field"
  | "duplicate_field"
  | "no_evidence"
  | "evidence_not_in_transcript"
  | "value_not_in_evidence";

export interface GroundedField {
  readonly fieldId: string;
  readonly value: FieldValue;
  readonly evidence: readonly Evidence[];
}

export interface RejectedProposal {
  readonly fieldId: string;
  readonly reason: GroundingRejection;
}

export interface GroundingOutcome {
  readonly accepted: readonly GroundedField[];
  readonly rejected: readonly RejectedProposal[];
}

/** Case, whitespace and typographic quote differences are not clinical differences. */
export function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A number must be literally present in the quote, not merely implied by it.
 * Polarity (positive vs negative) and option picks are the extractor's reading of the quote,
 * which is why review always shows the quote beside the value.
 */
function quoteCarriesValue(field: FieldDefinition, value: FieldValue, quotes: string): boolean {
  if (field.type === "number" && typeof value === "number")
    return wordsContainNumber(quotes, value);
  return true;
}

function groundOne(
  template: TemplateDefinition,
  transcript: string,
  proposal: ProposedField,
): GroundedField | GroundingRejection {
  const field = findField(template, proposal.fieldId);
  if (field === undefined) return "unknown_field";

  const checked = validateFieldValue(field, proposal.value);
  if (!checked.ok) return checked.error;

  const quotes = proposal.evidence.map(normalizeForMatching).filter((quote) => quote.length > 0);
  if (quotes.length === 0) return "no_evidence";
  if (!quotes.every((quote) => transcript.includes(quote))) return "evidence_not_in_transcript";
  if (!quoteCarriesValue(field, checked.value, quotes.join(" "))) return "value_not_in_evidence";

  return {
    fieldId: field.id,
    value: checked.value,
    evidence: proposal.evidence.map((quote) => ({ quote: quote.trim() })),
  };
}

export function groundProposals(
  template: TemplateDefinition,
  transcript: string,
  proposals: readonly ProposedField[],
): GroundingOutcome {
  const normalizedTranscript = normalizeForMatching(transcript);
  const accepted: GroundedField[] = [];
  const rejected: RejectedProposal[] = [];
  const seen = new Set<string>();

  for (const proposal of proposals) {
    if (seen.has(proposal.fieldId)) {
      rejected.push({ fieldId: proposal.fieldId, reason: "duplicate_field" });
      continue;
    }
    seen.add(proposal.fieldId);
    const outcome = groundOne(template, normalizedTranscript, proposal);
    if (typeof outcome === "string") rejected.push({ fieldId: proposal.fieldId, reason: outcome });
    else accepted.push(outcome);
  }
  return { accepted, rejected };
}
