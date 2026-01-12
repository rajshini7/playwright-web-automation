import fs from "fs";
import path from "path";
import { Page, Browser } from "playwright";

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
  viewport: {
    width: number;
    height: number;
  };
  maxScrollY: number;
  items: VisibleItem[];
};

/* ================= PATH ================= */

const OUT_FILE = path.join(process.cwd(), "baseline", "steps.json");

/* ================= RECORDER ================= */

export async function runRecorder(page: Page, browser: Browser) {
  const pages: PageRecord[] = [];
  let currentPage: PageRecord | null = null;
  let pageIndex = 0;
  let finished = false;

  /* ================= FILE ================= */

  function saveAll() {
    const dir = path.dirname(OUT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(pages, null, 2));
    console.log(`💾 Saved ${pages.length} pages`);
  }

  /* ================= PAGE CONTROL ================= */

  async function startNewPage(url: string) {
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };

    currentPage = {
      pageIndex: pageIndex++,
      url,
      viewport,
      maxScrollY: 0,
      items: []
    };

    pages.push(currentPage);
  }

  function pushItem(item: VisibleItem) {
    if (!currentPage) return;

    const key = `${item.locator}|${item.text}`;
    if (!(currentPage as any)._seen) {
      (currentPage as any)._seen = new Set<string>();
    }
    const seen = (currentPage as any)._seen as Set<string>;

    if (!seen.has(key)) {
      seen.add(key);
      currentPage.items.push(item);
    }

    if (item.scrollY > currentPage.maxScrollY) {
      currentPage.maxScrollY = item.scrollY;
    }
  }

  /* ================= INIT FIRST PAGE ================= */

  await startNewPage(page.url());

  /* ================= BRIDGE ================= */

  await page.exposeBinding(
    "__recordVisibleItem",
    async (_src, item: VisibleItem) => {
      pushItem(item);
    }
  );

  /* ================= INJECT RECORDER ================= */

  async function injectRecorder() {
    await page.evaluate(() => {
      function getLocator(el: Element): string {
        if ((el as HTMLElement).id) {
          return `#${(el as HTMLElement).id}`;
        }
        if (el.getAttribute("data-testid")) {
          return `[data-testid="${el.getAttribute("data-testid")}"]`;
        }

        const pathParts: string[] = [];
        let curr: Element | null = el;

        while (curr && curr !== document.body) {
          let selector = curr.tagName.toLowerCase();
          const parent: HTMLElement | null = curr.parentElement;

          if (parent) {
            const siblings = Array.from(parent.children).filter(
              (c): c is Element => (c as Element).tagName === curr!.tagName
            );
            if (siblings.length > 1) {
              selector += `:nth-of-type(${siblings.indexOf(curr) + 1})`;
            }
          }

          pathParts.unshift(selector);
          curr = parent;
        }

        return pathParts.join(" > ");
      }

      const isVisible = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        return (
          r.width > 0 &&
          r.height > 0 &&
          s.visibility !== "hidden" &&
          s.display !== "none" &&
          s.opacity !== "0"
        );
      };

      const emit = (el: HTMLElement) => {
        if (!isVisible(el)) return;
        const text = el.innerText?.replace(/\s+/g, " ").trim();
        if (!text) return;

        const rect = el.getBoundingClientRect();

        (window as any).__recordVisibleItem({
          tag: el.tagName.toLowerCase(),
          text,
          locator: getLocator(el),
          boundingBox: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          },
          scrollY: window.scrollY
        });
      };

      const io = new IntersectionObserver(
        entries => {
          entries.forEach(e => {
            if (e.isIntersecting) emit(e.target as HTMLElement);
          });
        },
        { threshold: 0.1 }
      );

      document.querySelectorAll("body *").forEach(el =>
        io.observe(el as HTMLElement)
      );

      const mo = new MutationObserver(muts => {
        muts.forEach(m =>
          m.addedNodes.forEach(n => {
            if (n.nodeType === 1) {
              io.observe(n as HTMLElement);
              (n as HTMLElement)
                .querySelectorAll?.("*")
                .forEach((c: Element) =>
                  io.observe(c as HTMLElement)
                );
            }
          })
        );
      });

      mo.observe(document.body, { childList: true, subtree: true });
    });
  }

  await injectRecorder();

  /* ================= NAVIGATION ================= */

  page.on("framenavigated", async frame => {
    if (frame === page.mainFrame()) {
      await startNewPage(frame.url());
      injectRecorder();
    }
  });

  /* ================= SHUTDOWN ================= */

  function finalize(reason: string) {
    if (finished) return;
    finished = true;
    console.log(`\n🛑 Recording finished (${reason})`);
    saveAll();
    process.exit(0);
  }

  page.on("close", () => finalize("page closed"));
  browser.once("disconnected", () => finalize("browser disconnected"));
  process.on("SIGINT", () => finalize("SIGINT"));

  console.log("🎥 Recorder active — navigate & scroll, close browser to stop");
}
