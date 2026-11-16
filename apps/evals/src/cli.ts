#!/usr/bin/env node
import Anthropic from "@anthropic-ai/sdk";
import { createAnthropicExtractor } from "@chiro-scribe/extraction";
import { lumbarDailyVisitSuite } from "./cases/lumbar-daily-visit.js";
import { formatReport } from "./report.js";
import { runSuite } from "./run-suite.js";
import { isSafe, summarize } from "./score.js";

const USAGE = `Runs synthetic dictations through the live extraction model and scores the drafts.

Required environment:
  ANTHROPIC_API_KEY  an API key
  EVAL_MODEL         the model id to evaluate

Synthetic data only. Never point this at real dictations: a standard API key is not covered by a BAA.`;

const { ANTHROPIC_API_KEY: apiKey, EVAL_MODEL: model } = process.env;

if (!apiKey || !model) {
  process.stdout.write(`${USAGE}\n`);
  process.exitCode = 2;
} else {
  const sdk = new Anthropic({ apiKey });
  const extractor = createAnthropicExtractor({
    client: { create: (request) => sdk.messages.create(request) },
    model,
  });
  const scores = await runSuite(lumbarDailyVisitSuite, extractor);
  process.stdout.write(`${formatReport(model, scores).join("\n")}\n`);
  process.exitCode = isSafe(summarize(scores)) ? 0 : 1;
}
