// NOTE:
// run_test intentionally DOES NOT load dotenv.
// All variables must come from CI / runtime environment (process.env)

import { Page } from "playwright";
import fs from "fs";
import path from "path";

import { loginForrun_test } from "../auth/loginrun_test";
import { captureFailureScreenshot } from "./artifacts/screenshot";

/* ================= TYPES ================= */

type VisibleItem = {
  tag: string;
  text: string;
  locator: string;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  scrollY: number;
};

type Pagecreate_test = {
  pageIndex: number;
  url: string;
  viewport?: {
    width: number;
    height: number;
  };
  maxScrollY: number;
  items: VisibleItem[];
};

type PageResult = Pagecreate_test & {
  pass: boolean;
  failureReason?: string;
  screenshotPath?: string;
};

/* ================= PATHS ================= */

const BASELINE_DIR = path.join(process.cwd(), "baseline");
const STEPS_FILE = path.join(BASELINE_DIR, "steps.json");
const REPORT_FILE = path.join(process.cwd(), "run_test-report.html");

/* ================= HELPERS ================= */

function loadPages(): Pagecreate_test[] {
  if (!fs.existsSync(STEPS_FILE)) {
    throw new Error(`${STEPS_FILE} not found. Run create_tester first.`);
  }
  return JSON.parse(fs.readFileSync(STEPS_FILE, "utf-8")) as Pagecreate_test[];
}

function embedImageBase64(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

/* ================= EXACT create_testER EXTRACTION ================= */

async function extractVisibleContent(page: Page): Promise<VisibleItem[]> {
  return await page.evaluate(() => {
    function isVisible(el: HTMLElement) {
      const r = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      return (
        r.width > 0 &&
        r.height > 0 &&
        s.display !== "none" &&
        s.visibility !== "hidden" &&
        s.opacity !== "0"
      );
    }

    const items: VisibleItem[] = [];

    document.querySelectorAll("body *").forEach(el => {
      const element = el as HTMLElement;
      if (!isVisible(element)) return;

      const text = element.innerText?.replace(/\s+/g, " ").trim();
      if (!text) return;

      const rect = element.getBoundingClientRect();

      // EXACT locator strategy used by create_tester
      let locator = "";
      if (element.id) {
        locator = `#${element.id}`;
      } else {
        const path: string[] = [];
        let curr: HTMLElement | null = element;

        while (curr && curr.tagName.toLowerCase() !== "body") {
          let selector = curr.tagName.toLowerCase();
          const parent = curr.parentElement;

          if (parent) {
            const siblings = Array.from(parent.children).filter(
              e => e.tagName === curr!.tagName
            );
            if (siblings.length > 1) {
              selector += `:nth-of-type(${siblings.indexOf(curr) + 1})`;
            }
          }

          path.unshift(selector);
          curr = curr.parentElement;
        }

        locator = path.join(" > ");
      }

      items.push({
        tag: element.tagName.toLowerCase(),
        text,
        locator,
        boundingBox: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        scrollY: window.scrollY,
      });
    });

    return items;
  });
}

/* ================= ENTRY ================= */

export async function runrun_test(): Promise<void> {
  const pages = loadPages();
  if (!pages.length) {
    console.log("⚠️ No create_tested pages found.");
    return;
  }

  const results: PageResult[] = [];

  console.log("🔑 Starting run_test login...");
  const page = await loginForrun_test();
  console.log("✅ Login successful. Starting run_test...");

  for (const create_test of pages) {
    console.log(
      `\n▶ Verifying page ${create_test.pageIndex + 1}: ${create_test.url}`
    );

    if (create_test.viewport) {
      await page.setViewportSize(create_test.viewport);
    }

    await page.goto(create_test.url, {
      waitUntil: "load",
      timeout: 60_000,
    });

    await page.evaluate(y => window.scrollTo(0, y), create_test.maxScrollY);
    await page.waitForTimeout(500);

    const liveItems = await extractVisibleContent(page);

    let pass = true;
    let failureReason: string | undefined;

    for (const baselineItem of create_test.items) {
      const match = liveItems.find(
        live =>
          live.tag === baselineItem.tag &&
          live.text === baselineItem.text &&
          live.locator === baselineItem.locator
      );

      if (!match) {
        pass = false;
        failureReason = `Missing element: <${baselineItem.tag}> "${baselineItem.text.slice(
          0,
          80
        )}..."`;
        break;
      }

      // visibility sanity only (not layout precision)
      if (
        match.boundingBox.width <= 0 ||
        match.boundingBox.height <= 0
      ) {
        pass = false;
        failureReason = `Element not visible: "${baselineItem.text.slice(
          0,
          80
        )}..."`;
        break;
      }
    }

    let screenshotPath: string | undefined;
    if (!pass) {
      screenshotPath = await captureFailureScreenshot(
        page,
        create_test.pageIndex + 1
      );
    }

    results.push({
      ...create_test,
      pass,
      failureReason,
      screenshotPath,
    });
  }

  /* ================= REPORT ================= */

  const reportHtml = `
<html>
<head>
  <title>run_test Report</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .page { border: 1px solid #ccc; margin-bottom: 20px; padding: 10px; }
    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
    img { margin-top: 10px; max-width: 100%; }
  </style>
</head>
<body>
  <h1>run_test Verification Report</h1>
  ${results
    .map(
      r => `
    <div class="page">
      <h2>
        Page ${r.pageIndex + 1} —
        ${
          r.pass
            ? '<span class="pass">PASS</span>'
            : '<span class="fail">FAIL</span>'
        }
      </h2>
      <p><strong>URL:</strong> ${r.url}</p>
      ${
        r.failureReason
          ? `<p><strong>Reason:</strong> ${r.failureReason}</p>`
          : ""
      }
      ${
        r.screenshotPath
          ? `<img src="${embedImageBase64(r.screenshotPath)}" />`
          : ""
      }
    </div>
  `
    )
    .join("")}
</body>
</html>
`;

  fs.writeFileSync(REPORT_FILE, reportHtml);
console.log(`📄 run_test report generated → ${REPORT_FILE}`);

const browser = page.context().browser();

if (results.some(r => !r.pass)) {
  if (browser) await browser.close();
  throw new Error("❌ run_test verification failed");
}

console.log("✅ run_test verification passed");

if (browser) {
  await browser.close(); // ✅ THIS WAS MISSING
}

process.exit(0); // optional but makes CI deterministic
}
