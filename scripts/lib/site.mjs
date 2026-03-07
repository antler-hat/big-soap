import path from "node:path";
import { fileURLToPath } from "node:url";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import * as sass from "sass";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

export const projectRoot = path.resolve(currentDir, "../..");
export const srcDir = path.join(projectRoot, "src");
export const distDir = path.join(projectRoot, "dist");
const stylesEntry = path.join(srcDir, "styles", "main.scss");
const cssOutputDir = path.join(distDir, "assets", "css");
const cssOutputFile = path.join(cssOutputDir, "main.css");
const cssMapFile = path.join(cssOutputDir, "main.css.map");

export async function cleanDist() {
  await rm(distDir, { recursive: true, force: true });
}

export async function buildSite() {
  await cleanDist();
  await mkdir(cssOutputDir, { recursive: true });
  await copyHtmlPages();
  await copyAssetsDirectory();
  await compileStyles();
}

async function copyHtmlPages() {
  const entries = await readdir(srcDir, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && path.extname(entry.name) === ".html")
      .map(async (entry) => {
        const sourcePath = path.join(srcDir, entry.name);
        const targetPath = path.join(distDir, entry.name);
        const html = await readFile(sourcePath, "utf8");
        await writeFile(targetPath, html);
      })
  );
}

async function copyAssetsDirectory() {
  const assetsSourceDir = path.join(srcDir, "assets");
  const assetsTargetDir = path.join(distDir, "assets");

  await cp(assetsSourceDir, assetsTargetDir, { recursive: true, force: true });
}

async function compileStyles() {
  const result = sass.compile(stylesEntry, {
    loadPaths: [path.join(srcDir, "styles")],
    sourceMap: true,
    sourceMapIncludeSources: true,
    style: "expanded"
  });

  const mapName = path.basename(cssMapFile);
  const cssWithMapReference = `${result.css}\n/*# sourceMappingURL=${mapName} */\n`;

  await writeFile(cssOutputFile, cssWithMapReference, "utf8");
  await writeFile(cssMapFile, JSON.stringify(result.sourceMap, null, 2), "utf8");
}
