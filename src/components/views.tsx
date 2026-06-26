import {
  BookOpen,
  Copy,
  Download,
  Lock,
  Moon,
  Plus,
  Send,
  Shield,
  StickyNote,
  Trash2,
  Upload
} from "lucide-react";
import { activities, boundaries, boundaryChecklist, glimpseKinds, moods } from "../lib/appData";
import type { ActivityId, AppState, Boundary, GlimpseKind, LibraryFile, MemoryItem, MemoryView, Mood, ReadingNote } from "../types/domain";
import { actionIcons, activityIcons } from "./icons";
import { Avatars, Button, Chip, Field, IconBox, Progress, ViewHeader } from "./ui";

export interface ViewActions {
  updateState: (patch: Partial<AppState>) => void;
  addMemory: (title: string, body: string, isPrivate?: boolean, kind?: string) => Promise<void>;
  deleteMemory: (memory: MemoryItem) => Promise<void>;
  deleteListItem: (item: string, index: number) => Promise<void>;
  addListItem: () => Promise<void>;
  addNote: (locked: boolean) => Promise<void>;
  deleteNote: (note: ReadingNote) => Promise<void>;
  updateFileProgress: (file: LibraryFile, progress: number) => Promise<void>;
  openLibraryFile: (file: LibraryFile) => Promise<void>;
  deleteLibraryFile: (file: LibraryFile) => Promise<void>;
  saveMemoryDraft: () => Promise<void>;
  saveAnswer: (isPrivate: boolean) => Promise<void>;
  uploadFiles: (files: FileList) => Promise<void>;
  showToast: (message: string) => void;
  copyInvite: () => Promise<void>;
}

interface ViewProps {
  state: AppState;
  actions: ViewActions;
  inviteCode?: string;
}

function spicyEnabled(state: AppState) {
  return Boolean(state.spicy.mo && state.spicy.aysel);
}

export function HomeView({ state, actions }: ViewProps) {
  const latestMemory = state.memories[0];
  const activeFile = state.files[0];
  const sharedCount = state.memories.filter((memory) => !memory.private).length;
  const privateCount = state.memories.filter((memory) => memory.private).length;
  const glimpseLabel = state.glimpseCaption ? `${state.glimpseKind} ready` : `Write a ${state.glimpseKind.toLowerCase()} glimpse`;

  return (
    <>
      <ViewHeader eyebrow="Private home" title="Mo & Aysel" right={<Avatars />} />
      <section className="presence-card">
        <div>
          <span className="meta">{latestMemory ? "Latest shared moment" : "Start here"}</span>
          <strong>{latestMemory ? latestMemory.title : "Create the first real memory together"}</strong>
          <p>{latestMemory ? (latestMemory.private ? "Private preview hidden." : latestMemory.body) : "Save a glimpse, answer, list idea, or reading note. No last seen, no pressure counter."}</p>
        </div>
        <span className="pill">{state.mood}</span>
      </section>

      <section className="metric-grid" aria-label="Today">
        <article className="metric-card">
          <IconBox icon={Send} />
          <div>
            <strong>One Glimpse</strong>
            <p>{glimpseLabel}</p>
          </div>
        </article>
        <article className="metric-card">
          <span className="number">{sharedCount}</span>
          <div>
            <strong>Shared memories</strong>
            <p>{privateCount ? `${privateCount} private item${privateCount === 1 ? "" : "s"} in vault` : "Vault is empty"}</p>
          </div>
        </article>
        <article className="metric-card">
          <IconBox icon={BookOpen} />
          <div>
            <strong>{activeFile ? activeFile.title : "No book uploaded"}</strong>
            <p>{activeFile ? `${activeFile.progress}% shared reading progress` : "Upload a PDF or EPUB in Library"}</p>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <span className="meta">Soft status</span>
          <strong>{state.mood}</strong>
        </div>
        <div className="chip-row">
          {moods.map((mood: Mood) => (
            <Chip
              key={mood}
              active={state.mood === mood}
              privateTone={mood.includes("flirty")}
              onClick={() => actions.updateState({ mood })}
            >
              {mood}
            </Chip>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <span className="meta">Today's question</span>
          <strong>What did you want to tell me today but did not?</strong>
        </div>
        <div className="button-row">
          <Button icon={StickyNote} onClick={() => actions.updateState({ modal: "question", questionDraft: "" })}>
            Answer
          </Button>
          <Button
            icon={Lock}
            variant="danger"
            onClick={() => {
              if (!spicyEnabled(state)) {
                actions.showToast("Private mode needs both toggles.");
                return;
              }
              actions.updateState({ modal: "private-question", questionDraft: "" });
            }}
          >
            Private
          </Button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <span className="meta">Glimpse composer</span>
          <strong>{state.glimpseCaption || "Write something small to send today"}</strong>
        </div>
        <div className="chip-row">
          {glimpseKinds.map((kind: GlimpseKind) => (
            <Chip key={kind} active={state.glimpseKind === kind} onClick={() => actions.updateState({ glimpseKind: kind })}>
              {kind}
            </Chip>
          ))}
        </div>
        <Field
          label="Caption"
          type="text"
          value={state.glimpseCaption}
          maxLength={72}
          onChange={(event) => actions.updateState({ glimpseCaption: event.currentTarget.value })}
        />
        <div className="button-row">
          <Button
            icon={Send}
            onClick={async () => {
              if (!state.glimpseCaption.trim()) {
                actions.showToast("Write the glimpse first.");
                return;
              }
              await actions.addMemory(`${state.glimpseKind} sent`, state.glimpseCaption, false, "glimpse");
              actions.showToast("Glimpse sent and saved.");
            }}
          >
            Send
          </Button>
          <Button
            icon={actionIcons.book}
            variant="secondary"
            onClick={async () => {
              if (!state.glimpseCaption.trim()) {
                actions.showToast("Write the glimpse first.");
                return;
              }
              await actions.addMemory("One Glimpse saved", state.glimpseCaption, false, "glimpse");
              actions.showToast("Saved to Memories.");
            }}
          >
            Save
          </Button>
        </div>
      </section>

      <section className="panel accent-panel">
        <div className="panel-heading">
          <span className="meta">Current shared activity</span>
          <strong>{activeFile ? `Reading: ${activeFile.title}` : activities[state.activeActivity].title}</strong>
        </div>
        <Progress value={state.readingProgress} />
        <p>{activeFile ? `${state.readingProgress}% synced for this space.` : "Pick an activity or upload reading material to make this real."}</p>
      </section>
    </>
  );
}

export function TogetherView({ state, actions }: ViewProps) {
  const active = activities[state.activeActivity] || activities.read;

  return (
    <>
      <ViewHeader eyebrow="Do things together" title="Together" right={<span className="pill">async</span>} />
      <section className="activity-grid" aria-label="Activities">
        {Object.entries(activities).map(([id, item]) => {
          const Icon = activityIcons[item.id];
          return (
            <button
              className={`activity-tile ${state.activeActivity === id ? "is-active" : ""}`}
              key={id}
              type="button"
              onClick={() => actions.updateState({ activeActivity: id as ActivityId })}
            >
              <span>
                <Icon aria-hidden="true" />
              </span>
              <strong>{item.label}</strong>
            </button>
          );
        })}
      </section>

      <section className="panel dark-panel">
        <div className="panel-heading">
          <span className="meta">Tonight</span>
          <strong>{active.title}</strong>
        </div>
        <p>{active.copy}</p>
        <div className="chip-row">
          {active.chips.map((item) => (
            <span className="label-chip" key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <span className="meta">Private deck</span>
          <strong>{spicyEnabled(state) ? "Both enabled" : "Waiting for both toggles"}</strong>
        </div>
        <div className="toggle-row">
          <Toggle
            label="Mo"
            active={state.spicy.mo}
            onClick={() => actions.updateState({ spicy: { ...state.spicy, mo: !state.spicy.mo } })}
          />
          <Toggle
            label="Aysel"
            active={state.spicy.aysel}
            onClick={() => actions.updateState({ spicy: { ...state.spicy, aysel: !state.spicy.aysel } })}
          />
        </div>
        <div className="chip-row">
          {boundaries.map((boundary: Boundary) => (
            <Chip
              key={boundary}
              active={state.boundary === boundary}
              privateTone={boundary === "Private"}
              onClick={() => actions.updateState({ boundary })}
            >
              {boundary}
            </Chip>
          ))}
        </div>
        <div className={`locked-card ${spicyEnabled(state) ? "" : "is-muted"}`}>
          <Lock aria-hidden="true" />
          <div>
            <strong>Tell me what you want me to remember about tonight.</strong>
            <p>Hidden from widgets, deletable by either person.</p>
          </div>
        </div>
        <div className="button-row">
          <Button icon={StickyNote} variant="secondary" onClick={() => actions.updateState({ modal: "question", questionDraft: "" })}>
            Answer soft
          </Button>
          <Button
            icon={Lock}
            variant="danger"
            onClick={() => {
              if (!spicyEnabled(state)) {
                actions.showToast("Private mode needs both toggles.");
                return;
              }
              actions.updateState({ modal: "private-question", questionDraft: "" });
            }}
          >
            Private answer
          </Button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <span className="meta">Shared lists</span>
          <strong>{state.listItems.length} saved ideas</strong>
        </div>
        <Field
          compact
          label="New idea"
          type="text"
          value={state.listDraft}
          maxLength={48}
          onChange={(event) => actions.updateState({ listDraft: event.currentTarget.value })}
        />
        <div className="button-row">
          <Button icon={Plus} onClick={actions.addListItem}>
            Add idea
          </Button>
        </div>
        <div className="mini-list">
          {state.listItems.length ? (
            state.listItems.slice(0, 5).map((item, index) => (
              <span className="mini-list-item" key={`${item}-${index}`}>
                {item}
                <button type="button" title="Remove idea" aria-label={`Remove ${item}`} onClick={() => void actions.deleteListItem(item, index)}>
                  x
                </button>
              </span>
            ))
          ) : (
            <em>No ideas yet. Add the first movie, food, book, or visit plan.</em>
          )}
        </div>
      </section>
    </>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`toggle ${active ? "is-on" : ""}`} type="button" aria-pressed={active} onClick={onClick}>
      <span>{label}</span>
      <i />
    </button>
  );
}

export function MemoriesView({ state, actions }: ViewProps) {
  return (
    <>
      <ViewHeader
        eyebrow="Private archive"
        title="Memories"
        right={
          <Button
            icon={Plus}
            small
            onClick={() =>
              actions.updateState({
                modal: "memory",
                memoryTitleDraft: "",
                memoryBodyDraft: "",
                memoryKindDraft: "memory",
                memoryPrivateDraft: false
              })
            }
          >
            Save
          </Button>
        }
      />
      <div className="tab-row" role="tablist">
        {(["wall", "timeline", "letters", "vault"] as MemoryView[]).map((view) => (
          <Chip
            key={view}
            active={state.memoriesView === view}
            privateTone={view === "vault"}
            onClick={() => actions.updateState({ memoriesView: view })}
          >
            {view[0].toUpperCase() + view.slice(1)}
          </Chip>
        ))}
      </div>
      {renderMemoryView(state, actions)}
    </>
  );
}

function renderMemoryView(state: AppState, actions: ViewActions) {
  if (state.memoriesView === "timeline") {
    return (
      <section className="timeline">
        {state.memories.length ? (
          state.memories.map((memory, index) => (
            <article className="timeline-item" key={memory.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{memory.title}</strong>
                <p>{memory.private ? "Private memory, preview hidden." : memory.body}</p>
              </div>
            </article>
          ))
        ) : (
          <EmptyState title="Timeline is empty" body="Saved glimpses, notes, and letters will appear here in order." />
        )}
      </section>
    );
  }

  if (state.memoriesView === "letters") {
    const letters = state.memories.filter((item) => item.kind === "letter");
    return (
      <>
        <section className="panel warm-panel">
          <div className="panel-heading">
            <span className="meta">Open when</span>
            <strong>Letters for specific moments</strong>
          </div>
          <div className="button-row">
            <Button
              icon={StickyNote}
              onClick={() =>
                actions.updateState({
                  modal: "memory",
                  memoryTitleDraft: "Open when you miss me",
                  memoryBodyDraft: "",
                  memoryKindDraft: "letter",
                  memoryPrivateDraft: false
                })
              }
            >
              New letter
            </Button>
          </div>
        </section>
        <section className="stack-list">
          {letters.length ? (
            letters.map((letter) => <MemoryCard key={letter.id} memory={letter} actions={actions} />)
          ) : (
            <EmptyState title="No letters yet" body="Create an open-when letter and it will sync into this shared space." />
          )}
        </section>
      </>
    );
  }

  if (state.memoriesView === "vault") {
    const privateItems = state.memories.filter((item) => item.private);
    return (
      <>
        <section className="panel dark-panel">
          <div className="panel-heading">
            <span className="meta">Vault status</span>
            <strong>Locked previews are hidden</strong>
          </div>
          <p>Private photos, voice notes, coupons, and letters never appear in widgets.</p>
        </section>
        <section className="stack-list">
          {privateItems.length ? (
            privateItems.map((item) => <MemoryCard key={item.id} memory={item} actions={actions} />)
          ) : (
            <ListItem title="Vault is empty" body="Private items will appear here." icon={Lock} />
          )}
        </section>
        <section className="stack-list">
          <ListItem title="Blur previews" body="No accidental opening or lock-screen exposure." icon={Shield} />
          <ListItem title="Both-control delete" body="Either person can remove a shared private item." icon={Trash2} />
          <ListItem title="No pressure features" body="No last seen, no location tracking, no guilt streaks." icon={Shield} />
        </section>
      </>
    );
  }

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <span className="meta">Save anything meaningful</span>
          <strong>Photos, voice, quotes, dates, book notes</strong>
        </div>
        <div className="chip-row">
          {["photos", "voice", "quotes", "dates", "book highlights", "private"].map((item) => (
            <span className={`label-chip ${item === "private" ? "private-label-chip" : ""}`} key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>
      <section className="stack-list">
        {state.memories.length ? (
          state.memories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} actions={actions} />
          ))
        ) : (
          <EmptyState title="No memories yet" body="Use Save, send a glimpse, answer a question, or add a reading note." />
        )}
      </section>
    </>
  );
}

function MemoryCard({ memory, actions }: { memory: MemoryItem; actions: ViewActions }) {
  return (
    <article className={`list-card ${memory.private ? "private-list-card" : ""}`}>
      <IconBox icon={memory.private ? Lock : actionIcons.book} />
      <div>
        <strong>{memory.title}</strong>
        <p>{memory.private ? "Locked preview hidden." : memory.body}</p>
      </div>
      <button className="icon-button" type="button" title="Delete memory" aria-label="Delete memory" onClick={() => actions.deleteMemory(memory)}>
        <Trash2 aria-hidden="true" />
      </button>
    </article>
  );
}

function ListItem({ title, body, icon: Icon }: { title: string; body: string; icon: typeof Lock }) {
  return (
    <article className="list-card">
      <IconBox icon={Icon} />
      <div>
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </article>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <article className="empty-state">
      <strong>{title}</strong>
      <p>{body}</p>
    </article>
  );
}

export function LibraryView({ state, actions }: ViewProps) {
  const activeFile = state.files[0];
  const visibleFiles = state.files.filter((file) => {
    if (state.libraryView === "finished") return file.progress >= 100;
    if (state.libraryView === "mine") return file.meta.toLowerCase().includes("uploaded");
    if (state.libraryView === "aysel") return file.meta.toLowerCase().includes("aysel");
    return true;
  });

  return (
    <>
      <ViewHeader
        eyebrow="Shared reading"
        title="Library"
        right={
          <label className="button small-button" title="Upload PDF or EPUB">
            <Upload aria-hidden="true" />
            <span>Upload</span>
            <input
              className="hidden-file"
              type="file"
              accept=".pdf,.epub,application/pdf,application/epub+zip"
              multiple
              onChange={(event) => {
                if (event.currentTarget.files?.length) {
                  void actions.uploadFiles(event.currentTarget.files);
                  event.currentTarget.value = "";
                }
              }}
            />
          </label>
        }
      />
      <div className="tab-row" role="tablist">
        {(["ours", "mine", "aysel", "finished"] as const).map((view) => (
          <Chip key={view} active={state.libraryView === view} onClick={() => actions.updateState({ libraryView: view })}>
            {view === "aysel" ? "Aysel" : view[0].toUpperCase() + view.slice(1)}
          </Chip>
        ))}
      </div>

      <section className="panel">
        <div className="panel-heading">
          <span className="meta">Supported</span>
          <strong>PDF / EPUB with notes</strong>
        </div>
        <div className="chip-row">
          {["PDF", "EPUB", "highlights", "bookmarks", "search", "night mode"].map((item) => (
            <span className={`label-chip ${item === "PDF" || item === "EPUB" ? "is-active" : ""}`} key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="stack-list">
        {visibleFiles.length ? (
          visibleFiles.map((file: LibraryFile) => (
            <article className="list-card file-card" key={file.id}>
              <IconBox icon={BookOpen} />
              <div>
                <strong>
                  {file.type}: {file.title}
                </strong>
                <p>{file.meta}</p>
                <Progress value={file.progress} />
                <div className="progress-steps" aria-label={`${file.title} reading progress`}>
                  {[25, 50, 75, 100].map((value) => (
                    <button
                      className={file.progress === value ? "is-active" : ""}
                      type="button"
                      key={value}
                      onClick={() => void actions.updateFileProgress(file, value)}
                    >
                      {value === 100 ? "Done" : `${value}%`}
                    </button>
                  ))}
                </div>
                <div className="button-row compact-actions">
                  <Button icon={Download} small variant="secondary" onClick={() => actions.openLibraryFile(file)}>
                    Open
                  </Button>
                  <Button icon={Trash2} small variant="secondary" onClick={() => actions.deleteLibraryFile(file)}>
                    Remove
                  </Button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            title={state.files.length ? "Nothing in this filter" : "No shared books yet"}
            body={state.files.length ? "Switch tabs or upload another PDF or EPUB." : "Upload a PDF or EPUB and it will become a synced reading item for both accounts."}
          />
        )}
      </section>

      <section className={`reader-card ${state.readerNight ? "is-night" : ""}`}>
        <div className="reader-toolbar">
          <div>
            <span className="meta">Reading together</span>
            <strong>{activeFile ? activeFile.title : "Choose something to read together"}</strong>
          </div>
          <Button icon={Moon} variant="secondary" small onClick={() => actions.updateState({ readerNight: !state.readerNight })}>
            {state.readerNight ? "Day" : "Night"}
          </Button>
        </div>
        {activeFile ? (
          <>
            <p>Use this space for highlights, page progress, and notes while the real reader gets deeper.</p>
            <p>
              Current progress: <mark>{activeFile.progress}%</mark>
            </p>
          </>
        ) : (
          <p>Upload the first book above, then add notes from either account. Locked notes stay out of casual previews.</p>
        )}
        <div className="note-list">
          {state.notes.length ? (
            state.notes.map((note) => (
              <article className={`list-card note-card ${note.locked ? "private-list-card" : ""}`} key={note.id}>
                <IconBox icon={note.locked ? Lock : StickyNote} />
                <div>
                  <strong>{note.page}</strong>
                  <p>{note.locked ? "Locked note preview hidden." : note.body}</p>
                </div>
                <button className="icon-button" type="button" title="Delete note" aria-label={`Delete note ${note.page}`} onClick={() => actions.deleteNote(note)}>
                  <Trash2 aria-hidden="true" />
                </button>
              </article>
            ))
          ) : (
            <EmptyState title="No notes yet" body="Add a page or section note below." />
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <span className="meta">Add margin note</span>
          <strong>{state.notes.length} notes saved</strong>
        </div>
        <Field
          compact
          label="Page or section"
          type="text"
          value={state.notePageDraft}
          maxLength={24}
          placeholder="p.21, ch.3, quote"
          onChange={(event) => actions.updateState({ notePageDraft: event.currentTarget.value })}
        />
        <Field
          compact
          label="Note"
          type="text"
          value={state.noteDraft}
          maxLength={80}
          onChange={(event) => actions.updateState({ noteDraft: event.currentTarget.value })}
        />
        <div className="button-row">
          <Button icon={StickyNote} onClick={() => actions.addNote(false)}>
            Add note
          </Button>
          <Button icon={Lock} variant="danger" onClick={() => actions.addNote(true)}>
            Locked note
          </Button>
        </div>
      </section>
    </>
  );
}

export function ContextPanel({ state, actions, inviteCode }: ViewProps) {
  const active = activities[state.activeActivity] || activities.read;
  const activeFile = state.files[0];

  if (state.activeTab === "together") {
    return (
      <>
        <div className="context-kicker">Current plan</div>
        <h2>{active.title}</h2>
        <p>{active.copy}</p>
        <BoundaryChecklist />
        <div className="context-actions">
          <Button icon={actionIcons.book} onClick={() => actions.addMemory("Tonight's plan", active.title, false, "plan")}>
            Save to memories
          </Button>
          <Button icon={actionIcons.book} variant="secondary" onClick={() => actions.updateState({ activeTab: "library" })}>
            Open Library
          </Button>
        </div>
      </>
    );
  }

  if (state.activeTab === "memories") {
    return (
      <>
        <div className="context-kicker">Memory rules</div>
        <h2>Private archive, no public feed</h2>
        <p>Saved moments stay between the two people. Vault previews are blurred by default.</p>
        <BoundaryChecklist />
        <div className="context-actions">
          <Button
            icon={StickyNote}
            onClick={() => {
              actions.updateState({
                activeTab: "memories",
                memoriesView: "letters",
                modal: "memory",
                memoryTitleDraft: "Open when you miss me",
                memoryBodyDraft: "",
                memoryKindDraft: "letter",
                memoryPrivateDraft: false
              });
            }}
          >
            New letter
          </Button>
          <Button icon={Lock} variant="secondary" onClick={() => actions.updateState({ activeTab: "memories", memoriesView: "vault" })}>
            Open vault
          </Button>
        </div>
      </>
    );
  }

  if (state.activeTab === "library") {
    return (
      <>
        <div className="context-kicker">Reading date</div>
        <h2>Pages 12-20 tonight</h2>
        <p>Leave one text, voice, highlight, or locked note. Compare highlights after both finish.</p>
        <div className="progress-panel">
          <span>You</span>
          <Progress value={activeFile ? activeFile.progress : state.readingProgress} />
          <input
            type="range"
            min="0"
            max="100"
            value={activeFile ? activeFile.progress : state.readingProgress}
            onChange={(event) => {
              const progress = Number(event.currentTarget.value);
              if (activeFile) {
                void actions.updateFileProgress(activeFile, progress);
                return;
              }
              actions.updateState({ readingProgress: progress });
            }}
          />
        </div>
        <div className="context-actions">
          <Button
            icon={actionIcons.book}
            onClick={() =>
              actions.updateState({
                activeTab: "memories",
                modal: "memory",
                memoryTitleDraft: "Shared highlight",
                memoryBodyDraft: "",
                memoryKindDraft: "reading",
                memoryPrivateDraft: false
              })
            }
          >
            Save highlight
          </Button>
          <Button
            icon={Lock}
            variant="secondary"
            onClick={() => {
              actions.updateState({ activeTab: "library" });
              actions.showToast("Write the locked note first.");
            }}
          >
            Add locked note
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="context-kicker">One glimpse</div>
      <h2>A private long-distance home</h2>
      <p>{state.memories.length ? `${state.memories.length} saved moment${state.memories.length === 1 ? "" : "s"} in this space.` : "Daily glimpse, shared activities, private memories, and reading together."}</p>
      <div className="visual-card" aria-label="Today glimpse visual">
        <span>{state.glimpseKind}</span>
        <strong>{state.glimpseCaption || "Write the first glimpse."}</strong>
      </div>
      {inviteCode ? (
        <button className="invite-chip" type="button" onClick={actions.copyInvite}>
          <Copy aria-hidden="true" />
          <span>{inviteCode}</span>
        </button>
      ) : null}
      <BoundaryChecklist />
      <div className="context-actions">
        <Button
          icon={Send}
          onClick={() => {
            if (!state.glimpseCaption.trim()) {
              actions.showToast("Write the glimpse first.");
              return;
            }
            void actions.addMemory(`${state.glimpseKind} sent`, state.glimpseCaption, false, "glimpse");
          }}
        >
          Send glimpse
        </Button>
        <Button icon={BookOpen} variant="secondary" onClick={() => actions.updateState({ activeTab: "library" })}>
          Start reading
        </Button>
      </div>
    </>
  );
}

function BoundaryChecklist() {
  return (
    <div className="boundary-list">
      {boundaryChecklist.map((item) => (
        <span key={item}>
          <Shield aria-hidden="true" />
          {item}
        </span>
      ))}
    </div>
  );
}
