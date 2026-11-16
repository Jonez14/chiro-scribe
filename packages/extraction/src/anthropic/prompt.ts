import type { TemplateDefinition } from "@chiro-scribe/domain";
import { describeFields } from "./field-catalog.js";

export const SYSTEM_PROMPT = `You transcribe a chiropractor's dictation into the fields of their own clinical form.

Rules:
- Record only what the clinician explicitly said. Never infer, assume, or complete a finding.
- If the dictation does not address a field, omit that field. An omitted field is correct. A guessed field is a clinical error.
- For every field you return, quote the exact words from the dictation that support it. Copy them verbatim.
- For a checkbox, return true or false only if the clinician stated the result. Unmentioned is not negative.
- For a number, return the number exactly as dictated.
- Use the clinician's own terminology. Do not add diagnoses, codes, or recommendations.`;

export function buildUserMessage(template: TemplateDefinition, transcript: string): string {
  return [
    `Form: ${template.name}`,
    "Fields:",
    ...describeFields(template),
    "",
    "Dictation:",
    "<dictation>",
    transcript,
    "</dictation>",
  ].join("\n");
}
