"use client";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useId,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type CSSProperties,
} from "react";
import {
  Home,
  Settings2,
  FlaskConical,
  Microscope,
  Trophy,
  Users,
  Code2,
  Languages,
  BadgeCheck,
  Presentation,
  Heart,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  GraduationCap,
  GripVertical,
  HelpCircle,
  LayoutTemplate,
  LoaderCircle,
  Menu,
  MoreHorizontal,
  Palette,
  Plus,
  Redo2,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  purposeOf,
  layoutOf,
  CV,
  Entry,
  Section,
  Template,
  Kind,
  Profile,
  Font,
  createCV,
  createSection,
  emptyEntry,
  templates,
  fonts,
  colors,
  uid,
  filledEntry,
  readableText,
  download,
  filename,
  validateCV,
  checks,
  plainText,
} from "@/lib/model";
import WorkspaceHub from "./WorkspaceHub";
import ImportSelector from "./ImportSelector";
import { useWorkspace } from "@/lib/workspace";
import { buildFromImport } from "@/lib/import-cv";
import ExactPDFPreview from "./ExactPDFPreview";
import RichEditor from "./RichEditor";
import {latexToVisual} from "@/lib/latex";
import AlignmentControl from "./AlignmentControl";
import BrandMark from "./BrandMark";
import ThemeControl from "./ThemeControl";
import ResearchPanel from "./ResearchPanel";
import LatexStudio, { EditorialUploader } from "./LatexStudio";
import LayoutEditor from "./LayoutEditor";
import { compileCV, pdfBlob } from "@/lib/fonts";
const KEY = "cv-studio.documents.v1";
const iconFor = (kind: Kind, title = "") => {
  const name = title.toLowerCase();
  if (/research|method/.test(name)) return FlaskConical;
  if (/award|honor|scholarship/.test(name)) return Trophy;
  if (/reference/.test(name)) return Users;
  if (/project/.test(name)) return Code2;
  if (/language/.test(name)) return Languages;
  if (/certification/.test(name)) return BadgeCheck;
  if (/teaching|presentation|conference/.test(name)) return Presentation;
  if (/volunteer/.test(name)) return Heart;
  return kind === "education"
    ? GraduationCap
    : kind === "publications"
      ? BookOpen
      : kind === "skills"
        ? Sparkles
        : kind === "experience"
          ? BriefcaseBusiness
          : FileText;
};
type ModalName = "drafts" | "new" | "section" | "export" | "help" | null;
function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const dialogTitle = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={dialogTitle}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header>
        <div>
          <h2 id={dialogTitle}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  const child =
    isValidElement(children) &&
    ["input", "textarea", "select"].includes(String(children.type))
      ? cloneElement(children as ReactElement, {
          "aria-labelledby": id,
          "aria-describedby": hint ? id + "-hint" : undefined,
        })
      : children;
  return (
    <label className="field">
      <span id={id}>{label}</span>
      {child}
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </label>
  );
}
function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <Field label={label}>
      <input
        type={type}
        value={value}
        maxLength={2000}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}
function TemplateCard({
  id,
  selected,
  onClick,
}: {
  id: Template;
  selected?: boolean;
  onClick: () => void;
}) {
  const t = templates.find((t) => t.id === id)!;
  const CategoryIcon =
    purposeOf(id) === "academic"
      ? GraduationCap
      : purposeOf(id) === "research"
        ? Microscope
        : purposeOf(id) === "phd"
          ? BookOpen
          : BriefcaseBusiness;
  return (
    <button
      className={`template-card ${selected ? "selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <div
        className={`template-thumbnail thumb-${purposeOf(id)} thumb-layout-${layoutOf(id)}`}
        style={{ "--thumb-accent": t.color } as CSSProperties}
      >
        <div className="thumb-sheet">
          <strong
            style={{ fontFamily: fonts.find((f) => f.id === t.font)!.family }}
          >
            Alex Morgan
          </strong>
          <span className="thumb-tagline">
            {t.category === "Industry"
              ? "PRODUCT & STRATEGY"
              : "RESEARCH · DISCOVERY · IMPACT"}
          </span>
          <i className="thumb-contact" />
          {[0, 1, 2].map((i) => (
            <div className="thumb-section" key={i}>
              <b />
              {[0, 1, 2].map((j) => (
                <i key={j} />
              ))}
            </div>
          ))}
        </div>
        {selected && (
          <span className="template-check">
            <Check size={14} />
          </span>
        )}
      </div>
      <div className="template-card-label">
        <strong>{t.name}</strong>
        <span>
          <CategoryIcon size={12} />
          {t.category}
        </span>
      </div>
    </button>
  );
}
export default function Studio() {
  const {
    workspace,
    setWorkspace,
    loaded: workspaceLoaded,
    error: workspaceError,
  } = useWorkspace();
  const [newSource, setNewSource] = useState("blank"),
    [newImport, setNewImport] = useState(""),
    [newSelected, setNewSelected] = useState<string[]>([]),
    [newStep, setNewStep] = useState(1),
    [templateFilter, setTemplateFilter] = useState("All"),
    [templateQuery, setTemplateQuery] = useState("");
  const selectedImport = workspace.imports.find((i) => i.id === newImport);
  const startNew = () => {
    setNewType(workspace.settings.defaultTemplate);
    setNewSource(workspace.settings.autoProfile ? "profile" : "blank");
    setNewImport("");
    setNewSelected([]);
    setNewStep(1);
    setModal("new");
  };
  const [docs, setDocs] = useState<CV[]>([]),
    [active, setActive] = useState(""),
    [ready, setReady] = useState(false),
    [panel, setPanel] = useState("home"),
    [modal, setModal] = useState<ModalName>(null),
    [mobile, setMobile] = useState("edit"),
    [navOpen, setNavOpen] = useState(false),
    [status, setStatus] = useState("Saved on this device"),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [pdfURL, setPdfURL] = useState(""),
    [newType, setNewType] = useState<Template>("phd"),
    [sectionName, setSectionName] = useState(""),
    [sectionKind, setSectionKind] = useState<Kind>("experience"),
    [confirm, setConfirm] = useState<{
      title: string;
      detail: string;
      action: () => void;
    } | null>(null);
  const history = useRef<CV[]>([]),
    future = useRef<CV[]>([]),
    [historyVersion, setHistoryVersion] = useState(0),
    fileInput = useRef<HTMLInputElement>(null),
    saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const cv = docs.find((d) => d.id === active) || docs[0];
  useEffect(() => {
    let initial: CV[] = [];
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length > 50)
          throw new Error("Invalid saved data");
        initial = parsed.map(validateCV);
      }
    } catch {
      setToast("Saved drafts could not be read. Export backups regularly.");
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) localStorage.setItem(KEY + ".recovery", raw);
      } catch {}
    }
    if (!initial.length) {
      const first = createCV();
      first.profile.name = "Nahin Intesher";
      first.label = "My first CV";
      initial = [first];
    }
    setDocs(initial);
    setActive(initial[0].id);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    setStatus("Saving…");
    clearTimeout(saveTimer.current);
    const save = () => {
      try {
        localStorage.setItem(KEY, JSON.stringify(docs));
        setStatus("Saved on this device");
      } catch {
        setStatus("Not saved · download a backup");
      }
    };
    saveTimer.current = setTimeout(save, 500);
    const flush = () => {
      try {
        localStorage.setItem(KEY, JSON.stringify(docs));
      } catch {}
    };
    window.addEventListener("pagehide", flush);
    return () => {
      clearTimeout(saveTimer.current);
      window.removeEventListener("pagehide", flush);
    };
  }, [docs, ready]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(
    () => () => {
      if (pdfURL) URL.revokeObjectURL(pdfURL);
    },
    [pdfURL],
  );
  const commit = useCallback(
    (updated: CV) => {
      if (!cv) return;
      history.current = [...history.current.slice(-49), structuredClone(cv)];
      future.current = [];
      setHistoryVersion((v) => v + 1);
      setDocs((ds) =>
        ds.map((d) =>
          d.id === cv.id
            ? { ...updated, updatedAt: new Date().toISOString() }
            : d,
        ),
      );
    },
    [cv],
  );
  const patch = (p: Partial<CV>) => {
    const next={...cv,...p};
    if(!p.latex && (p.profile || p.summary!==undefined || p.sections || p.design) && cv.latex?.mode==="custom") {
      try {const result=latexToVisual(cv.latex.source);if(result.compatible&&!result.issues.length)next.latex={mode:"generated",source:""};else setToast("Visual data updated. Custom LaTeX is preserved; regenerate to apply changes to its PDF.");} catch {setToast("Visual data updated. Custom LaTeX is preserved; regenerate to apply changes to its PDF.");}
    }
    commit(next);
  };
  const changeProfile = (key: keyof Profile, value: string) =>
    patch({ profile: { ...cv.profile, [key]: value } });
  const changeDesign = (key: keyof CV["design"], value: unknown) =>
    patch({ design: { ...cv.design, [key]: value } });
  const changeSection = (id: string, p: Partial<Section>) =>
    patch({
      sections: cv.sections.map((s) => (s.id === id ? { ...s, ...p } : s)),
    });
  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    future.current.push(structuredClone(cv));
    setDocs((ds) => ds.map((d) => (d.id === cv.id ? prev : d)));
    setHistoryVersion((v) => v + 1);
  };
  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(structuredClone(cv));
    setDocs((ds) => ds.map((d) => (d.id === cv.id ? next : d)));
    setHistoryVersion((v) => v + 1);
  };
  const selectDoc = (id: string) => {
    setActive(id);
    setPanel("profile");
    history.current = [];
    future.current = [];
    setHistoryVersion((v) => v + 1);
    setModal(null);
  };
  const navigate = (id: string) => {
    setPanel(id);
    setNavOpen(false);
    setMobile("edit");
  };
  const moveSection = (index: number, delta: number) => {
    const list = [...cv.sections];
    const [item] = list.splice(index, 1);
    list.splice(index + delta, 0, item);
    patch({ sections: list });
  };
  const createNew = () => {
    if (docs.length >= 50) {
      setToast(
        "You can keep up to 50 drafts. Export and remove an older draft first.",
      );
      return;
    }
    const fresh = createCV(newType);
    fresh.design.font = workspace.settings.defaultFont;
    if (newSource === "profile")
      fresh.profile = structuredClone(workspace.profile);
    let result = fresh;
    if (newSource === "import" && selectedImport) {
      try {
        result = buildFromImport(fresh, selectedImport.cv, newSelected);
      } catch (e) {
        setToast(e instanceof Error ? e.message : "Could not create CV");
        return;
      }
    }
    result.label = `${templates.find((t) => t.id === newType)!.category} CV`;
    setDocs((ds) => [...ds, result]);
    selectDoc(result.id);
    setToast("A fresh draft, ready for your next chapter.");
  };
  const duplicate = () => {
    if (docs.length >= 50) {
      setToast("Draft limit reached. Export and remove an older draft.");
      return;
    }
    const next = structuredClone(cv);
    next.id = uid();
    next.label = `${cv.label.slice(0, 110)} (copy)`;
    next.updatedAt = new Date().toISOString();
    setDocs((ds) => [...ds, next]);
    selectDoc(next.id);
    setToast("Draft duplicated");
  };
  const exportFile = (format: "json" | "txt") => {
    download(
      new Blob(
        [
          format === "json"
            ? JSON.stringify({ format: "cv-studio", version: 1, cv }, null, 2)
            : plainText(cv),
        ],
        {
          type:
            format === "json" ? "application/json" : "text/plain;charset=utf-8",
        },
      ),
      `${filename(cv)}.${format}`,
    );
    setToast(
      format === "json"
        ? "Backup downloaded. Keep it somewhere safe."
        : "Plain text downloaded",
    );
  };
  const exportPDF = async (preview = false) => {
    setBusy(true);
    try {
      const { createPDF } = await import("@/lib/pdf");
      const blob = await createPDF(cv);
      if (preview) {
        setPdfURL(URL.createObjectURL(blob));
        setModal(null);
      } else {
        download(blob, `${filename(cv)}.pdf`);
        setToast("Your PDF is ready. Good luck with your application.");
      }
    } catch (e) {
      console.error("PDF export failed", e);
      setModal(null);
      setToast(
        "PDF export failed. Try again, or download a JSON backup to keep your work.",
      );
    } finally {
      setBusy(false);
    }
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 2_000_000)
        throw new Error("Choose a backup smaller than 2 MB.");
      if (docs.length >= 50)
        throw new Error("Draft limit reached. Remove an older draft first.");
      const parsed = JSON.parse(await file.text());
      const item = validateCV(parsed.cv ?? parsed);
      item.id = uid();
      item.label = `${item.label.slice(0, 108)} (imported)`;
      item.updatedAt = new Date().toISOString();
      setDocs((ds) => [...ds, item]);
      selectDoc(item.id);
      setToast("Backup imported as a new draft");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not import this file.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };
  if (!ready || !workspaceLoaded || !cv)
    return (
      <div className="loading-screen">
        <div className="brand-mark">
          <BrandMark size={48} />
        </div>
        <h1>CV Banao</h1>
        <p>A thoughtful space for your next chapter</p>
        <LoaderCircle className="spin" size={20} />
      </div>
    );
  const section = cv.sections.find((s) => s.id === panel),
    checklist = checks(cv),
    completed = checklist.filter((c) => c.done).length;
  const selectTemplate = (id: Template) => {
    const t = templates.find((t) => t.id === id)!;
    patch({
      template: id,
      design: { ...cv.design, font: t.font, accent: t.color },
    });
    setToast("Template applied. Your content and section order are preserved.");
  };
  const editEntry = (id: string, p: Partial<Entry>) => {
    if (section)
      changeSection(section.id, {
        entries: section.entries.map((e) => (e.id === id ? { ...e, ...p } : e)),
      });
  };
  const deleteEntry = (id: string) => {
    if (!section) return;
    const e = section.entries.find((e) => e.id === id)!;
    const act = () =>
      changeSection(section.id, {
        entries: section.entries.filter((e) => e.id !== id),
      });
    if (filledEntry(e))
      setConfirm({
        title: "Remove this entry?",
        detail: "You can undo this change during the current editing session.",
        action: act,
      });
    else act();
  };
  const reorderEntry = (index: number, delta: number) => {
    if (!section) return;
    const list = [...section.entries];
    const [e] = list.splice(index, 1);
    list.splice(index + delta, 0, e);
    changeSection(section.id, { entries: list });
  };
  return (
    <div
      className={`studio-shell ${panel === "latex" ? "latex-mode" : ""} ${["home", "imports", "account", "settings"].includes(panel) ? "hub-mode" : ""}`}
      data-history={historyVersion}
    >
      <header className="app-header">
        <div className="brand">
          <button
            className="icon-button menu-toggle"
            aria-label="Open navigation"
            onClick={() => setNavOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="brand-mark">
            <BrandMark />
          </div>
          <span>
            CV <strong>Banao</strong>
            <small>YOUR STORY. YOUR NEXT STEP.</small>
          </span>
        </div>
        <div className="document-name">
          <input
            aria-label="Document name"
            maxLength={120}
            value={cv.label}
            onChange={(e) => patch({ label: e.target.value })}
          />
          <span className={status.startsWith("Not") ? "save-error" : ""}>
            <span className="status-dot" />
            {status}
          </span>
        </div>
        <div className="header-actions">
          <ThemeControl />
          <button
            className="button subtle drafts-button"
            onClick={() => setModal("drafts")}
          >
            <FolderOpen size={16} /> My drafts{" "}
            <span className="count-badge">{docs.length}</span>
          </button>
          <button className="button primary" onClick={() => setModal("export")}>
            <Download size={16} />
            <span>Export CV</span>
            <ChevronDown size={13} />
          </button>
        </div>
      </header>
      <div className="mobile-switch">
        <button
          className={mobile === "edit" ? "active" : ""}
          onClick={() => setMobile("edit")}
        >
          Edit your CV
        </button>
        <button
          className={mobile === "preview" ? "active" : ""}
          onClick={() => setMobile("preview")}
        >
          Live preview
        </button>
      </div>
      {navOpen && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside className={`sidebar ${navOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <span className="eyebrow">YOUR WORKSPACE</span>
          <button
            className="icon-button mobile-close"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="design-nav">
          {[
            { id: "home", label: "My workspace", Icon: Home },
            { id: "imports", label: "Import current CV", Icon: Upload },
            { id: "account", label: "My profile", Icon: UserRound },
            { id: "settings", label: "Settings", Icon: Settings2 },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              className={panel === id ? "nav-button active" : "nav-button"}
              onClick={() => navigate(id)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
          <button
            className={
              panel === "research-pdf" ? "nav-button active" : "nav-button"
            }
            onClick={() => navigate("research-pdf")}
          >
            <BookOpen size={17} /> Research PDFs{" "}
            <span className="new-badge">AI</span>
          </button>
          <button
            className={
              panel === "templates" ? "nav-button active" : "nav-button"
            }
            onClick={() => navigate("templates")}
          >
            <LayoutTemplate size={17} /> Templates{" "}
            <span className="new-badge">{templates.length}</span>
          </button>
          <button
            className={panel === "design" ? "nav-button active" : "nav-button"}
            onClick={() => navigate("design")}
          >
            <Palette size={17} /> Design & layout
          </button>
          <button
            className={panel === "latex" ? "nav-button active" : "nav-button"}
            onClick={() => navigate("latex")}
          >
            <FileText size={17} />
            LaTeX & PDF
          </button>
          <button
            className={panel === "layout" ? "nav-button active" : "nav-button"}
            onClick={() => navigate("layout")}
          >
            <LayoutTemplate size={17} />
            Arrange & style
          </button>
        </div>
        <div className="section-nav-title">
          <span className="eyebrow">CV CONTENT</span>
          <button
            className="icon-button"
            title="Add section"
            aria-label="Add section"
            onClick={() => setModal("section")}
          >
            <Plus size={16} />
          </button>
        </div>
        <button
          className={`nav-button ${panel === "profile" ? "active" : ""}`}
          onClick={() => navigate("profile")}
        >
          <UserRound size={17} /> Personal details{" "}
          {cv.profile.email && <Check size={13} className="nav-check" />}
        </button>
        <div className="section-nav">
          {cv.sections.map((s, i) => {
            const Icon = iconFor(s.kind, s.title);
            return (
              <div
                className={`section-nav-row ${panel === s.id ? "active" : ""} ${!s.visible ? "is-hidden" : ""}`}
                key={s.id}
              >
                <button className="nav-button" onClick={() => navigate(s.id)}>
                  <Icon size={16} />
                  <span>{readableText(s.title)}</span>
                  {!s.visible && <EyeOff size={12} />}
                </button>
                <div className="nav-reorder">
                  <button
                    disabled={i === 0}
                    aria-label={`Move ${s.title} up`}
                    onClick={() => moveSection(i, -1)}
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    disabled={i === cv.sections.length - 1}
                    aria-label={`Move ${s.title} down`}
                    onClick={() => moveSection(i, 1)}
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button
          className="add-section-button"
          onClick={() => setModal("section")}
        >
          <Plus size={15} /> Add a section
        </button>
        <div className="sidebar-bottom">
          <button className="readiness-card" onClick={() => navigate("review")}>
            <div>
              <span className="readiness-icon">
                <CheckCheck size={16} />
              </span>
              <strong>A little polish goes a long way</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${(completed / 5) * 100}%` }} />
            </div>
            <p>
              {completed} of 5 basics covered <ArrowUpRight size={13} />
            </p>
          </button>
          <button
            className="nav-button help-button"
            onClick={() => setModal("help")}
          >
            <HelpCircle size={16} /> Help & privacy <ArrowUpRight size={13} />
          </button>
          <div className="private-note">
            <ShieldCheck size={12} /> Private by default. Always yours.
          </div>
        </div>
      </aside>
      <main
        className={`editor-pane ${mobile === "preview" && panel !== "latex" ? "mobile-hide" : ""}`}
      >
        <div className="editor-topline">
          <span>
            <i />{" "}
            {panel === "design" || panel === "templates"
              ? "MAKE IT YOURS"
              : "BUILD WITH INTENTION"}
          </span>
          <div className="history-buttons">
            <button className="editor-mode-switch" onClick={()=>navigate(panel === "latex" ? "profile" : "latex")}>{panel === "latex" ? "Visual editor" : "LaTeX editor"}</button>
            <button
              className="icon-button"
              disabled={!history.current.length}
              aria-label="Undo"
              title="Undo"
              onClick={undo}
            >
              <Undo2 size={16} />
            </button>
            <button
              className="icon-button"
              disabled={!future.current.length}
              aria-label="Redo"
              title="Redo"
              onClick={redo}
            >
              <Redo2 size={16} />
            </button>
          </div>
        </div>
        <div className="editor-scroll" key={panel}>
          {panel === "latex" && (
            <LatexStudio cv={cv} onChange={patch} notify={setToast} />
          )}
          {panel === "layout" && <LayoutEditor cv={cv} onChange={patch} />}
          {panel === "design" && cv.design.font === "editorial" && (
            <EditorialUploader notify={setToast} />
          )}

          {["home", "imports", "account", "settings"].includes(panel) && (
            <WorkspaceHub
              panel={panel}
              workspace={workspace}
              setWorkspace={setWorkspace}
              docs={docs}
              cv={cv}
              onNew={startNew}
              onOpen={selectDoc}
              onNavigate={navigate}
              onApply={(updated) => {
                commit(updated);
                navigate("profile");
              }}
              onRestore={(restored) => {
                setDocs(restored);
                selectDoc(restored[0].id);
              }}
              notify={setToast}
              storageError={workspaceError}
            />
          )}
          {panel === "research-pdf" && (
            <ResearchPanel
              purpose={purposeOf(cv.template)}
              onAdd={(entry, target) => {
                const title =
                  target === "research"
                    ? "Research experience"
                    : target === "publication"
                      ? "Publications"
                      : "Literature review";
                const kind =
                  target === "publication" ? "publications" : "experience";
                const existing = cv.sections.find(
                  (s) => s.title.toLowerCase() === title.toLowerCase(),
                );
                if (existing) {
                  if (existing.entries.length >= 100) {
                    setToast(
                      "This section has reached 100 entries. Remove an entry first.",
                    );
                    return false;
                  }
                  changeSection(existing.id, {
                    visible: true,
                    entries: [...existing.entries.filter(filledEntry), entry],
                  });
                } else {
                  if (cv.sections.length >= 40) {
                    setToast(
                      "Section limit reached. Remove a section before adding this entry.",
                    );
                    return false;
                  }
                  const section = createSection(title, kind);
                  section.entries = [entry];
                  patch({ sections: [...cv.sections, section] });
                }
                setToast("Research entry added to your CV.");
                return true;
              }}
            />
          )}
          {panel === "profile" && (
            <>
              <div className="editor-heading">
                <span className="heading-icon">
                  <UserRound size={22} />
                </span>
                <p className="eyebrow">A GREAT FIRST IMPRESSION</p>
                <h1>Let’s start with you.</h1>
                <p>
                  The essentials that help someone reach you.
                  <br />
                  Your story comes next.
                </p>
              </div>
              <div className="form-card">
                <div className="card-heading">
                  <h2>Personal details</h2>
                  <span>01</span>
                </div>
                <RichEditor
                  label="Full name"
                  value={cv.profile.name}
                  onChange={(v) => changeProfile("name", v)}
                  placeholder="Your full name"
                />
                <RichEditor
                  label="Professional headline"
                  value={cv.profile.headline}
                  onChange={(v) => changeProfile("headline", v)}
                  placeholder="e.g. Researcher in computational biology"
                />
                <div className="field-grid">
                  <TextInput
                    label="Email address"
                    type="email"
                    value={cv.profile.email}
                    onChange={(v) => changeProfile("email", v)}
                    placeholder="you@example.com"
                  />
                  <TextInput
                    label="Phone · optional"
                    type="tel"
                    value={cv.profile.phone}
                    onChange={(v) => changeProfile("phone", v)}
                    placeholder="+880 …"
                  />
                </div>
                <RichEditor
                  label="Location"
                  value={cv.profile.location}
                  onChange={(v) => changeProfile("location", v)}
                  placeholder="City, country"
                />
              </div>
              <div className="form-card">
                <div className="card-heading">
                  <h2>Links that tell your story</h2>
                  <span>OPTIONAL</span>
                </div>
                <TextInput
                  label="Website or portfolio"
                  value={cv.profile.website}
                  onChange={(v) => changeProfile("website", v)}
                  placeholder="yourwebsite.com"
                />
                <TextInput label="Website display name" value={cv.profile.websiteLabel ?? ""} onChange={(v) => changeProfile("websiteLabel", v)} placeholder="e.g. Website" />
                <TextInput
                  label="LinkedIn"
                  value={cv.profile.linkedin}
                  onChange={(v) => changeProfile("linkedin", v)}
                  placeholder="linkedin.com/in/your-name"
                />
                <TextInput label="LinkedIn display name" value={cv.profile.linkedinLabel ?? ""} onChange={(v) => changeProfile("linkedinLabel", v)} placeholder="e.g. LinkedIn" />
                <TextInput
                  label="Google Scholar, ORCID or GitHub"
                  value={cv.profile.scholar}
                  onChange={(v) => changeProfile("scholar", v)}
                  placeholder="Your research or project profile"
                />
                <TextInput label="Scholar / GitHub display name" value={cv.profile.scholarLabel ?? ""} onChange={(v) => changeProfile("scholarLabel", v)} placeholder="e.g. Scholar / GitHub" />
              </div>
              <div className="form-card">
                <div className="card-heading">
                  <h2>
                    {cv.template === "industry"
                      ? "Professional summary"
                      : "Profile / research objective"}
                  </h2>
                </div>
                <RichEditor label="A brief introduction" value={cv.summary} multiline onChange={(summary) => patch({summary})}/>
              </div>
              <div className="gentle-tip">
                <Sparkles size={17} />
                <p>
                  <strong>Keep it intentional.</strong> A city and country are
                  enough. You don’t need to include a full address, photo or
                  personal identifiers.
                </p>
              </div>
              <button
                className="button primary next-button"
                onClick={() => navigate(cv.sections[0]?.id || "design")}
              >
                Continue to {cv.sections[0]?.title.toLowerCase() || "design"}{" "}
                <ChevronRight size={16} />
              </button>
            </>
          )}
          {panel === "templates" && (
            <>
              <div className="editor-heading">
                <span className="heading-icon">
                  <LayoutTemplate size={22} />
                </span>
                <p className="eyebrow">YOUR STORY, WELL PRESENTED</p>
                <h1>A format for your next step.</h1>
                <p>
                  Twenty carefully considered templates.
                  <br />
                  Every detail is yours to change.
                </p>
              </div>
              <div className="template-filter">
                <label className="hub-field">
                  <span>Find a template</span>
                  <input
                    aria-label="Search templates"
                    value={templateQuery}
                    onChange={(e) => setTemplateQuery(e.target.value)}
                    placeholder="Search by name or purpose…"
                  />
                </label>
                <div
                  className="hub-tabs"
                  role="group"
                  aria-label="Template category"
                >
                  {[
                    "All",
                    "Academic",
                    "Research",
                    "PhD / Higher study",
                    "Industry",
                  ].map((c) => (
                    <button
                      key={c}
                      className={templateFilter === c ? "active" : ""}
                      aria-pressed={templateFilter === c}
                      onClick={() => setTemplateFilter(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="template-grid">
                {templates
                  .filter(
                    (t) =>
                      (templateFilter === "All" ||
                        t.category === templateFilter) &&
                      [t.name, t.category]
                        .join(" ")
                        .toLowerCase()
                        .includes(templateQuery.toLowerCase()),
                  )
                  .map((t) => (
                    <TemplateCard
                      id={t.id}
                      key={t.id}
                      selected={cv.template === t.id}
                      onClick={() => selectTemplate(t.id)}
                    />
                  ))}
              </div>
              <div className="template-description">
                <span className="eyebrow">
                  {templates.find((t) => t.id === cv.template)!.category}
                </span>
                <h2>{templates.find((t) => t.id === cv.template)!.name}</h2>
                <p>
                  {templates.find((t) => t.id === cv.template)!.description}
                </p>
              </div>
              <div className="gentle-tip">
                <ShieldCheck size={18} />
                <p>
                  All templates use a simple, single-column reading order and
                  selectable PDF text. Switching templates keeps your content.
                </p>
              </div>
              <button
                className="button outline full-width"
                onClick={() => navigate("design")}
              >
                <Palette size={16} /> Fine-tune this design{" "}
                <ArrowUpRight size={14} />
              </button>
              <p className="small-note">
                Want a different set of suggested sections? Create a new draft
                and choose its purpose.
              </p>
            </>
          )}
          {panel === "design" && (
            <>
              <div className="editor-heading">
                <span className="heading-icon">
                  <Palette size={22} />
                </span>
                <p className="eyebrow">THE FINISHING TOUCHES</p>
                <h1>Make it feel like you.</h1>
                <p>
                  Thoughtful typography. Just the right color.
                  <br />A little space to let your work breathe.
                </p>
              </div>
              <div className="form-card">
                <div className="card-heading">
                  <h2>Typography</h2>
                  <span>Aa</span>
                </div>
                <div className="font-options">
                  {fonts.map((f) => (
                    <button
                      key={f.id}
                      className={cv.design.font === f.id ? "selected" : ""}
                      style={{ fontFamily: f.family }}
                      onClick={() => changeDesign("font", f.id)}
                      aria-pressed={cv.design.font === f.id}
                    >
                      <span>Aa</span>
                      <strong>{f.name}</strong>
                      {cv.design.font === f.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
                <Field label={`Body size · ${cv.design.fontSize} pt`}>
                  <input
                    type="range"
                    min={8}
                    max={14}
                    step={0.5}
                    value={cv.design.fontSize}
                    onChange={(e) => changeDesign("fontSize", +e.target.value)}
                  />
                </Field>
                <AlignmentControl value={cv.design.textAlign} onChange={(textAlign) => changeDesign("textAlign",textAlign)} label="Default body alignment" />
                <Field
                  label={`Line height · ${cv.design.lineHeight.toFixed(2)}`}
                >
                  <input
                    type="range"
                    min={1.1}
                    max={1.8}
                    step={0.05}
                    value={cv.design.lineHeight}
                    onChange={(e) =>
                      changeDesign("lineHeight", +e.target.value)
                    }
                  />
                </Field>
              </div>
              <div className="form-card">
                <div className="card-heading">
                  <h2>Accent color</h2>
                  <span>HEADINGS & LINKS</span>
                </div>
                <div className="color-swatches">
                  {colors.map((c) => (
                    <button
                      key={c}
                      aria-label={`Choose color ${c}`}
                      aria-pressed={cv.design.accent === c}
                      style={{ background: c }}
                      onClick={() => changeDesign("accent", c)}
                    >
                      {cv.design.accent === c && <Check size={17} />}
                    </button>
                  ))}
                </div>
                <Field label="Custom color">
                  <div className="custom-color">
                    <input
                      type="color"
                      value={cv.design.accent}
                      onChange={(e) => changeDesign("accent", e.target.value)}
                    />
                    <code>{cv.design.accent.toUpperCase()}</code>
                    <span>Keep it readable on white</span>
                  </div>
                </Field>
                <Field label="Body text color">
                  <div className="custom-color">
                    <input
                      type="color"
                      value={cv.design.textColor}
                      onChange={(e) =>
                        changeDesign("textColor", e.target.value)
                      }
                    />
                    <code>{cv.design.textColor.toUpperCase()}</code>
                    <span>Choose a dark, readable shade</span>
                  </div>
                </Field>
              </div>
              <div className="form-card">
                <div className="card-heading">
                  <h2>Page layout</h2>
                </div>
                <Field label="Paper size">
                  <select
                    value={cv.design.paper}
                    onChange={(e) => changeDesign("paper", e.target.value)}
                  >
                    <option value="A4">A4 · 210 × 297 mm</option>
                    <option value="LETTER">US Letter · 8.5 × 11 in</option>
                  </select>
                </Field>
                <Field label={`Page margins · ${cv.design.margins} pt`}>
                  <input
                    type="range"
                    min={24}
                    max={64}
                    step={2}
                    value={cv.design.margins}
                    onChange={(e) => changeDesign("margins", +e.target.value)}
                  />
                </Field>
                <Field label={`Section spacing · ${cv.design.spacing} pt`}>
                  <input
                    type="range"
                    min={8}
                    max={24}
                    value={cv.design.spacing}
                    onChange={(e) => changeDesign("spacing", +e.target.value)}
                  />
                </Field>
                <label className="toggle-row">
                  <span>
                    <strong>Page numbers</strong>
                    <small>Include your name and page count in PDF</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={cv.design.pageNumbers}
                    onChange={(e) =>
                      changeDesign("pageNumbers", e.target.checked)
                    }
                  />
                </label>
              </div>
              <button
                className="button outline full-width"
                onClick={() => {
                  const d = createCV(cv.template).design;
                  patch({ design: d });
                  setToast("Template design restored");
                }}
              >
                Restore template defaults
              </button>
            </>
          )}
          {section && (
            <>
              <div className="editor-heading">
                <span className="heading-icon">
                  {(() => {
                    const I = iconFor(section.kind, section.title);
                    return <I size={22} />;
                  })()}
                </span>
                <p className="eyebrow">EVERY EXPERIENCE HAS A STORY</p>
                <h1>{section.title}</h1>
                <p>
                  {section.kind === "education"
                    ? "Your academic foundation. Start with your most recent qualification."
                    : section.kind === "publications"
                      ? "Make your contributions easy to find. Include authors, status and a link."
                      : section.kind === "skills"
                        ? "Group related skills and methods. Be specific about what you can do."
                        : section.kind === "text"
                          ? "Give this part of your story the space it needs."
                          : "Show what you did, how you did it, and why it mattered."}
                </p>
              </div>
              <div className="section-settings">
                <Field label="Section heading">
                  <input
                    maxLength={120}
                    value={section.title}
                    onChange={(e) =>
                      changeSection(section.id, { title: e.target.value })
                    }
                  />
                </Field>
                <button
                  className={`icon-button ${!section.visible ? "muted" : ""}`}
                  aria-label={
                    section.visible
                      ? "Hide section from CV"
                      : "Show section on CV"
                  }
                  title={section.visible ? "Hide section" : "Show section"}
                  onClick={() =>
                    changeSection(section.id, { visible: !section.visible })
                  }
                >
                  {section.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {!section.visible && (
                <div className="inline-notice">
                  <EyeOff size={16} /> This section is hidden from the preview
                  and exports.
                </div>
              )}
              {section.entries.map((e, index) => (
                <div className="form-card entry-card" key={e.id}>
                  <div className="card-heading">
                    <h2>
                      <span className="entry-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {section.kind === "skills"
                        ? "Skill group"
                        : section.kind === "text"
                          ? "Content block"
                          : "Entry"}
                    </h2>
                    <div className="entry-actions">
                      <button
                        className="icon-button"
                        disabled={index === 0}
                        aria-label={`Move entry ${index + 1} up`}
                        onClick={() => reorderEntry(index, -1)}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        className="icon-button"
                        disabled={index === section.entries.length - 1}
                        aria-label={`Move entry ${index + 1} down`}
                        onClick={() => reorderEntry(index, 1)}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        className="icon-button danger"
                        aria-label={`Remove entry ${index + 1}`}
                        onClick={() => deleteEntry(e.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <RichEditor
                    label={
                      section.kind === "education"
                        ? "Degree / qualification"
                        : section.kind === "publications"
                          ? "Title"
                          : section.kind === "skills"
                            ? "Category"
                            : section.kind === "text"
                              ? "Subheading · optional"
                              : "Role / project / award"
                    }
                    value={e.title}
                    onChange={(v) => editEntry(e.id, { title: v })}
                    placeholder={
                      section.kind === "education"
                        ? "e.g. BSc in Genetic Engineering and Biotechnology"
                        : section.kind === "skills"
                          ? "e.g. Laboratory methods"
                          : "Your entry title"
                    }
                  />
                  {!["skills", "text"].includes(section.kind) && (
                    <>
                      <RichEditor
                        label={
                          section.kind === "education"
                            ? "Institution"
                            : section.kind === "publications"
                              ? "Authors"
                              : "Organization / lab / institution"
                        }
                        value={e.subtitle}
                        onChange={(v) => editEntry(e.id, { subtitle: v })}
                        placeholder={
                          section.kind === "publications"
                            ? "List authors in publication order"
                            : "Institution or organization name"
                        }
                      />
                      <div className="field-grid">
                        <RichEditor
                          label={
                            section.kind === "publications"
                              ? "Year / status"
                              : "Date / period"
                          }
                          value={e.date}
                          onChange={(v) => editEntry(e.id, { date: v })}
                          placeholder={
                            section.kind === "publications"
                              ? "2026 · Under review"
                              : "Sep 2023 – Present"
                          }
                        />
                        <RichEditor
                          label={
                            section.kind === "publications"
                              ? "Journal / venue"
                              : "Location · optional"
                          }
                          value={e.location}
                          onChange={(v) => editEntry(e.id, { location: v })}
                          placeholder={
                            section.kind === "publications"
                              ? "Journal or conference"
                              : "City, country"
                          }
                        />
                      </div>
                      <TextInput
                        label={
                          section.kind === "publications"
                            ? "DOI / publication URL"
                            : "Relevant link · optional"
                        }
                        value={e.url}
                        onChange={(v) => editEntry(e.id, { url: v })}
                        placeholder="https://…"
                      />
                      <TextInput label="Link display name" value={e.urlLabel ?? ""} onChange={(v) => editEntry(e.id, {urlLabel: v})} placeholder="e.g. Link, GitHub, Read paper" />
                    </>
                  )}
                  {["skills", "text"].includes(section.kind) && <><TextInput label="Link URL" value={e.url} onChange={(url) => editEntry(e.id, {url})}/><TextInput label="Link display name" value={e.urlLabel ?? ""} onChange={(urlLabel) => editEntry(e.id, {urlLabel})} placeholder="Link" /></>}
                  <AlignmentControl value={e.style?.textAlign ?? section.style?.textAlign ?? cv.design.textAlign} onChange={(textAlign) => editEntry(e.id, {style: {indent: e.style?.indent ?? 0, spacingAfter: e.style?.spacingAfter ?? 10, ...e.style, textAlign}})} label="Entry text alignment" />
                  <RichEditor label={section.kind === "skills" ? "Skills / tools / methods" : "Details & achievements"} value={e.description} multiline onChange={(description) => editEntry(e.id,{description})}/>
                </div>
              ))}
              <button
                className="add-entry-button"
                disabled={section.entries.length >= 100}
                onClick={() =>
                  changeSection(section.id, {
                    entries: [...section.entries, emptyEntry()],
                  })
                }
              >
                <Plus size={17} /> Add{" "}
                {section.kind === "skills" ? "skill group" : "another entry"}
              </button>
              <div className="section-footer">
                <span>Empty entries won’t appear on your CV.</span>
                <button
                  className="text-danger"
                  onClick={() =>
                    setConfirm({
                      title: `Remove ${section.title}?`,
                      detail:
                        "This removes the entire section and its entries. You can undo this in the current session.",
                      action: () => {
                        patch({
                          sections: cv.sections.filter(
                            (s) => s.id !== section.id,
                          ),
                        });
                        setPanel("profile");
                      },
                    })
                  }
                >
                  Remove section
                </button>
              </div>
            </>
          )}
          {panel === "review" && (
            <>
              <div className="editor-heading">
                <span className="heading-icon">
                  <CheckCheck size={23} />
                </span>
                <p className="eyebrow">BEFORE YOU HIT SEND</p>
                <h1>The final look.</h1>
                <p>
                  A few helpful checks. Your requirements may vary by
                  application.
                </p>
              </div>
              <div className="form-card">
                <div className="card-heading">
                  <h2>Content checklist</h2>
                  <span>{completed}/5</span>
                </div>
                {checklist.map((c) => (
                  <button
                    key={c.label}
                    className={`check-row ${c.done ? "done" : ""}`}
                    onClick={() => navigate(c.target)}
                  >
                    <span>{c.done ? <Check size={14} /> : <span />}</span>
                    {c.label}
                    <ChevronRight size={15} />
                  </button>
                ))}
              </div>
              <div className="form-card review-notes">
                <h2>Make the last pass count</h2>
                <p>
                  Check names, dates, contact details and links. Use consistent
                  date formats and put recent experiences first.
                </p>
                <p>
                  Describe your own contribution clearly. Keep publication
                  status accurate and distinguish submitted work from published
                  work.
                </p>
                <p>
                  Follow the institution’s or employer’s length and formatting
                  requirements. Preview the exported PDF before sending.
                </p>
                <p>
                  This checklist is guidance, not an admissions or ATS score.
                </p>
              </div>
              <button
                className="button primary full-width"
                onClick={() => setModal("export")}
              >
                <Download size={16} /> Export your CV
              </button>
            </>
          )}
        </div>
        <div className="editor-footer">
          <ShieldCheck size={12} />
          <span>Saved locally. No account needed.</span>
          <button onClick={() => setModal("help")}>
            How it works <ArrowUpRight size={12} />
          </button>
        </div>
      </main>
      <div
        className={`preview-region ${mobile === "edit" ? "mobile-hide" : ""}`}
      >
        {!["home", "imports", "account", "settings", "latex"].includes(panel) && (
          <ExactPDFPreview cv={cv} />
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        className="sr-only"
        tabIndex={-1}
        accept=".json,application/json"
        onChange={(e) => void importFile(e.target.files?.[0])}
      />
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {modal === "drafts" && (
        <Modal
          title="Your next chapters"
          subtitle="Separate drafts for every opportunity. Stored on this browser."
          onClose={() => setModal(null)}
        >
          <div className="modal-body draft-name-editor">
            <TextInput
              label="Current draft name"
              value={cv.label}
              onChange={(v) => patch({ label: v.slice(0, 120) })}
              placeholder="e.g. Autumn PhD applications"
            />
          </div>
          <div className="draft-list">
            {docs.map((d) => (
              <div
                className={`draft-item ${d.id === cv.id ? "current" : ""}`}
                key={d.id}
              >
                <div className="draft-icon" style={{ color: d.design.accent }}>
                  <FileText size={23} />
                </div>
                <button
                  className="draft-select"
                  onClick={() => selectDoc(d.id)}
                >
                  <strong>{d.label || "Untitled CV"}</strong>
                  <span>
                    {templates.find((t) => t.id === d.template)?.category} ·{" "}
                    {readableText(d.profile.name) || "No name yet"}{" "}
                    {d.id === cv.id && "· Current"}
                  </span>
                </button>
                <button
                  className="icon-button danger"
                  disabled={docs.length === 1}
                  aria-label={`Delete ${d.label}`}
                  onClick={() =>
                    setConfirm({
                      title: "Delete this draft?",
                      detail:
                        "Download a JSON backup first if you want to keep it. This action cannot be undone.",
                      action: () => {
                        const next = docs.filter((x) => x.id !== d.id);
                        setDocs(next);
                        if (active === d.id) selectDoc(next[0].id);
                      },
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="modal-actions wrap">
            <button className="button primary" onClick={startNew}>
              <Plus size={16} /> New CV
            </button>
            <button className="button outline" onClick={duplicate}>
              <Copy size={15} /> Duplicate current
            </button>
            <button
              className="button subtle"
              onClick={() => {
                setModal(null);
                fileInput.current?.click();
              }}
            >
              <Upload size={15} /> Import backup
            </button>
          </div>
        </Modal>
      )}
      {modal === "new" && (
        <Modal
          title="Make your next move."
          subtitle="Choose your information, then a format. Everything stays editable."
          onClose={() => setModal(null)}
          wide
        >
          <div className="new-flow-steps">
            <button
              className={newStep === 1 ? "active" : ""}
              onClick={() => setNewStep(1)}
            >
              <span>1</span> Information
            </button>
            <button
              className={newStep === 2 ? "active" : ""}
              onClick={() => setNewStep(2)}
            >
              <span>2</span> Format & create
            </button>
          </div>
          {newStep === 1 ? (
            <div className="modal-body">
              <h3>How would you like to start?</h3>
              <div className="source-options">
                {[
                  {
                    id: "blank",
                    name: "Start blank",
                    detail: "A clean slate for a new opportunity.",
                    Icon: FileText,
                  },
                  {
                    id: "profile",
                    name: "Use my profile",
                    detail: "Reuse your saved personal and contact details.",
                    Icon: UserRound,
                  },
                  {
                    id: "import",
                    name: "Use imported information",
                    detail: "Choose a saved CV and select what to bring over.",
                    Icon: Upload,
                  },
                ].map(({ id, name, detail, Icon }) => (
                  <button
                    className={newSource === id ? "selected" : ""}
                    key={id}
                    aria-pressed={newSource === id}
                    onClick={() => setNewSource(id)}
                  >
                    <Icon size={22} />
                    <strong>{name}</strong>
                    <span>{detail}</span>
                  </button>
                ))}
              </div>
              {newSource === "profile" && (
                <p className="hub-note">
                  Using profile:{" "}
                  {workspace.profile.name ||
                    "No name saved yet. Add one from My profile."}
                </p>
              )}
              {newSource === "import" &&
                (workspace.imports.length ? (
                  <>
                    <label className="hub-field">
                      <span>Saved import</span>
                      <select
                        aria-label="Saved import"
                        value={newImport}
                        onChange={(e) => {
                          setNewImport(e.target.value);
                          const item = workspace.imports.find(
                            (i) => i.id === e.target.value,
                          );
                          setNewSelected(
                            item
                              ? [
                                  "profile",
                                  "summary",
                                  ...item.cv.sections
                                    .filter(
                                      (s) =>
                                        !s.title.startsWith(
                                          "Unassigned information",
                                        ),
                                    )
                                    .map((s) => s.id),
                                ]
                              : [],
                          );
                        }}
                      >
                        <option value="">Choose imported information…</option>
                        {workspace.imports.map((i) => (
                          <option value={i.id} key={i.id}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {selectedImport && (
                      <ImportSelector
                        cv={selectedImport.cv}
                        selected={newSelected}
                        onChange={setNewSelected}
                      />
                    )}
                  </>
                ) : (
                  <div className="hub-empty">
                    <Upload size={28} />
                    <h3>No saved imports yet</h3>
                    <p>
                      Import a PDF, DOCX, JSON backup or pasted CV text first.
                    </p>
                    <button
                      className="button outline"
                      onClick={() => {
                        setModal(null);
                        navigate("imports");
                      }}
                    >
                      Import current CV
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <>
              <div className="template-grid modal-template-grid">
                {templates.map((t) => (
                  <TemplateCard
                    key={t.id}
                    id={t.id}
                    selected={newType === t.id}
                    onClick={() => setNewType(t.id)}
                  />
                ))}
              </div>
              <p className="new-font-note">
                Default font:{" "}
                {
                  fonts.find((f) => f.id === workspace.settings.defaultFont)
                    ?.name
                }
                . Change it any time in Design & layout.
              </p>
            </>
          )}
          <div className="modal-actions">
            <button
              className="button subtle"
              onClick={() => (newStep === 2 ? setNewStep(1) : setModal(null))}
            >
              {newStep === 2 ? "Back" : "Cancel"}
            </button>
            <button
              className="button primary"
              disabled={
                newSource === "import" &&
                (!selectedImport || !newSelected.length)
              }
              onClick={() => (newStep === 1 ? setNewStep(2) : createNew())}
            >
              {newStep === 1 ? "Choose a template" : "Create my CV"}
              <ArrowUpRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {modal === "section" && (
        <Modal
          title="Make room for more."
          subtitle="Add a section that matters to your application."
          onClose={() => setModal(null)}
        >
          <div className="modal-body">
            <Field label="Section name">
              <input
                autoFocus
                value={sectionName}
                maxLength={120}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="e.g. Volunteer experience"
              />
            </Field>
            <Field label="Content format">
              <select
                value={sectionKind}
                onChange={(e) => setSectionKind(e.target.value as Kind)}
              >
                <option value="experience">
                  Experience · role, organization, dates & details
                </option>
                <option value="education">
                  Education · qualification & institution
                </option>
                <option value="publications">
                  Publication · title, authors, venue & link
                </option>
                <option value="skills">Skills · category & skills</option>
                <option value="text">
                  Free text · interests, references or statement
                </option>
              </select>
            </Field>
            <div className="suggestion-chips">
              {[
                "Teaching experience",
                "Certifications",
                "Volunteer experience",
                "Languages",
                "Conferences",
                "References",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSectionName(s);
                    setSectionKind(
                      s === "Languages"
                        ? "skills"
                        : s === "References"
                          ? "text"
                          : "experience",
                    );
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button
              className="button primary"
              disabled={!sectionName.trim() || cv.sections.length >= 40}
              onClick={() => {
                const s = createSection(sectionName.trim(), sectionKind);
                patch({ sections: [...cv.sections, s] });
                navigate(s.id);
                setSectionName("");
                setModal(null);
              }}
            >
              <Plus size={16} /> Add section
            </button>
          </div>
        </Modal>
      )}
      {modal === "export" && (
        <Modal
          title="Ready for your next chapter?"
          subtitle="Your work, in the format you need. No watermark. No paywall."
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          <div className="export-options">
            <div className="export-feature">
              <div className="export-file-icon">
                <FileText size={28} />
                <b>PDF</b>
              </div>
              <div>
                <h3>Professional PDF</h3>
                <p>
                  Embedded fonts, selectable text, automatic pagination. Ready
                  to share.
                </p>
              </div>
            </div>
            <div className="pdf-actions">
              <button
                className="button primary"
                disabled={busy}
                onClick={() => void exportPDF()}
              >
                {busy ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <Download size={16} />
                )}{" "}
                {busy ? "Preparing PDF…" : "Download PDF"}
              </button>
              <button
                className="button outline"
                disabled={busy}
                onClick={() => void exportPDF(true)}
              >
                <Eye size={16} /> Preview PDF
              </button>
            </div>
            <button className="export-row" onClick={() => exportFile("json")}>
              <Save size={21} />
              <span>
                <strong>
                  Editable backup <small>.json</small>
                </strong>
                <p>Keep a copy. Import it later or on another device.</p>
              </span>
              <Download size={16} />
            </button>
            <button className="export-row" onClick={() => exportFile("txt")}>
              <FileText size={21} />
              <span>
                <strong>
                  Plain text <small>.txt</small>
                </strong>
                <p>Copy into application forms or review the reading order.</p>
              </span>
              <Download size={16} />
            </button>
          </div>
          <p className="export-note">
            Only completed, visible sections are exported. Always review your
            PDF before submitting.
          </p>
        </Modal>
      )}
      {modal === "help" && (
        <Modal
          title="A little clarity."
          subtitle="Everything you need to know about your workspace."
          onClose={() => setModal(null)}
        >
          <div className="modal-body help-content">
            <h3>Your data stays with you</h3>
            <p>
              CV drafts are saved in this browser’s local storage. The ordinary
              editor does not upload your content or use analytics. Research
              PDFs are read in your browser; generating a summary sends
              extracted text and your stated role through the server to OpenAI.
              Anyone with access to this browser profile may be able to open
              saved CV drafts.
            </p>
            <h3>Back up work you care about</h3>
            <p>
              Download a JSON backup from Export CV. Clearing browser data,
              private browsing or changing devices can remove local drafts.
              Import a backup from My drafts to continue elsewhere.
            </p>
            <h3>Twenty templates, one flexible editor</h3>
            <p>
              Choose a format, edit its sections, then tune fonts, colors and
              spacing. Switching a template preserves content; a new draft
              starts with purpose-specific sections. Use the arrows to reorder
              sections and entries.
            </p>
            <h3>Preview and export</h3>
            <p>
              The live preview is continuous. PDF export adds real page breaks,
              embedded fonts and optional page numbers. Open Preview PDF to
              check the final layout. Fonts support Latin text; non-Latin
              scripts may need additional fonts.
            </p>
            <h3>Keep the final judgement yours</h3>
            <p>
              This is an editing tool, not an admissions adviser or ATS
              certification service. Follow the requirements of the opportunity
              you’re applying for.
            </p>
          </div>
        </Modal>
      )}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <div className="modal-body">
            <p>{confirm.detail}</p>
          </div>
          <div className="modal-actions">
            <button className="button subtle" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              className="button destructive"
              onClick={() => {
                confirm.action();
                setConfirm(null);
              }}
            >
              Remove
            </button>
          </div>
        </Modal>
      )}
      {pdfURL && (
        <Modal
          title="Your final PDF"
          subtitle="Check page breaks, spacing and links before submitting."
          wide
          onClose={() => setPdfURL("")}
        >
          <iframe
            className="pdf-viewer"
            title="Generated CV PDF"
            src={pdfURL}
          />
          <div className="modal-actions">
            <a
              className="button outline"
              href={pdfURL}
              target="_blank"
              rel="noreferrer"
            >
              Open in a new tab <ArrowUpRight size={15} />
            </a>
            <a
              className="button primary"
              href={pdfURL}
              download={`${filename(cv)}.pdf`}
            >
              <Download size={16} /> Download PDF
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
