import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const env = {
  ...process.env,
  ...(await readEnvFile(".env")),
  ...(await readEnvFile(".env.local"))
};

const requiredTables = [
  "profiles",
  "couple_spaces",
  "space_members",
  "space_preferences",
  "memories",
  "shared_lists",
  "list_items",
  "reading_items",
  "reading_progress",
  "reading_notes"
];

const protectedRpcs = [
  {
    name: "create_couple_space",
    body: { space_name: "AfterLife smoke test", invite_code_input: "SMOKE123" }
  },
  {
    name: "join_couple_space",
    body: { invite_code_input: "SMOKE123" }
  }
];

const supabaseUrl = clean(env.VITE_SUPABASE_URL);
const anonKey = clean(env.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl || !anonKey || supabaseUrl.includes("your-project-ref") || anonKey.includes("your-supabase")) {
  console.error("Supabase env is not configured.");
  console.error("Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from Supabase Project Settings > API.");
  process.exit(1);
}

let baseUrl;
try {
  baseUrl = new URL(supabaseUrl);
} catch {
  console.error("VITE_SUPABASE_URL is not a valid URL.");
  process.exit(1);
}

const authSettings = await request("/auth/v1/settings");
if (!authSettings.ok) {
  console.error(`Supabase Auth check failed: ${authSettings.status} ${authSettings.text}`);
  process.exit(1);
}
console.log("ok auth endpoint reachable");

for (const table of requiredTables) {
  const result = await request(`/rest/v1/${table}?select=*&limit=0`);
  if (!result.ok) {
    console.error(`missing or unreachable table ${table}: ${result.status} ${result.text}`);
    process.exit(1);
  }
  console.log(`ok table ${table}`);
}

for (const rpc of protectedRpcs) {
  const result = await request(`/rest/v1/rpc/${rpc.name}`, {
    method: "POST",
    body: JSON.stringify(rpc.body)
  });

  if (result.status === 404 || result.text.includes("PGRST202") || result.text.includes("Could not find the function")) {
    console.error(`missing RPC ${rpc.name}: ${result.status} ${result.text}`);
    process.exit(1);
  }

  if (result.ok) {
    console.error(`RPC ${rpc.name} allowed an anonymous call. It must require a signed-in user.`);
    process.exit(1);
  }

  if (!result.text.includes("Not authenticated") && result.status !== 401 && result.status !== 403) {
    console.error(`RPC ${rpc.name} exists but did not fail with the expected auth guard: ${result.status} ${result.text}`);
    process.exit(1);
  }

  console.log(`ok rpc ${rpc.name} requires auth`);
}

console.log("Supabase backend looks reachable, schema-shaped, and auth-guarded.");

async function readEnvFile(path) {
  const target = resolve(path);
  if (!existsSync(target)) return {};

  const text = await readFile(target, "utf8");
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), clean(line.slice(index + 1))];
      })
  );
}

async function request(path, init = {}) {
  const url = new URL(path, baseUrl);
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers || {})
    }
  });

  return {
    ok: response.ok,
    status: response.status,
    text: await response.text()
  };
}

function clean(value) {
  return String(value || "").trim().replace(/^['"]|['"]$/g, "");
}
