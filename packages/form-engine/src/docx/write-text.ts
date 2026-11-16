import type { Document, Element } from "@xmldom/xmldom";
import type { ContentControl } from "./content-controls.js";
import { child, childElements, descendants, removeNode, W } from "./xml.js";

const PLACEHOLDER_STYLE = "PlaceholderText";

/** Reuse the control's first run so the clinic's font, size and emphasis survive. */
function claimRun(doc: Document, content: Element): Element {
  const [first, ...rest] = descendants(content, W, "r");
  rest.forEach(removeNode);
  if (first) return first;

  const run = doc.createElementNS(W, "w:r");
  const host = descendants(content, W, "p")[0] ?? content;
  host.appendChild(run);
  return run;
}

function clearRun(run: Element): void {
  for (const node of childElements(run)) {
    if (!(node.namespaceURI === W && node.localName === "rPr")) removeNode(node);
  }
  const runProperties = child(run, W, "rPr");
  const style = runProperties && child(runProperties, W, "rStyle");
  if (style?.getAttributeNS(W, "val") === PLACEHOLDER_STYLE) removeNode(style);
}

function appendLines(doc: Document, run: Element, value: string): void {
  value.split(/\r?\n/).forEach((line, index) => {
    if (index > 0) run.appendChild(doc.createElementNS(W, "w:br"));
    const text = doc.createElementNS(W, "w:t");
    text.setAttribute("xml:space", "preserve");
    text.appendChild(doc.createTextNode(line));
    run.appendChild(text);
  });
}

export function writeText(control: ContentControl, value: string): void {
  const doc = control.content.ownerDocument;
  if (!doc) return;
  const placeholderFlag = child(control.properties, W, "showingPlcHdr");
  if (placeholderFlag) removeNode(placeholderFlag);

  const run = claimRun(doc, control.content);
  clearRun(run);
  appendLines(doc, run, value);
}
