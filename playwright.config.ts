import { defineConfig } from "@playwright/test";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

/**
 * =====================================================
 * ENV LOADING STRATEGY
 * =====================================================
 *
 * 1. Load `.env`            → create_test (record)
 * 2. Load `.env.run_test`   → run_test (replay) [optional]
 * 3. CI env vars override everything
 *
 * This DOES NOT break create_test.
 * This ENABLES replay locally & in CI.
 */

/* ---------- create_test env (existing, unchanged) ---------- */
dotenv.config({
  path: path.resolve(__dirname, ".env"),
  override: false, // do NOT override CI vars
});

/* ---------- run_test env (optional, replay-only) ---------- */
const runTestEnvPath = path.resolve(__dirname, ".env.run_test");
if (fs.existsSync(runTestEnvPath)) {
  dotenv.config({
    path: runTestEnvPath,
    override: false, // CI still wins
  });
}

/* ===================================================== */

export default defineConfig({
  testDir: "./tests",

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    headless: true, // CI-safe, default
    viewport: { width: 1280, height: 800 },
    launchOptions: {
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
      ],
    },
  },
});
