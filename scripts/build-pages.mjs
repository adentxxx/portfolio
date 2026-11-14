// Static build for GitHub Pages: `npm run build:pages` → ./out
//
// The site is a Node app with a database, an admin, and API routes. Pages can
// host none of that, so this script builds a static snapshot of the public
// pages from the local database:
//
//   1. copies src/app aside,
//   2. drops the admin and the API, makes the pages static, and lists the
//      case pages to prerender (both languages),
//   3. runs `next build` in export mode (see GITHUB_PAGES in next.config.ts),
//   4. puts src/app back exactly as it was, whatever happened,
//   5. fixes the payload file names a Windows export breaks, and adds CNAME
//      and .nojekyll, so ./out is ready to copy into adentxxx/adentxxx.github.io.
//
// src/app is restored from the copy, not from git, so uncommitted work is safe.
// If a run is killed half-way, the next run restores the copy first.

import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createConnection } from "node:net";
import { join, relative, sep } from "node:path";

const APP = join("src", "app");
const BACKUP = ".pages-backup";
const OUT = "out";
const DOMAIN = "hereisalex.art";
const DEV_PORT = 43123;

function restore() {
  if (!existsSync(BACKUP)) return;
  rmSync(APP, { recursive: true, force: true });
  cpSync(BACKUP, APP, { recursive: true });
  rmSync(BACKUP, { recursive: true, force: true });
}

/** The dev server and the build share .next; running both corrupts the cache. */
function devServerRunning() {
  return new Promise((resolve) => {
    const socket = createConnection({ port: DEV_PORT, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function prepare() {
  // GitHub Pages cannot run Route Handlers or the admin editor.
  rmSync(join(APP, "api"), { recursive: true, force: true });
  rmSync(join(APP, "admin"), { recursive: true, force: true });

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(path)) continue;

      const source = readFileSync(path, "utf8");
      let next = source.replaceAll(
        'export const dynamic = "force-dynamic";',
        'export const dynamic = "force-static";',
      );

      // Case pages, Russian and English: an export needs the list of slugs.
      const normalized = path.replaceAll("\\", "/");
      if (
        normalized.endsWith("projects/[slug]/page.tsx") &&
        !next.includes("generateStaticParams")
      ) {
        next = next.replace(
          'export const dynamic = "force-static";',
          `export const dynamic = "force-static";

export async function generateStaticParams() {
  const { projects } = await getHomeContent();
  return projects.map((project) => ({ slug: project.slug }));
}`,
        );
        next = `import { getHomeContent } from "@/lib/content";\n${next}`;
      }

      if (next !== source) writeFileSync(path, next);
    }
  };
  walk(APP);
}

// Next writes one flat file per route segment: __next.projects.$d$slug.__PAGE__.txt.
// A Windows export keeps the backslashes, so that name turns into nested
// folders and client navigations never find the payload.
function flattenSegments(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(dir, entry.name);
    if (!entry.name.startsWith("__next.")) {
      flattenSegments(path);
      continue;
    }
    for (const file of collect(path)) {
      const suffix = relative(path, file).split(sep).join(".");
      renameSync(file, join(dir, `${entry.name}.${suffix}`));
    }
    rmSync(path, { recursive: true, force: true });
  }
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

async function main() {
  if (!existsSync(join(APP, "layout.tsx")) && !existsSync(BACKUP)) {
    throw new Error("Run this from the project root: npm run build:pages");
  }
  if (existsSync(BACKUP)) {
    console.log("An earlier run was interrupted. Restoring src/app first.");
    restore();
  }
  if (await devServerRunning()) {
    throw new Error(
      `The dev server is running on port ${DEV_PORT}. Stop it, then run the build again.`,
    );
  }

  cpSync(APP, BACKUP, { recursive: true });
  let status = 1;
  try {
    prepare();
    // Route types from `next dev` still point at the admin and the API.
    rmSync(join(".next", "dev"), { recursive: true, force: true });
    rmSync(OUT, { recursive: true, force: true });

    const result = spawnSync(
      process.execPath,
      [join("node_modules", "next", "dist", "bin", "next"), "build", "--webpack"],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          GITHUB_PAGES: "true",
          NEXT_PUBLIC_TRAILING_SLASH: "true",
          NEXT_PUBLIC_SITE_URL:
            process.env.NEXT_PUBLIC_SITE_URL || `https://${DOMAIN}`,
        },
      },
    );
    status = result.status ?? 1;
  } finally {
    restore();
  }
  if (status !== 0) {
    throw new Error("The build failed. src/app is back as it was.");
  }

  flattenSegments(OUT);
  // Pages needs both: the custom domain, and no Jekyll (it hides _next).
  writeFileSync(join(OUT, "CNAME"), `${DOMAIN}\n`);
  writeFileSync(join(OUT, ".nojekyll"), "");

  for (const leaked of ["admin", "api"]) {
    if (existsSync(join(OUT, leaked))) {
      throw new Error(`./out contains /${leaked}. Do not publish this build.`);
    }
  }
  console.log(`\nStatic site is in ./${OUT} (domain ${DOMAIN}).`);
  console.log("Publish: copy its contents into adentxxx/adentxxx.github.io.");
}

process.on("SIGINT", () => {
  restore();
  process.exit(130);
});

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
