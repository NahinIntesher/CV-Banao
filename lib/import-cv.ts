import { pdfLayoutText } from "./pdf-layout";
import { parseStructuredText } from "./structured-import";
import { CV, Profile, uid, validateCV } from "./model";
export const IMPORT_LIMIT = 120000;
export type ImportRecord = {
  id: string;
  name: string;
  createdAt: string;
  sourceType: string;
  source: string;
  cv: CV;
  notes?: string[];
};
export const profileKeys: (keyof Profile)[] = [
  "name",
  "headline",
  "email",
  "phone",
  "location",
  "website",
  "linkedin",
  "scholar",
  "websiteLabel", "linkedinLabel", "scholarLabel",
];
export const profileLabels: Record<keyof Profile, string> = {
  name: "Full name",
  headline: "Professional headline",
  email: "Email address",
  phone: "Phone",
  location: "Location",
  website: "Website",
  linkedin: "LinkedIn",
  scholar: "Scholar / ORCID / GitHub",
  websiteLabel: "Website display name",
  linkedinLabel: "LinkedIn display name",
  scholarLabel: "Scholar / GitHub display name",
};
export function parseCVText(
  source: string,
  annotationLinks: string[] = [],
): CV {
  return parseStructuredText(source, annotationLinks);
}
export function importBackup(text: string): CV {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(
      "This JSON file cannot be read. Choose a CV Banao or CV Studio backup.",
    );
  }
  return validateCV(raw.cv ?? raw);
}
export function buildFromImport(
  target: CV,
  source: CV,
  selected: string[],
): CV {
  const next = structuredClone(target);
  if (selected.includes("profile"))
    next.profile = structuredClone(source.profile);
  if (selected.includes("summary")) next.summary = source.summary;
  const sections = source.sections
    .filter((s) => selected.includes(s.id))
    .map((s) => ({
      ...structuredClone(s),
      id: uid(),
      entries: s.entries.map((e) => ({ ...e, id: uid() })),
    }));
  // Replace matching sections, preserving destination order and unselected data.
  for (const s of sections) {
    const index = next.sections.findIndex(
      (x) => x.title.toLowerCase() === s.title.toLowerCase(),
    );
    if (index >= 0) next.sections[index] = s;
    else next.sections.push(s);
  }
  return validateCV(next);
}
export function validateImport(raw: unknown): ImportRecord {
  if (!raw || typeof raw !== "object") throw new Error("Invalid saved import");
  const r = raw as ImportRecord;
  if (
    typeof r.id !== "string" ||
    r.id.length > 200 ||
    typeof r.name !== "string" ||
    r.name.length > 120 ||
    typeof r.createdAt !== "string" ||
    typeof r.source !== "string" ||
    r.source.length > IMPORT_LIMIT ||
    typeof r.sourceType !== "string"
  )
    throw new Error("Invalid saved import");
  if (
    r.notes &&
    (!Array.isArray(r.notes) ||
      r.notes.length > 20 ||
      r.notes.some((n) => typeof n !== "string" || n.length > 1000))
  )
    throw new Error("Invalid import notes");
  return { ...r, cv: validateCV(r.cv) };
}
// Inspect ZIP directory sizes before decompressing DOCX to reject excessive documents.
export function checkDocx(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("This is not a readable DOCX file.");
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  let total = 0;
  if (count > 1000)
    throw new Error("This DOCX contains too many embedded files.");
  for (let i = 0; i < count; i++) {
    if (at + 46 > bytes.length || view.getUint32(at, true) !== 0x02014b50)
      throw new Error("Invalid DOCX directory.");
    if (view.getUint16(at + 8, true) & 1)
      throw new Error("Remove the password before importing.");
    const size = view.getUint32(at + 24, true);
    total += size;
    if (size > 20000000 || total > 50000000)
      throw new Error(
        "DOCX expanded size is too large. Export a text-only CV.",
      );
    at +=
      46 +
      view.getUint16(at + 28, true) +
      view.getUint16(at + 30, true) +
      view.getUint16(at + 32, true);
  }
}
export async function extractDocx(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  checkDocx(bytes);
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(bytes);
  const entry = zip.file("word/document.xml");
  if (!entry) throw new Error("This DOCX has no document content.");
  const xml = await entry.async("string");
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror"))
    throw new Error("The DOCX content is damaged.");
  const text = Array.from(doc.getElementsByTagNameNS("*", "p"))
    .map((p) =>
      Array.from(p.getElementsByTagNameNS("*", "t"))
        .map((t) => t.textContent)
        .join(""),
    )
    .join("\n");
  if (text.length > IMPORT_LIMIT) throw new Error("The CV text is too long.");
  if (!text.trim())
    throw new Error("No text found. Try PDF, plain text or a different DOCX.");
  return text;
}
export async function extractImport(
  file: File,
  ocr: boolean,
  progress: (message: string) => void,
  signal?: AbortSignal,
): Promise<{ source: string; cv: CV; type: string }> {
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Choose a file up to 10 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase();
  let source = "";
  if (ext === "json") {
    if (file.size > 2000000)
      throw new Error("Choose a JSON backup up to 2 MB.");
    const text = await file.text();
    const cv = importBackup(text);
    return {
      source:
        JSON.stringify(cv, null, 2).length > IMPORT_LIMIT
          ? JSON.stringify(cv, null, 2).slice(0, IMPORT_LIMIT - 60) +
            "\n[Source display truncated; full structured CV retained.]"
          : JSON.stringify(cv, null, 2),
      cv,
      type: "JSON",
    };
  }
  if (ext === "docx") {
    progress("Reading DOCX text…");
    source = await extractDocx(file);
  } else if (ext === "txt") {
    source = await file.text();
  } else if (ext === "pdf") {
    progress("Opening PDF…");
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const task = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      useSystemFonts: true,
    });
    let worker: Awaited<
      ReturnType<(typeof import("tesseract.js"))["createWorker"]>
    > | null = null;
    try {
      const doc = await task.promise;
      if (doc.numPages > 60) throw new Error("Import a CV of up to 60 pages.");
      for (let i = 1; i <= doc.numPages; i++) {
        if (signal?.aborted) throw new Error("Import cancelled.");
        progress(`Reading page ${i} of ${doc.numPages}…`);
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        let lines = pdfLayoutText(content.items, await page.getAnnotations());
        if (lines.trim().length < 30 && ocr) {
          if (doc.numPages > 12)
            throw new Error(
              "OCR supports up to 12 pages per import. Split the scanned CV first.",
            );
          if (!worker) {
            progress("Loading English OCR…");
            const { createWorker, OEM } = await import("tesseract.js");
            worker = await createWorker("eng", OEM.LSTM_ONLY, {
              workerPath: "/ocr/worker.min.js",
              corePath: "/ocr/core",
              langPath: "/ocr/lang",
              logger: (m) => {
                if (m.status === "recognizing text")
                  progress(
                    `OCR page ${i}/${doc.numPages} · ${Math.round(m.progress * 100)}%`,
                  );
              },
            });
          }
          const viewport = page.getViewport({ scale: 1.8 });
          if (
            viewport.width * viewport.height > 16000000 ||
            viewport.width > 8000 ||
            viewport.height > 8000
          )
            throw new Error(
              "This scanned page is too large for OCR. Resize it to a standard document page and retry.",
            );
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvas, viewport }).promise;
          lines = (await worker.recognize(canvas)).data.text;
          canvas.width = 0;
          canvas.height = 0;
        }
        source += `[Page ${i}]\n${lines}\n`;
        if (source.length > IMPORT_LIMIT)
          throw new Error("The CV text exceeds 120,000 characters.");
        page.cleanup();
      }
    } finally {
      if (worker) await worker.terminate();
      await task.destroy();
    }
  } else throw new Error("Choose PDF, DOCX, TXT or JSON.");
  if (signal?.aborted) throw new Error("Import cancelled.");
  if (source.trim().length < 30)
    throw new Error(
      "No usable text found. Enable OCR for a scanned PDF, or paste the CV text.",
    );
  return { source, cv: parseCVText(source), type: ext!.toUpperCase() };
}
