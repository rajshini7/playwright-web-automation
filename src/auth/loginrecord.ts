import { chromium, Page } from "playwright";
import { LOGIN_SELECTORS } from "../config/selector";

export async function loginForRecord(): Promise<Page> {
  const {
    RECORD_BASE_URL,
    RECORD_LOGIN_USER,
    RECORD_LOGIN_PASS,
    RECORD_LOGIN_SUCCESS_SELECTOR,
  } = process.env;

  if (
    !RECORD_BASE_URL ||
    !RECORD_LOGIN_USER ||
    !RECORD_LOGIN_PASS ||
    !RECORD_LOGIN_SUCCESS_SELECTOR
  ) {
    console.error("Loaded env:", {
      RECORD_BASE_URL,
      RECORD_LOGIN_USER,
      RECORD_LOGIN_PASS,
      RECORD_LOGIN_SUCCESS_SELECTOR,
    });

    throw new Error(
      "Missing .env values. Required: RECORD_BASE_URL, RECORD_LOGIN_USER, RECORD_LOGIN_PASS, RECORD_LOGIN_SUCCESS_SELECTOR"
    );
  }

  console.log("🚀 Launching headed browser for RECORD");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("🌐 Navigating to login page...");
  await page.goto(RECORD_BASE_URL, { waitUntil: "domcontentloaded" });

  console.log("✍️ Filling credentials...");
  await page.fill(LOGIN_SELECTORS.usernameInput, RECORD_LOGIN_USER);
  await page.fill(LOGIN_SELECTORS.passwordInput, RECORD_LOGIN_PASS);

  console.log("🔐 Submitting login...");
  await Promise.all([
    page.click(LOGIN_SELECTORS.submitButton),
    page.waitForLoadState("networkidle"),
  ]);

  console.log("🔎 Verifying login success...");
  await page.waitForSelector(RECORD_LOGIN_SUCCESS_SELECTOR, {
    timeout: 15000,
    state: "visible",
  });

  console.log("✅ Login successful — returning page to recorder");
  return page;
}
