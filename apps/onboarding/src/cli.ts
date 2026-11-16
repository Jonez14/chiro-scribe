#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { run } from "./run.js";

process.exitCode = await run(
  { readFile: (path) => readFile(path), print: (line) => process.stdout.write(`${line}\n`) },
  process.argv.slice(2),
);
