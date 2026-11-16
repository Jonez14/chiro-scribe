import {
  applyEdits,
  checkVoiceEdits,
  err,
  type Actor,
  type ClinicalDocument,
  type EditError,
  type EditOutcome,
  type Result,
  type TemplateDefinition,
  type VoiceEditRejection,
} from "@chiro-scribe/domain";
import type { EditInterpreter } from "@chiro-scribe/extraction";

export interface VoiceEditRequest {
  readonly template: TemplateDefinition;
  readonly document: ClinicalDocument;
  /** The transcribed correction, e.g. "Change right cervical rotation to 55 degrees." */
  readonly instruction: string;
  readonly actor: Actor;
}

export type VoiceEditError =
  | { readonly kind: "empty_instruction" }
  | { readonly kind: "template_mismatch" }
  | { readonly kind: "unsupported"; readonly rejection: VoiceEditRejection }
  | { readonly kind: "invalid"; readonly error: EditError };

/**
 * A spoken correction changes only the fields it names and returns the diff for display.
 * If any part of the interpretation is unsupported or invalid, the document is left untouched.
 */
export async function editByVoice(
  request: VoiceEditRequest,
  interpreter: EditInterpreter,
): Promise<Result<EditOutcome, VoiceEditError>> {
  const { template, document, actor } = request;
  const instruction = request.instruction.trim();
  if (instruction.length === 0) return err({ kind: "empty_instruction" });
  if (document.templateId !== template.id || document.templateVersion !== template.version) {
    return err({ kind: "template_mismatch" });
  }

  const interpreted = await interpreter.interpret({ template, document, instruction });
  const checked = checkVoiceEdits(template, instruction, interpreted);
  if (!checked.ok) return err({ kind: "unsupported", rejection: checked.error });

  const applied = applyEdits(template, document, checked.value, actor, {
    kind: "voice",
    instruction,
  });
  return applied.ok ? applied : err({ kind: "invalid", error: applied.error });
}
