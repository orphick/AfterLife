export type TabId = "home" | "together" | "memories" | "library";
export type ActivityId = "read" | "watch" | "listen" | "play" | "lists" | "spicy";
export type MemoryView = "wall" | "timeline" | "letters" | "vault";
export type LibraryView = "ours" | "mine" | "aysel" | "finished";
export type Boundary = "Soft" | "Flirty" | "Bold" | "Private";
export type Mood =
  | "I miss you"
  | "Need comfort"
  | "Come bother me"
  | "Want attention"
  | "Feeling flirty";
export type GlimpseKind = "Photo" | "Voice" | "Tiny text" | "Quote" | "Song" | "Reading page";

export type SyncStatus =
  | "checking"
  | "local"
  | "offline"
  | "loading"
  | "saving"
  | "saved"
  | "online"
  | "error";

export interface SpicyState {
  mo: boolean;
  aysel: boolean;
}

export interface LibraryFile {
  id: string;
  type: "PDF" | "EPUB";
  title: string;
  progress: number;
  meta: string;
  remoteId?: string;
  storagePath?: string;
}

export interface MemoryItem {
  id: string;
  kind: string;
  title: string;
  body: string;
  private: boolean;
  createdAt?: string;
  remoteId?: string;
}

export interface ReadingNote {
  id: string;
  page: string;
  body: string;
  locked: boolean;
  remoteId?: string;
}

export interface AppState {
  activeTab: TabId;
  activeActivity: ActivityId;
  mood: Mood;
  glimpseKind: GlimpseKind;
  spicy: SpicyState;
  boundary: Boundary;
  memoriesView: MemoryView;
  libraryView: LibraryView;
  readingProgress: number;
  readerNight: boolean;
  toast: string;
  modal: null | "question" | "private-question";
  questionMode: "soft" | "private";
  questionDraft: string;
  glimpseCaption: string;
  listDraft: string;
  noteDraft: string;
  files: LibraryFile[];
  memories: MemoryItem[];
  listItems: string[];
  notes: ReadingNote[];
}

export interface TabDefinition {
  id: TabId;
  label: string;
}

export interface ActivityDefinition {
  id: ActivityId;
  label: string;
  title: string;
  copy: string;
  chips: string[];
}

export interface CoupleSpace {
  id: string;
  name: string;
  inviteCode: string;
  role: "owner" | "partner" | "local";
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
}

export interface RemotePreferencePatch {
  activeActivity?: ActivityId;
  mood?: Mood;
  glimpseKind?: GlimpseKind;
  boundary?: Boundary;
  spicy?: SpicyState;
  readingProgress?: number;
  readerNight?: boolean;
  glimpseCaption?: string;
}
