import { diagnoseForm, fillerFor, type TemplateSlot } from "@chiro-scribe/form-engine";
import { formatOf, type Io } from "../io.js";

function slotName(slot: TemplateSlot): string {
  return slot.binding.kind === "docx.content_control" ? slot.binding.tag : slot.binding.name;
}

/** What is ready to fill in this file, and what still needs binding. */
export async function inspect(io: Io, path: string): Promise<number> {
  const format = formatOf(path);
  const file = await io.readFile(path);
  const slots = await fillerFor(format).inspect(file);
  const diagnosis = await diagnoseForm(format, file);

  io.print(`Fillable slots: ${slots.length}`);
  for (const slot of slots) io.print(`  ${slot.kind.padEnd(8)} ${slotName(slot)}`);
  io.print("Also in this file:");
  for (const finding of diagnosis.findings)
    io.print(`  ${String(finding.count).padStart(4)}  ${finding.label}`);
  if (slots.length === 0) {
    io.print("No fillable slots yet. This form needs binding before it can be used.");
  }
  return 0;
}
