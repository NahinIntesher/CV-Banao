"use client";
import { useEffect, useMemo, useState } from "react";
import { Code2, Download, Play, RotateCcw } from "lucide-react";
import ResizableSplit from "./ResizableSplit";
import PDFPages from "./PDFPages";
import {extractImport} from "@/lib/import-cv";
import { CV, download, filename } from "@/lib/model";
import { activeLatex,latexToVisual } from "@/lib/latex";
import {
  compileCV,
  exportOverleaf,
  loadEditorial,
  pdfBlob,
  setCompilerAccess,
} from "@/lib/fonts";
export function EditorialUploader({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [files, setFiles] = useState({ regular: false, bold: false });
  const upload = async (file: File | undefined, weight: "regular" | "bold") => {
    if (!file) return;
    try {
      if (!/\.(ttf|otf)$/i.test(file.name) || file.size > 1024 * 1024)
        throw new Error("Choose a TTF/OTF font up to 1 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      let value = "";
      for (const b of bytes) value += String.fromCharCode(b);
      const encoded = btoa(value);
      if (!/^(AAEAAA|T1RUTw|dHJ1ZQ)/.test(encoded))
        throw new Error("Invalid font file.");
      localStorage.setItem("cvb:editorial:" + weight, encoded);
      setFiles({ ...files, [weight]: true });
      if (
        localStorage.getItem("cvb:editorial:regular") &&
        localStorage.getItem("cvb:editorial:bold")
      ) {
        await loadEditorial();
        notify("Editorial fonts saved on this device.");
      }
    } catch (e) {
      notify((e as Error).message);
    }
  };
  return (
    <section className="feature-card">
      <h3>Use your Editorial font</h3>
      <p>
        Upload your licensed regular and bold TTF/OTF files, up to 1 MB each.
        They stay on this device and are sent to your compiler only when
        compiling.
      </p>
      {(["regular", "bold"] as const).map((weight) => (
        <label className="font-upload" key={weight}>
          {files[weight] ? "Selected" : "Upload"} {weight}
          <input
            type="file"
            accept=".ttf,.otf"
            onChange={(e) => void upload(e.target.files?.[0], weight)}
          />
        </label>
      ))}
    </section>
  );
}
export default function LatexStudio({
  cv,
  onChange,
  notify,
}: {
  cv: CV;
  onChange: (part: Partial<CV>) => void;
  notify: (message: string) => void;
}) {
  const source = activeLatex(cv);
  const [syncIssues,setSyncIssues]=useState<string[]>([]);
  const [code, setCode] = useState(""),
    [auto, setAuto] = useState(true),
    [manual, setManual] = useState<{ source: string; nonce: number } | null>(
      null,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<{
      source: string;
      font: CV["design"]["font"];
      pdf: string;
      pages: string[];
      pageCount: number;
      warnings: string[];
    } | null>(null);
  const compiledBlob=useMemo(()=>result ? pdfBlob(result.pdf) : null,[result]);
  const compileSource = auto ? source : (manual?.source ?? ""),
    nonce = manual?.nonce ?? 0;
  useEffect(() => {
    if (!code || !compileSource) return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        setBusy(true);
        setError("");
        try {
          const out = await compileCV(cv, compileSource, controller.signal);
          if (active) setResult({ ...out, source: compileSource, font: cv.design.font });
        } catch (e) {
          if (active && (e as Error).name !== "AbortError")
            setError((e as Error).message);
        } finally {
          if (active) setBusy(false);
        }
      },
      auto ? 1600 : 100,
    );
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
      setBusy(false);
    };
  }, [compileSource, nonce, code, auto, cv.design.font]);
  const action = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      notify((e as Error).message);
    }
  };
  return (
    <section className="latex-studio">
      <div className="feature-title">
        <Code2 />
        <h2>LaTeX & PDF studio</h2>
      </div>
      <p>
        Edit text and formatting in either mode. Supported changes update the other
        editor automatically; any unsupported part is identified below.
      </p>
      <div className="compiler-toolbar">
        <label>
          Workspace access code
          <input
            type="password"
            value={code}
            autoComplete="off"
            onChange={(e) => {
              setCode(e.target.value);
              setCompilerAccess(e.target.value);
            }}
            placeholder="Your private compiler access code"
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => {
              setAuto(e.target.checked);
              setManual(null);
            }}
          />{" "}
          Compile automatically
        </label>
        <button
          className="primary"
          disabled={busy || !code}
          onClick={() => setManual({ source, nonce: Date.now() })}
        >
          <Play size={15} />
          {busy ? "Compiling…" : "Compile now"}
        </button>
        <button onClick={() => void action(() => exportOverleaf(cv))}>
          <Download size={15} />
          Overleaf ZIP
        </button>
      </div>
      <div className="sync-status" role="status">{syncIssues.length ? <><strong>Some parts could not sync</strong><ul>{syncIssues.map((issue,i)=><li key={i}>{issue}</li>)}</ul><p>Your code is preserved. Supported fields continue to sync.</p></> : "Two-way editing · text, links, inline formatting and supported CV layout settings sync with the visual editor."}</div>
      <ResizableSplit left={
        <section className="feature-card">
          <div className="feature-title">
            <h3>LaTeX source</h3>
            <span>
              {cv.latex?.mode === "custom"
                ? "Custom code"
                : "Generated from CV"}
            </span>
          </div>
          <textarea
            aria-label="XeLaTeX source"
            className="latex-code"
            spellCheck={false}
            wrap="off"
            value={source}
            maxLength={150000}
            onChange={(e) => {
              const value=e.target.value,textarea=e.target,position=textarea.selectionStart;
              try {
                const result=latexToVisual(value);setSyncIssues(result.issues);
                onChange({...result.cv,id:cv.id,label:cv.label,latex:result.compatible&&!result.issues.length?{mode:"generated",source:""}:{mode:"custom",source:value}});
                requestAnimationFrame(()=>textarea.setSelectionRange(position,position));
              }catch(error){setSyncIssues([(error as Error).message]);onChange({latex:{mode:"custom",source:value}});}
            }}
          />
          <div className="compiler-toolbar">
            <button
              onClick={() => {
                if (
                  cv.latex?.mode !== "custom" ||
                  window.confirm(
                    "Replace custom LaTeX with code generated from the current CV?",
                  )
                )
                  onChange({ latex: { mode: "generated", source: "" } });
              }}
            >
              <RotateCcw size={15} />
              Regenerate
            </button>
            <button
              onClick={() =>
                download(
                  new Blob([source], { type: "text/plain" }),
                  filename(cv) + ".tex",
                )
              }
            >
              <Download size={15} />
              .tex
            </button>
          </div>
        </section>} right={<section className="feature-card">
          <h3>Compiled PDF</h3>
          <p role="status">
            {busy
              ? "Compiling…"
              : result
                ? `${result.pageCount} pages · ${result.source === source && result.font === cv.design.font ? "Up to date" : "Previous version"}`
                : "Connect the included compiler backend to see compiled pages."}
          </p>
          {error && (
            <pre role="alert" className="compile-error">
              {error}
            </pre>
          )}
          {result?.warnings.map((w, i) => (
            <p key={i} className="preview-warning">
              {w}
            </p>
          ))}
          {compiledBlob && <PDFPages blob={compiledBlob} />}
          {compiledBlob && cv.latex?.mode === "custom" && <button disabled={busy || result?.source !== source} onClick={()=>void action(async()=>{
            const recovered=await extractImport(new File([compiledBlob],"compiled-cv.pdf",{type:"application/pdf"}),false,()=>{});
            const count=recovered.cv.sections.reduce((n,s)=>n+s.entries.length,0);
            if(window.confirm(`Recovered ${recovered.cv.sections.length} sections and ${count} entries. Apply them to the visual editor? Review inferred fields afterwards. Custom layout stays in your LaTeX code.`)){
              onChange({...recovered.cv,id:cv.id,label:cv.label,template:cv.template,design:cv.design,latex:{mode:"custom",source}});
              setSyncIssues(["Recovered editable text and links from the compiled PDF. Review inferred fields. Custom layout and commands remain in LaTeX."]);
            }
          })}>Recover visual fields from custom PDF</button>}
          <button
            className="primary"
            disabled={!result || result.source !== source || result.font !== cv.design.font || busy}
            onClick={() =>
              result && download(pdfBlob(result.pdf), filename(cv) + ".pdf")
            }
          >
            <Download size={15} />
            Download this PDF
          </button>
        </section>} />
    </section>
  );
}
