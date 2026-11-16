import { lumbarDailyVisit, sampleDictation } from "@chiro-scribe/domain/testing";
import { describe, expect, it, vi } from "vitest";
import { ExtractionError } from "../ports.js";
import { createAnthropicExtractor } from "./anthropic-extractor.js";
import type { MessagesClient } from "./messages-client.js";
import { buildTool } from "./tool.js";

type Response = Awaited<ReturnType<MessagesClient["create"]>>;

function clientReturning(content: Response["content"]) {
  const create = vi.fn<MessagesClient["create"]>(() => Promise.resolve({ content }));
  return { create };
}

const request = { template: lumbarDailyVisit, transcript: sampleDictation };

describe("createAnthropicExtractor", () => {
  it("forces the tool call, sends no sampling parameters, and restricts field ids to the form", async () => {
    const client = clientReturning([
      { type: "tool_use", name: "record_form_fields", input: { fields: [] } },
    ]);
    await createAnthropicExtractor({ client, model: "model-under-test" }).extract(request);

    const sent = client.create.mock.calls[0]![0];
    expect(sent.model).toBe("model-under-test");
    expect(sent).not.toHaveProperty("temperature");
    expect(sent.tool_choice).toEqual({ type: "tool", name: "record_form_fields" });
    expect(sent.tools).toEqual([buildTool(lumbarDailyVisit)]);
    expect(JSON.stringify(sent.tools)).toContain(
      JSON.stringify({ type: "string", enum: lumbarDailyVisit.fields.map((field) => field.id) }),
    );
    expect(sent.messages[0]!.content).toContain(sampleDictation);
  });

  it("maps the tool call to proposals without judging them", async () => {
    const client = clientReturning([
      {
        type: "tool_use",
        name: "record_form_fields",
        input: {
          fields: [
            { field_id: "objective.kemps_right", value: true, evidence: ["Positive Kemp's"] },
          ],
        },
      },
    ]);
    const proposals = await createAnthropicExtractor({ client, model: "m" }).extract(request);
    expect(proposals).toEqual([
      { fieldId: "objective.kemps_right", value: true, evidence: ["Positive Kemp's"] },
    ]);
  });

  it.each([
    ["prose instead of a tool call", [{ type: "text" }]],
    [
      "a malformed tool call",
      [{ type: "tool_use", name: "record_form_fields", input: { fields: "none" } }],
    ],
  ])("fails closed on %s", async (_name, content) => {
    const extractor = createAnthropicExtractor({ client: clientReturning(content), model: "m" });
    await expect(extractor.extract(request)).rejects.toBeInstanceOf(ExtractionError);
  });
});
