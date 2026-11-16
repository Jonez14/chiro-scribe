import type { FieldValue, TemplateDefinition } from "@chiro-scribe/domain";

/**
 * One synthetic dictation and what a correct draft looks like.
 * `expected` lists every field the dictation supports. Any field not listed must stay empty.
 * Text fields are checked for presence only: wording is for a person to judge, not a string match.
 */
export interface EvalCase {
  readonly name: string;
  /** What this case is designed to catch. */
  readonly probes: string;
  readonly transcript: string;
  readonly expected: Readonly<Record<string, FieldValue>>;
}

export interface EvalSuite {
  readonly template: TemplateDefinition;
  readonly cases: readonly EvalCase[];
}
