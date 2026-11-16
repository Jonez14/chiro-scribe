import type { FieldValue } from "@chiro-scribe/domain";
import { FormEngineError } from "../errors.js";
import type { Assignment, FormFiller, TemplateSlot } from "../filler.js";
import { findContentControls, type ContentControl } from "./content-controls.js";
import { openDocx, saveDocx } from "./package.js";
import { writeCheckbox } from "./write-checkbox.js";
import { writeText } from "./write-text.js";

function tagOf(assignment: Assignment): string {
  if (assignment.binding.kind !== "docx.content_control") {
    throw new FormEngineError(
      "unsupported_binding",
      `A .docx template cannot use binding ${assignment.binding.kind}.`,
    );
  }
  return assignment.binding.tag;
}

function resolve(controls: readonly ContentControl[], tag: string): ContentControl {
  const matches = controls.filter((control) => control.tag === tag);
  const [control] = matches;
  if (!control) {
    throw new FormEngineError("binding_not_found", `No content control tagged "${tag}".`);
  }
  if (matches.length > 1) {
    throw new FormEngineError(
      "binding_ambiguous",
      `${matches.length} content controls share tag "${tag}".`,
    );
  }
  return control;
}

function write(control: ContentControl, value: FieldValue): void {
  if (control.kind === "checkbox") {
    if (typeof value !== "boolean") {
      throw new FormEngineError("binding_type_mismatch", `"${control.tag}" is a checkbox.`);
    }
    writeCheckbox(control, value);
    return;
  }
  if (typeof value === "boolean") {
    throw new FormEngineError("binding_type_mismatch", `"${control.tag}" is not a checkbox.`);
  }
  writeText(control, String(value));
}

export const docxFiller: FormFiller = {
  async inspect(file): Promise<readonly TemplateSlot[]> {
    const controls = findContentControls(await openDocx(file));
    return controls.map(({ tag, kind }) => ({
      binding: { kind: "docx.content_control", tag },
      kind,
    }));
  },

  async fill(file, assignments): Promise<Uint8Array> {
    const pkg = await openDocx(file);
    const controls = findContentControls(pkg);
    for (const assignment of assignments) {
      write(resolve(controls, tagOf(assignment)), assignment.value);
    }
    return saveDocx(pkg);
  },
};
