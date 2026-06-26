import type { AppState, CoupleSpace, UserProfile } from "../types/domain";
import { getPersistableState } from "./state";

const LOCAL_CLIENT_ID_KEY = "afterlife.local.clientId";
const LOCAL_ACTIVE_SPACE_KEY = "afterlife.local.activeSpaceId";

export function getLocalClientId(): string {
  try {
    const saved = window.localStorage?.getItem(LOCAL_CLIENT_ID_KEY);
    if (saved) return saved;

    const next = `local-${crypto.randomUUID()}`;
    window.localStorage?.setItem(LOCAL_CLIENT_ID_KEY, next);
    return next;
  } catch {
    return `local-${Date.now()}`;
  }
}

export function getSavedLocalSpaceId(): string | null {
  try {
    return window.localStorage?.getItem(LOCAL_ACTIVE_SPACE_KEY) || null;
  } catch {
    return null;
  }
}

export function saveLocalSpaceId(spaceId: string): void {
  try {
    window.localStorage?.setItem(LOCAL_ACTIVE_SPACE_KEY, spaceId);
  } catch {
    // Local storage can be disabled in embedded browsers.
  }
}

export function resetLocalIdentity(): void {
  try {
    window.localStorage?.removeItem(LOCAL_CLIENT_ID_KEY);
    window.localStorage?.removeItem(LOCAL_ACTIVE_SPACE_KEY);
  } catch {
    // Nothing to reset.
  }
}

export async function bootstrapLocal(clientId: string): Promise<{
  profile: UserProfile | null;
  spaces: CoupleSpace[];
}> {
  const data = await request<{ profile: LocalProfile | null; spaces: CoupleSpace[] }>(
    `/api/local/bootstrap?clientId=${encodeURIComponent(clientId)}`
  );
  return {
    profile: data.profile ? mapProfile(data.profile) : null,
    spaces: data.spaces || []
  };
}

export async function saveLocalProfile(clientId: string, displayName: string): Promise<UserProfile> {
  const data = await request<{ profile: LocalProfile }>("/api/local/profile", {
    method: "POST",
    body: { clientId, displayName }
  });
  return mapProfile(data.profile);
}

export async function createLocalSpace(clientId: string, name: string, state: AppState): Promise<CoupleSpace> {
  const data = await request<{ space: CoupleSpace }>("/api/local/spaces", {
    method: "POST",
    body: { clientId, name, state: getPersistableState(state) }
  });
  saveLocalSpaceId(data.space.id);
  return data.space;
}

export async function joinLocalSpace(clientId: string, inviteCode: string): Promise<CoupleSpace> {
  const data = await request<{ space: CoupleSpace }>("/api/local/join", {
    method: "POST",
    body: { clientId, inviteCode }
  });
  saveLocalSpaceId(data.space.id);
  return data.space;
}

export async function loadLocalSpaceState(clientId: string, spaceId: string): Promise<AppState | null> {
  const data = await request<{ state: Partial<AppState> }>(
    `/api/local/state?clientId=${encodeURIComponent(clientId)}&spaceId=${encodeURIComponent(spaceId)}`
  );
  return data.state && Object.keys(data.state).length ? (data.state as AppState) : null;
}

export async function saveLocalSpaceState(clientId: string, spaceId: string, state: AppState): Promise<void> {
  await request<{ ok: true }>("/api/local/state", {
    method: "PUT",
    body: { clientId, spaceId, state: getPersistableState(state) }
  });
}

interface LocalProfile {
  id: string;
  email: string;
  displayName: string;
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: options.body ? { "content-type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Local backend request failed");
  }

  return data as T;
}

function mapProfile(profile: LocalProfile): UserProfile {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName
  };
}
