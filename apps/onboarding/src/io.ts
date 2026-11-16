import type { TemplateFormat } from "@chiro-scribe/domain";

/** Everything a command may touch. Injected so commands are tested without a filesystem. */
export interface Io {
  readFile(path: string): Promise<Uint8Array>;
  print(line: string): void;
}

export class UsageError extends Error {
  override readonly name = "UsageError";
}

export function formatOf(path: string): TemplateFormat {
  const lower = path.toLowerCase();
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".pdf")) return "pdf";
  throw new UsageError(`Unsupported file type: ${path}. Expected a .docx or .pdf file.`);
}
