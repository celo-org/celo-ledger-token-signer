import { writeFileSync } from "fs";
import path from "path";

const __dirname = process.cwd();
const DIST = path.resolve(__dirname, "lib");
writeFileSync(
  path.join(DIST, "mjs", "package.json"),
  JSON.stringify({ type: "module" }, null, 4)
);
writeFileSync(
  path.join(DIST, "cjs", "package.json"),
  JSON.stringify({ type: "commonjs" }, null, 4)
);
