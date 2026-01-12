# 🎥 Playwright Recorder & Replay Framework (TypeScript)

A custom **Playwright-based Recorder & Replay framework** that:

- Records **real, visible UI content**
- Stores page snapshots in `steps.json`
- Replays the same flow in **CI**
- Verifies that **UI content has not changed**
- Generates a **visual HTML report**

This is **NOT** Playwright Test.
This is a **content-verification engine** built on Playwright.

---

## 📌 Why This Project Exists

Traditional UI tests:
- Break on small layout changes
- Depend on fragile selectors
- Require test code for every flow

This framework instead:
- Records **what users actually see**
- Replays **real navigation**
- Compares **content snapshots**, not pixels
- Works **locally and in CI**
- Requires **zero test authoring after recording**

---

## 🧠 Core Concepts

### 1️⃣ Recorder Mode
- Logs in using real credentials
- Injects a DOM observer
- Captures:
  - Visible text
  - Tag name
  - Stable DOM locator
  - Bounding box
  - Scroll position
- Writes everything to:
baseline/steps.json

markdown
Copy code

### 2️⃣ Replay Mode
- Logs in headless (CI-safe)
- Replays recorded URLs
- Extracts visible content using **exact same logic**
- Verifies:
- Element exists
- Text matches
- Element is visible
- Generates:
replay-report.html

yaml
Copy code

---

## 🧱 Tech Stack

- **Node.js**
- **TypeScript**
- **Playwright (Chromium)**
- **GitHub Actions (CI)**

---

## 📂 Folder Structure

```txt
playwright-recorder/
│
├── baseline/
│   └── steps.json              # Recorded content snapshots
│
├── src/
│   ├── auth/
│   │   ├── loginrecord.ts      # Local interactive login
│   │   └── loginreplay.ts      # CI-safe headless login
│   │
│   ├── record/
│   │   └── recorder.ts         # DOM observer + content recorder
│   │
│   ├── replay/
│   │   ├── replay.ts           # Replay & verification engine
│   │   └── artifacts/
│   │       └── screenshot.ts   # Failure screenshots
│   │
│   ├── stepsstore.ts           # Shared types / helpers
│   └── index.ts                # Entry point (record / replay)
│
├── replay-report.html          # Generated replay report
├── package.json
├── tsconfig.json
└── README.md
▶️ How to Run
🔹 Record Mode (Local)
Uses .env file.

bash
Copy code
npm run record
What happens:

Browser opens (headed)

You interact freely

Recorder captures visible content

Close the browser when done

baseline/steps.json is saved

🔹 Replay Mode (Local or CI)
Uses environment variables, NOT .env.

PowerShell
powershell
Copy code
$env:BASE_URL="https://practicetestautomation.com"
$env:LOGIN_PATH="/practice-test-login/"
$env:USERNAME="student"
$env:PASSWORD="Password123"

npm run replay
Linux / macOS
bash
Copy code
BASE_URL=https://practicetestautomation.com \
LOGIN_PATH=/practice-test-login/ \
USERNAME=student \
PASSWORD=Password123 \
npm run replay
📊 Replay Report
Generated at:

Copy code
replay-report.html
Contains:

PASS / FAIL per page

Failure reason

Embedded screenshots (base64)

🤖 CI/CD Ready
Replay runs fully headless

No .env dependency

Secrets managed via GitHub Actions

Deterministic exit (PASS / FAIL)

✅ What This Framework Is Good At
✔ Regression detection
✔ Content drift detection
✔ Smoke verification
✔ CI-safe UI validation

❌ What It Does NOT Try To Be
✘ Pixel-perfect visual testing
✘ Playwright Test replacement
✘ Selector-heavy test suite

👤 Created By
Rajeev S
Playwright • Automation • CI Systems

