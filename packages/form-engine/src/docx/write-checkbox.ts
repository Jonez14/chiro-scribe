import type { Element } from "@xmldom/xmldom";
import type { ContentControl } from "./content-controls.js";
import { child, descendants, W, W14 } from "./xml.js";

/** Word's defaults when the control does not declare its own glyphs: ballot box with X, ballot box. */
const DEFAULT_GLYPH = { checkedState: "2612", uncheckedState: "2610" } as const;

function glyph(checkbox: Element, state: keyof typeof DEFAULT_GLYPH): string {
  const hex = child(checkbox, W14, state)?.getAttributeNS(W14, "val") ?? DEFAULT_GLYPH[state];
  return String.fromCodePoint(Number.parseInt(hex, 16));
}

/** Word stores a checkbox twice: the state flag and the visible glyph. Both must agree. */
export function writeCheckbox(control: ContentControl, checked: boolean): void {
  const checkbox = child(control.properties, W14, "checkbox");
  const doc = control.properties.ownerDocument;
  if (!checkbox || !doc) return;

  let flag = child(checkbox, W14, "checked");
  if (!flag) {
    flag = doc.createElementNS(W14, "w14:checked");
    checkbox.insertBefore(flag, checkbox.firstChild);
  }
  flag.setAttributeNS(W14, "w14:val", checked ? "1" : "0");

  const text = descendants(control.content, W, "t")[0];
  if (text) text.textContent = glyph(checkbox, checked ? "checkedState" : "uncheckedState");
}
