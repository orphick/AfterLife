import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = {
  ...process.env,
  ...(await readEnvFile(".env")),
  ...(await readEnvFile(".env.local"))
};

const supabaseUrl = clean(env.VITE_SUPABASE_URL);
const anonKey = clean(env.VITE_SUPABASE_ANON_KEY);

const ownerEmail = clean(env.AFTERLIFE_SMOKE_EMAIL_1);
const ownerPassword = clean(env.AFTERLIFE_SMOKE_PASSWORD_1);
const partnerEmail = clean(env.AFTERLIFE_SMOKE_EMAIL_2);
const partnerPassword = clean(env.AFTERLIFE_SMOKE_PASSWORD_2);
const outsiderEmail = clean(env.AFTERLIFE_SMOKE_OUTSIDER_EMAIL);
const outsiderPassword = clean(env.AFTERLIFE_SMOKE_OUTSIDER_PASSWORD);
const mediaBucket = "afterlife-media";

if (!supabaseUrl || !anonKey || supabaseUrl.includes("your-project-ref") || anonKey.includes("your-supabase")) {
  fail("Supabase env is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.");
}

if (!ownerEmail || !ownerPassword || !partnerEmail || !partnerPassword) {
  fail("Add AFTERLIFE_SMOKE_EMAIL_1, AFTERLIFE_SMOKE_PASSWORD_1, AFTERLIFE_SMOKE_EMAIL_2, and AFTERLIFE_SMOKE_PASSWORD_2 to run the two-account smoke test.");
}

const owner = createBrowserLikeClient();
const partner = createBrowserLikeClient();
const ownerUser = await signIn(owner, ownerEmail, ownerPassword, "owner");
const partnerUser = await signIn(partner, partnerEmail, partnerPassword, "partner");
if (ownerUser.id === partnerUser.id) {
  fail("Smoke test needs two different Supabase Auth users.");
}

await bootstrapProfile(owner, "Smoke Owner");
await bootstrapProfile(partner, "Smoke Partner");

const inviteCode = `SMK${Date.now().toString(36).toUpperCase()}`;
const spaceName = `AfterLife smoke ${new Date().toISOString()}`;
const created = await must(
  owner.rpc("create_couple_space", {
    space_name: spaceName,
    invite_code_input: inviteCode
  }),
  "owner can create a couple space"
);

const spaceId = created.id;
if (!spaceId) fail("create_couple_space did not return a space id.");
console.log(`ok owner created space ${spaceId}`);

const ownerSpacesAfterCreate = await must(owner.rpc("get_my_spaces"), "owner can list own spaces");
if (!ownerSpacesAfterCreate.some((space) => space.id === spaceId && space.role === "owner")) {
  fail("owner space list did not include the created space.");
}
console.log("ok owner can list created space");

const joined = await must(partner.rpc("join_couple_space", { invite_code_input: inviteCode }), "partner can join by invite code");
if (joined.id !== spaceId) fail(`join_couple_space returned ${joined.id}, expected ${spaceId}.`);
console.log("ok partner joined same space");

const partnerSpacesAfterJoin = await must(partner.rpc("get_my_spaces"), "partner can list joined spaces");
if (!partnerSpacesAfterJoin.some((space) => space.id === spaceId && space.role === "partner")) {
  fail("partner space list did not include the joined space.");
}
console.log("ok partner can list joined space");

const memory = await must(
  owner
    .from("memories")
    .insert({
      space_id: spaceId,
      created_by: ownerUser.id,
      kind: "smoke",
      title: "Smoke shared memory",
      body: "Created by the AfterLife Supabase smoke test."
    })
    .select("*")
    .single(),
  "owner can insert a shared memory"
);

const listItem = await must(
  owner
    .from("list_items")
    .insert({
      space_id: spaceId,
      created_by: ownerUser.id,
      title: "Smoke shared idea",
      position: 0
    })
    .select("*")
    .single(),
  "owner can insert a shared list item"
);

const partnerMemories = await must(
  partner.from("memories").select("id,title").eq("space_id", spaceId).eq("id", memory.id),
  "partner can read owner memory"
);
if (partnerMemories.length !== 1) fail("partner could not see the owner-created memory.");
console.log("ok partner sees owner memory");

const partnerItems = await must(
  partner.from("list_items").select("id,title").eq("space_id", spaceId).eq("id", listItem.id),
  "partner can read owner list item"
);
if (partnerItems.length !== 1) fail("partner could not see the owner-created list item.");
console.log("ok partner sees owner list item");

await must(
  partner
    .from("space_preferences")
    .upsert(
      {
        space_id: spaceId,
        active_activity: "read",
        mood: "Smoke verified",
        glimpse_kind: "Photo",
        boundary: "Flirty",
        spicy_mo: true,
        spicy_aysel: true,
        reading_progress: 43,
        reader_night: false,
        glimpse_caption: "Smoke sync verified.",
        updated_at: new Date().toISOString()
      },
      { onConflict: "space_id" }
    ),
  "partner can update shared preferences"
);
console.log("ok partner updates shared preferences");

const storagePath = `${spaceId}/library/smoke-${Date.now()}.pdf`;
const smokePdf = new Blob(["%PDF-1.4\n% AfterLife smoke file\n"], { type: "application/pdf" });
const uploadResult = await owner.storage.from(mediaBucket).upload(storagePath, smokePdf, {
  contentType: "application/pdf",
  upsert: false
});
if (uploadResult.error) fail(`owner can upload storage object failed: ${uploadResult.error.message}`);
console.log("ok owner uploaded storage object");

const readingItem = await must(
  owner
    .from("reading_items")
    .insert({
      space_id: spaceId,
      created_by: ownerUser.id,
      file_type: "PDF",
      title: "Smoke PDF",
      progress: 0,
      meta: "Smoke storage-backed reading item",
      storage_path: storagePath
    })
    .select("*")
    .single(),
  "owner can insert storage-backed reading item"
);

const mediaAsset = await must(
  owner
    .from("media_assets")
    .insert({
      space_id: spaceId,
      uploaded_by: ownerUser.id,
      reading_item_id: readingItem.id,
      bucket_id: mediaBucket,
      storage_path: storagePath,
      file_name: "smoke.pdf",
      mime_type: "application/pdf",
      byte_size: smokePdf.size,
      asset_kind: "book",
      is_private: false
    })
    .select("*")
    .single(),
  "owner can insert media asset"
);

const partnerMedia = await must(
  partner.from("media_assets").select("id,storage_path").eq("space_id", spaceId).eq("id", mediaAsset.id),
  "partner can read media asset"
);
if (partnerMedia.length !== 1) fail("partner could not see owner-created media asset.");
console.log("ok partner sees media asset");

await must(
  partner.rpc("record_space_event", {
    target_space_id: spaceId,
    event_kind: "smoke.checked",
    event_payload: { ok: true }
  }),
  "partner can record a space event"
);
const ownerEvents = await must(owner.from("space_events").select("id,event_kind").eq("space_id", spaceId).eq("event_kind", "smoke.checked"), "owner can read partner event");
if (!ownerEvents.length) fail("owner could not see partner-recorded event.");
console.log("ok space events are shared");

const rotated = await must(owner.rpc("rotate_space_invite", { target_space_id: spaceId }), "owner can rotate invite code");
if (!rotated.invite_code || rotated.invite_code === inviteCode) fail("rotate_space_invite did not return a new invite code.");
console.log("ok owner rotated invite code");

if (outsiderEmail && outsiderPassword) {
  const outsider = createBrowserLikeClient();
  await signIn(outsider, outsiderEmail, outsiderPassword, "outsider");
  const outsiderJoin = await outsider.rpc("join_couple_space", { invite_code_input: rotated.invite_code });
  if (!outsiderJoin.error) fail("outsider joined a full two-person couple space.");
  console.log("ok outsider cannot join full couple space");

  const outsiderMemories = await must(
    outsider.from("memories").select("id").eq("space_id", spaceId),
    "outsider query is RLS-filtered"
  );
  if (outsiderMemories.length) fail("outsider could read memories from a space they did not join.");
  console.log("ok outsider cannot read space memories");
}

await owner.storage.from(mediaBucket).remove([storagePath]);
await must(owner.rpc("delete_couple_space", { target_space_id: spaceId }), "owner can delete smoke couple space");

console.log("Supabase two-account smoke flow passed.");

function createBrowserLikeClient() {
  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

async function signIn(client, email, password, label) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) fail(`Could not sign in ${label} account ${email}: ${error.message}`);
  if (!data.user) fail(`Could not sign in ${label} account ${email}: no user returned.`);
  console.log(`ok signed in ${label} account`);
  return data.user;
}

async function bootstrapProfile(client, displayName) {
  await must(client.rpc("bootstrap_profile", { display_name_input: displayName }), `profile bootstrap for ${displayName}`);
}

async function must(query, label) {
  const { data, error } = await query;
  if (error) fail(`${label} failed: ${error.message}`);
  return data;
}

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

function clean(value) {
  return String(value || "").trim().replace(/^['"]|['"]$/g, "");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
