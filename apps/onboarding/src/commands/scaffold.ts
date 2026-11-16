import { ClinicalSection, type ClinicalSection as Section } from "@chiro-scribe/domain";
import { fillerFor, type SlotKind, type TemplateSlot } from "@chiro-scribe/form-engine";
import { formatOf, type Io } from "../io.js";

/** Deliberately invalid: a person must decide the clinical section. Validation fails until they do. */
export const SECTION_PLACEHOLDER = "TODO_SECTION";

const fieldType = {
  text: "text",
  checkbox: "checkbox",
  choice: "choice",
} as const satisfies Record<SlotKind, string>;

function slotName(slot: TemplateSlot): string {
  return slot.binding.kind === "docx.content_control" ? slot.binding.tag : slot.binding.name;
}

function toFieldId(name: string): string {
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "_")
    .replace(/^[^a-z]+|_+$/g, "");
  return id.length > 0 ? id : "field";
}

/** A section is taken from the slot name only when the name states it outright. Never guessed. */
function sectionOf(fieldId: string): Section | typeof SECTION_PLACEHOLDER {
  const parsed = ClinicalSection.safeParse(fieldId.split(".")[0]);
  return parsed.success ? parsed.data : SECTION_PLACEHOLDER;
}

function toField(slot: TemplateSlot) {
  const name = slotName(slot);
  const id = toFieldId(name);
  return {
    id,
    label: name,
    section: sectionOf(id),
    type: fieldType[slot.kind],
    required: false,
    ...(slot.kind === "choice" ? { options: ["TODO_OPTION_1", "TODO_OPTION_2"] } : {}),
    binding: slot.binding,
  };
}

/** Prints a starting mapping for a bound form. A draft for a person to finish, not a template. */
export async function scaffold(io: Io, path: string): Promise<number> {
  const format = formatOf(path);
  const slots = await fillerFor(format).inspect(await io.readFile(path));
  const draft = {
    id: "TODO_template_id",
    version: 1,
    name: "TODO template name",
    documentType: "daily_visit",
    format,
    fields: slots.map(toField),
  };
  io.print(JSON.stringify(draft, null, 2));
  return slots.length > 0 ? 0 : 1;
}
