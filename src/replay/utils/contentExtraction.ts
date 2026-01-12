// src/utils/contentExtraction.ts
import { Page } from "playwright";

export type ExtractedItem = {
  tag: string;
  text: string;
  locator: string;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
};

export async function extractVisibleContent(
  page: Page
): Promise<ExtractedItem[]> {
  return await page.evaluate(() => {
    function isVisible(el: HTMLElement) {
      const r = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      return (
        r.width > 0 &&
        r.height > 0 &&
        s.visibility !== "hidden" &&
        s.display !== "none" &&
        s.opacity !== "0"
      );
    }

    const items: ExtractedItem[] = [];

    document.querySelectorAll("body *").forEach(el => {
      const element = el as HTMLElement;
      if (!isVisible(element)) return;

      const text = element.innerText?.replace(/\s+/g, " ").trim();
      if (!text) return;

      const rect = element.getBoundingClientRect();
      const tag = element.tagName.toLowerCase();

      let locator = tag;
      if (element.id) locator += `#${element.id}`;
      else if (element.className)
        locator += "." + element.className.split(" ").join(".");

      items.push({
        tag,
        text,
        locator,
        boundingBox: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
      });
    });

    return items;
  });
}
