import type {
  ActivityDefinition,
  AppState,
  Boundary,
  GlimpseKind,
  Mood,
  TabDefinition
} from "../types/domain";

export const tabs: TabDefinition[] = [
  { id: "home", label: "Home" },
  { id: "together", label: "Together" },
  { id: "memories", label: "Memories" },
  { id: "library", label: "Library" }
];

export const moods: Mood[] = [
  "I miss you",
  "Need comfort",
  "Come bother me",
  "Want attention",
  "Feeling flirty"
];

export const glimpseKinds: GlimpseKind[] = [
  "Photo",
  "Voice",
  "Tiny text",
  "Quote",
  "Song",
  "Reading page"
];

export const boundaries: Boundary[] = ["Soft", "Flirty", "Bold", "Private"];

export const activities: Record<string, ActivityDefinition> = {
  read: {
    id: "read",
    label: "Read",
    title: "PDF / EPUB reading date",
    copy: "Pages 12-20 tonight. One note each before the call.",
    chips: ["locked notes", "highlights", "async"]
  },
  watch: {
    id: "watch",
    label: "Watch",
    title: "Movie night",
    copy: "Good Omens episode, soft sync, and one saved quote after.",
    chips: ["episode", "after-call", "memory"]
  },
  listen: {
    id: "listen",
    label: "Listen",
    title: "Two-song playlist",
    copy: "One song from Mo, one from Aysel, both saved with a tiny reason.",
    chips: ["playlist", "voice", "mood"]
  },
  play: {
    id: "play",
    label: "Play",
    title: "Guess my answer",
    copy: "Soft questions first. Private prompts stay gated behind both toggles.",
    chips: ["questions", "flirty", "safe"]
  },
  lists: {
    id: "lists",
    label: "Lists",
    title: "Shared lists",
    copy: "Movies, books, places, food, gifts, plans, and inside jokes.",
    chips: ["future", "utility", "ideas"]
  },
  spicy: {
    id: "spicy",
    label: "Private",
    title: "Private deck",
    copy: "Opt-in prompts, locked notes, coupons, and both-control delete.",
    chips: ["consent", "locked", "discreet"]
  }
};

export const defaultState: AppState = {
  activeTab: "home",
  activeActivity: "read",
  mood: "Need comfort",
  glimpseKind: "Photo",
  spicy: { mo: false, aysel: false },
  boundary: "Soft",
  memoriesView: "wall",
  libraryView: "ours",
  readingProgress: 0,
  readerNight: false,
  toast: "",
  modal: null,
  questionMode: "soft",
  questionDraft: "",
  glimpseCaption: "",
  listDraft: "",
  noteDraft: "",
  files: [],
  memories: [],
  listItems: [],
  notes: []
};

export const boundaryChecklist = [
  "No last seen",
  "No location tracking",
  "No public feed",
  "No guilt streaks",
  "Private is opt-in"
];
