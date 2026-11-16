import { describe, expect, it } from "vitest";
import { TemplateDefinition } from "./template.js";
import { lumbarDailyVisit } from "./test-support/index.js";

describe("TemplateDefinition", () => {
  it("rejects duplicate field ids", () => {
    const [first] = lumbarDailyVisit.fields;
    const result = TemplateDefinition.safeParse({ ...lumbarDailyVisit, fields: [first, first] });
    expect(result.success).toBe(false);
  });

  it("rejects a binding that cannot exist in the template's file format", () => {
    const result = TemplateDefinition.safeParse({ ...lumbarDailyVisit, format: "pdf" });
    expect(result.success).toBe(false);
  });
});
