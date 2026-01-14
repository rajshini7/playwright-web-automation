import { test } from "@playwright/test";
import { runrun_test } from "../src/run_test/run_test";

test("run_test replay verification", async () => {
  // run_test controls its own lifecycle
  // including login, navigation, verification, report generation
  await runrun_test();
});
