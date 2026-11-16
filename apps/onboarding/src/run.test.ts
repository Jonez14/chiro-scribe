import { TemplateDefinition } from "@chiro-scribe/domain";
import { lumbarDailyVisit } from "@chiro-scribe/domain/testing";
import { buildDocxFixture, buildPdfFixture } from "@chiro-scribe/form-engine/testing";
import { describe, expect, it } from "vitest";
import type { Io } from "./io.js";
import { run, USAGE } from "./run.js";

const json = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));

async function cli(files: Record<string, Uint8Array>, ...argv: string[]) {
  const lines: string[] = [];
  const io: Io = {
    readFile: (path) => {
      const file = files[path];
      if (file) return Promise.resolve(file);
      return Promise.reject(Object.assign(new Error("missing"), { code: "ENOENT" }));
    },
    print: (line) => lines.push(line),
  };
  return { code: await run(io, argv), output: lines.join("\n") };
}

const boundForm = () =>
  buildDocxFixture(
    [
      "subjective.chief_complaint",
      "subjective.pain_side",
      "objective.lumbar_flexion_deg",
      "plan.treatment_performed",
    ],
    ["objective.kemps_right"],
  );

describe("scribe-forms", () => {
  it("inspect lists slots and what else is in the file", async () => {
    const { code, output } = await cli(
      { "f.docx": await buildDocxFixture(["complaint"], ["kemps"]) },
      "inspect",
      "f.docx",
    );
    expect(code).toBe(0);
    expect(output).toContain("Fillable slots: 2");
    expect(output).toContain("text     complaint");
    expect(output).toContain("checkbox kemps");
    expect(output).toMatch(/1\s+tables/);
  });

  it("inspect says plainly when a form has nothing bound yet", async () => {
    const { output } = await cli({ "f.docx": await buildDocxFixture([], []) }, "inspect", "f.docx");
    expect(output).toContain("This form needs binding");
  });

  it("validate passes a mapping that lines up with its form", async () => {
    const files = { "f.docx": await boundForm(), "t.json": json(lumbarDailyVisit) };
    const { code, output } = await cli(files, "validate", "f.docx", "t.json");
    expect(output).toContain("OK: 5 fields bound, 0 slots unmapped.");
    expect(code).toBe(0);
  });

  it("validate fails when the form lacks a mapped field", async () => {
    const files = {
      "f.docx": await buildDocxFixture(["subjective.chief_complaint"], []),
      "t.json": json(lumbarDailyVisit),
    };
    const { code, output } = await cli(files, "validate", "f.docx", "t.json");
    expect(code).toBe(1);
    expect(output).toContain("MISSING   objective.kemps_right");
    expect(output).toContain("FAILED: 4 blocking problem(s).");
  });

  it("scaffold output is a draft that cannot pass validation until a person finishes it", async () => {
    const files: Record<string, Uint8Array> = { "f.pdf": await buildPdfFixture() };
    const { code, output } = await cli(files, "scaffold", "f.pdf");
    expect(code).toBe(0);

    const draft = JSON.parse(output) as { fields: { id: string; section: string }[] };
    expect(draft.fields.map((field) => field.id)).toEqual([
      "chief_complaint",
      "flexion",
      "kemps_right",
      "pain_side",
    ]);
    expect(draft.fields.every((field) => field.section === "TODO_SECTION")).toBe(true);
    expect(TemplateDefinition.safeParse(draft).success).toBe(false);
  });

  it("scaffold takes the section from a slot name that states it", async () => {
    const { output } = await cli(
      { "f.docx": await buildDocxFixture(["objective.slr_left"], []) },
      "scaffold",
      "f.docx",
    );
    expect(output).toContain('"section": "objective"');
  });

  it.each([
    ["no arguments", [], USAGE],
    ["an unsupported file type", ["inspect", "form.doc"], "Unsupported file type"],
    ["a missing file", ["inspect", "nope.docx"], "File not found."],
  ])("exits 2 with a message on %s", async (_name, argv, message) => {
    const { code, output } = await cli({}, ...argv);
    expect(code).toBe(2);
    expect(output).toContain(message);
  });

  it("exits 2 on a file that is not really a Word document", async () => {
    const { code, output } = await cli(
      { "f.docx": new Uint8Array([1, 2, 3]) },
      "inspect",
      "f.docx",
    );
    expect(code).toBe(2);
    expect(output).toContain("not a readable .docx");
  });
});
