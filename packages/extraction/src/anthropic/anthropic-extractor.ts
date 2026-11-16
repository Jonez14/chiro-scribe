import { ExtractionError, type ClinicalExtractor } from "../ports.js";
import { callTool, type AnthropicConfig } from "./messages-client.js";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt.js";
import { buildTool, parseToolInput } from "./tool.js";

export function createAnthropicExtractor(config: AnthropicConfig): ClinicalExtractor {
  return {
    async extract({ template, transcript }) {
      const input = await callTool(config, {
        system: SYSTEM_PROMPT,
        user: buildUserMessage(template, transcript),
        tool: buildTool(template),
      });
      const proposals = parseToolInput(input);
      if (!proposals) throw new ExtractionError("Extractor returned a malformed tool call.");
      return proposals;
    },
  };
}
