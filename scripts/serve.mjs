import { createReadStream, existsSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve } from "node:path";

const root = resolve(".");
const preferredPort = Number.parseInt(process.env.PORT || "4173", 10);
const stateFile = resolve(process.env.AFTERLIFE_STATE_FILE || join(root, "data", "afterlife.local.json"));
const dataDir = dirname(stateFile);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function resolveRequest(url) {
  const cleanUrl = decodeURIComponent((url || "/").split("?")[0]);
  const safePath = normalize(cleanUrl).replace(/^(\.\.[/\\])+/, "");
  const target = resolve(join(root, safePath));

  if (!target.startsWith(root)) {
    return null;
  }

  if (existsSync(target) && statSync(target).isFile()) {
    return target;
  }

  const fallback = resolve(join(root, "index.html"));
  return existsSync(fallback) ? fallback : null;
}

async function readRequestBody(req) {
  let body = "";

  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) {
      throw new Error("Request body too large");
    }
  }

  return body;
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/health") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
    return true;
  }

  if (pathname !== "/api/state") {
    return false;
  }

  if (req.method === "GET") {
    try {
      const saved = await readFile(stateFile, "utf8");
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(saved);
    } catch {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end("{}");
    }
    return true;
  }

  if (req.method === "PUT") {
    try {
      const body = await readRequestBody(req);
      const data = JSON.parse(body || "{}");
      await mkdir(dataDir, { recursive: true });
      await writeFile(stateFile, JSON.stringify(data, null, 2), "utf8");
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: false, error: error.message }));
    }
    return true;
  }

  res.writeHead(405, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
  return true;
}

function start(port) {
  const server = createServer(async (req, res) => {
    const pathname = decodeURIComponent((req.url || "/").split("?")[0]);

    if (pathname.startsWith("/api/") && await handleApi(req, res, pathname)) {
      return;
    }

    const filePath = resolveRequest(req.url);

    if (!filePath) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "content-type": types[extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store"
    });
    createReadStream(filePath).pipe(res);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < preferredPort + 20) {
      start(port + 1);
      return;
    }
    throw error;
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`AfterLife is running at http://127.0.0.1:${port}`);
  });
}

start(preferredPort);
