import type { FieldDefinition, TemplateDefinition } from "@chiro-scribe/domain";

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

/** The form's fields as the model sees them. Shared by extraction and edit interpretation. */
export function describeFields(template: TemplateDefinition): string[] {
  return template.fields.map(describeField);
}
