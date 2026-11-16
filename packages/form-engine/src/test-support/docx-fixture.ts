import JSZip from "jszip";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const W14 = "http://schemas.microsoft.com/office/word/2010/wordml";

const textControl = (tag: string) => `
  <w:sdt>
    <w:sdtPr><w:tag w:val="${tag}"/><w:showingPlcHdr/><w:text/></w:sdtPr>
    <w:sdtContent>
      <w:r><w:rPr><w:rStyle w:val="PlaceholderText"/><w:b/></w:rPr><w:t>Click to enter</w:t></w:r>
      <w:r><w:t> text.</w:t></w:r>
    </w:sdtContent>
  </w:sdt>`;

const checkboxControl = (tag: string) => `
  <w:sdt>
    <w:sdtPr>
      <w:tag w:val="${tag}"/>
      <w14:checkbox>
        <w14:checked w14:val="0"/>
        <w14:checkedState w14:val="2612" w14:font="MS Gothic"/>
        <w14:uncheckedState w14:val="2610" w14:font="MS Gothic"/>
      </w14:checkbox>
    </w:sdtPr>
    <w:sdtContent><w:r><w:t>☐</w:t></w:r></w:sdtContent>
  </w:sdt>`;

const cell = (inner: string) => `<w:tc><w:p>${inner}</w:p></w:tc>`;

/**
 * A minimal, valid, synthetic .docx with tagged content controls inside a table,
 * built in memory so no binary fixtures (and no real forms) live in the repo.
 */
export async function buildDocxFixture(
  textTags: readonly string[],
  checkboxTags: readonly string[],
): Promise<Uint8Array> {
  const rows = [
    ...textTags.map(
      (tag) => `<w:tr>${cell(`<w:r><w:t>${tag}</w:t></w:r>`)}${cell(textControl(tag))}</w:tr>`,
    ),
    ...checkboxTags.map(
      (tag) => `<w:tr>${cell(`<w:r><w:t>${tag}</w:t></w:r>`)}${cell(checkboxControl(tag))}</w:tr>`,
    ),
  ].join("");
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}" xmlns:w14="${W14}"><w:body>
  <w:p><w:r><w:t>Daily Visit Note</w:t></w:r></w:p>
  <w:tbl>${rows}</w:tbl>
</w:body></w:document>`;

  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  );
  zip.file("word/document.xml", documentXml);
  return zip.generateAsync({ type: "uint8array" });
}

export async function readDocumentXml(file: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  return (await zip.file("word/document.xml")?.async("string")) ?? "";
}
