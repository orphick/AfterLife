import { spawn } from "node:child_process";
import { request } from "node:http";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const port = 4199;
const stateFile = join(tmpdir(), "afterlife-api-test-state.json");

function httpRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = request({
      hostname: "127.0.0.1",
      port,
      path,
      method,
      headers: payload
        ? {
            "content-type": "application/json",
            "content-length": Buffer.byteLength(payload)
          }
        : {}
    }, (res) => {
      let text = "";
      res.on("data", (chunk) => {
        text += chunk;
      });
      res.on("end", () => {
        resolve({ status: res.statusCode, body: text });
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Server startup timed out")), 5000);

    child.stdout.on("data", (chunk) => {
      if (String(chunk).includes(`:${port}`)) {
        clearTimeout(timer);
        resolve();
      }
    });

    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
    });
  });
}

const child = spawn(process.execPath, ["scripts/serve.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(port),
    AFTERLIFE_STATE_FILE: stateFile
  },
  stdio: ["ignore", "pipe", "pipe"]
});

try {
  await waitForServer(child);

  const health = await httpRequest("GET", "/api/health");
  const empty = await httpRequest("GET", "/api/state");
  const saved = await httpRequest("PUT", "/api/state", {
    activeTab: "memories",
    memories: [{ id: "test", title: "Test", body: "Saved through API", private: false }]
  });
  const loaded = await httpRequest("GET", "/api/state");

  const parsedHealth = JSON.parse(health.body);
  const parsedEmpty = JSON.parse(empty.body);
  const parsedSaved = JSON.parse(saved.body);
  const parsedLoaded = JSON.parse(loaded.body);

  if (health.status !== 200 || !parsedHealth.ok) {
    throw new Error("Health endpoint failed");
  }

  if (empty.status !== 200 || Object.keys(parsedEmpty).length !== 0) {
    throw new Error("Empty state endpoint failed");
  }

  if (saved.status !== 200 || !parsedSaved.ok) {
    throw new Error("State save endpoint failed");
  }

  if (loaded.status !== 200 || parsedLoaded.activeTab !== "memories") {
    throw new Error("State load endpoint failed");
  }

  console.log("API check passed");
} finally {
  child.kill();
  await rm(stateFile, { force: true });
}
