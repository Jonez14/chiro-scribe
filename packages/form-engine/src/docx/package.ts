import { DOMParser, XMLSerializer, type Document } from "@xmldom/xmldom";
import JSZip from "jszip";
import { FormEngineError } from "../errors.js";

/** Body, headers and footers can all carry content controls. */
const CONTENT_PART = /^word\/(document|header\d*|footer\d*)\.xml$/;

export interface DocxPart {
  readonly path: string;
  readonly xml: Document;
}

export interface DocxPackage {
  readonly zip: JSZip;
  readonly parts: readonly DocxPart[];
}

export async function openDocx(file: Uint8Array): Promise<DocxPackage> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new FormEngineError("invalid_file", "File is not a readable .docx package.");
  }
  const paths = Object.keys(zip.files)
    .filter((path) => CONTENT_PART.test(path))
    .sort();
  if (!paths.includes("word/document.xml")) {
    throw new FormEngineError("invalid_file", "Package has no word/document.xml.");
  }
  const parts = await Promise.all(
    paths.map(async (path) => {
      const text = await zip.file(path)?.async("string");
      return { path, xml: new DOMParser().parseFromString(text ?? "", "application/xml") };
    }),
  );
  return { zip, parts };
}

/** Rewrites only the parts we parsed. Every other byte of the package is carried through. */
export async function saveDocx(pkg: DocxPackage): Promise<Uint8Array> {
  const serializer = new XMLSerializer();
  for (const part of pkg.parts) {
    pkg.zip.file(part.path, serializer.serializeToString(part.xml));
  }
  return pkg.zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
