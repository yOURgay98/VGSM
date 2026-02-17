import fs from "node:fs";
import path from "node:path";

const roots = [".next/types", ".next/dev/types"];

for (const rel of roots) {
  const abs = path.join(process.cwd(), rel);
  try {
    fs.rmSync(abs, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

