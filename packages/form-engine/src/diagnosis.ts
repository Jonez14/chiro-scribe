import type { TemplateFormat } from "@chiro-scribe/domain";

export interface DiagnosisFinding {
  readonly label: string;
  readonly count: number;
}

/** What a form file contains besides ready-to-fill slots. Counts only, never content. */
export interface FormDiagnosis {
  readonly format: TemplateFormat;
  readonly findings: readonly DiagnosisFinding[];
}
