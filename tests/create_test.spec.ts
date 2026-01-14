import { test } from "@playwright/test";
import { loginForcreate_test } from "../src/auth/logincreate_test";
import { runcreate_tester } from "../src/create_test/create_tester";

test("create_test recorder", async () => {
  // Never timeout — you control the session
  test.setTimeout(0);

  const page = await loginForcreate_test();

  const browser = page.context().browser();
  if (!browser) {
    throw new Error("Browser instance is null");
  }

  console.log("🎥 Recorder active — browser will stay open");
  console.log("🛑 Close the browser manually when you are done");

  // 🔥 START RECORDER IN BACKGROUND (DO NOT AWAIT)
  const recorderPromise = runcreate_tester(page, browser);

  // 🔒 HANDOVER: browser stays alive until YOU close it
  await page.waitForEvent("close");

  // 🧹 AFTER CLOSE: swallow expected recorder teardown errors
  await recorderPromise.catch(err => {
    const msg = String(err?.message || err);
    if (msg.includes("MutationObserver")) {
      console.log("ℹ️ Recorder stopped during DOM teardown (expected)");
      return;
    }
    throw err; // real errors still fail
  });
});
