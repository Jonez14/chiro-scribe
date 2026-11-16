import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { createAnthropicExtractor } from "./anthropic-extractor.js";

describe("SDK compatibility", () => {
  it("accepts the official client's messages API (checked by the compiler)", () => {
    const sdk = new Anthropic({ apiKey: "not-a-real-key" });
    const extractor = createAnthropicExtractor({
      client: { create: (request) => sdk.messages.create(request) },
      model: "configured-per-deployment",
    });
    expect(extractor).toHaveProperty("extract");
  });
});
