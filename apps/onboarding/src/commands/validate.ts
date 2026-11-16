import { TemplateDefinition } from "@chiro-scribe/domain";
import { auditBindings } from "@chiro-scribe/form-engine";
import { formatOf, UsageError, type Io } from "../io.js";

async function readJson(io: Io, path: string): Promise<unknown> {
  const text = new TextDecoder().decode(await io.readFile(path));
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new UsageError(`${path} is not valid JSON.`);
  }
}

/** The gate a mapping passes before a template goes live. Exit code 0 only when it is usable. */
export async function validate(io: Io, formPath: string, templatePath: string): Promise<number> {
  const parsed = TemplateDefinition.safeParse(await readJson(io, templatePath));
  if (!parsed.success) {
    io.print("Template definition is invalid:");
    for (const issue of parsed.error.issues)
      io.print(`  ${issue.path.join(".")}: ${issue.message}`);
    return 1;
  }
  const template = parsed.data;
  if (template.format !== formatOf(formPath)) {
    io.print(`Template is for ${template.format} but the form file is not.`);
    return 1;
  }

  const audit = await auditBindings(template, await io.readFile(formPath));
  for (const fieldId of audit.unbound)
    io.print(`MISSING   ${fieldId}: no matching slot in the file`);
  for (const m of audit.mismatched) {
    io.print(`MISMATCH  ${m.fieldId}: a ${m.fieldType} field cannot go in a ${m.slotKind} slot`);
  }
  for (const slot of audit.unmapped)
    io.print(`UNMAPPED  ${JSON.stringify(slot.binding)} (${slot.kind})`);

  const blocking = audit.unbound.length + audit.mismatched.length;
  io.print(
    blocking === 0
      ? `OK: ${template.fields.length} fields bound, ${audit.unmapped.length} slots unmapped.`
      : `FAILED: ${blocking} blocking problem(s).`,
  );
  return blocking === 0 ? 0 : 1;
}
