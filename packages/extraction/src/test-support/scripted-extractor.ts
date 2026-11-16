import type { EditOperation, ProposedField } from "@chiro-scribe/domain";
import type { ClinicalExtractor, EditInterpreter } from "../ports.js";

/** Deterministic extractor for tests, including proposals a misbehaving model might make. */
export function scriptedExtractor(proposals: readonly ProposedField[]): ClinicalExtractor {
  return { extract: () => Promise.resolve(proposals) };
}

/** Deterministic edit interpreter for tests. */
export function scriptedEditInterpreter(operations: readonly EditOperation[]): EditInterpreter {
  return { interpret: () => Promise.resolve(operations) };
}
