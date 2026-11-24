import * as nextEnv from "@next/env";
import { defineConfig } from "@trigger.dev/sdk";

nextEnv.loadEnvConfig(process.cwd());
const project = process.env.TRIGGER_PROJECT_REF;
if (!project) throw new Error("Set TRIGGER_PROJECT_REF in .env.local before running the Trigger.dev CLI.");

export default defineConfig({
  project,
  dirs: ["./trigger"],
  runtime: "node-22",
  maxDuration: 240,
  retries: { enabledInDev: false, default: { maxAttempts: 1 } },
  build: { external: ["@browserbasehq/stagehand", "@browserbasehq/sdk"] },
});
