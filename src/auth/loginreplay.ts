// src/auth/loginreplay.ts
import dotenv from "dotenv";
dotenv.config({
  path: ".env.ci",
  override: true,
});

import { chromium, Page } from "playwright";
import { LOGIN_SELECTORS } from "../config/selector";

export async function loginForReplay(): Promise<Page> {
  const { BASE_URL, LOGIN_PATH, USERNAME, PASSWORD } = process.env;

  if (!BASE_URL || !LOGIN_PATH || !USERNAME || !PASSWORD) {
    throw new Error(
      "Missing env vars: BASE_URL, LOGIN_PATH, USERNAME, PASSWORD"
    );
  }

  console.log("🔑 Starting headless login for replay (CI)");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // ✅ ALWAYS correct login page
  await page.goto(`${BASE_URL}${LOGIN_PATH}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  // ✅ Form must exist
  await page.waitForSelector(LOGIN_SELECTORS.usernameInput, {
    timeout: 30_000,
  });

  await page.fill(LOGIN_SELECTORS.usernameInput, USERNAME);
  await page.fill(LOGIN_SELECTORS.passwordInput, PASSWORD);

  await page.click(LOGIN_SELECTORS.submitButton);

  // ✅ REAL success signal (DOM, not navigation)
  await page.waitForSelector("text=Logged In Successfully", {
    timeout: 30_000,
  });

  console.log("✅ Replay login successful");

  return page;
}
