import { chromium, Page } from "playwright";
import { LOGIN_SELECTORS } from "../config/selector";


export async function loginForcreate_test(): Promise<Page> {
  // 🔥 HARDCODED VALUES (NO .env)
  const create_test_BASE_URL =
    "https://practicetestautomation.com/practice-test-login/";
  const create_test_LOGIN_USER = "student";
  const create_test_LOGIN_PASS = "Password123";
  const create_test_LOGIN_SUCCESS_SELECTOR = "h1";

  console.log("🚀 Launching headed browser for create_test");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("🌐 Navigating to login page...");
  await page.goto(create_test_BASE_URL, { waitUntil: "domcontentloaded" });

  console.log("✍️ Filling credentials...");
  await page.fill(LOGIN_SELECTORS.usernameInput, create_test_LOGIN_USER);
  await page.fill(LOGIN_SELECTORS.passwordInput, create_test_LOGIN_PASS);

  console.log("🔐 Submitting login...");
  await Promise.all([
    page.click(LOGIN_SELECTORS.submitButton),
    page.waitForLoadState("networkidle"),
  ]);

  console.log("🔎 Verifying login success...");
  await page.waitForSelector(create_test_LOGIN_SUCCESS_SELECTOR, {
    timeout: 15000,
    state: "visible",
  });

  console.log("✅ Login successful — returning page to create_tester");
  return page;
}
