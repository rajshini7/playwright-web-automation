// NOTE:
// Replay intentionally DOES NOT load dotenv.
// All variables must come from CI / runtime environment (process.env)

import { Page } from "playwright";
import fs from "fs";
import path from "path";

import { loginForReplay } from "../auth/loginreplay";
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

type PageRecord = {
  pageIndex: number;
  url: string;
  viewport?: {
    width: number;
    height: number;
  };
  maxScrollY: number;
  items: VisibleItem[];
};

type PageResult = PageRecord & {
  pass: boolean;
  failureReason?: string;
  screenshotPath?: string;
};

/* ================= PATHS ================= */

const BASELINE_DIR = path.join(process.cwd(), "baseline");
const STEPS_FILE = path.join(BASELINE_DIR, "steps.json");
const REPORT_FILE = path.join(process.cwd(), "replay-report.html");

/* ================= HELPERS ================= */

function loadPages(): PageRecord[] {
  if (!fs.existsSync(STEPS_FILE)) {
    throw new Error(`${STEPS_FILE} not found. Run recorder first.`);
  }
  return JSON.parse(fs.readFileSync(STEPS_FILE, "utf-8")) as PageRecord[];
}

function embedImageBase64(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

/* ================= EXACT RECORDER EXTRACTION ================= */

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

      // EXACT locator strategy used by recorder
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

export async function runReplay(): Promise<void> {
  const pages = loadPages();
  if (!pages.length) {
    console.log("⚠️ No recorded pages found.");
    return;
  }

  const results: PageResult[] = [];

  console.log("🔑 Starting replay login...");
  const page = await loginForReplay();
  console.log("✅ Login successful. Starting replay...");

  for (const record of pages) {
    console.log(
      `\n▶ Verifying page ${record.pageIndex + 1}: ${record.url}`
    );

    if (record.viewport) {
      await page.setViewportSize(record.viewport);
    }

    await page.goto(record.url, {
      waitUntil: "load",
      timeout: 60_000,
    });

    await page.evaluate(y => window.scrollTo(0, y), record.maxScrollY);
    await page.waitForTimeout(500);

    const liveItems = await extractVisibleContent(page);

    let pass = true;
    let failureReason: string | undefined;

    for (const baselineItem of record.items) {
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
        record.pageIndex + 1
      );
    }

    results.push({
      ...record,
      pass,
      failureReason,
      screenshotPath,
    });
  }

  /* ================= REPORT ================= */

  const reportHtml = `
<html>
<head>
  <title>Replay Report</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .page { border: 1px solid #ccc; margin-bottom: 20px; padding: 10px; }
    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
    img { margin-top: 10px; max-width: 100%; }
  </style>
</head>
<body>
  <h1>Replay Verification Report</h1>
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
console.log(`📄 Replay report generated → ${REPORT_FILE}`);

const browser = page.context().browser();

if (results.some(r => !r.pass)) {
  if (browser) await browser.close();
  throw new Error("❌ Replay verification failed");
}

console.log("✅ Replay verification passed");

if (browser) {
  await browser.close(); // ✅ THIS WAS MISSING
}

process.exit(0); // optional but makes CI deterministic
}
