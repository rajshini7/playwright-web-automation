import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  override: true,
});

import { loginForRecord } from "./auth/loginrecord";
import { runRecorder } from "./record/recorder";
import { runReplay } from "./replay/replay";

async function main() {
  const mode = process.argv[2];

  if (mode === "replay") {
    console.log("🔁 Starting REPLAY mode...");
    await runReplay();
    return;
  }

  console.log("🎥 Starting RECORD mode...");
  console.log("🔵 Starting login flow...");

  const page = await loginForRecord();
  const browser = page.context().browser();

  if (!browser) {
    throw new Error("Browser instance not found from page context");
  }

  console.log("🔵 Login complete. Manual control handed over.");
  console.log("🔵 Scroll freely. Close browser when done.");

  await runRecorder(page, browser);
}

main().catch(err => {
  console.error("❌ Runner failed:", err);
  process.exit(1);
});
