import type { Element } from "@xmldom/xmldom";
import type { FormDiagnosis } from "../diagnosis.js";
import { openDocx } from "./package.js";
import { child, descendants, W } from "./xml.js";

const CHECKBOX_GLYPHS = /[☐-☒]/g;
const BLANK_LINE = /_{3,}/g;

function paragraphText(paragraph: Element): string {
  return descendants(paragraph, W, "t")
    .map((text) => text.textContent ?? "")
    .join("");
}

function isUntagged(sdt: Element): boolean {
  const properties = child(sdt, W, "sdtPr");
  return !properties || !child(properties, W, "tag")?.getAttributeNS(W, "val");
}

const count = (text: string, pattern: RegExp) => (text.match(pattern) ?? []).length;

/**
 * Counts the things in a Word form that look fillable but are not bound yet. Most clinic forms
 * start life as typed underscores and symbol checkboxes, so this sizes the onboarding work.
 * Reports counts only, never document text.
 */
export async function diagnoseDocx(file: Uint8Array): Promise<FormDiagnosis> {
  const pkg = await openDocx(file);
  const roots = pkg.parts.flatMap((part) => part.xml.documentElement ?? []);
  const all = (name: string) => roots.flatMap((root) => descendants(root, W, name));
  const text = all("p").map(paragraphText).join("\n");

  return {
    format: "docx",
    findings: [
      { label: "tables", count: all("tbl").length },
      { label: "content controls without a tag", count: all("sdt").filter(isUntagged).length },
      { label: "legacy Word form fields", count: all("ffData").length },
      {
        label: "checkbox symbols (bound or typed)",
        count: count(text, CHECKBOX_GLYPHS) + all("sym").length,
      },
      { label: "underscore blanks", count: count(text, BLANK_LINE) },
    ],
  };
}
