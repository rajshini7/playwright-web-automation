import fs from "fs";
import path from "path";

/**
 * 🔐 HARD LOAD .env (BOM-SAFE, NO DOTENV)
 * DO NOT CHANGE THIS LOGIC
 */
const envPath = path.resolve(process.cwd(), ".env");
const envFile = fs.readFileSync(envPath, "utf-8");

for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  let [key, ...rest] = trimmed.split("=");

  // ✅ STRIP UTF-8 BOM (WINDOWS BUG FIX)
  key = key.replace(/^\uFEFF/, "");

  process.env[key] = rest.join("=");
}

async function main() {
  const { loginForcreate_test } = await import("./auth/logincreate_test");
  const { runcreate_tester } = await import("./create_test/create_tester");
  const { runrun_test } = await import("./run_test/run_test");

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

  console.log("Loaded env:", {
    create_test_BASE_URL: process.env.create_test_BASE_URL,
    create_test_LOGIN_USER: process.env.create_test_LOGIN_USER,
    create_test_LOGIN_PASS: process.env.create_test_LOGIN_PASS,
    create_test_LOGIN_SUCCESS_SELECTOR:
      process.env.create_test_LOGIN_SUCCESS_SELECTOR,
  });

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
