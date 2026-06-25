import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(".");
const preferredPort = Number.parseInt(process.env.PORT || "4173", 10);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
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

function start(port) {
  const server = createServer((req, res) => {
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
