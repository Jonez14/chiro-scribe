import type { Element, Node } from "@xmldom/xmldom";

export const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
export const W14 = "http://schemas.microsoft.com/office/word/2010/wordml";

const ELEMENT_NODE = 1;

export function childElements(parent: Node): Element[] {
  const result: Element[] = [];
  for (let node = parent.firstChild; node !== null; node = node.nextSibling) {
    if (node.nodeType === ELEMENT_NODE) result.push(node as Element);
  }
  return result;
}

export function child(parent: Node, ns: string, localName: string): Element | undefined {
  return childElements(parent).find((el) => el.namespaceURI === ns && el.localName === localName);
}

export function descendants(parent: Element, ns: string, localName: string): Element[] {
  return Array.from(parent.getElementsByTagNameNS(ns, localName));
}

export function removeNode(node: Node): void {
  node.parentNode?.removeChild(node);
}
