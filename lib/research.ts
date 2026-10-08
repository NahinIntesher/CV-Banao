export interface ResearchBullet {
  text: string;
  evidence: string;
  page: number;
}
export interface ResearchSummary {
  title: string;
  authors: string;
  year: string;
  venue: string;
  url: string;
  publicationStatus: string;
  summary: string;
  bullets: ResearchBullet[];
  methods: string[];
  cautions: string[];
}
export interface PDFSource {
  name: string;
  text: string;
  pages: number;
}
export const PDF_LIMITS = {
  files: 3,
  bytes: 10 * 1024 * 1024,
  pages: 60,
  characters: 120000,
};
export const normalize = (s: string) =>
  s.replace(/\s+/g, " ").trim().toLowerCase();
export function validateSummary(
  raw: unknown,
  source: PDFSource,
): ResearchSummary {
  const fail = () => {
    throw new Error("The AI returned an incomplete result. Please try again.");
  };
  if (!raw || typeof raw !== "object") return fail();
  const r = raw as ResearchSummary;
  for (const key of [
    "title",
    "authors",
    "year",
    "venue",
    "url",
    "publicationStatus",
    "summary",
  ] as const)
    if (typeof r[key] !== "string" || r[key].length > 5000) return fail();
  if (
    !Array.isArray(r.bullets) ||
    r.bullets.length > 6 ||
    !Array.isArray(r.methods) ||
    !Array.isArray(r.cautions)
  )
    return fail();
  if (
    [...r.methods, ...r.cautions].some(
      (s) => typeof s !== "string" || s.length > 2000,
    )
  )
    return fail();
  const cautions = r.cautions.slice(0, 10);
  const valid: ResearchBullet[] = [];
  for (const b of r.bullets) {
    if (
      !b ||
      typeof b.text !== "string" ||
      typeof b.evidence !== "string" ||
      b.text.length > 1000 ||
      b.evidence.length > 600 ||
      !Number.isInteger(b.page) ||
      b.page < 1 ||
      b.page > source.pages
    )
      return fail();
    const pageText =
      source.text.split(`[Page ${b.page}]`)[1]?.split(/\[Page \d+\]/)[0] ?? "";
    if (
      b.evidence.trim().length < 15 ||
      !normalize(pageText).includes(normalize(b.evidence))
    ) {
      cautions.push(
        "A bullet was omitted because its supporting passage could not be located on the cited page.",
      );
      continue;
    }
    valid.push(b);
  }
  if (!valid.length)
    throw new Error(
      "No source-supported bullets could be verified. Try a text-based PDF with a clear abstract and results section.",
    );
  return { ...r, bullets: valid, cautions: [...new Set(cautions)] };
}
export async function extractPDF(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<PDFSource> {
  if (!file.name.toLowerCase().endsWith(".pdf"))
    throw new Error("Please choose a PDF file.");
  if (file.size > PDF_LIMITS.bytes)
    throw new Error("Each PDF must be 10 MB or smaller.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!new TextDecoder().decode(bytes.slice(0, 1024)).includes("%PDF-"))
    throw new Error("This file does not look like a valid PDF.");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({ data: bytes, useSystemFonts: true });
  try {
    const doc = await task.promise;
    if (doc.numPages > PDF_LIMITS.pages)
      throw new Error(
        "Use a PDF of 60 pages or fewer. Export the relevant chapter or paper first.",
      );
    let text = "";
    let emptyPages = 0;
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const lines = content.items
        .map((item) =>
          "str" in item
            ? item.str + ("hasEOL" in item && item.hasEOL ? "\n" : " ")
            : "",
        )
        .join("")
        .trim();
      if (lines.length < 20) emptyPages++;
      text += `[Page ${i}]\n${lines}\n\n`;
      if (text.length > PDF_LIMITS.characters)
        throw new Error(
          "This PDF contains too much text. Export a shorter paper or chapter; content is never silently cut off.",
        );
      onProgress?.(i, doc.numPages);
      page.cleanup();
    }
    if (text.replace(/\[Page \d+\]/g, "").trim().length < 150)
      throw new Error(
        "No useful selectable text was found. This may be a scanned PDF. Run OCR first, then upload a searchable PDF.",
      );
    return { name: file.name, text, pages: doc.numPages };
  } catch (e) {
    if (e instanceof Error && e.name === "PasswordException")
      throw new Error(
        "This PDF is password protected. Upload an unlocked copy.",
      );
    throw e;
  } finally {
    await task.destroy();
  }
}
