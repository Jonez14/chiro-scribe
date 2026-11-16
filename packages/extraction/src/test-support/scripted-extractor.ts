import type { ProposedField } from "@chiro-scribe/domain";
import type { ClinicalExtractor } from "../ports.js";

/** Deterministic extractor for tests, including proposals a misbehaving model might make. */
export function scriptedExtractor(proposals: readonly ProposedField[]): ClinicalExtractor {
  return { extract: () => Promise.resolve(proposals) };
}
