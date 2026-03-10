import http from "node:http";
import path from "node:path";
import { watch } from "node:fs";
import { access, readFile } from "node:fs/promises";
import {
  buildSite,
  distDir,
  projectRoot,
  srcDir
} from "./lib/site.mjs";

const port = Number.parseInt(process.env.PORT ?? "4173", 10);
const host = process.env.HOST ?? "127.0.0.1";

let buildInFlight = false;
let queuedBuild = false;
let debounceTimer;

await runBuild("initial");

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const relativePath = decodeURIComponent(requestUrl.pathname);

  try {
    const redirectPath = await canonicalDirectoryPath(relativePath);

    if (redirectPath) {
      res.writeHead(308, { Location: `${redirectPath}${requestUrl.search}` });
      res.end();
      return;
    }

    const filePath = await resolveRequestPath(relativePath);
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.on("error", (error) => {
  console.error(`Dev server failed to start on http://${host}:${port}`);
  console.error(error);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`Serving ${distDir} at http://${host}:${port}`);
  console.log(`Watching ${srcDir} for changes`);
});

const watcher = watch(srcDir, { recursive: true }, (_eventType, filename) => {
  if (!filename) {
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void runBuild(filename);
  }, 50);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function runBuild(trigger) {
  if (buildInFlight) {
    queuedBuild = true;
    return;
  }

  buildInFlight = true;

  try {
    await buildSite();
    console.log(`Rebuilt after ${trigger}`);
  } catch (error) {
    console.error("Build failed");
    console.error(error);
  } finally {
    buildInFlight = false;
  }

  if (queuedBuild) {
    queuedBuild = false;
    await runBuild("queued changes");
  }
}

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
}

async function resolveRequestPath(relativePath) {
  const candidatePaths = requestCandidates(relativePath).map((candidatePath) =>
    path.join(distDir, candidatePath)
  );

  for (const candidatePath of candidatePaths) {
    try {
      await access(candidatePath);
      return candidatePath;
    } catch {
      continue;
    }
  }

  throw new Error("Not found");
}

async function canonicalDirectoryPath(relativePath) {
  if (relativePath === "/" || relativePath.endsWith("/")) {
    return null;
  }

  const normalizedPath = relativePath.replace(/^\/+/, "");

  if (path.extname(normalizedPath)) {
    return null;
  }

  try {
    await access(path.join(distDir, normalizedPath, "index.html"));
    return `${relativePath}/`;
  } catch {
    return null;
  }
}

function requestCandidates(relativePath) {
  if (relativePath === "/") {
    return ["index.html"];
  }

  const normalizedPath = relativePath.replace(/^\/+/, "");

  if (path.extname(normalizedPath)) {
    return [normalizedPath];
  }

  if (relativePath.endsWith("/")) {
    return [`${normalizedPath}index.html`];
  }

  return [`${normalizedPath}.html`, path.join(normalizedPath, "index.html")];
}

function shutdown() {
  watcher.close();
  server.close(() => {
    process.exit(0);
  });
}
