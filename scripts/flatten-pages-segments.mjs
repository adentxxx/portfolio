import { readdirSync, renameSync, rmSync } from "node:fs";
import { join, relative, sep } from "node:path";

// Next writes one flat file per route segment: __next.projects.$d$slug.__PAGE__.txt.
// A Windows export keeps the backslashes, so path.join turns that name into
// nested folders and client navigations never find the payload.
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("__next.")) flatten(path);
    else walk(path);
  }
}

function flatten(dir) {
  const parent = join(dir, "..");
  const prefix = dir.split(sep).at(-1);
  for (const file of collect(dir)) {
    const suffix = relative(dir, file).split(sep).join(".");
    renameSync(file, join(parent, `${prefix}.${suffix}`));
  }
  rmSync(dir, { recursive: true, force: true });
}

function collect(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collect(path));
    else files.push(path);
  }
  return files;
}

walk(process.argv[2] || "out");
