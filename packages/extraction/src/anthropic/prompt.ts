import type { FieldDefinition, TemplateDefinition } from "@chiro-scribe/domain";

export const SYSTEM_PROMPT = `You transcribe a chiropractor's dictation into the fields of their own clinical form.

Rules:
- Record only what the clinician explicitly said. Never infer, assume, or complete a finding.
- If the dictation does not address a field, omit that field. An omitted field is correct. A guessed field is a clinical error.
- For every field you return, quote the exact words from the dictation that support it. Copy them verbatim.
- For a checkbox, return true or false only if the clinician stated the result. Unmentioned is not negative.
- For a number, return the number exactly as dictated.
- Use the clinician's own terminology. Do not add diagnoses, codes, or recommendations.`;

function describeType(field: FieldDefinition): string {
  switch (field.type) {
    case "text":
      return "text";
    case "number":
      return field.unit ? `number (${field.unit})` : "number";
    case "checkbox":
      return "checkbox: true or false";
    case "choice":
      return `one of: ${field.options.join(" | ")}`;
  }
}

function describeField(field: FieldDefinition): string {
  const guidance = field.guidance ? ` Note: ${field.guidance}` : "";
  return `- ${field.id} [${field.section}] "${field.label}" (${describeType(field)}).${guidance}`;
}

export function buildUserMessage(template: TemplateDefinition, transcript: string): string {
  return [
    `Form: ${template.name}`,
    "Fields:",
    ...template.fields.map(describeField),
    "",
    "Dictation:",
    "<dictation>",
    transcript,
    "</dictation>",
  ].join("\n");
}
