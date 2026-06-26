import { defaultState } from "./appData";
import type { AppState } from "../types/domain";

export const STORAGE_KEY = "afterlife.webapp.v2";
const LEGACY_STORAGE_KEY = "afterlife.webapp.v1";

export function cloneDefaultState(): AppState {
  return structuredClone(defaultState);
}

export function mergeState(saved: Partial<AppState> | null | undefined): AppState {
  const base = cloneDefaultState();
  if (!saved || typeof saved !== "object") return base;

  return {
    ...base,
    ...saved,
    spicy: { ...base.spicy, ...(saved.spicy || {}) },
    files: Array.isArray(saved.files) ? saved.files : base.files,
    memories: Array.isArray(saved.memories) ? saved.memories : base.memories,
    listItems: Array.isArray(saved.listItems) ? saved.listItems : base.listItems,
    notes: Array.isArray(saved.notes) ? saved.notes : base.notes,
    toast: "",
    modal: null,
    questionDraft: "",
    memoryTitleDraft: "",
    memoryBodyDraft: "",
    memoryKindDraft: saved.memoryKindDraft || base.memoryKindDraft,
    memoryPrivateDraft: Boolean(saved.memoryPrivateDraft),
    notePageDraft: saved.notePageDraft || ""
  };
}

export function getPersistableState(state: AppState): AppState {
  return {
    ...state,
    toast: "",
    modal: null,
    questionDraft: "",
    memoryTitleDraft: "",
    memoryBodyDraft: ""
  };
}

export function readLocalState(): AppState {
  try {
    const saved =
      window.localStorage?.getItem(STORAGE_KEY) ||
      window.localStorage?.getItem(LEGACY_STORAGE_KEY);
    return mergeState(saved ? JSON.parse(saved) : null);
  } catch {
    return cloneDefaultState();
  }
}

export function writeLocalState(state: AppState): void {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(getPersistableState(state)));
  } catch {
    // Some embedded browsers disable localStorage. The in-memory state still works.
  }
}
