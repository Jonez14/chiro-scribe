export type FormEngineErrorCode =
  | "invalid_file"
  | "binding_not_found"
  | "binding_ambiguous"
  | "binding_type_mismatch"
  | "unsupported_binding";

/**
 * Thrown when a template file and its mapping disagree. That is a configuration defect
 * caught at template onboarding, never something to paper over while filling a chart.
 */
export class FormEngineError extends Error {
  override readonly name = "FormEngineError";

  constructor(
    readonly code: FormEngineErrorCode,
    message: string,
  ) {
    super(message);
  }
}
