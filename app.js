const STORAGE_KEY = "afterlife.webapp.v1";

const icons = {
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.2 12 4l9 7.2v8.3a1.5 1.5 0 0 1-1.5 1.5h-4.2v-6h-6.6v6H4.5A1.5 1.5 0 0 1 3 19.5v-8.3Z"/></svg>',
  together: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 11.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Zm7.6 0a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2ZM2.8 20.5c.5-3.7 2.8-6 5.4-6s4.9 2.3 5.4 6H2.8Zm7.6 0c.6-3.4 2.6-5.4 5.4-5.4s4.8 2 5.4 5.4H10.4Z"/></svg>',
  memories: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h14A1.5 1.5 0 0 1 20.5 6v12A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5Zm1.8 4.2v6.6h10.4V8.7H6.8Zm1.1 1.1h8.2v4.4H7.9V9.8Z"/></svg>',
  library: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h9.4A3.6 3.6 0 0 1 18 8.1v11.4H7.4A2.4 2.4 0 0 1 5 17.1V4.5Zm2.2 2.2v10.4c0 .1.1.2.2.2h8.4V8.1a1.4 1.4 0 0 0-1.4-1.4H7.2Zm1.6 2.4h5.6v1.8H8.8V9.1Zm0 3.2h5.6v1.8H8.8v-1.8Z"/></svg>',
  send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3.2 4.2 18 7.8-18 7.8 1.9-6.5 8.1-1.3-8.1-1.3-1.9-6.5Z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2h1.2a1.8 1.8 0 0 1 1.8 1.8v7.4a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 19.2v-7.4A1.8 1.8 0 0 1 5.8 10H7Zm2.2 0h5.6V8a2.8 2.8 0 1 0-5.6 0v2Z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.8 4h2.4v6.8H20v2.4h-6.8V20h-2.4v-6.8H4v-2.4h6.8V4Z"/></svg>',
  upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.8 17.2 9h-3.4v6h-3.6V9H6.8L12 3.8ZM5 17.2h14V20H5v-2.8Z"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.7A8.2 8.2 0 0 1 8.3 3.8 8.7 8.7 0 1 0 20.2 15.7Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8l.8 2H21v2.2H3V6h4.2L8 4Zm-2.2 6h12.4l-.9 10H6.7l-.9-10Z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 20 6v5.3c0 4.7-3.1 8.2-8 9.5-4.9-1.3-8-4.8-8-9.5V6l8-2.8Zm0 3L6.4 8.1v3.2c0 3.3 2 5.8 5.6 7 3.6-1.2 5.6-3.7 5.6-7V8.1L12 6.2Z"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 5.3A2.3 2.3 0 0 1 6.8 3h12.7v16H6.8a2.3 2.3 0 0 0-2.3 2.3v-16Zm3 1.7v2h8.8V7H7.5Zm0 3.8v2h8.8v-2H7.5Z"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5 19.5 12 6 19.5v-15Z"/></svg>',
  note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v11.5L14.5 20H5V4Zm3 4v2h8V8H8Zm0 4v2h5v-2H8Z"/></svg>'
};

const tabs = [
  { id: "home", label: "Home", icon: icons.home },
  { id: "together", label: "Together", icon: icons.together },
  { id: "memories", label: "Memories", icon: icons.memories },
  { id: "library", label: "Library", icon: icons.library }
];

const moods = ["I miss you", "Need comfort", "Come bother me", "Want attention", "Feeling flirty"];
const glimpseKinds = ["Photo", "Voice", "Tiny text", "Quote", "Song", "Reading page"];
const boundaries = ["Soft", "Flirty", "Bold", "Private"];

const activities = {
  read: {
    label: "Read",
    icon: icons.book,
    title: "PDF / EPUB reading date",
    copy: "Pages 12-20 tonight. One note each before the call.",
    chips: ["locked notes", "highlights", "async"]
  },
  watch: {
    label: "Watch",
    icon: icons.play,
    title: "Movie night",
    copy: "Good Omens episode, soft sync, and one saved quote after.",
    chips: ["episode", "after-call", "memory"]
  },
  listen: {
    label: "Listen",
    icon: icons.note,
    title: "Two-song playlist",
    copy: "One song from Mo, one from Aysel, both saved with a tiny reason.",
    chips: ["playlist", "voice", "mood"]
  },
  play: {
    label: "Play",
    icon: icons.together,
    title: "Guess my answer",
    copy: "Soft questions first. Private prompts stay gated behind both toggles.",
    chips: ["questions", "flirty", "safe"]
  },
  lists: {
    label: "Lists",
    icon: icons.memories,
    title: "Shared lists",
    copy: "Movies, books, places, food, gifts, plans, and inside jokes.",
    chips: ["future", "utility", "ideas"]
  },
  spicy: {
    label: "Private",
    icon: icons.lock,
    title: "Private deck",
    copy: "Opt-in prompts, locked notes, coupons, and both-control delete.",
    chips: ["consent", "locked", "discreet"]
  }
};

const defaultState = {
  activeTab: "home",
  activeActivity: "read",
  mood: "Need comfort",
  glimpseKind: "Photo",
  spicy: { mo: true, aysel: true },
  boundary: "Flirty",
  memoriesView: "wall",
  libraryView: "ours",
  readingProgress: 42,
  readerNight: false,
  toast: "",
  modal: null,
  questionMode: "soft",
  questionDraft: "",
  glimpseCaption: "This made me think of you.",
  listDraft: "",
  noteDraft: "",
  files: [
    { id: "letters", type: "PDF", title: "Letters from...", progress: 42, meta: "2 locked notes, 4 shared highlights" },
    { id: "night", type: "EPUB", title: "Night Chapters", progress: 18, meta: "Font size, chapters, progress" }
  ],
  memories: [
    { id: "m1", kind: "glimpse", title: "One Glimpse saved", body: "Look at the sky here.", private: false },
    { id: "m2", kind: "reading", title: "Shared highlight", body: "You both highlighted the same line.", private: false },
    { id: "m3", kind: "voice", title: "Replayable voice note", body: "Saved from Today.", private: false },
    { id: "m4", kind: "letter", title: "Open when you cannot sleep", body: "Voice note recommended.", private: false },
    { id: "m5", kind: "vault", title: "Private vault item", body: "Locked, hidden by default, deletable by either person.", private: true }
  ],
  listItems: [
    "Movies to watch",
    "Books / PDFs to read",
    "Places to go",
    "Food to try",
    "When we meet",
    "Inside jokes",
    "Gift ideas",
    "Private wishlist"
  ],
  notes: [
    { id: "n1", page: "p.21", body: "This line reminded me of you.", locked: false },
    { id: "n2", page: "p.24", body: "Locked note for the end of the chapter.", locked: true }
  ]
};

let state = loadState();
let toastTimer = null;
let deferredInstallPrompt = null;
let refreshingFromServiceWorker = false;
let apiSaveTimer = null;

const runtime = {
  canInstall: false,
  hasUpdate: false,
  apiStatus: "checking",
  isStandalone: window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true,
  waitingWorker: null
};

function loadState() {
  try {
    const saved = JSON.parse(readStoredState());
    return mergeState(defaultState, saved || {});
  } catch {
    return structuredClone(defaultState);
  }
}

function mergeState(base, saved) {
  return {
    ...structuredClone(base),
    ...saved,
    spicy: { ...base.spicy, ...(saved.spicy || {}) },
    files: Array.isArray(saved.files) ? saved.files : base.files,
    memories: Array.isArray(saved.memories) ? saved.memories : base.memories,
    listItems: Array.isArray(saved.listItems) ? saved.listItems : base.listItems,
    notes: Array.isArray(saved.notes) ? saved.notes : base.notes
  };
}

function saveState() {
  const cleanState = getPersistableState();
  writeStoredState(JSON.stringify(cleanState));
  scheduleApiSave(cleanState);
}

function readStoredState() {
  try {
    return window.localStorage?.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function writeStoredState(value) {
  try {
    window.localStorage?.setItem(STORAGE_KEY, value);
  } catch {
    // Some embedded browsers disable storage; the in-memory state still works.
  }
}

function getPersistableState() {
  return { ...state, toast: "", modal: null };
}

function setState(patch) {
  state = { ...state, ...patch };
  saveState();
  render();
}

function spicyEnabled() {
  return Boolean(state.spicy.mo && state.spicy.aysel);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function button(label, action, icon = "", extraClass = "", attrs = "") {
  return `<button class="button ${extraClass}" type="button" data-action="${action}" ${attrs}>${icon}<span>${label}</span></button>`;
}

function chip(label, active, action, value, extraClass = "") {
  const attrs = action ? `data-action="${action}" data-value="${escapeHtml(value || label)}"` : "";
  return `<button class="chip ${active ? "is-active" : ""} ${extraClass}" type="button" ${attrs}>${escapeHtml(label)}</button>`;
}

function progress(value) {
  const amount = Math.max(0, Math.min(100, Number(value) || 0));
  return `<div class="progress" aria-label="Progress ${amount}%"><span style="width:${amount}%"></span></div>`;
}

function render() {
  const app = document.querySelector("#app");
  const active = tabs.find((tab) => tab.id === state.activeTab) || tabs[0];
  app.innerHTML = `
    <main class="app-shell">
      <aside class="app-sidebar" aria-label="AfterLife navigation">
        <div class="brand">
          <span class="brand-mark">AF</span>
          <div>
            <strong>AfterLife</strong>
            <p>Private long-distance home</p>
          </div>
        </div>
        ${renderNavigation()}
        <section class="sidebar-card">
          <span class="meta">Safety contract</span>
          <strong>No surveillance, no public feed.</strong>
          <p>Private features stay opt-in, hidden from widgets, and deletable by either person.</p>
        </section>
      </aside>
      <section class="app-main" aria-label="AfterLife app">
        <div class="app-topbar">
          <div>
            <span class="meta">Current space</span>
            <strong>${escapeHtml(active.label)}</strong>
          </div>
          <div class="topbar-actions">
            ${renderSyncStatus()}
            ${renderPwaActions()}
            <span class="pill">${spicyEnabled() ? "Private mode ready" : "Private mode waiting"}</span>
            ${renderAvatars()}
          </div>
        </div>
        <div class="workspace-grid">
          <section class="primary-view" aria-label="${escapeHtml(active.label)} view">
            ${renderActiveTab()}
          </section>
          <aside class="context-panel" aria-label="Current context">
            ${renderContextPanel()}
          </aside>
        </div>
      </section>
      ${state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : ""}
      ${state.modal ? renderModal() : ""}
    </main>
  `;
}

function renderSyncStatus() {
  const label = runtime.apiStatus === "online" ? "Local backend" : "This device";
  return `<span class="sync-pill sync-${runtime.apiStatus}">${label}</span>`;
}

function renderPwaActions() {
  const actions = [];

  if (runtime.hasUpdate) {
    actions.push(button("Update", "refresh-app", icons.upload, "secondary small-button"));
  }

  if (runtime.canInstall && !runtime.isStandalone) {
    actions.push(button("Install", "install-app", icons.upload, "secondary small-button install-button"));
  }

  return actions.join("");
}

function renderNavigation() {
  return `
    <nav class="app-nav" aria-label="Primary">
      ${tabs.map((tab) => `
        <button class="nav-button ${state.activeTab === tab.id ? "is-active" : ""}" type="button" data-action="tab" data-value="${tab.id}" title="${tab.label}">
          ${tab.icon}
          <span>${tab.label}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function renderActiveTab() {
  if (state.activeTab === "together") return renderTogether();
  if (state.activeTab === "memories") return renderMemories();
  if (state.activeTab === "library") return renderLibrary();
  return renderHome();
}

function renderHeader(eyebrow, title, right = "") {
  return `
    <header class="view-header">
      <div>
        <p>${escapeHtml(eyebrow)}</p>
        <h1>${escapeHtml(title)}</h1>
      </div>
      ${right}
    </header>
  `;
}

function renderAvatars() {
  return `
    <div class="avatar-stack" aria-label="Mo and Aysel">
      <span>A</span>
      <span>M</span>
    </div>
  `;
}

function renderHome() {
  return `
    ${renderHeader("Private home", "Mo & Aysel", renderAvatars())}
    <section class="presence-card">
      <div>
        <span class="meta">Now with you</span>
        <strong>Aysel is reading your note</strong>
        <p>Soft presence only. No last seen, no pressure counter.</p>
      </div>
      <span class="pill">soft</span>
    </section>

    <section class="metric-grid" aria-label="Today">
      <article class="metric-card">
        <span class="icon-box">${icons.send}</span>
        <div>
          <strong>One Glimpse</strong>
          <p>${escapeHtml(state.glimpseKind)} ready</p>
        </div>
      </article>
      <article class="metric-card">
        <span class="number">17</span>
        <div>
          <strong>Days left</strong>
          <p>Next visit</p>
        </div>
      </article>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <span class="meta">Soft status</span>
        <strong>${escapeHtml(state.mood)}</strong>
      </div>
      <div class="chip-row">
        ${moods.map((mood) => chip(mood, state.mood === mood, "mood", mood, mood.includes("flirty") ? "private-chip" : "")).join("")}
      </div>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <span class="meta">Today's question</span>
        <strong>What did you want to tell me today but did not?</strong>
      </div>
      <div class="button-row">
        ${button("Answer", "open-question", icons.note)}
        ${button("Private", "open-private-question", icons.lock, "danger")}
      </div>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <span class="meta">Glimpse composer</span>
        <strong>${escapeHtml(state.glimpseCaption)}</strong>
      </div>
      <div class="chip-row">
        ${glimpseKinds.map((kind) => chip(kind, state.glimpseKind === kind, "glimpse-kind", kind)).join("")}
      </div>
      <label class="field">
        <span>Caption</span>
        <input type="text" value="${escapeHtml(state.glimpseCaption)}" data-input="glimpseCaption" maxlength="72">
      </label>
      <div class="button-row">
        ${button("Send", "save-glimpse", icons.send)}
        ${button("Save", "save-glimpse-memory", icons.memories, "secondary")}
      </div>
    </section>

    <section class="panel accent-panel">
      <div class="panel-heading">
        <span class="meta">Current shared activity</span>
        <strong>Reading: Letters from...</strong>
      </div>
      ${progress(state.readingProgress)}
      <p>You ${state.readingProgress}% - Aysel p.18 - 2 locked notes waiting</p>
    </section>
  `;
}

function renderTogether() {
  const active = activities[state.activeActivity] || activities.read;
  return `
    ${renderHeader("Do things together", "Together", `<span class="pill">async</span>`)}
    <section class="activity-grid" aria-label="Activities">
      ${Object.entries(activities).map(([id, item]) => `
        <button class="activity-tile ${state.activeActivity === id ? "is-active" : ""}" type="button" data-action="activity" data-value="${id}">
          <span>${item.icon}</span>
          <strong>${item.label}</strong>
        </button>
      `).join("")}
    </section>

    <section class="panel dark-panel">
      <div class="panel-heading">
        <span class="meta">Tonight</span>
        <strong>${escapeHtml(active.title)}</strong>
      </div>
      <p>${escapeHtml(active.copy)}</p>
      <div class="chip-row">
        ${active.chips.map((item) => chip(item, false, "", item)).join("")}
      </div>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <span class="meta">Private deck</span>
        <strong>${spicyEnabled() ? "Both enabled" : "Waiting for both toggles"}</strong>
      </div>
      <div class="toggle-row">
        ${renderToggle("Mo", state.spicy.mo, "toggle-spicy", "mo")}
        ${renderToggle("Aysel", state.spicy.aysel, "toggle-spicy", "aysel")}
      </div>
      <div class="chip-row">
        ${boundaries.map((item) => chip(item, state.boundary === item, "boundary", item, item === "Private" ? "private-chip" : "")).join("")}
      </div>
      <div class="locked-card ${spicyEnabled() ? "" : "is-muted"}">
        <span>${icons.lock}</span>
        <div>
          <strong>Tell me what you want me to remember about tonight.</strong>
          <p>Hidden from widgets, deletable by either person.</p>
        </div>
      </div>
      <div class="button-row">
        ${button("Answer soft", "soft-response", icons.note, "secondary")}
        ${button("Private answer", "private-response", icons.lock, "danger")}
      </div>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <span class="meta">Shared lists</span>
        <strong>${state.listItems.length} saved ideas</strong>
      </div>
      <label class="field compact">
        <span>New idea</span>
        <input type="text" value="${escapeHtml(state.listDraft)}" data-input="listDraft" maxlength="48">
      </label>
      <div class="button-row">
        ${button("Add idea", "add-list-item", icons.plus)}
      </div>
      <div class="mini-list">
        ${state.listItems.slice(0, 5).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
    </section>
  `;
}

function renderToggle(label, active, action, value) {
  return `
    <button class="toggle ${active ? "is-on" : ""}" type="button" data-action="${action}" data-value="${value}" aria-pressed="${active}">
      <span>${escapeHtml(label)}</span>
      <i></i>
    </button>
  `;
}

function renderMemories() {
  const view = state.memoriesView;
  return `
    ${renderHeader("Private archive", "Memories", button("Save", "quick-memory", icons.plus, "small-button"))}
    <div class="tab-row" role="tablist">
      ${["wall", "timeline", "letters", "vault"].map((item) => chip(item[0].toUpperCase() + item.slice(1), view === item, "memories-view", item, item === "vault" ? "private-chip" : "")).join("")}
    </div>
    ${renderMemoryView(view)}
  `;
}

function renderMemoryView(view) {
  if (view === "timeline") {
    return `
      <section class="timeline">
        ${state.memories.map((memory, index) => `
          <article class="timeline-item">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>${escapeHtml(memory.title)}</strong>
              <p>${escapeHtml(memory.private ? "Private memory, preview hidden." : memory.body)}</p>
            </div>
          </article>
        `).join("")}
      </section>
    `;
  }

  if (view === "letters") {
    const letters = [
      ["You miss me", "Available anytime"],
      ["You are mad at me", "Repair note, not a debate"],
      ["You cannot sleep", "Voice note recommended"],
      ["You feel insecure", "Reassurance without asking"],
      ["You need to laugh", "Private jokes and photos"],
      ["You want me", "Private mode only"]
    ];
    return `
      <section class="panel warm-panel">
        <div class="panel-heading">
          <span class="meta">Open when</span>
          <strong>Letters for specific moments</strong>
        </div>
      </section>
      <section class="stack-list">
        ${letters.map(([title, body]) => renderListItem(title, body, title.includes("want") ? icons.lock : icons.note)).join("")}
      </section>
    `;
  }

  if (view === "vault") {
    const privateItems = state.memories.filter((item) => item.private);
    return `
      <section class="panel dark-panel">
        <div class="panel-heading">
          <span class="meta">Vault status</span>
          <strong>Locked previews are hidden</strong>
        </div>
        <p>Private photos, voice notes, coupons, and letters never appear in widgets.</p>
      </section>
      <section class="stack-list">
        ${privateItems.map((item) => renderVaultItem(item)).join("") || renderListItem("Vault is empty", "Private items will appear here.", icons.lock)}
      </section>
      <section class="stack-list">
        ${renderListItem("Blur previews", "No accidental opening or lock-screen exposure.", icons.shield)}
        ${renderListItem("Both-control delete", "Either person can remove a shared private item.", icons.trash)}
        ${renderListItem("No pressure features", "No last seen, no location tracking, no guilt streaks.", icons.shield)}
      </section>
    `;
  }

  return `
    <section class="panel">
      <div class="panel-heading">
        <span class="meta">Save anything meaningful</span>
        <strong>Photos, voice, quotes, dates, book notes</strong>
      </div>
      <div class="chip-row">
        ${["photos", "voice", "quotes", "dates", "book highlights", "private"].map((item) => chip(item, false, "", item, item === "private" ? "private-chip" : "")).join("")}
      </div>
    </section>
    <section class="stack-list">
      ${state.memories.map((memory) => renderMemoryItem(memory)).join("")}
    </section>
  `;
}

function renderMemoryItem(memory) {
  return `
    <article class="list-card ${memory.private ? "private-list-card" : ""}">
      <span class="icon-box">${memory.private ? icons.lock : icons.memories}</span>
      <div>
        <strong>${escapeHtml(memory.title)}</strong>
        <p>${escapeHtml(memory.private ? "Locked preview hidden." : memory.body)}</p>
      </div>
      <button class="icon-button" type="button" data-action="delete-memory" data-value="${memory.id}" title="Delete memory" aria-label="Delete memory">${icons.trash}</button>
    </article>
  `;
}

function renderVaultItem(memory) {
  return `
    <article class="list-card private-list-card">
      <span class="icon-box">${icons.lock}</span>
      <div>
        <strong>${escapeHtml(memory.title)}</strong>
        <p>Locked preview hidden.</p>
      </div>
      <button class="icon-button" type="button" data-action="delete-memory" data-value="${memory.id}" title="Delete private item" aria-label="Delete private item">${icons.trash}</button>
    </article>
  `;
}

function renderListItem(title, body, icon) {
  return `
    <article class="list-card">
      <span class="icon-box">${icon}</span>
      <div>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(body)}</p>
      </div>
    </article>
  `;
}

function renderLibrary() {
  const view = state.libraryView;
  return `
    ${renderHeader("Shared reading", "Library", `<label class="button small-button" title="Upload PDF or EPUB">${icons.upload}<span>Upload</span><input class="hidden-file" type="file" data-file="library" accept=".pdf,.epub,application/pdf,application/epub+zip"></label>`)}
    <div class="tab-row" role="tablist">
      ${["ours", "mine", "aysel", "finished"].map((item) => chip(item === "aysel" ? "Aysel" : item[0].toUpperCase() + item.slice(1), view === item, "library-view", item)).join("")}
    </div>

    <section class="panel">
      <div class="panel-heading">
        <span class="meta">Supported</span>
        <strong>PDF / EPUB with notes</strong>
      </div>
      <div class="chip-row">
        ${["PDF", "EPUB", "highlights", "bookmarks", "search", "night mode"].map((item) => chip(item, item === "PDF" || item === "EPUB", "", item)).join("")}
      </div>
    </section>

    <section class="stack-list">
      ${state.files.map((file) => `
        <article class="list-card file-card">
          <span class="icon-box">${icons.book}</span>
          <div>
            <strong>${escapeHtml(file.type)}: ${escapeHtml(file.title)}</strong>
            <p>${escapeHtml(file.meta)}</p>
            ${progress(file.progress)}
          </div>
        </article>
      `).join("")}
    </section>

    <section class="reader-card ${state.readerNight ? "is-night" : ""}">
      <div class="reader-toolbar">
        <div>
          <span class="meta">Reading together</span>
          <strong>Letters from...</strong>
        </div>
        ${button(state.readerNight ? "Day" : "Night", "reader-night", icons.moon, "secondary small-button")}
      </div>
      <p>She read the sentence twice, because it felt like it had been written for someone far away.</p>
      <p>The room was quiet, but the words made it less empty. <mark>This line reminded me of you.</mark></p>
      <p>Somewhere between the page and the silence, she understood that distance was not the absence of love.</p>
      <div class="note-rail">
        ${state.notes.map((note) => `<span class="${note.locked ? "is-locked" : ""}">${note.locked ? icons.lock : icons.note}${escapeHtml(note.page)}</span>`).join("")}
      </div>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <span class="meta">Add margin note</span>
        <strong>${state.notes.length} notes saved</strong>
      </div>
      <label class="field compact">
        <span>Note</span>
        <input type="text" value="${escapeHtml(state.noteDraft)}" data-input="noteDraft" maxlength="80">
      </label>
      <div class="button-row">
        ${button("Add note", "add-note", icons.note)}
        ${button("Locked note", "add-locked-note", icons.lock, "danger")}
      </div>
    </section>
  `;
}

function renderContextPanel() {
  const active = activities[state.activeActivity] || activities.read;

  if (state.activeTab === "together") {
    return `
      <div class="context-kicker">Current plan</div>
      <h2>${escapeHtml(active.title)}</h2>
      <p>${escapeHtml(active.copy)}</p>
      ${renderBoundaryChecklist()}
      <div class="context-actions">
        ${button("Save to memories", "save-plan", icons.memories)}
        ${button("Open Library", "go-library", icons.library, "secondary")}
      </div>
    `;
  }

  if (state.activeTab === "memories") {
    return `
      <div class="context-kicker">Memory rules</div>
      <h2>Private archive, no public feed</h2>
      <p>Saved moments stay between the two people. Vault previews are blurred by default.</p>
      ${renderBoundaryChecklist()}
      <div class="context-actions">
        ${button("New letter", "new-letter", icons.note)}
        ${button("Open vault", "open-vault", icons.lock, "secondary")}
      </div>
    `;
  }

  if (state.activeTab === "library") {
    return `
      <div class="context-kicker">Reading date</div>
      <h2>Pages 12-20 tonight</h2>
      <p>Leave one text, voice, highlight, or locked note. Compare highlights after both finish.</p>
      <div class="progress-panel">
        <span>You</span>
        ${progress(state.readingProgress)}
        <input type="range" min="0" max="100" value="${state.readingProgress}" data-input="readingProgress">
      </div>
      <div class="context-actions">
        ${button("Save highlight", "save-highlight", icons.memories)}
        ${button("Add locked note", "add-locked-note", icons.lock, "secondary")}
      </div>
    `;
  }

  return `
    <div class="context-kicker">One glimpse</div>
    <h2>A private long-distance home</h2>
    <p>Daily glimpse, soft presence, countdowns, shared activities, private memories, and reading together.</p>
    <div class="visual-card" aria-label="Today glimpse visual">
      <span>Today, 21:44</span>
      <strong>Look at the sky here.</strong>
    </div>
    ${renderBoundaryChecklist()}
    <div class="context-actions">
      ${button("Send glimpse", "save-glimpse", icons.send)}
      ${button("Start reading", "go-library", icons.book, "secondary")}
    </div>
  `;
}

function renderBoundaryChecklist() {
  const items = ["No last seen", "No location tracking", "No public feed", "No guilt streaks", "Private is opt-in"];
  return `
    <div class="boundary-list">
      ${items.map((item) => `<span>${icons.shield}${escapeHtml(item)}</span>`).join("")}
    </div>
  `;
}

function renderModal() {
  const isPrivate = state.modal === "private-question" || state.modal === "private-response";
  const title = isPrivate ? "Private answer" : "Soft answer";
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <section class="modal" role="dialog" aria-modal="true" aria-label="${title}" data-stop>
        <div class="modal-header">
          <div>
            <span class="meta">${isPrivate ? "Locked by default" : "Today's question"}</span>
            <h2>${title}</h2>
          </div>
          <button class="icon-button" type="button" data-action="close-modal" title="Close" aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.4 4.8 5.6 5.6 5.6-5.6 1.6 1.6-5.6 5.6 5.6 5.6-1.6 1.6-5.6-5.6-5.6 5.6-1.6-1.6 5.6-5.6-5.6-5.6 1.6-1.6Z"/></svg>
          </button>
        </div>
        <textarea data-input="questionDraft" maxlength="260" placeholder="Write it here">${escapeHtml(state.questionDraft)}</textarea>
        <div class="button-row">
          ${button("Save answer", isPrivate ? "save-private-answer" : "save-soft-answer", isPrivate ? icons.lock : icons.note, isPrivate ? "danger" : "")}
        </div>
      </section>
    </div>
  `;
}

function showToast(message) {
  clearTimeout(toastTimer);
  state = { ...state, toast: message };
  render();
  toastTimer = setTimeout(() => {
    state = { ...state, toast: "" };
    render();
  }, 2400);
}

function addMemory(title, body, isPrivate = false, kind = "memory") {
  const memory = {
    id: `m${Date.now()}`,
    kind,
    title,
    body,
    private: isPrivate
  };
  state = { ...state, memories: [memory, ...state.memories] };
  saveState();
}

function handleAction(action, value) {
  switch (action) {
    case "tab":
      setState({ activeTab: value });
      break;
    case "mood":
      setState({ mood: value });
      break;
    case "glimpse-kind":
      setState({ glimpseKind: value });
      break;
    case "activity":
      setState({ activeActivity: value });
      break;
    case "boundary":
      setState({ boundary: value });
      break;
    case "memories-view":
      setState({ memoriesView: value });
      break;
    case "library-view":
      setState({ libraryView: value });
      break;
    case "toggle-spicy":
      setState({ spicy: { ...state.spicy, [value]: !state.spicy[value] } });
      break;
    case "open-question":
      setState({ modal: "question", questionDraft: "" });
      break;
    case "open-private-question":
    case "private-response":
      if (!spicyEnabled()) {
        showToast("Private mode needs both toggles.");
        return;
      }
      setState({ modal: "private-question", questionDraft: "" });
      break;
    case "soft-response":
      setState({ modal: "question", questionDraft: "" });
      break;
    case "close-modal":
      setState({ modal: null, questionDraft: "" });
      break;
    case "save-soft-answer":
      saveAnswer(false);
      break;
    case "save-private-answer":
      saveAnswer(true);
      break;
    case "save-glimpse":
      addMemory(`${state.glimpseKind} sent`, state.glimpseCaption || "One Glimpse", false, "glimpse");
      showToast("Glimpse sent and saved.");
      break;
    case "save-glimpse-memory":
      addMemory("One Glimpse saved", state.glimpseCaption || "One Glimpse", false, "glimpse");
      showToast("Saved to Memories.");
      break;
    case "save-highlight":
      addMemory("Shared highlight", "This line reminded me of you.", false, "reading");
      showToast("Highlight saved.");
      break;
    case "save-plan":
      addMemory("Tonight's plan", activities[state.activeActivity].title, false, "plan");
      showToast("Plan saved to Memories.");
      break;
    case "quick-memory":
      addMemory("New memory", "A small moment saved today.", false, "memory");
      showToast("Memory added.");
      break;
    case "new-letter":
      addMemory("Open when you miss me", "A letter for a future moment.", false, "letter");
      setState({ activeTab: "memories", memoriesView: "letters" });
      showToast("Letter created.");
      break;
    case "open-vault":
      setState({ activeTab: "memories", memoriesView: "vault" });
      break;
    case "go-library":
      setState({ activeTab: "library" });
      break;
    case "delete-memory":
      setState({ memories: state.memories.filter((memory) => memory.id !== value) });
      showToast("Memory removed.");
      break;
    case "add-list-item":
      addListItem();
      break;
    case "reader-night":
      setState({ readerNight: !state.readerNight });
      break;
    case "add-note":
      addNote(false);
      break;
    case "add-locked-note":
      addNote(true);
      break;
    case "install-app":
      installApp();
      break;
    case "refresh-app":
      refreshApp();
      break;
    default:
      break;
  }
}

function saveAnswer(isPrivate) {
  const body = state.questionDraft.trim();
  if (!body) {
    showToast("Write something first.");
    return;
  }
  addMemory(isPrivate ? "Private answer" : "Today's answer", body, isPrivate, isPrivate ? "vault" : "answer");
  state = { ...state, modal: null, questionDraft: "", activeTab: "memories", memoriesView: isPrivate ? "vault" : "wall" };
  saveState();
  render();
  showToast(isPrivate ? "Saved in the vault." : "Answer saved.");
}

function addListItem() {
  const item = state.listDraft.trim();
  if (!item) {
    showToast("Add an idea first.");
    return;
  }
  setState({ listItems: [item, ...state.listItems], listDraft: "" });
  showToast("Idea added.");
}

function addNote(locked) {
  if (locked && !spicyEnabled()) {
    showToast("Locked notes need both toggles.");
    return;
  }
  const body = state.noteDraft.trim() || (locked ? "Locked note for the end of the chapter." : "This paragraph is so you.");
  const note = { id: `n${Date.now()}`, page: "p.21", body, locked };
  state = { ...state, notes: [note, ...state.notes], noteDraft: "" };
  addMemory(locked ? "Locked reading note" : "Margin note", body, locked, locked ? "vault" : "reading");
  saveState();
  render();
  showToast(locked ? "Locked note added." : "Note added.");
}

document.addEventListener("click", (event) => {
  const actionNode = event.target.closest("[data-action]");
  if (!actionNode) {
    if (event.target.closest("[data-stop]")) return;
    return;
  }

  const action = actionNode.dataset.action;
  const value = actionNode.dataset.value;
  handleAction(action, value);
});

document.addEventListener("input", (event) => {
  const input = event.target.closest("[data-input]");
  if (!input) return;

  const key = input.dataset.input;
  const value = input.type === "range" ? Number(input.value) : input.value;
  state = { ...state, [key]: value };
  saveState();
  if (input.type === "range") {
    render();
  }
});

document.addEventListener("change", (event) => {
  const fileInput = event.target.closest("[data-file='library']");
  if (!fileInput || !fileInput.files.length) return;

  const added = [...fileInput.files].map((file) => ({
    id: `f${Date.now()}-${file.name}`,
    type: file.name.toLowerCase().endsWith(".epub") ? "EPUB" : "PDF",
    title: file.name.replace(/\.(pdf|epub)$/i, ""),
    progress: 0,
    meta: "Uploaded locally, ready for notes"
  }));

  setState({ files: [...added, ...state.files] });
  showToast("Book added to Library.");
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  runtime.canInstall = true;
  render();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  runtime.canInstall = false;
  runtime.isStandalone = true;
  showToast("AfterLife installed.");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    registerServiceWorker();
  });
}

async function installApp() {
  if (!deferredInstallPrompt) {
    showToast("Install will appear when the browser allows it.");
    return;
  }

  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  runtime.canInstall = false;
  render();

  if (choice.outcome === "accepted") {
    showToast("Install started.");
  }
}

function refreshApp() {
  if (!runtime.waitingWorker) {
    location.reload();
    return;
  }

  runtime.waitingWorker.postMessage({ type: "SKIP_WAITING" });
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register("service-worker.js");

    if (registration.waiting && navigator.serviceWorker.controller) {
      markUpdateReady(registration.waiting);
    }

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          markUpdateReady(newWorker);
        }
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshingFromServiceWorker) return;
      refreshingFromServiceWorker = true;
      location.reload();
    });
  } catch {
    // Local file access and some browser modes disable service workers.
  }
}

function markUpdateReady(worker) {
  runtime.waitingWorker = worker;
  runtime.hasUpdate = true;
  render();
  showToast("A new version is ready.");
}

async function hydrateStateFromApi() {
  if (!location.protocol.startsWith("http")) {
    runtime.apiStatus = "offline";
    render();
    return;
  }

  try {
    const response = await fetch("api/state", { cache: "no-store" });
    if (!response.ok) throw new Error("State API unavailable");

    const data = await response.json();
    runtime.apiStatus = "online";

    if (data && Object.keys(data).length > 0) {
      state = mergeState(defaultState, data);
      writeStoredState(JSON.stringify(getPersistableState()));
    }

    render();
  } catch {
    runtime.apiStatus = "offline";
    render();
  }
}

function scheduleApiSave(cleanState) {
  if (!location.protocol.startsWith("http")) return;

  clearTimeout(apiSaveTimer);
  apiSaveTimer = setTimeout(() => {
    saveStateToApi(cleanState);
  }, 350);
}

async function saveStateToApi(cleanState) {
  try {
    const response = await fetch("api/state", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cleanState)
    });

    runtime.apiStatus = response.ok ? "online" : "offline";
  } catch {
    runtime.apiStatus = "offline";
  }

  render();
}

render();
hydrateStateFromApi();
