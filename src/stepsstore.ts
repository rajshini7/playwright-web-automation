import fs from "fs";
import path from "path";

export type ContentSnapshot = {
  visibleText: string[];
};

export class StepsStore {
  private steps: any;
  private readonly filePath: string;

  constructor() {
    // 🔥 FORCE PROJECT ROOT (NOT CWD GUESSING)
    const projectRoot = path.resolve(__dirname, "..", "..");
    const outDir = path.join(projectRoot, "baseline");
    this.filePath = path.join(outDir, "steps.json");

    console.log("📁 StepsStore path:", this.filePath);

    this.steps = fs.existsSync(this.filePath)
      ? JSON.parse(fs.readFileSync(this.filePath, "utf-8"))
      : {};
  }

  updateContentSnapshot(snapshot: ContentSnapshot) {
    this.steps.contentSnapshot = snapshot;
  }

  save() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      this.filePath,
      JSON.stringify(this.steps, null, 2),
      "utf-8"
    );
  }
}
