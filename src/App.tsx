import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Check,
  Cloud,
  Copy,
  Download,
  HeartHandshake,
  KeyRound,
  LoaderCircle,
  Lock,
  LogOut,
  RefreshCw,
  Shield,
  StickyNote,
  UserPlus,
  WifiOff
} from "lucide-react";
import { tabs } from "./lib/appData";
import { generateInviteCode, normalizeInviteCode } from "./lib/invite";
import { getPersistableState, mergeState, readLocalState, writeLocalState } from "./lib/state";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { usePwa } from "./hooks/usePwa";
import type { AppState, CoupleSpace, LibraryFile, MemoryItem, ReadingNote, SyncStatus, UserProfile } from "./types/domain";
import { tabIcons } from "./components/icons";
import { Avatars, Button, Field } from "./components/ui";
import { ContextPanel, HomeView, LibraryView, MemoriesView, TogetherView, type ViewActions } from "./components/views";

const localSpace: CoupleSpace = {
  id: "local",
  name: "Local Couple Space",
  inviteCode: "LOCAL",
  role: "local"
};

const syncedPreferenceKeys = new Set<keyof AppState>([
  "activeActivity",
  "mood",
  "glimpseKind",
  "boundary",
  "spicy",
  "readingProgress",
  "readerNight",
  "glimpseCaption"
]);

function App() {
  const [state, setState] = useState<AppState>(() => readLocalState());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(isSupabaseConfigured ? "checking" : "local");
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [spaces, setSpaces] = useState<CoupleSpace[]>([]);
  const [activeSpace, setActiveSpace] = useState<CoupleSpace | null>(isSupabaseConfigured ? null : localSpace);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [spaceName, setSpaceName] = useState("Mo & Aysel");
  const [inviteDraft, setInviteDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const toastTimer = useRef<number | null>(null);
  const apiSaveTimer = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setState((current) => ({ ...current, toast: message }));
    toastTimer.current = window.setTimeout(() => {
      setState((current) => ({ ...current, toast: "" }));
    }, 2400);
  }, []);

  const pwa = usePwa(showToast);

  const saveLocalSnapshot = useCallback((next: AppState) => {
    writeLocalState(next);

    if (isSupabaseConfigured) return;
    if (!window.location.protocol.startsWith("http")) return;

    if (apiSaveTimer.current) window.clearTimeout(apiSaveTimer.current);
    apiSaveTimer.current = window.setTimeout(() => {
      fetch("/api/state", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(getPersistableState(next))
      }).catch(() => {
        // Vite dev does not expose the local API bridge. localStorage remains active.
      });
    }, 350);
  }, []);

  const saveRemotePreferences = useCallback(
    async (next: AppState) => {
      if (!supabase || !activeSpace || activeSpace.role === "local") return;

      setSyncStatus("saving");
      const { error } = await supabase.from("space_preferences").upsert(
        {
          space_id: activeSpace.id,
          active_activity: next.activeActivity,
          mood: next.mood,
          glimpse_kind: next.glimpseKind,
          boundary: next.boundary,
          spicy_mo: next.spicy.mo,
          spicy_aysel: next.spicy.aysel,
          reading_progress: next.readingProgress,
          reader_night: next.readerNight,
          glimpse_caption: next.glimpseCaption,
          updated_at: new Date().toISOString()
        },
        { onConflict: "space_id" }
      );

      setSyncStatus(error ? "error" : "saved");
      if (error) showToast("Preferences did not sync.");
    },
    [activeSpace, showToast]
  );

  const updateState = useCallback(
    (patch: Partial<AppState>) => {
      setState((current) => {
        const next = {
          ...current,
          ...patch,
          spicy: patch.spicy ? { ...current.spicy, ...patch.spicy } : current.spicy
        };
        saveLocalSnapshot(next);

        const shouldSync = Object.keys(patch).some((key) => syncedPreferenceKeys.has(key as keyof AppState));
        if (shouldSync) void saveRemotePreferences(next);

        return next;
      });
    },
    [saveLocalSnapshot, saveRemotePreferences]
  );

  useEffect(() => {
    if (isSupabaseConfigured) return;

    fetch("/api/state", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data && Object.keys(data).length > 0) {
          setState(mergeState(data));
          setSyncStatus("local");
        }
      })
      .catch(() => setSyncStatus("local"));
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const refreshSpaces = useCallback(
    async (preferredSpaceId?: string) => {
      if (!supabase || !session) return;

      const email = session.user.email || "";
      const name =
        displayName.trim() ||
        String(session.user.user_metadata?.display_name || "") ||
        email.split("@")[0] ||
        "AfterLife user";

      await supabase.from("profiles").upsert({
        id: session.user.id,
        email,
        display_name: name,
        updated_at: new Date().toISOString()
      });

      setProfile({ id: session.user.id, email, displayName: name });

      const { data, error } = await supabase
        .from("space_members")
        .select("role,couple_spaces(id,name,invite_code)")
        .eq("user_id", session.user.id)
        .order("joined_at", { ascending: true });

      if (error) {
        setSyncStatus("error");
        showToast("Could not load your couple space.");
        return;
      }

      const nextSpaces: CoupleSpace[] = (data || []).flatMap((row: any) => {
          const space = Array.isArray(row.couple_spaces) ? row.couple_spaces[0] : row.couple_spaces;
          if (!space) return [];
          return [{
            id: space.id,
            name: space.name,
            inviteCode: space.invite_code,
            role: row.role === "owner" ? "owner" : "partner"
          } satisfies CoupleSpace];
        });

      setSpaces(nextSpaces);
      setActiveSpace((current) => {
        const preferred = nextSpaces.find((space) => space.id === preferredSpaceId);
        const existing = nextSpaces.find((space) => space.id === current?.id);
        return preferred || existing || nextSpaces[0] || null;
      });
    },
    [displayName, session, showToast]
  );

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setSpaces([]);
      setActiveSpace(isSupabaseConfigured ? null : localSpace);
      return;
    }
    void refreshSpaces();
  }, [refreshSpaces, session]);

  const loadRemoteState = useCallback(
    async (spaceId: string, silent = false) => {
      if (!supabase) return;
      if (!silent) setSyncStatus("loading");

      const [preferencesResult, memoriesResult, listResult, filesResult, notesResult] = await Promise.all([
        supabase.from("space_preferences").select("*").eq("space_id", spaceId).maybeSingle(),
        supabase.from("memories").select("*").eq("space_id", spaceId).order("created_at", { ascending: false }),
        supabase.from("list_items").select("*").eq("space_id", spaceId).order("position", { ascending: true }),
        supabase.from("reading_items").select("*").eq("space_id", spaceId).order("created_at", { ascending: false }),
        supabase.from("reading_notes").select("*").eq("space_id", spaceId).order("created_at", { ascending: false })
      ]);

      const firstError =
        preferencesResult.error ||
        memoriesResult.error ||
        listResult.error ||
        filesResult.error ||
        notesResult.error;

      if (firstError) {
        setSyncStatus("error");
        showToast("Run the Supabase schema, then refresh.");
        return;
      }

      setState((current) => {
        const preferences: any = preferencesResult.data || {};
        const remoteMemories = (memoriesResult.data || []).map(mapMemoryRow);
        const remoteListItems = (listResult.data || []).map((item: any) => item.title as string);
        const remoteFiles = (filesResult.data || []).map(mapReadingItemRow);
        const remoteNotes = (notesResult.data || []).map(mapReadingNoteRow);

        const next: AppState = {
          ...current,
          activeActivity: preferences.active_activity || current.activeActivity,
          mood: preferences.mood || current.mood,
          glimpseKind: preferences.glimpse_kind || current.glimpseKind,
          boundary: preferences.boundary || current.boundary,
          spicy: {
            mo: preferences.spicy_mo ?? current.spicy.mo,
            aysel: preferences.spicy_aysel ?? current.spicy.aysel
          },
          readingProgress: preferences.reading_progress ?? current.readingProgress,
          readerNight: preferences.reader_night ?? current.readerNight,
          glimpseCaption: preferences.glimpse_caption || current.glimpseCaption,
          memories: remoteMemories.length ? remoteMemories : current.memories,
          listItems: remoteListItems.length ? remoteListItems : current.listItems,
          files: remoteFiles.length ? remoteFiles : current.files,
          notes: remoteNotes.length ? remoteNotes : current.notes
        };

        writeLocalState(next);
        return next;
      });

      setSyncStatus("saved");
    },
    [showToast]
  );

  useEffect(() => {
    if (!activeSpace || activeSpace.role === "local") return;
    void loadRemoteState(activeSpace.id);
  }, [activeSpace, loadRemoteState]);

  useEffect(() => {
    if (!supabase || !activeSpace || activeSpace.role === "local") return;

    const client = supabase;
    const reload = () => void loadRemoteState(activeSpace.id, true);
    const channel = client
      .channel(`space:${activeSpace.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "memories", filter: `space_id=eq.${activeSpace.id}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "list_items", filter: `space_id=eq.${activeSpace.id}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "reading_items", filter: `space_id=eq.${activeSpace.id}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "reading_notes", filter: `space_id=eq.${activeSpace.id}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "space_preferences", filter: `space_id=eq.${activeSpace.id}` }, reload)
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [activeSpace, loadRemoteState]);

  const handleAuth = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!supabase) return;

      setBusy(true);
      const credentials = {
        email: authEmail.trim(),
        password: authPassword
      };

      const result =
        authMode === "signup"
          ? await supabase.auth.signUp({
              ...credentials,
              options: { data: { display_name: displayName.trim() || credentials.email.split("@")[0] } }
            })
          : await supabase.auth.signInWithPassword(credentials);

      setBusy(false);

      if (result.error) {
        showToast(result.error.message);
        return;
      }

      if (authMode === "signup" && !result.data.session) {
        showToast("Check your email to finish sign up.");
        return;
      }

      showToast(authMode === "signup" ? "Account created." : "Signed in.");
    },
    [authEmail, authMode, authPassword, displayName, showToast]
  );

  const createSpace = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!supabase || !session) return;

      setBusy(true);
      const inviteCode = generateInviteCode();
      const { data, error } = await supabase.rpc("create_couple_space", {
        space_name: spaceName.trim() || "Mo & Aysel",
        invite_code_input: inviteCode
      });
      setBusy(false);

      if (error) {
        showToast(error.message);
        return;
      }

      const created = mapRpcSpace(data);
      await refreshSpaces(created?.id);
      showToast("Couple space created.");
    },
    [refreshSpaces, session, showToast, spaceName]
  );

  const joinSpace = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!supabase || !session) return;

      const inviteCode = normalizeInviteCode(inviteDraft);
      if (!inviteCode) {
        showToast("Enter the invite code.");
        return;
      }

      setBusy(true);
      const { data, error } = await supabase.rpc("join_couple_space", { invite_code_input: inviteCode });
      setBusy(false);

      if (error) {
        showToast(error.message);
        return;
      }

      const joined = mapRpcSpace(data);
      await refreshSpaces(joined?.id);
      setInviteDraft("");
      showToast("Joined the couple space.");
    },
    [inviteDraft, refreshSpaces, session, showToast]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setActiveSpace(null);
    showToast("Signed out.");
  }, [showToast]);

  const addMemory = useCallback(
    async (title: string, body: string, isPrivate = false, kind = "memory") => {
      const fallbackMemory: MemoryItem = {
        id: `m${Date.now()}`,
        kind,
        title,
        body,
        private: isPrivate,
        createdAt: new Date().toISOString()
      };

      if (supabase && activeSpace && activeSpace.role !== "local") {
        setSyncStatus("saving");
        const { data, error } = await supabase
          .from("memories")
          .insert({
            space_id: activeSpace.id,
            created_by: session?.user.id,
            kind,
            title,
            body,
            is_private: isPrivate
          })
          .select("*")
          .single();

        if (error) {
          setSyncStatus("error");
          showToast("Memory did not sync.");
          return;
        }

        const remoteMemory = mapMemoryRow(data);
        updateLocalList((current) => ({ ...current, memories: [remoteMemory, ...current.memories] }));
        setSyncStatus("saved");
        return;
      }

      updateLocalList((current) => ({ ...current, memories: [fallbackMemory, ...current.memories] }));
    },
    [activeSpace, session?.user.id, showToast]
  );

  const deleteMemory = useCallback(
    async (memory: MemoryItem) => {
      updateLocalList((current) => ({ ...current, memories: current.memories.filter((item) => item.id !== memory.id) }));

      if (!supabase || !activeSpace || activeSpace.role === "local" || !memory.remoteId) return;

      setSyncStatus("saving");
      const { error } = await supabase.from("memories").delete().eq("id", memory.remoteId);
      setSyncStatus(error ? "error" : "saved");
      showToast(error ? "Memory did not delete online." : "Memory removed.");
    },
    [activeSpace, showToast]
  );

  const addListItem = useCallback(async () => {
    const item = state.listDraft.trim();
    if (!item) {
      showToast("Add an idea first.");
      return;
    }

    if (supabase && activeSpace && activeSpace.role !== "local") {
      setSyncStatus("saving");
      const { error } = await supabase.from("list_items").insert({
        space_id: activeSpace.id,
        created_by: session?.user.id,
        title: item,
        position: state.listItems.length
      });
      setSyncStatus(error ? "error" : "saved");
      if (error) {
        showToast("Idea did not sync.");
        return;
      }
    }

    updateState({ listItems: [item, ...state.listItems], listDraft: "" });
    showToast("Idea added.");
  }, [activeSpace, session?.user.id, showToast, state.listDraft, state.listItems, updateState]);

  const addNote = useCallback(
    async (locked: boolean) => {
      if (locked && !(state.spicy.mo && state.spicy.aysel)) {
        showToast("Locked notes need both toggles.");
        return;
      }

      const body = state.noteDraft.trim() || (locked ? "Locked note for the end of the chapter." : "This paragraph is so you.");
      const note: ReadingNote = { id: `n${Date.now()}`, page: "p.21", body, locked };

      if (supabase && activeSpace && activeSpace.role !== "local") {
        setSyncStatus("saving");
        const { data, error } = await supabase
          .from("reading_notes")
          .insert({
            space_id: activeSpace.id,
            created_by: session?.user.id,
            page: note.page,
            body,
            is_locked: locked
          })
          .select("*")
          .single();

        setSyncStatus(error ? "error" : "saved");
        if (error) {
          showToast("Note did not sync.");
          return;
        }

        note.remoteId = data.id;
        note.id = `remote-note-${data.id}`;
      }

      updateState({ notes: [note, ...state.notes], noteDraft: "" });
      await addMemory(locked ? "Locked reading note" : "Margin note", body, locked, locked ? "vault" : "reading");
      showToast(locked ? "Locked note added." : "Note added.");
    },
    [activeSpace, addMemory, session?.user.id, showToast, state.noteDraft, state.notes, state.spicy, updateState]
  );

  const uploadFiles = useCallback(
    async (files: FileList) => {
      const added: LibraryFile[] = [...files].map((file) => ({
        id: `f${Date.now()}-${file.name}`,
        type: file.name.toLowerCase().endsWith(".epub") ? "EPUB" : "PDF",
        title: file.name.replace(/\.(pdf|epub)$/i, ""),
        progress: 0,
        meta: "Uploaded locally, ready for notes"
      }));

      if (supabase && activeSpace && activeSpace.role !== "local") {
        setSyncStatus("saving");
        const rows = added.map((file) => ({
          space_id: activeSpace.id,
          created_by: session?.user.id,
          file_type: file.type,
          title: file.title,
          progress: 0,
          meta: file.meta
        }));
        const { error } = await supabase.from("reading_items").insert(rows);
        setSyncStatus(error ? "error" : "saved");
        if (error) {
          showToast("Reading item did not sync.");
          return;
        }
      }

      updateState({ files: [...added, ...state.files] });
      showToast("Book added to Library.");
    },
    [activeSpace, session?.user.id, showToast, state.files, updateState]
  );

  const saveAnswer = useCallback(
    async (isPrivate: boolean) => {
      const body = state.questionDraft.trim();
      if (!body) {
        showToast("Write something first.");
        return;
      }

      await addMemory(isPrivate ? "Private answer" : "Today's answer", body, isPrivate, isPrivate ? "vault" : "answer");
      updateState({
        modal: null,
        questionDraft: "",
        activeTab: "memories",
        memoriesView: isPrivate ? "vault" : "wall"
      });
      showToast(isPrivate ? "Saved in the vault." : "Answer saved.");
    },
    [addMemory, showToast, state.questionDraft, updateState]
  );

  const copyInvite = useCallback(async () => {
    if (!activeSpace?.inviteCode) return;

    try {
      await navigator.clipboard.writeText(activeSpace.inviteCode);
      showToast("Invite code copied.");
    } catch {
      showToast(activeSpace.inviteCode);
    }
  }, [activeSpace?.inviteCode, showToast]);

  const actions = useMemo<ViewActions>(
    () => ({
      updateState,
      addMemory,
      deleteMemory,
      addListItem,
      addNote,
      saveAnswer,
      uploadFiles,
      showToast,
      copyInvite
    }),
    [addListItem, addMemory, addNote, copyInvite, deleteMemory, saveAnswer, showToast, updateState, uploadFiles]
  );

  function updateLocalList(updater: (current: AppState) => AppState) {
    setState((current) => {
      const next = updater(current);
      saveLocalSnapshot(next);
      return next;
    });
  }

  const activeTab = tabs.find((tab) => tab.id === state.activeTab) || tabs[0];

  if (!authReady) {
    return <LoadingScreen />;
  }

  if (isSupabaseConfigured && !session) {
    return (
      <AuthScreen
        authMode={authMode}
        busy={busy}
        displayName={displayName}
        email={authEmail}
        password={authPassword}
        onAuthMode={setAuthMode}
        onDisplayName={setDisplayName}
        onEmail={setAuthEmail}
        onPassword={setAuthPassword}
        onSubmit={handleAuth}
      />
    );
  }

  if (isSupabaseConfigured && session && !activeSpace) {
    return (
      <SpaceScreen
        busy={busy}
        inviteDraft={inviteDraft}
        profile={profile}
        spaceName={spaceName}
        spaces={spaces}
        onCreate={createSpace}
        onInviteDraft={setInviteDraft}
        onJoin={joinSpace}
        onSelectSpace={setActiveSpace}
        onSignOut={signOut}
        onSpaceName={setSpaceName}
      />
    );
  }

  return (
    <main className="app-shell">
      <aside className="app-sidebar" aria-label="AfterLife navigation">
        <div className="brand">
          <span className="brand-mark">AF</span>
          <div>
            <strong>AfterLife</strong>
            <p>Private long-distance home</p>
          </div>
        </div>
        <nav className="app-nav" aria-label="Primary">
          {tabs.map((tab) => {
            const Icon = tabIcons[tab.id];
            return (
              <button
                className={`nav-button ${state.activeTab === tab.id ? "is-active" : ""}`}
                key={tab.id}
                type="button"
                title={tab.label}
                onClick={() => updateState({ activeTab: tab.id })}
              >
                <Icon aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <section className="sidebar-card">
          <span className="meta">Safety contract</span>
          <strong>No surveillance, no public feed.</strong>
          <p>Private features stay opt-in, hidden from widgets, and deletable by either person.</p>
        </section>
      </aside>

      <section className="app-main" aria-label="AfterLife app">
        <div className="app-topbar">
          <div>
            <span className="meta">{activeSpace?.name || "Current space"}</span>
            <strong>{activeTab.label}</strong>
          </div>
          <div className="topbar-actions">
            <SyncPill status={syncStatus} />
            {pwa.hasUpdate ? (
              <Button icon={RefreshCw} variant="secondary" small onClick={pwa.refreshApp}>
                Update
              </Button>
            ) : null}
            {pwa.canInstall && !pwa.isStandalone ? (
              <Button icon={Download} variant="secondary" small className="install-button" onClick={() => void pwa.installApp()}>
                Install
              </Button>
            ) : null}
            <span className="pill">{state.spicy.mo && state.spicy.aysel ? "Private mode ready" : "Private mode waiting"}</span>
            <Avatars />
            {isSupabaseConfigured ? (
              <button className="icon-button" type="button" title="Sign out" aria-label="Sign out" onClick={() => void signOut()}>
                <LogOut aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
        <div className="workspace-grid">
          <section className="primary-view" aria-label={`${activeTab.label} view`}>
            {state.activeTab === "home" ? <HomeView state={state} actions={actions} inviteCode={activeSpace?.inviteCode} /> : null}
            {state.activeTab === "together" ? <TogetherView state={state} actions={actions} inviteCode={activeSpace?.inviteCode} /> : null}
            {state.activeTab === "memories" ? <MemoriesView state={state} actions={actions} inviteCode={activeSpace?.inviteCode} /> : null}
            {state.activeTab === "library" ? <LibraryView state={state} actions={actions} inviteCode={activeSpace?.inviteCode} /> : null}
          </section>
          <aside className="context-panel" aria-label="Current context">
            <ContextPanel state={state} actions={actions} inviteCode={activeSpace?.inviteCode} />
          </aside>
        </div>
      </section>

      {state.toast ? (
        <div className="toast" role="status">
          {state.toast}
        </div>
      ) : null}
      {state.modal ? <AnswerModal state={state} actions={actions} /> : null}
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <LoaderCircle className="spin" aria-hidden="true" />
        <h1>AfterLife</h1>
      </section>
    </main>
  );
}

function AuthScreen({
  authMode,
  busy,
  displayName,
  email,
  password,
  onAuthMode,
  onDisplayName,
  onEmail,
  onPassword,
  onSubmit
}: {
  authMode: "signin" | "signup";
  busy: boolean;
  displayName: string;
  email: string;
  password: string;
  onAuthMode: (mode: "signin" | "signup") => void;
  onDisplayName: (value: string) => void;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand large-brand">
          <span className="brand-mark">AF</span>
          <div>
            <strong>AfterLife</strong>
            <p>Private long-distance home</p>
          </div>
        </div>
        <div className="auth-tabs">
          <ChipButton active={authMode === "signin"} onClick={() => onAuthMode("signin")}>
            Sign in
          </ChipButton>
          <ChipButton active={authMode === "signup"} onClick={() => onAuthMode("signup")}>
            Create account
          </ChipButton>
        </div>
        <form className="form-grid" onSubmit={onSubmit}>
          {authMode === "signup" ? (
            <Field label="Display name" value={displayName} onChange={(event) => onDisplayName(event.currentTarget.value)} />
          ) : null}
          <Field label="Email" type="email" value={email} autoComplete="email" required onChange={(event) => onEmail(event.currentTarget.value)} />
          <Field
            label="Password"
            type="password"
            value={password}
            autoComplete={authMode === "signup" ? "new-password" : "current-password"}
            minLength={6}
            required
            onChange={(event) => onPassword(event.currentTarget.value)}
          />
          <Button icon={KeyRound} disabled={busy} type="submit">
            {busy ? "Working" : authMode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>
      </section>
    </main>
  );
}

function SpaceScreen({
  busy,
  inviteDraft,
  profile,
  spaceName,
  spaces,
  onCreate,
  onInviteDraft,
  onJoin,
  onSelectSpace,
  onSignOut,
  onSpaceName
}: {
  busy: boolean;
  inviteDraft: string;
  profile: UserProfile | null;
  spaceName: string;
  spaces: CoupleSpace[];
  onCreate: (event: FormEvent) => void;
  onInviteDraft: (value: string) => void;
  onJoin: (event: FormEvent) => void;
  onSelectSpace: (space: CoupleSpace) => void;
  onSignOut: () => void;
  onSpaceName: (value: string) => void;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-card wide-auth-card">
        <div className="space-header">
          <div>
            <span className="meta">{profile?.email || "Signed in"}</span>
            <h1>Choose your space</h1>
          </div>
          <button className="icon-button" type="button" title="Sign out" aria-label="Sign out" onClick={onSignOut}>
            <LogOut aria-hidden="true" />
          </button>
        </div>

        {spaces.length ? (
          <div className="space-list">
            {spaces.map((space) => (
              <button className="space-row" key={space.id} type="button" onClick={() => onSelectSpace(space)}>
                <HeartHandshake aria-hidden="true" />
                <span>
                  <strong>{space.name}</strong>
                  <small>{space.inviteCode}</small>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="setup-grid">
          <form className="panel" onSubmit={onCreate}>
            <div className="panel-heading">
              <span className="meta">Create</span>
              <strong>Start a private space</strong>
            </div>
            <Field label="Space name" value={spaceName} onChange={(event) => onSpaceName(event.currentTarget.value)} />
            <Button icon={UserPlus} disabled={busy} type="submit">
              Create space
            </Button>
          </form>

          <form className="panel" onSubmit={onJoin}>
            <div className="panel-heading">
              <span className="meta">Join</span>
              <strong>Use an invite code</strong>
            </div>
            <Field label="Invite code" value={inviteDraft} onChange={(event) => onInviteDraft(event.currentTarget.value)} />
            <Button icon={Copy} variant="secondary" disabled={busy} type="submit">
              Join space
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

function AnswerModal({ state, actions }: { state: AppState; actions: ViewActions }) {
  const isPrivate = state.modal === "private-question";
  return (
    <div className="modal-backdrop" onClick={() => actions.updateState({ modal: null, questionDraft: "" })}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={isPrivate ? "Private answer" : "Soft answer"} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="meta">{isPrivate ? "Locked by default" : "Today's question"}</span>
            <h2>{isPrivate ? "Private answer" : "Soft answer"}</h2>
          </div>
          <button className="icon-button" type="button" title="Close" aria-label="Close" onClick={() => actions.updateState({ modal: null, questionDraft: "" })}>
            x
          </button>
        </div>
        <textarea
          value={state.questionDraft}
          maxLength={260}
          placeholder="Write it here"
          onChange={(event) => actions.updateState({ questionDraft: event.currentTarget.value })}
        />
        <div className="button-row">
          <Button icon={isPrivate ? Lock : StickyNote} variant={isPrivate ? "danger" : "primary"} onClick={() => actions.saveAnswer(isPrivate)}>
            Save answer
          </Button>
        </div>
      </section>
    </div>
  );
}

function SyncPill({ status }: { status: SyncStatus }) {
  const label = {
    checking: "Checking",
    local: "This device",
    offline: "Offline",
    loading: "Loading",
    saving: "Saving",
    saved: "Shared online",
    online: "Shared online",
    error: "Needs setup"
  }[status];

  const Icon = status === "local" || status === "offline" || status === "error" ? WifiOff : status === "saving" || status === "loading" || status === "checking" ? LoaderCircle : status === "saved" || status === "online" ? Check : Cloud;

  return (
    <span className={`sync-pill sync-${status}`}>
      <Icon className={status === "saving" || status === "loading" || status === "checking" ? "spin" : ""} aria-hidden="true" />
      {label}
    </span>
  );
}

function ChipButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button className={`chip ${active ? "is-active" : ""}`} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function mapMemoryRow(row: any): MemoryItem {
  return {
    id: `remote-memory-${row.id}`,
    remoteId: row.id,
    kind: row.kind || "memory",
    title: row.title || "Memory",
    body: row.body || "",
    private: Boolean(row.is_private),
    createdAt: row.created_at
  };
}

function mapReadingItemRow(row: any): LibraryFile {
  return {
    id: `remote-file-${row.id}`,
    remoteId: row.id,
    type: row.file_type === "EPUB" ? "EPUB" : "PDF",
    title: row.title || "Reading item",
    progress: Number(row.progress || 0),
    meta: row.meta || "Shared reading item"
  };
}

function mapReadingNoteRow(row: any): ReadingNote {
  return {
    id: `remote-note-${row.id}`,
    remoteId: row.id,
    page: row.page || "p.21",
    body: row.body || "",
    locked: Boolean(row.is_locked)
  };
}

function mapRpcSpace(data: any): { id: string } | null {
  const row = Array.isArray(data) ? data[0] : data;
  return row?.id ? { id: row.id } : null;
}

export default App;
