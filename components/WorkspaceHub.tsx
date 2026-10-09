"use client";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  ArrowUpRight,
  Check,
  CloudOff,
  Download,
  FileText,
  FolderOpen,
  LayoutTemplate,
  LoaderCircle,
  Palette,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  X,
  ScanText,
  ChevronRight,
} from "lucide-react";
import {
  CV,
  Profile,
  Template,
  Font,
  createCV,
  download,
  fonts,
  templates,
  uid,
  validateCV,
  filledEntry,
  readableText,
} from "@/lib/model";
import {
  ImportRecord,
  buildFromImport,
  extractImport,
  parseCVText,
  profileKeys,
  profileLabels,
  IMPORT_LIMIT,
} from "@/lib/import-cv";
import {
  Workspace,
  workspaceColors,
  readWorkspaceBackup,
  defaultWorkspace,
} from "@/lib/workspace";
import ImportSelector from "./ImportSelector";
import { importReviewNotes } from "@/lib/structured-import";
type Props = {
  panel: string;
  workspace: Workspace;
  setWorkspace: Dispatch<SetStateAction<Workspace>>;
  docs: CV[];
  cv: CV;
  onNew: () => void;
  onOpen: (id: string) => void;
  onNavigate: (id: string) => void;
  onApply: (cv: CV) => void;
  onRestore: (docs: CV[]) => void;
  notify: (s: string) => void;
  storageError: string;
};
export default function WorkspaceHub(p: Props) {
  const { workspace: w, setWorkspace: setW } = p;
  const [search, setSearch] = useState(""),
    [text, setText] = useState(""),
    [mode, setMode] = useState("file"),
    [review, setReview] = useState<ImportRecord | null>(null),
    [selected, setSelected] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
    [error, setError] = useState(""),
    [deleteId, setDeleteId] = useState(""),
    [confirmApply, setConfirmApply] = useState(false),
    [clearAll, setClearAll] = useState(false),
    [aiCode, setAICode] = useState("");
  const fileRef = useRef<HTMLInputElement>(null),
    abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const updateProfile = (key: keyof Profile, value: string) =>
    setW((prev) => ({ ...prev, profile: { ...prev.profile, [key]: value } }));
  const setting = (key: keyof Workspace["settings"], value: unknown) =>
    setW((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));
  const openReview = (item: ImportRecord) => {
    setReview(structuredClone(item));
    setSelected([
      "profile",
      "summary",
      ...item.cv.sections
        .filter((s) => !s.title.startsWith("Unassigned information"))
        .map((s) => s.id),
    ]);
    setConfirmApply(false);
    setError("");
  };
  const read = async (file?: File) => {
    if (busy) return;
    setError("");
    setBusy(true);
    abort.current = new AbortController();
    try {
      let result;
      if (file)
        result = await extractImport(
          file,
          w.settings.ocr,
          setProgress,
          abort.current.signal,
        );
      else {
        setProgress("Organizing your text…");
        result = { source: text, cv: parseCVText(text), type: "TEXT" };
      }
      if (abort.current.signal.aborted) return;
      openReview({
        id: uid(),
        name: (file?.name.replace(/\.[^.]+$/, "") || "Pasted CV").slice(0, 120),
        createdAt: new Date().toISOString(),
        sourceType: result.type,
        source: result.source,
        cv: result.cv,
      });
    } catch (e) {
      if (!abort.current.signal.aborted)
        setError(
          e instanceof Error ? e.message : "Import failed. Please retry.",
        );
    } finally {
      setBusy(false);
      setProgress("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const save = () => {
    if (!review) return;
    try {
      const item = {
        ...review,
        name: review.name.trim() || "Imported CV",
        cv: validateCV(review.cv),
      };
      if (!w.imports.some((i) => i.id === item.id) && w.imports.length >= 20)
        throw new Error(
          "Keep up to 20 saved imports. Remove an older import first.",
        );
      setW((prev) => ({
        ...prev,
        imports: [item, ...prev.imports.filter((i) => i.id !== item.id)],
      }));
      p.notify("Imported information saved. Your current CV has not changed.");
      setReview(null);
      setConfirmApply(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save import.");
    }
  };
  const editCV = (cv: CV) => setReview((r) => (r ? { ...r, cv } : r));
  const reviseEntry = (si: number, ei: number, key: string, value: string) => {
    if (review)
      editCV({
        ...review.cv,
        sections: review.cv.sections.map((s, i) =>
          i === si
            ? {
                ...s,
                entries: s.entries.map((e, j) =>
                  j === ei ? { ...e, [key]: value } : e,
                ),
              }
            : s,
        ),
      });
  };
  const workspaceBackup = () =>
    download(
      new Blob(
        [
          JSON.stringify(
            {
              format: "cv-banao-workspace",
              version: 1,
              workspace: w,
              docs: p.docs,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      "cv-banao-workspace.json",
    );
  const restore = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 15 * 1024 * 1024)
        throw new Error("Workspace backups must be under 15 MB.");
      const backup = readWorkspaceBackup(await file.text());
      setW(backup.workspace);
      p.onRestore(backup.docs);
      p.notify("Workspace restored, including profile, imports and drafts.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restore failed.");
    }
  };
  const heading = (title: string, description: string, Icon = FolderOpen) => (
    <div className="hub-heading">
      <div className="hub-eyebrow">
        <Icon size={16} /> YOUR NEXT CHAPTER
      </div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
  const blank = (
    <div className="hub-empty">
      <FolderOpen size={32} />
      <h3>Room for your next opportunity.</h3>
      <p>Your saved information will appear here.</p>
    </div>
  );
  return (
    <div className="workspace-hub">
      {(error || p.storageError) && (
        <div className="hub-alert" role="alert">
          {error || p.storageError}
          {error && (
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={16} />
            </button>
          )}
        </div>
      )}
      {p.panel === "home" && (
        <>
          <div className="dashboard-hero">
            <div>
              <span className="hub-eyebrow">MADE FOR YOUR NEXT MOVE</span>
              <h1>
                Your experience.
                <br />A stronger first impression.
              </h1>
              <p>
                Build a CV that feels like you. Bring your existing information,
                choose a format, and make every detail count.
              </p>
              <button className="button primary" onClick={p.onNew}>
                <Plus size={17} /> Create a new CV <ArrowUpRight size={16} />
              </button>
              <button
                className="button outline"
                onClick={() => p.onNavigate("imports")}
              >
                <Upload size={16} /> Import an existing CV
              </button>
            </div>
            <div className="hero-document" aria-hidden="true">
              <div className="hero-document-icon">
                <FileText size={26} />
              </div>
              <b>{w.profile.name || "Your next chapter"}</b>
              <span>CURRICULUM VITAE</span>
              <i />
              <strong>EXPERIENCE & POTENTIAL</strong>
              <i />
              <i />
              <i />
              <strong>EDUCATION & DISCOVERY</strong>
              <i />
              <i />
              <div className="hero-stamp">
                <Check size={16} /> Made by you
              </div>
            </div>
          </div>
          <div className="hub-stats">
            {[
              [String(p.docs.length), "CV drafts", FileText],
              [String(w.imports.length), "Saved imports", FolderOpen],
              ["20", "Purposeful templates", LayoutTemplate],
              ["10", "Professional fonts", Palette],
            ].map(([count, label, Icon]) => {
              const I = Icon as typeof FileText;
              return (
                <div key={String(label)}>
                  <I size={20} />
                  <strong>{String(count)}</strong>
                  <span>{String(label)}</span>
                </div>
              );
            })}
          </div>
          <div className="hub-section-title">
            <div>
              <h2>Your CV workspace</h2>
              <p>
                Continue editing, or create a version for a new opportunity.
              </p>
            </div>
            <label className="hub-search">
              <Search size={16} />
              <input
                aria-label="Search CV drafts"
                placeholder="Find a draft…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          <div className="draft-grid">
            {p.docs
              .filter((d) =>
                [d.label, d.profile.name]
                  .join(" ")
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((d) => (
                <button
                  className="draft-card"
                  key={d.id}
                  onClick={() => p.onOpen(d.id)}
                >
                  <div className="draft-card-top">
                    <span style={{ background: d.design.accent }}>
                      <FileText size={21} />
                    </span>
                    <span className="draft-type">
                      {templates.find((t) => t.id === d.template)?.category}
                    </span>
                  </div>
                  <h3>{d.label}</h3>
                  <p>{d.profile.name || "Add your details"}</p>
                  <div>
                    <small>
                      Updated {new Date(d.updatedAt).toLocaleDateString()}
                    </small>
                    <span>
                      Edit CV <ArrowUpRight size={14} />
                    </span>
                  </div>
                </button>
              ))}
            <button className="draft-card create-card" onClick={p.onNew}>
              <Plus size={27} />
              <h3>A new opportunity</h3>
              <p>Start your next CV</p>
            </button>
          </div>
          <div className="hub-bottom-note">
            <ShieldCheck size={19} />
            <div>
              <strong>Your work, on your device.</strong>
              <p>
                No account needed. Download a workspace backup to carry your
                profile, saved imports and drafts with you.
              </p>
            </div>
            <button className="button outline" onClick={workspaceBackup}>
              <Download size={15} /> Back up
            </button>
          </div>
        </>
      )}
      {p.panel === "imports" && (
        <>
          {heading(
            "Bring your story with you.",
            "Import once. Review the details. Reuse only what you need.",
            Upload,
          )}
          {!review ? (
            <>
              <div className="hub-card import-start">
                <div
                  className="hub-tabs"
                  role="group"
                  aria-label="Import input"
                >
                  {[
                    ["file", "Upload a file", Upload],
                    ["text", "Paste CV text", FileText],
                  ].map(([id, label, Icon]) => {
                    const I = Icon as typeof FileText;
                    return (
                      <button
                        key={String(id)}
                        aria-pressed={mode === id}
                        className={mode === id ? "active" : ""}
                        onClick={() => setMode(String(id))}
                        disabled={busy}
                      >
                        <I size={16} />
                        {String(label)}
                      </button>
                    );
                  })}
                </div>
                {mode === "file" ? (
                  <label
                    className={`cv-dropzone ${busy ? "busy" : ""}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!busy) void read(e.dataTransfer.files[0]);
                    }}
                  >
                    <Upload size={31} />
                    <strong>Drop your current CV here</strong>
                    <span>or click to choose a file</span>
                    <small>PDF, DOCX, TXT or JSON · up to 10 MB</small>
                    <input
                      ref={fileRef}
                      aria-label="Upload current CV"
                      type="file"
                      disabled={busy}
                      accept=".pdf,.docx,.txt,.json"
                      onChange={(e) => void read(e.target.files?.[0])}
                    />
                  </label>
                ) : (
                  <>
                    <label className="hub-field">
                      <span>Your current CV text</span>
                      <textarea
                        rows={10}
                        maxLength={IMPORT_LIMIT}
                        value={text}
                        disabled={busy}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={
                          "Paste your CV here, including section headings such as Education, Experience and Skills."
                        }
                      />
                    </label>
                    <div className="text-import-footer">
                      <small>
                        {text.length.toLocaleString()} / 120,000 characters
                      </small>
                      <button
                        className="button primary"
                        disabled={busy || !text.trim()}
                        onClick={() => void read()}
                      >
                        <ScanText size={16} /> Review imported information
                      </button>
                    </div>
                  </>
                )}
                <label className="hub-check">
                  <input
                    type="checkbox"
                    checked={w.settings.ocr}
                    disabled={busy}
                    onChange={(e) => setting("ocr", e.target.checked)}
                  />
                  <span>
                    Read scanned PDFs with English OCR{" "}
                    <small>
                      Processed on your device. Up to 12 scanned pages; 60
                      searchable pages.
                    </small>
                  </span>
                </label>
                {busy && (
                  <div className="import-progress" role="status">
                    <LoaderCircle size={19} className="spin" />
                    <span>{progress || "Preparing import…"}</span>
                    <button
                      className="button subtle"
                      onClick={() => {
                        abort.current?.abort();
                        setProgress("Cancelling…");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <p className="hub-note">
                  <ShieldCheck size={15} /> Imports are saved separately. Your
                  current CV stays as it is until you choose to apply
                  information.
                </p>
              </div>
              <div className="hub-section-title">
                <div>
                  <h2>
                    Your information library <span>{w.imports.length}</span>
                  </h2>
                  <p>Keep academic and industry information separately.</p>
                </div>
              </div>
              {w.imports.length ? (
                <div className="import-list">
                  {w.imports.map((item) => (
                    <div className="hub-card import-item" key={item.id}>
                      <span className="import-file-icon">
                        <FileText size={23} />
                        <small>{item.sourceType}</small>
                      </span>
                      <div>
                        <h3>{item.name}</h3>
                        <p>
                          {item.cv.profile.name || "Imported information"} ·{" "}
                          {item.cv.sections.length} sections
                        </p>
                        <small>
                          Saved {new Date(item.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      <button
                        className="button outline"
                        onClick={() => openReview(item)}
                      >
                        Review & use <ChevronRight size={14} />
                      </button>
                      <button
                        className="icon-button danger"
                        aria-label={`Delete import ${item.name}`}
                        onClick={() => setDeleteId(item.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                      {deleteId === item.id && (
                        <div className="inline-confirm">
                          <p>
                            Remove this saved import? Existing CVs will stay
                            unchanged.
                          </p>
                          <button
                            className="button subtle"
                            onClick={() => setDeleteId("")}
                          >
                            Cancel
                          </button>
                          <button
                            className="button destructive"
                            onClick={() => {
                              setW((prev) => ({
                                ...prev,
                                imports: prev.imports.filter(
                                  (i) => i.id !== item.id,
                                ),
                              }));
                              setDeleteId("");
                            }}
                          >
                            Remove import
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                blank
              )}
            </>
          ) : (
            <>
              <div className="review-toolbar">
                <span>
                  <Check size={16} /> Ready for your review
                </span>
                <button
                  className="button subtle"
                  onClick={() => {
                    setReview(null);
                    setConfirmApply(false);
                  }}
                >
                  <X size={16} /> Close review
                </button>
              </div>
              <div className="hub-card">
                <h2>Check the details first</h2>
                <p className="hub-description">
                  Titles, organizations, locations, dates and descriptions are
                  detected separately. Review the entries before saving or
                  applying.
                </p>
                {[...(review.notes ?? []), ...importReviewNotes(review.cv)].map(
                  (note, i) => (
                    <p className="hub-description" key={i}>
                      {note}
                    </p>
                  ),
                )}
                <label className="hub-field">
                  <span>Workspace access code for optional AI detection</span>
                  <input
                    type="password"
                    autoComplete="off"
                    value={aiCode}
                    onChange={(e) => setAICode(e.target.value)}
                  />
                </label>
                <button
                  className="button subtle"
                  disabled={busy || !aiCode}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        "Allow your CV text to be sent to your configured AI service for advanced field detection? Review the result before applying.",
                      )
                    )
                      return;
                    setBusy(true);
                    setError("");
                    try {
                      const response = await fetch("/api/import-structure", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "x-cv-access-code": aiCode,
                        },
                        body: JSON.stringify({ source: review.source }),
                      });
                      const result = await response.json();
                      if (!response.ok)
                        throw new Error(result.error || "Detection failed.");
                      openReview({
                        ...review,
                        cv: validateCV(result.cv),
                        notes: result.notes,
                      });
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Advanced AI field detection
                </button>
                <label className="hub-field">
                  <span>Saved import name</span>
                  <input
                    maxLength={120}
                    value={review.name}
                    onChange={(e) =>
                      setReview({ ...review, name: e.target.value })
                    }
                  />
                </label>
                <div className="hub-field-grid">
                  {profileKeys.map((k) => (
                    <label className="hub-field" key={k}>
                      <span>{profileLabels[k]}</span>
                      <input
                        maxLength={2000}
                        value={readableText(review.cv.profile[k] ?? "")}
                        onChange={(e) =>
                          editCV({
                            ...review.cv,
                            profile: {
                              ...review.cv.profile,
                              [k]: e.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
                <label className="hub-field">
                  <span>Imported summary</span>
                  <textarea
                    maxLength={20000}
                    rows={4}
                    value={readableText(review.cv.summary)}
                    onChange={(e) =>
                      editCV({ ...review.cv, summary: e.target.value })
                    }
                  />
                </label>
              </div>
              {review.cv.sections.map((s, si) => (
                <details
                  className="hub-card import-review-section"
                  key={s.id}
                  open={si === 0}
                >
                  <summary>
                    {s.title}
                    <span>
                      {s.entries.length}{" "}
                      {s.entries.length === 1 ? "entry" : "entries"}
                    </span>
                  </summary>
                  <label className="hub-field">
                    <span>Section title</span>
                    <input
                      maxLength={120}
                      value={readableText(s.title)}
                      onChange={(e) =>
                        editCV({
                          ...review.cv,
                          sections: review.cv.sections.map((x, i) =>
                            i === si ? { ...x, title: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  {s.entries.map((entry, ei) => (
                    <div className="review-entry" key={entry.id}>
                      <div className="review-entry-top">
                        <b>Entry {ei + 1}</b>
                        <button
                          className="icon-button danger"
                          aria-label={`Remove imported entry ${si + 1}-${ei + 1}`}
                          onClick={() =>
                            editCV({
                              ...review.cv,
                              sections: review.cv.sections.map((x, i) =>
                                i === si
                                  ? {
                                      ...x,
                                      entries: x.entries.filter(
                                        (e) => e.id !== entry.id,
                                      ),
                                    }
                                  : x,
                              ),
                            })
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="hub-field-grid">
                        {[
                          ["title", "Title / qualification / role"],
                          ["subtitle", "Organization / institution / authors"],
                          ["date", "Dates"],
                          ["location", "Location"],
                          ["url", "Link URL"],
                          ["urlLabel", "Link display name"],
                        ].map(([key, label]) => (
                          <label className="hub-field" key={key}>
                            <span>{label}</span>
                            <input
                              maxLength={2000}
                              value={readableText(
                                entry[
                                  key as
                                    | "title"
                                    | "subtitle"
                                    | "date"
                                    | "location"
                                    | "url"
                                ] ?? ""
                              )}
                              onChange={(e) =>
                                reviseEntry(si, ei, key, e.target.value)
                              }
                            />
                          </label>
                        ))}
                      </div>
                      <label className="hub-field">
                        <span>Source text / details</span>
                        <textarea
                          rows={6}
                          maxLength={20000}
                          value={readableText(entry.description)}
                          onChange={(e) =>
                            reviseEntry(si, ei, "description", e.target.value)
                          }
                        />
                      </label>
                    </div>
                  ))}
                  <button
                    className="button outline"
                    onClick={() => {
                      const fresh = createCV().sections[0].entries[0];
                      editCV({
                        ...review.cv,
                        sections: review.cv.sections.map((x, i) =>
                          i === si
                            ? { ...x, entries: [...x.entries, fresh] }
                            : x,
                        ),
                      });
                    }}
                    disabled={s.entries.length >= 100}
                  >
                    <Plus size={15} /> Add entry
                  </button>
                </details>
              ))}
              <details className="hub-card source-details">
                <summary>
                  <FileText size={16} /> Original source · {review.sourceType}
                </summary>
                <p>
                  Compare the reviewed fields with the original text. PDF
                  sources retain page markers.
                </p>
                <pre>{review.source}</pre>
              </details>
              <div className="hub-card">
                <ImportSelector
                  cv={review.cv}
                  selected={selected}
                  onChange={setSelected}
                />
                <div className="review-actions">
                  <button className="button primary" onClick={save}>
                    <FolderOpen size={16} /> Save information only
                  </button>
                  <button
                    className="button outline"
                    disabled={!selected.length}
                    onClick={() => setConfirmApply(true)}
                  >
                    Update current CV <ArrowUpRight size={15} />
                  </button>
                </div>
                {confirmApply && (
                  <div className="inline-confirm">
                    <p>
                      Apply selected information to{" "}
                      <strong>{p.cv.label}</strong>? Selected contact/summary
                      fields and matching sections will be replaced. You can
                      undo this update in the editor.
                    </p>
                    <button
                      className="button subtle"
                      onClick={() => setConfirmApply(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="button primary"
                      onClick={() => {
                        try {
                          if (
                            !w.imports.some((i) => i.id === review.id) &&
                            w.imports.length >= 20
                          )
                            throw new Error(
                              "Remove an older saved import first.",
                            );
                          const updated = buildFromImport(
                            p.cv,
                            review.cv,
                            selected,
                          );
                          const saved = {
                            ...review,
                            name: review.name.trim() || "Imported CV",
                            cv: validateCV(review.cv),
                          };
                          setW((prev) => ({
                            ...prev,
                            imports: [
                              saved,
                              ...prev.imports.filter((i) => i.id !== saved.id),
                            ],
                          }));
                          p.onApply(updated);
                          p.notify(
                            "Selected imported information applied. You can edit every field.",
                          );
                          setConfirmApply(false);
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : "Could not apply import.",
                          );
                        }
                      }}
                    >
                      Apply selected information
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
      {p.panel === "account" && (
        <>
          {heading(
            "A profile you can reuse.",
            "Your personal details, ready for your next CV.",
            UserRound,
          )}
          <div className="hub-card profile-card">
            <div className="profile-avatar">
              {w.profile.name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase() || <UserRound size={30} />}
            </div>
            <h2>{w.profile.name || "Your profile"}</h2>
            <p>
              Saved separately from each CV. Changes here will not overwrite
              existing drafts.
            </p>
            <div className="hub-field-grid">
              {profileKeys.map((k) => (
                <label className="hub-field" key={k}>
                  <span>{profileLabels[k]}</span>
                  <input
                    maxLength={2000}
                    value={readableText(w.profile[k] ?? "")}
                    placeholder={k === "name" ? "Your full name" : ""}
                    onChange={(e) => updateProfile(k, e.target.value)}
                  />
                </label>
              ))}
            </div>
            <div className="review-actions">
              <button
                className="button outline"
                onClick={() => {
                  setW((prev) => ({
                    ...prev,
                    profile: structuredClone(p.cv.profile),
                  }));
                  p.notify(
                    "Current CV details copied to your reusable profile.",
                  );
                }}
              >
                <RotateCcw size={16} /> Copy from current CV
              </button>
              <button className="button primary" onClick={p.onNew}>
                <Plus size={16} /> Create a CV
              </button>
            </div>
            <p className="hub-note">
              <Check size={15} /> Profile saves automatically on this device.
            </p>
          </div>
        </>
      )}
      {p.panel === "settings" && (
        <>
          {heading(
            "Your workspace. Your way.",
            "Choose your appearance, defaults and data preferences.",
            Settings2,
          )}
          <div className="hub-card">
            <div className="hub-card-title">
              <Palette size={20} />
              <div>
                <h2>Workspace palette</h2>
                <p>
                  Pairs with Light, Dark or System mode in the top bar. CV
                  document colors stay independent.
                </p>
              </div>
            </div>
            <div className="workspace-palettes">
              {workspaceColors.map((c) => (
                <button
                  key={c.id}
                  aria-pressed={w.settings.color === c.id}
                  className={w.settings.color === c.id ? "selected" : ""}
                  onClick={() => setting("color", c.id)}
                >
                  <span style={{ background: c.color }}>
                    {w.settings.color === c.id && <Check size={17} />}
                  </span>
                  <strong>{c.name}</strong>
                </button>
              ))}
            </div>
          </div>
          <div className="hub-card">
            <h2>New CV defaults</h2>
            <div className="hub-field-grid">
              <label className="hub-field">
                <span>Default template</span>
                <select
                  value={w.settings.defaultTemplate}
                  onChange={(e) =>
                    setting("defaultTemplate", e.target.value as Template)
                  }
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {t.category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="hub-field">
                <span>Default CV font</span>
                <select
                  value={w.settings.defaultFont}
                  onChange={(e) =>
                    setting("defaultFont", e.target.value as Font)
                  }
                >
                  {fonts.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="hub-check">
              <input
                type="checkbox"
                checked={w.settings.autoProfile}
                onChange={(e) => setting("autoProfile", e.target.checked)}
              />
              <span>
                Use my profile by default for new CVs
                <small>
                  You can choose Blank or Imported information in the creation
                  flow.
                </small>
              </span>
            </label>
            <label className="hub-check">
              <input
                type="checkbox"
                checked={w.settings.ocr}
                onChange={(e) => setting("ocr", e.target.checked)}
              />
              <span>Enable English OCR for scanned CVs</span>
            </label>
          </div>
          <div className="hub-card">
            <div className="hub-card-title">
              <ShieldCheck size={20} />
              <div>
                <h2>Backups & data</h2>
                <p>
                  Profile, imports and drafts are saved in this browser.
                  Download a backup to move between devices.
                </p>
              </div>
            </div>
            <div className="review-actions">
              <button className="button primary" onClick={workspaceBackup}>
                <Download size={16} /> Export workspace backup
              </button>
              <label className="button outline backup-label">
                <Upload size={16} /> Restore workspace backup
                <input
                  aria-label="Restore workspace backup"
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    void restore(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <p className="hub-description">
              Restoring replaces your current workspace with the selected
              backup.
            </p>
            <p className="hub-note">
              <CloudOff size={16} /> Device-local workspace · no cloud sync or
              account required.
            </p>
            <details className="data-danger">
              <summary>Reset workspace data</summary>
              <p>
                This removes profile, saved imports and drafts on this device.
                Download a backup first.
              </p>
              {!clearAll ? (
                <button
                  className="button destructive"
                  onClick={() => setClearAll(true)}
                >
                  Reset my workspace
                </button>
              ) : (
                <div className="inline-confirm">
                  <p>
                    Delete all locally saved profile, import and draft
                    information?
                  </p>
                  <button
                    className="button subtle"
                    onClick={() => setClearAll(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="button destructive"
                    onClick={() => {
                      setW(defaultWorkspace());
                      p.onRestore([createCV()]);
                      setClearAll(false);
                      p.notify("Workspace reset. A blank CV is ready.");
                    }}
                  >
                    Delete data & reset
                  </button>
                </div>
              )}
            </details>
          </div>
        </>
      )}
    </div>
  );
}
