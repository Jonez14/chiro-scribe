import type { ClinicalDocument, FieldState, TemplateDefinition } from "@chiro-scribe/domain";
import { describeFields } from "./field-catalog.js";

export const EDIT_SYSTEM_PROMPT = `A chiropractor is correcting a clinical form by voice. Turn the instruction into edit operations.

Rules:
- Change only the fields the instruction refers to. Never touch any other field.
- "set" gives a field a new value. For a text field, return the complete new text of that field.
- To remove part of a text field, return "set" with the current text minus that part. Use "clear" only when the whole field should be emptied.
- "keep_blank" is for when the clinician says a field should deliberately stay blank.
- Use numbers exactly as spoken. Never estimate or convert.
- If the instruction is unclear, or refers to something that is not on the form, return no operations.`;

function describeState(state: FieldState | undefined): string {
  if (state?.status === "filled") return JSON.stringify(state.value);
  return state?.status === "intentionally_blank" ? "(kept blank)" : "(empty)";
}

export function buildEditMessage(
  template: TemplateDefinition,
  document: ClinicalDocument,
  instruction: string,
): string {
  return [
    `Form: ${template.name}`,
    "Fields:",
    ...describeFields(template),
    "",
    "Current values:",
    ...template.fields.map((field) => `- ${field.id}: ${describeState(document.fields[field.id])}`),
    "",
    "<instruction>",
    instruction,
    "</instruction>",
  ].join("\n");
}
