"use client";
import { useEffect, useRef, useState } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  LoaderCircle,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  ShieldCheck,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import {
  extractPDF,
  PDF_LIMITS,
  type PDFSource,
  type ResearchSummary,
} from "@/lib/research";
import { uid, type Template, type Entry, emptyEntry } from "@/lib/model";
interface Paper {
  id: string;
  name: string;
  source?: PDFSource;
  error?: string;
  progress: string;
  result?: ResearchSummary;
  relationship: "literature" | "my_work";
  role: string;
  length: "concise" | "detailed";
  confirmed: boolean;
  includeSummary: boolean;
  target: "research" | "publication" | "literature";
  added: boolean;
}
export default function ResearchPanel({
  purpose,
  onAdd,
}: {
  purpose: Template;
  onAdd: (
    entry: Entry,
    target: "research" | "publication" | "literature",
  ) => boolean;
}) {
  const [papers, setPapers] = useState<Paper[]>([]),
    [active, setActive] = useState(""),
    [busy, setBusy] = useState(false),
    [reading, setReading] = useState(false),
    [configured, setConfigured] = useState<boolean | null>(null),
    [code, setCode] = useState(""),
    [notice, setNotice] = useState(""),
    [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null),
    abort = useRef<AbortController | null>(null),
    alive = useRef(true);
  const paper = papers.find((p) => p.id === active);
  useEffect(() => {
    alive.current = true;
    fetch("/api/research-summary")
      .then((r) => r.json())
      .then((d) => {
        if (alive.current) setConfigured(d.configured === true);
      })
      .catch(() => {
        if (alive.current) setConfigured(false);
      });
    return () => {
      alive.current = false;
      abort.current?.abort();
    };
  }, []);
  const patch = (id: string, p: Partial<Paper>) =>
    setPapers((list) =>
      list.map((item) => (item.id === id ? { ...item, ...p } : item)),
    );
  const addFiles = async (files: File[]) => {
    if (reading || busy) return;
    if (papers.length + files.length > PDF_LIMITS.files) {
      setNotice(
        "Keep up to 3 PDFs in this workspace. Remove one to add another.",
      );
      return;
    }
    setReading(true);
    setNotice("");
    for (const file of files) {
      const id = uid();
      const next: Paper = {
        id,
        name: file.name,
        progress: "Reading PDF…",
        relationship: "literature",
        role: "",
        length: "concise",
        confirmed: false,
        includeSummary: false,
        target: "literature",
        added: false,
      };
      setPapers((list) => [...list, next]);
      setActive(id);
      try {
        const source = await extractPDF(file, (page, total) => {
          if (alive.current)
            patch(id, { progress: `Reading page ${page} of ${total}` });
        });
        if (alive.current) patch(id, { source, progress: "" });
      } catch (e) {
        if (alive.current)
          patch(id, {
            error: e instanceof Error ? e.message : "Could not read this PDF.",
            progress: "",
          });
      }
      if (!alive.current) return;
    }
    setReading(false);
    if (input.current) input.current.value = "";
  };
  const generate = async () => {
    if (!paper?.source) return;
    setBusy(true);
    setNotice("");
    patch(paper.id, {
      error: undefined,
      progress: "Reading the research and drafting CV wording…",
      result: undefined,
      confirmed: false,
      added: false,
    });
    const controller = new AbortController();
    abort.current = controller;
    const timer = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch("/api/research-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cv-access-code": code,
        },
        signal: controller.signal,
        body: JSON.stringify({
          source: paper.source,
          purpose,
          relationship: paper.relationship,
          role: "",
          length: paper.length,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Summary generation failed.");
      if (alive.current) patch(paper.id, { result: data.result, progress: "" });
    } catch (e) {
      if (alive.current)
        patch(paper.id, {
          error:
            e instanceof Error && e.name === "AbortError"
              ? "Request cancelled or timed out. You can try again."
              : e instanceof Error
                ? e.message
                : "Could not generate a summary.",
          progress: "",
        });
    } finally {
      clearTimeout(timer);
      if (alive.current) setBusy(false);
    }
  };
  const editResult = (p: Partial<ResearchSummary>) => {
    if (paper?.result)
      patch(paper.id, {
        result: { ...paper.result, ...p },
        confirmed: false,
        added: false,
      });
  };
  const insert = () => {
    if (!paper?.result || !paper.confirmed) return;
    const r = paper.result;
    const description = [
      paper.includeSummary ? r.summary : "",
      ...r.bullets.map((b) => `- ${b.text}`),
    ]
      .filter(Boolean)
      .join("\n");
    const entry = {
      ...emptyEntry(),
      title: r.title,
      subtitle:
        paper.target === "publication"
          ? r.authors
          : paper.relationship === "literature"
            ? "Literature review"
            : "",
      date: r.year,
      location: paper.target === "publication" ? r.venue : "",
      url: r.url,
      description,
    };
    if (paper.target === "publication" && r.publicationStatus)
      entry.description = [r.publicationStatus, entry.description].join("\n");
    if (!onAdd(entry, paper.target)) {
      setNotice("Could not add the entry. Check the section or entry limit.");
      return;
    }
    patch(paper.id, { added: true });
    setNotice(
      "Added to your CV. You can edit it further in the corresponding section.",
    );
  };
  return (
    <>
      <div className="editor-heading">
        <span className="heading-icon">
          <BookOpen size={22} />
        </span>
        <h1>From paper to possibility.</h1>
        <p>
          Upload research papers or reports. Turn the evidence into clear,
          editable CV wording.
        </p>
      </div>
      <div className="research-steps">
        <span>
          <b>1</b> Upload PDF
        </span>
        <span>
          <b>2</b> Review summary
        </span>
        <span>
          <b>3</b> Add to CV
        </span>
      </div>
      <button
        className={`pdf-dropzone ${drag ? "dragging" : ""}`}
        disabled={reading || busy}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void addFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <span>
          <Upload size={24} />
        </span>
        <strong>
          {reading ? "Extracting text…" : "Drop your research here"}
        </strong>
        <p>or click to choose PDF files</p>
        <small>Up to 3 PDFs · 10 MB and 60 pages each</small>
      </button>
      <input
        className="sr-only"
        tabIndex={-1}
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        onChange={(e) => void addFiles(Array.from(e.target.files ?? []))}
      />
      {notice && (
        <p className="research-notice" role="status">
          {notice}
        </p>
      )}
      {configured === false && (
        <div className="research-setup">
          <AlertCircle size={17} />
          <div>
            <strong>AI summaries need a one-time setup</strong>
            <p>
              Add your OpenAI API key and a private workspace access code to{" "}
              <code>.env.local</code>. The included README has the steps. PDF
              text extraction works now.
            </p>
          </div>
        </div>
      )}
      <div className="paper-tabs">
        {papers.map((p) => (
          <button
            className={p.id === active ? "selected" : ""}
            key={p.id}
            onClick={() => setActive(p.id)}
            disabled={busy}
          >
            <FileText size={15} />
            <span>{p.name}</span>
            {p.result && <Check size={14} />}
          </button>
        ))}
      </div>
      {paper && (
        <>
          <div className="paper-file-heading">
            <span>
              {paper.source
                ? `${paper.source.pages} pages · ${paper.source.text.length.toLocaleString()} characters`
                : paper.name}
            </span>
            <button
              className="icon-button danger"
              disabled={busy || reading}
              aria-label="Remove selected PDF"
              onClick={() => {
                setPapers((list) => list.filter((p) => p.id !== paper.id));
                setActive(papers.find((p) => p.id !== paper.id)?.id ?? "");
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
          {paper.progress && (
            <div className="research-progress" role="status">
              <LoaderCircle size={16} className="spin" />
              {paper.progress}
            </div>
          )}
          {paper.error && (
            <div className="research-error" role="alert">
              <AlertCircle size={16} />
              <p>{paper.error}</p>
            </div>
          )}
          {paper.source && (
            <>
              <details className="extracted-text">
                <summary>
                  Review extracted text <ChevronDown size={14} />
                </summary>
                <p>
                  Check that the PDF’s main text was read correctly. Figures and
                  scanned pages may not contain extractable text.
                </p>
                <pre>{paper.source.text}</pre>
              </details>
              <div className="form-card">
                <div className="card-heading">
                  <h2>Tell us how this work relates to you</h2>
                </div>
                <label className="field">
                  <span>Your relationship to this research</span>
                  <select
                    disabled={busy}
                    value={paper.relationship}
                    onChange={(e) =>
                      patch(paper.id, {
                        relationship: e.target.value as Paper["relationship"],
                        target:
                          e.target.value === "my_work"
                            ? "research"
                            : "literature",
                        result: undefined,
                        confirmed: false,
                      })
                    }
                  >
                    <option value="literature">
                      I read or reviewed this work
                    </option>
                    <option value="my_work">I contributed to this work</option>
                  </select>
                </label>
                {paper.relationship === "my_work" && (
                  <label className="field">
                    <span>Your actual contribution</span>
                    <textarea
                      disabled={busy}
                      rows={4}
                      maxLength={3000}
                      value={paper.role}
                      onChange={(e) =>
                        patch(paper.id, {
                          role: e.target.value,
                          result: undefined,
                        })
                      }
                      placeholder="e.g. Collected samples and performed statistical analysis under supervision. Be specific about your own contribution."
                    />
                    <small>
                      At least 15 characters. The paper’s authorship or results
                      alone do not establish your role.
                    </small>
                  </label>
                )}
                <label className="field">
                  <span>CV bullet length</span>
                  <select
                    disabled={busy}
                    value={paper.length}
                    onChange={(e) =>
                      patch(paper.id, {
                        length: e.target.value as Paper["length"],
                      })
                    }
                  >
                    <option value="concise">Concise · 2–3 bullets</option>
                    <option value="detailed">Detailed · 3–5 bullets</option>
                  </select>
                </label>
                <label className="field">
                  <span>Workspace access code</span>
                  <input
                    type="password"
                    autoComplete="off"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="The code set by the site owner"
                  />
                  <small>
                    Not your OpenAI API key. This code is kept only in memory.
                  </small>
                </label>
                <div className="ai-disclosure">
                  <ShieldCheck size={15} />
                  <p>
                    Generating sends this PDF’s extracted text and your role
                    description through the server to OpenAI. The app does not
                    save the PDF or raw text. The AI provider’s data policies
                    apply.
                  </p>
                </div>
                <button
                  className="button primary full-width"
                  disabled={
                    busy ||
                    reading ||
                    configured !== true ||
                    !code ||
                    (paper.relationship === "my_work" &&
                      paper.role.trim().length < 15)
                  }
                  onClick={() => void generate()}
                >
                  {busy ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}{" "}
                  {busy
                    ? "Drafting…"
                    : paper.result
                      ? "Regenerate summary"
                      : "Generate CV summary"}
                </button>
                {busy && (
                  <button
                    className="button subtle full-width"
                    onClick={() => abort.current?.abort()}
                  >
                    Cancel request
                  </button>
                )}
              </div>
              {paper.result && (
                <div className="research-result">
                  <div className="result-heading">
                    <span>
                      <Check size={15} />
                    </span>
                    <div>
                      <p className="eyebrow">DRAFT, READY FOR YOUR REVIEW</p>
                      <h2>Your research, clearly stated.</h2>
                    </div>
                  </div>
                  <div className="form-card">
                    <label className="field">
                      <span>Research / paper title</span>
                      <input
                        maxLength={2000}
                        value={paper.result.title}
                        onChange={(e) => editResult({ title: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Research summary</span>
                      <textarea
                        rows={6}
                        value={paper.result.summary}
                        maxLength={5000}
                        onChange={(e) =>
                          editResult({ summary: e.target.value })
                        }
                      />
                    </label>
                    <div className="methods-chips">
                      {paper.result.methods.map((m, i) => (
                        <span key={i}>{m}</span>
                      ))}
                    </div>
                    <div className="field-grid">
                      <label className="field">
                        <span>Year · verify</span>
                        <input
                          value={paper.result.year}
                          onChange={(e) => editResult({ year: e.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span>Publication status · verify</span>
                        <input
                          value={paper.result.publicationStatus}
                          onChange={(e) =>
                            editResult({ publicationStatus: e.target.value })
                          }
                        />
                      </label>
                    </div>
                    <label className="field">
                      <span>Authors · verify</span>
                      <input
                        value={paper.result.authors}
                        onChange={(e) =>
                          editResult({ authors: e.target.value })
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Journal / venue · verify</span>
                      <input
                        value={paper.result.venue}
                        onChange={(e) => editResult({ venue: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Source URL / DOI link · verify</span>
                      <input
                        value={paper.result.url}
                        onChange={(e) => editResult({ url: e.target.value })}
                      />
                    </label>
                  </div>
                  <h3 className="research-subheading">
                    Suggested CV bullet points
                  </h3>
                  {paper.result.bullets.map((b, i) => (
                    <div className="bullet-review" key={i}>
                      <label className="field">
                        <span>Bullet {i + 1}</span>
                        <textarea
                          rows={3}
                          maxLength={1000}
                          value={b.text}
                          onChange={(e) =>
                            editResult({
                              bullets: paper.result!.bullets.map((x, j) =>
                                j === i ? { ...x, text: e.target.value } : x,
                              ),
                            })
                          }
                        />
                      </label>
                      <details>
                        <summary>
                          <BookOpen size={12} /> Supporting passage · page{" "}
                          {b.page}
                        </summary>
                        <blockquote>{b.evidence}</blockquote>
                      </details>
                    </div>
                  ))}
                  {paper.result.cautions.length > 0 && (
                    <div className="research-cautions">
                      <strong>Before adding this to your CV</strong>
                      <ul>
                        {paper.result.cautions.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="form-card">
                    <label className="field">
                      <span>Add to section</span>
                      <select
                        value={paper.target}
                        onChange={(e) =>
                          patch(paper.id, {
                            target: e.target.value as Paper["target"],
                            confirmed: false,
                            added: false,
                          })
                        }
                      >
                        {paper.relationship === "my_work" ? (
                          <>
                            <option value="research">
                              Research experience
                            </option>
                            <option value="publication">Publications</option>
                          </>
                        ) : (
                          <option value="literature">Literature review</option>
                        )}
                      </select>
                    </label>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={paper.includeSummary}
                        onChange={(e) =>
                          patch(paper.id, {
                            includeSummary: e.target.checked,
                            added: false,
                          })
                        }
                      />
                      <span>
                        Include the paragraph summary with the bullets
                      </span>
                    </label>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={paper.confirmed}
                        onChange={(e) =>
                          patch(paper.id, { confirmed: e.target.checked })
                        }
                      />
                      <span>
                        I checked the source passages, metadata and my
                        contribution. This wording accurately represents my
                        work.
                      </span>
                    </label>
                    <button
                      className="button primary full-width"
                      disabled={
                        !paper.confirmed ||
                        paper.added ||
                        !paper.result.title.trim() ||
                        !paper.result.bullets.some((b) => b.text.trim())
                      }
                      onClick={insert}
                    >
                      {paper.added ? <Check size={16} /> : <Plus size={16} />}{" "}
                      {paper.added
                        ? "Added to your CV"
                        : "Add reviewed entry to CV"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
      <p className="small-note">
        PDFs and generated drafts in this panel are temporary. Add reviewed
        entries to your CV before leaving this panel. Use searchable PDFs;
        scanned/image-only PDFs need OCR first. Evidence quotes are located
        automatically, but factual accuracy still needs your review.
      </p>
    </>
  );
}
