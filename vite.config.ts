import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

interface LocalProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

interface LocalSpace {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  memberIds: string[];
  state: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface LocalStore {
  profiles: Record<string, LocalProfile>;
  spaces: Record<string, LocalSpace>;
}

const localDataFile = resolve(process.env.AFTERLIFE_STATE_FILE || "data/afterlife.local.json");

function emptyStore(): LocalStore {
  return { profiles: {}, spaces: {} };
}

async function readStore(): Promise<LocalStore> {
  try {
    const saved = JSON.parse(await readFile(localDataFile, "utf8")) as Partial<LocalStore>;
    return {
      profiles: saved.profiles || {},
      spaces: saved.spaces || {}
    };
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: LocalStore): Promise<void> {
  await mkdir(dirname(localDataFile), { recursive: true });
  await writeFile(localDataFile, JSON.stringify(store, null, 2), "utf8");
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  let body = "";

  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error("Request body too large");
  }

  return body ? JSON.parse(body) : {};
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function getQuery(req: IncomingMessage): URLSearchParams {
  return new URL(req.url || "/", "http://127.0.0.1").searchParams;
}

function randomId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function inviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) => alphabet[byte % alphabet.length]).join("");
}

function publicSpace(space: LocalSpace, userId: string) {
  return {
    id: space.id,
    name: space.name,
    inviteCode: space.inviteCode,
    role: space.createdBy === userId ? "owner" : "partner"
  };
}

async function handleLocalApi(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
  if (!pathname.startsWith("/api/")) return false;

  try {
    if (pathname === "/api/health") {
      sendJson(res, 200, { ok: true });
      return true;
    }

    const store = await readStore();

    if (pathname === "/api/local/bootstrap" && req.method === "GET") {
      const clientId = getQuery(req).get("clientId") || "";
      const profile = store.profiles[clientId] || null;
      const spaces = profile
        ? Object.values(store.spaces)
            .filter((space) => space.memberIds.includes(clientId))
            .map((space) => publicSpace(space, clientId))
        : [];
      sendJson(res, 200, { profile, spaces });
      return true;
    }

    if (pathname === "/api/local/profile" && req.method === "POST") {
      const body = await readBody(req);
      const clientId = String(body.clientId || "");
      const displayName = String(body.displayName || "").trim();
      if (!clientId || !displayName) {
        sendJson(res, 400, { ok: false, error: "Missing profile details" });
        return true;
      }

      const profile: LocalProfile = {
        id: clientId,
        email: `${displayName.toLowerCase().replace(/[^a-z0-9]+/g, ".") || "local"}@local.afterlife`,
        displayName,
        createdAt: store.profiles[clientId]?.createdAt || new Date().toISOString()
      };
      store.profiles[clientId] = profile;
      await writeStore(store);
      sendJson(res, 200, { profile });
      return true;
    }

    if (pathname === "/api/local/spaces" && req.method === "POST") {
      const body = await readBody(req);
      const clientId = String(body.clientId || "");
      const profile = store.profiles[clientId];
      if (!profile) {
        sendJson(res, 401, { ok: false, error: "Create a local profile first" });
        return true;
      }

      let code = inviteCode();
      while (Object.values(store.spaces).some((space) => space.inviteCode === code)) {
        code = inviteCode();
      }

      const now = new Date().toISOString();
      const space: LocalSpace = {
        id: randomId("space"),
        name: String(body.name || "").trim() || "Mo & Aysel",
        inviteCode: code,
        createdBy: clientId,
        memberIds: [clientId],
        state: (body.state && typeof body.state === "object" ? body.state : {}) as Record<string, unknown>,
        createdAt: now,
        updatedAt: now
      };
      store.spaces[space.id] = space;
      await writeStore(store);
      sendJson(res, 200, { space: publicSpace(space, clientId) });
      return true;
    }

    if (pathname === "/api/local/join" && req.method === "POST") {
      const body = await readBody(req);
      const clientId = String(body.clientId || "");
      const code = String(body.inviteCode || "").trim().toUpperCase();
      const profile = store.profiles[clientId];
      const space = Object.values(store.spaces).find((item) => item.inviteCode === code);
      if (!profile || !space) {
        sendJson(res, 404, { ok: false, error: "Invite code not found" });
        return true;
      }

      if (!space.memberIds.includes(clientId)) {
        space.memberIds.push(clientId);
        space.updatedAt = new Date().toISOString();
      }
      await writeStore(store);
      sendJson(res, 200, { space: publicSpace(space, clientId) });
      return true;
    }

    if (pathname === "/api/local/state" && req.method === "GET") {
      const query = getQuery(req);
      const clientId = query.get("clientId") || "";
      const spaceId = query.get("spaceId") || "";
      const space = store.spaces[spaceId];
      if (!space || !space.memberIds.includes(clientId)) {
        sendJson(res, 404, { ok: false, error: "Space not found" });
        return true;
      }
      sendJson(res, 200, { state: space.state || {}, updatedAt: space.updatedAt });
      return true;
    }

    if (pathname === "/api/local/state" && req.method === "PUT") {
      const body = await readBody(req);
      const clientId = String(body.clientId || "");
      const spaceId = String(body.spaceId || "");
      const space = store.spaces[spaceId];
      if (!space || !space.memberIds.includes(clientId)) {
        sendJson(res, 404, { ok: false, error: "Space not found" });
        return true;
      }
      space.state = (body.state && typeof body.state === "object" ? body.state : {}) as Record<string, unknown>;
      space.updatedAt = new Date().toISOString();
      await writeStore(store);
      sendJson(res, 200, { ok: true, updatedAt: space.updatedAt });
      return true;
    }

    sendJson(res, 404, { ok: false, error: "Not found" });
    return true;
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : "Local API failed" });
    return true;
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "afterlife-local-api",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
          const handled = await handleLocalApi(req, res, pathname);
          if (!handled) next();
        });
      }
    }
  ],
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  preview: {
    host: "127.0.0.1",
    port: 4173
  }
});
