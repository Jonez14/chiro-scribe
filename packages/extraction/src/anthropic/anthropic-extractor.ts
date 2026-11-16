import { ExtractionError, type ClinicalExtractor } from "../ports.js";
import { buildExtractionSchema, parseExtractionOutput } from "./extraction-schema.js";
import { requestJson, type AnthropicConfig } from "./messages-client.js";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt.js";

export function createAnthropicExtractor(config: AnthropicConfig): ClinicalExtractor {
  return {
    async extract({ template, transcript }) {
      const output = await requestJson(config, {
        system: SYSTEM_PROMPT,
        user: buildUserMessage(template, transcript),
        schema: buildExtractionSchema(template),
      });
      const proposals = parseExtractionOutput(output);
      if (!proposals) throw new ExtractionError("Extractor returned JSON in the wrong shape.");
      return proposals;
    },
  };
}
