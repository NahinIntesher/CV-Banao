import {
  CV,
  Profile,
  Section,
  createCV,
  createSection,
  emptyEntry,
  uid,
  validateCV,
} from "./model";
export const IMPORT_LIMIT = 120000;
export type ImportRecord = {
  id: string;
  name: string;
  createdAt: string;
  sourceType: string;
  source: string;
  cv: CV;
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
};
const headings: [RegExp, string, Section["kind"]][] = [
  [
    /^(education|academic qualifications?|educational background)$/i,
    "Education",
    "education",
  ],
  [
    /^(work experience|professional experience|employment|experience)$/i,
    "Experience",
    "experience",
  ],
  [
    /^(research experience|research work)$/i,
    "Research experience",
    "experience",
  ],
  [/^(publications?|research publications?)$/i, "Publications", "publications"],
  [/^(projects?|research projects?)$/i, "Projects", "experience"],
  [
    /^(skills|technical skills|skills & methods)$/i,
    "Skills & methods",
    "skills",
  ],
  [
    /^(awards.*|honou?rs.*|scholarships.*)$/i,
    "Awards & scholarships",
    "experience",
  ],
  [/^(certifications?.*|training)$/i, "Certifications", "experience"],
  [/^(languages?)$/i, "Languages", "skills"],
  [/^(references?|referees)$/i, "References", "text"],
  [/^(research interests?|interests?)$/i, "Research interests", "text"],
  [/^(teaching.*)$/i, "Teaching experience", "experience"],
  [/^(volunteer.*|leadership.*)$/i, "Leadership & volunteering", "experience"],
];
export function parseCVText(source: string): CV {
  if (!source.trim()) throw new Error("Enter some CV text first.");
  if (source.length > IMPORT_LIMIT)
    throw new Error("Use up to 120,000 characters per import.");
  const cv = createCV("academic");
  cv.profile.name = "";
  cv.sections = [];
  const lines = source.replace(/\r/g, "").split("\n");
  const first = lines
    .map((l) => l.trim())
    .find((l) => l && !/^\[Page \d+\]$/.test(l));
  if (
    first &&
    first.length < 100 &&
    !/@|curriculum vitae|resume|résumé|^cv$/i.test(first) &&
    !headings.some(([re]) => re.test(first))
  )
    cv.profile.name = first;
  cv.profile.email = source.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] ?? "";
  cv.profile.phone =
    source
      .match(
        /(?:phone|mobile|tel(?:ephone)?)\s*[:：]?\s*([+\d][\d ()-]{7,22})/i,
      )?.[1]
      ?.trim() ??
    source.match(/\+\d[\d ()-]{7,20}\d/)?.[0]?.trim() ??
    source.match(/\b0\d{9,13}\b/)?.[0] ??
    "";
  if (cv.profile.phone.replace(/\D/g, "").length < 8) cv.profile.phone = "";
  const links =
    source.match(
      /(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com|github\.com|scholar\.google\.[a-z.]+|orcid\.org)\/[^\s|]+/gi,
    ) ?? [];
  for (const url of links) {
    if (url.includes("linkedin")) cv.profile.linkedin = url;
    else cv.profile.scholar = url;
  }
  let current: Section | null = null;
  let summary = false;
  let unassigned: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || /^\[Page \d+\]$/.test(line)) continue;
    const label = line.replace(/[:：]\s*$/, "");
    const h = headings.find(([re]) => re.test(label));
    if (h) {
      current = createSection(h[1], h[2]);
      current.entries[0].description = "";
      cv.sections.push(current);
      summary = false;
      continue;
    }
    if (
      /^(summary|profile|professional summary|objective|about me)$/i.test(label)
    ) {
      summary = true;
      current = null;
      continue;
    }
    if (summary) {
      cv.summary += (cv.summary ? "\n" : "") + line;
      continue;
    }
    if (current) {
      const e = current.entries[0];
      e.description += (e.description ? "\n" : "") + line;
    } else if (
      !Object.values(cv.profile).some(
        (value) => value.trim() && value.trim() === line,
      )
    )
      unassigned.push(line);
  }
  // Preserve all unclassified source lines for review; no qualifications are inferred.
  if (unassigned.length) {
    const s = createSection(
      "Unassigned information (review before use)",
      "text",
    );
    s.entries[0].description = unassigned.join("\n");
    cv.sections.push(s);
  }
  if (cv.sections.length > 40)
    throw new Error(
      "This document has too many sections. Import a shorter version.",
    );
  for (const s of cv.sections) {
    const text = s.entries[0].description;
    if (text.length > 20000) {
      s.entries = [];
      for (let i = 0; i < text.length; i += 19000)
        s.entries.push({
          ...emptyEntry(),
          description: text.slice(i, i + 19000),
        });
    }
  }
  return validateCV(cv);
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
        let lines = "";
        for (const item of content.items) {
          if ("str" in item) lines += item.str + (item.hasEOL ? "\n" : " ");
        }
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
