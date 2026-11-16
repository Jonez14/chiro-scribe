import { lumbarDailyVisit, sampleDictation } from "@chiro-scribe/domain/testing";
import { describe, expect, it, vi } from "vitest";
import { ExtractionError } from "../ports.js";
import { createAnthropicExtractor } from "./anthropic-extractor.js";
import { buildExtractionSchema } from "./extraction-schema.js";
import type { MessagesClient } from "./messages-client.js";

type Content = Awaited<ReturnType<MessagesClient["create"]>>["content"];

function clientReturning(content: Content) {
  const create = vi.fn<MessagesClient["create"]>(() => Promise.resolve({ content }));
  return { create };
}

const json = (value: unknown): Content => [{ type: "text", text: JSON.stringify(value) }];
const request = { template: lumbarDailyVisit, transcript: sampleDictation };

describe("createAnthropicExtractor", () => {
  it("asks for schema-constrained JSON and sends nothing current models reject", async () => {
    const client = clientReturning(json({ fields: [] }));
    await createAnthropicExtractor({ client, model: "model-under-test" }).extract(request);

    const sent = client.create.mock.calls[0]![0];
    expect(sent.model).toBe("model-under-test");
    expect(sent.output_config.format).toEqual({
      type: "json_schema",
      schema: buildExtractionSchema(lumbarDailyVisit),
    });
    expect(sent).not.toHaveProperty("temperature");
    expect(sent).not.toHaveProperty("tool_choice");
    expect(sent.messages[0]!.content).toContain(sampleDictation);
  });

  it("restricts field ids to the form and closes every object in the schema", () => {
    const schema = JSON.stringify(buildExtractionSchema(lumbarDailyVisit));
    expect(schema).toContain(
      JSON.stringify({ type: "string", enum: lumbarDailyVisit.fields.map((field) => field.id) }),
    );
    expect(schema.match(/"type":"object"/g)).toHaveLength(
      schema.match(/"additionalProperties":false/g)?.length ?? 0,
    );
  });

  it("reads the answer from the text block even when the model thinks first", async () => {
    const answer = {
      fields: [{ field_id: "objective.kemps_right", value: true, evidence: ["Positive Kemp's"] }],
    };
    const client = clientReturning([{ type: "thinking" }, ...json(answer)]);
    const proposals = await createAnthropicExtractor({ client, model: "m" }).extract(request);
    expect(proposals).toEqual([
      { fieldId: "objective.kemps_right", value: true, evidence: ["Positive Kemp's"] },
    ]);
  });

  it.each<[string, Content]>([
    ["no text block", [{ type: "thinking" }]],
    ["truncated JSON", [{ type: "text", text: '{"fields": [{"field_id": "obj' }]],
    ["JSON in the wrong shape", json({ fields: "none" })],
  ])("fails closed on %s", async (_name, content) => {
    const extractor = createAnthropicExtractor({ client: clientReturning(content), model: "m" });
    await expect(extractor.extract(request)).rejects.toBeInstanceOf(ExtractionError);
  });
});
