# 🎥 Playwright create_tester & run_test Framework (TypeScript)

A custom **Playwright-based create_tester & run_test framework** that:

- create_tests **real, visible UI content**
- Stores page snapshots in `steps.json`
- run_tests the same flow in **CI**
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
- create_tests **what users actually see**
- run_tests **real navigation**
- Compares **content snapshots**, not pixels
- Works **locally and in CI**
- Requires **zero test authoring after create_testing**

---

## 🧠 Core Concepts

### 1️⃣ create_tester Mode
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

### 2️⃣ run_test Mode
- Logs in headless (CI-safe)
- run_tests create_tested URLs
- Extracts visible content using **exact same logic**
- Verifies:
- Element exists
- Text matches
- Element is visible
- Generates:
run_test-report.html

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
playwright-create_tester/
│
├── baseline/
│   └── steps.json              # create_tested content snapshots
│
├── src/
│   ├── auth/
│   │   ├── logincreate_test.ts      # Local interactive login
│   │   └── loginrun_test.ts      # CI-safe headless login
│   │
│   ├── create_test/
│   │   └── create_tester.ts         # DOM observer + content create_tester
│   │
│   ├── run_test/
│   │   ├── run_test.ts           # run_test & verification engine
│   │   └── artifacts/
│   │       └── screenshot.ts   # Failure screenshots
│   │
│   ├── stepsstore.ts           # Shared types / helpers
│   └── index.ts                # Entry point (create_test / run_test)
│
├── run_test-report.html          # Generated run_test report
├── package.json
├── tsconfig.json
└── README.md
▶️ How to Run
🔹 create_test Mode (Local)
Uses .env file.

bash
Copy code
npm run create_test
What happens:

Browser opens (headed)

You interact freely

create_tester captures visible content

Close the browser when done

baseline/steps.json is saved

🔹 run_test Mode (Local or CI)
Uses environment variables, NOT .env.

PowerShell
powershell
Copy code
$env:BASE_URL="https://practicetestautomation.com"
$env:LOGIN_PATH="/practice-test-login/"
$env:USERNAME="student"
$env:PASSWORD="Password123"

npm run run_test
Linux / macOS
bash
Copy code
BASE_URL=https://practicetestautomation.com \
LOGIN_PATH=/practice-test-login/ \
USERNAME=student \
PASSWORD=Password123 \
npm run run_test
📊 run_test Report
Generated at:

Copy code
run_test-report.html
Contains:

PASS / FAIL per page

Failure reason

Embedded screenshots (base64)

🤖 CI/CD Ready
run_test runs fully headless

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

