import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  override: true,
});

import { loginForcreate_test } from "./auth/logincreate_test";
import { runcreate_tester } from "./create_test/create_tester";
import { runrun_test } from "./run_test/run_test";

async function main() {
  const mode = process.argv[2]; // undefined | "run_test"

  /* ================= run_test MODE ================= */
  if (mode === "run_test") {
    console.log("🔁 Starting run_test mode...");
    await runrun_test();
    return;
  }

  /* ================= create_test MODE ================= */
  console.log("🎥 Starting create_test mode...");
  console.log("🔵 Starting login flow...");

  const page = await loginForcreate_test();
  const browser = page.context().browser();

  if (!browser) {
    throw new Error("Browser instance not found from page context");
  }

  console.log("🔵 Login complete. Manual control handed over.");
  console.log("🔵 Scroll freely. Close browser when done.");

  await runcreate_tester(page, browser);
}

main().catch(err => {
  console.error("❌ Runner failed:", err);
  process.exit(1);
});
