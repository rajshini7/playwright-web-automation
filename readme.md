# 🎥 Playwright create_test & run_test Framework (TypeScript)

A custom **Playwright-based UI content recording and replay framework** that focuses on **what users actually see**, not fragile selectors or pixel diffs.

This project provides two clear, separated modes:

- **create_test** → interactively record visible UI content
- **run_test** → headless replay + verification (CI-safe)

This is **not** Playwright Test in the traditional sense.
It is a **semantic UI verification engine built on top of Playwright**.

---

## 🚀 Why This Project Exists

Traditional UI automation:
- Breaks on minor DOM or layout changes
- Requires constant selector maintenance
- Needs test code for every flow

This framework instead:
- Records **visible content only** (what users actually see)
- Replays **real navigation paths**
- Compares **semantic UI content**, not screenshots
- Works seamlessly **locally and in CI**
- Requires **zero test authoring after recording**

---

## 🧠 Core Concepts

### 1️⃣ create_test (Recording Mode)

- Runs **headed** (interactive browser)
- Logs in using real credentials
- Injects a DOM observer
- Captures for each page:
  - Visible text
  - Tag name
  - Stable DOM locator
  - Bounding box
  - Scroll position
- Allows **unlimited manual interaction**
- Saves results to:

```
baseline/steps.json
```

You control **when recording ends** by manually closing the browser.

---

### 2️⃣ run_test (Replay & Verification Mode)

- Runs **headless by default** (CI-safe)
- Logs in using environment variables
- Navigates using `baseline/steps.json`
- Extracts visible content using **the same logic as create_test**
- Verifies for every recorded page:
  - Element exists
  - Text matches
  - Element is visible
- Generates a full HTML report:

```
run_test-report.html
```

If any regression is detected, the run **fails deterministically**.

---

## 🧱 Tech Stack

- **Node.js**
- **TypeScript**
- **Playwright (Chromium)**
- **GitHub Actions (CI/CD)**

---

## 📂 Project Structure

```
playwright-recorder/
│
├── baseline/
│   └── steps.json                 # Recorded UI content baseline
│
├── src/
│   ├── auth/
│   │   ├── logincreate_test.ts    # Interactive login (recording)
│   │   └── loginrun_test.ts       # Headless login (replay / CI)
│   │
│   ├── create_test/
│   │   └── create_tester.ts       # DOM observer & content recorder
│   │
│   ├── run_test/
│   │   ├── run_test.ts            # Replay & verification engine
│   │   └── artifacts/
│   │       └── screenshot.ts      # Failure screenshots
│   │
│   └── stepsstore.ts              # Shared types / helpers
│
├── tests/
│   ├── create_test.spec.ts        # Recording entrypoint
│   └── run_test.spec.ts           # Replay entrypoint
│
├── playwright.config.ts           # Playwright + env configuration
├── run_test-report.html           # Generated replay report
├── package.json
├── tsconfig.json
└── README.md
```

---

## ▶️ How to Run

### 🔹 create_test (Local Recording)

Runs **headed** and allows free manual interaction.

```bash
npx playwright test tests/create_test.spec.ts --headed
```

**What happens:**

- Browser opens
- You navigate freely (no time limits)
- Visible content is captured continuously
- Close the browser when finished
- `baseline/steps.json` is saved

---

### 🔹 run_test (Local Replay)

Uses environment variables (not `.env`).

Create a local replay env file:

```
.env.run_test
```

```env
BASE_URL=https://practicetestautomation.com
LOGIN_PATH=/practice-test-login/
USERNAME=student
PASSWORD=Password123
```

Then run:

```bash
npx playwright test tests/run_test.spec.ts
```

This runs **headless**, verifies UI content, and generates:

```
run_test-report.html
```

---

## 🤖 CI / CD Ready

- run_test executes fully headless
- No `.env` dependency in CI
- Secrets injected via pipeline
- Deterministic PASS / FAIL behavior
- HTML report uploaded as artifact

### Required CI Secrets

| Name | Description |
|----|------------|
| `BASE_URL` | Application base URL |
| `LOGIN_PATH` | Login route |
| `USERNAME` | Replay user |
| `PASSWORD` | Replay password |

---

## 📊 run_test Report

The generated HTML report includes:

- PASS / FAIL per page
- Failure reason
- Embedded screenshots (base64)

This makes CI failures **immediately debuggable**.

---

## ✅ What This Framework Is Good At

- Semantic UI regression detection
- Content drift detection
- Smoke verification
- CI-safe UI validation

## 👤 Created By

**Rajeev S**  
Playwright • Automation • CI Systems

