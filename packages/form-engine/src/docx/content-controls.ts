import type { Element } from "@xmldom/xmldom";
import type { SlotKind } from "../filler.js";
import type { DocxPackage } from "./package.js";
import { child, descendants, W, W14 } from "./xml.js";

export interface ContentControl {
  readonly tag: string;
  readonly kind: SlotKind;
  readonly properties: Element;
  readonly content: Element;
}

function kindOf(properties: Element): SlotKind {
  if (child(properties, W14, "checkbox")) return "checkbox";
  if (child(properties, W, "dropDownList") ?? child(properties, W, "comboBox")) return "choice";
  return "text";
}

function toControl(sdt: Element): ContentControl | undefined {
  const properties = child(sdt, W, "sdtPr");
  const content = child(sdt, W, "sdtContent");
  const tag = properties && child(properties, W, "tag")?.getAttributeNS(W, "val");
  if (!properties || !content || !tag) return undefined;
  return { tag, kind: kindOf(properties), properties, content };
}

/** Every tagged content control in the package, in document order. Untagged controls are ignored. */
export function findContentControls(pkg: DocxPackage): ContentControl[] {
  return pkg.parts.flatMap((part) => {
    const root = part.xml.documentElement;
    if (!root) return [];
    return descendants(root, W, "sdt").flatMap((sdt) => toControl(sdt) ?? []);
  });
}
