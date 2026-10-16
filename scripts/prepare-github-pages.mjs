import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// GitHub Pages cannot run Route Handlers or the admin editor.
rmSync("src/app/api", { recursive: true, force: true });
rmSync("src/app/admin", { recursive: true, force: true });

function walk(dir) {
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

    const normalized = path.replaceAll("\\", "/");
    if (
      normalized.endsWith("src/app/projects/[slug]/page.tsx") &&
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
    }

    if (next !== source) writeFileSync(path, next);
  }
}

walk("src/app");
