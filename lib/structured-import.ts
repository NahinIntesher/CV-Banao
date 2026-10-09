import { linkParts, visibleText } from "./links";
import {
  CV,
  Entry,
  Kind,
  createCV,
  emptyEntry,
  uid,
  validateCV,
} from "./model";

const sections: [RegExp, string, Kind][] = [
  [
    /^(education|academic qualifications?|educational background)$/,
    "Education",
    "education",
  ],
  [
    /^(work experience|professional experience|industry experience|employment|experience)$/,
    "Work experience",
    "experience",
  ],
  [
    /^(research experience|research works?|research projects?)$/,
    "Research experience",
    "experience",
  ],
  [
    /^(teaching experience|teaching|academic experience)$/,
    "Teaching experience",
    "experience",
  ],
  [/^(selected (?:technical )?projects|projects?)$/, "Projects", "experience"],
  [
    /^(publications?|research publications?|manuscripts.*|conferences.*|presentations.*)$/,
    "Publications",
    "publications",
  ],
  [
    /^(skills.*|technical skills|programming languages|research methods)$/,
    "Skills & methods",
    "skills",
  ],
  [/^(competitive programming)$/, "Competitive programming", "skills"],
  [
    /^(awards.*|honou?rs.*|scholarships.*|grants.*)$/,
    "Awards & scholarships",
    "experience",
  ],
  [/^(certifications?.*|training)$/, "Certifications", "experience"],
  [/^(languages?)$/, "Languages", "skills"],
  [/^(references?|referees)$/, "References", "text"],
  [/^(research interests?|interests?)$/, "Research interests", "text"],
  [/^(volunteer.*|leadership.*)$/, "Leadership & volunteering", "experience"],
];
const summaryHeading =
  /^(summary|profile|professional summary|objective|about me)$/;
const normalizeHeading = (s: string) =>
  s
    .trim()
    .replace(/[:：]\s*$/, "")
    .replace(/\s*\(continued\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
const datePattern =
  /(?:\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|Spring|Summer|Fall|Autumn|Winter)\s+)?(?:\b\d{1,2}[/.])?(?:19|20)\d{2}(?:\s*[-–—]\s*(?:(?:[A-Za-z]+\s+)?(?:\d{1,2}[/.])?(?:19|20)\d{2}|Present|Current|Now|Ongoing)(?:\s*\(Expected\))?)?/i;
const bullet = /^[•●▪*\-–—]\s+/;
const institution =
  /\b(university|college|school|institute|department|laborator|center|centre|company|inc\.?|ltd\.?|corporation|coaching|qualitative study|undergraduate thesis|primary author|personal research|thesis project)\b/i;
const degree =
  /^(?:B\.?\s?Sc|M\.?\s?Sc|B\.?A\.?|M\.?A\.?|Ph\.?D|HSC|SSC|JSC|Higher Secondary|Secondary School|Junior School|Bachelor|Master|Doctor|Diploma)\b/i;
const locationPattern = /(?:\b[A-Z][\p{L}.' -]+,\s*[A-Z][\p{L}.' -]+)$/u;
const clean = (s: string) =>
  s
    .replace(/\u00ad/g, "")
    .replace(/\s+/g, " ")
    .trim();
const continuation = (s: string) =>
  /^[a-z(]/.test(s) ||
  /[.!?;]$/.test(s) ||
  /^(?:CGPA|GPA|Relevant|Datasets?|Technolog|Courses? I|Advisor|Target venue|Expected graduation)\b/i.test(
    s,
  );

function addDescription(e: Entry, text: string, wrapped = false) {
  const normalized = text.replace(bullet, "• ");
  if (wrapped && e.description)
    e.description =
      e.description.replace(/-$/, "") +
      (/[-]$/.test(e.description) ? "" : " ") +
      normalized;
  else e.description += (e.description ? "\n" : "") + normalized;
}

function structuredEntries(
  lines: string[],
  kind: Kind,
  sectionTitle: string,
): Entry[] {
  if (kind === "text")
    return [
      {
        ...emptyEntry(),
        description: lines.filter(Boolean).map(clean).join("\n"),
      },
    ];
  if (kind === "skills") {
    const records: Entry[] = [];
    let pendingUrl = "";
    for (const line of lines.filter((l) => l.trim())) {
      if (/^https?:\/\/\S+$/i.test(line.trim())) {
        if (records.length) records[records.length - 1].url = line.trim();
        else pendingUrl = line.trim();
        continue;
      }

      const parts = linkParts(line), links = parts.filter((p) => p.href);
      if (links.length === 1 && !parts.some((p) => !p.href && p.text.trim()) && records.length) {
        records[records.length-1].url = links[0].href!;
        records[records.length-1].urlLabel = links[0].text;
        continue;
      }
      const display = visibleText(line);
      const pieces = display.trim().split(/\s{2,}|:\s*/);
      records.push({
        ...emptyEntry(),
        url: links[0]?.href || pendingUrl,
        urlLabel: links[0]?.text,
        title: pieces.length > 1 ? clean(pieces.shift()!) : "",
        description: clean(pieces.join(" ") || display),
      });
      pendingUrl = "";
    }
    return records;
  }
  const bulletRecords =
    /awards|certifications/i.test(sectionTitle) &&
    bullet.test(lines.find((l) => l.trim())?.trim() ?? "");
  const result: Entry[] = [];
  let e = emptyEntry(),
    details = false,
    blank = false,
    previousBullet = false;
  const flush = () => {
    if ([e.title, e.subtitle, e.date, e.description].some(Boolean))
      result.push(e);
    e = emptyEntry();
    details = false;
    previousBullet = false;
  };
  for (const [lineIndex, raw] of lines.entries()) {
    if (!raw.trim()) {
      blank = true;
      continue;
    }
    let line = clean(raw);
    const parts = linkParts(line), labelled = parts.filter((p) => p.href);
    if (labelled.length === 1 && !parts.some((p) => !p.href && p.text.trim())) {
      e.url = labelled[0].href!; e.urlLabel = labelled[0].text;
      blank = false; continue;
    }
    const isBullet = bullet.test(line);
    if ((kind === "publications" || bulletRecords) && isBullet) {
      flush();
      e.title = line.replace(bullet, "");
      blank = false;
      continue;
    }
    if (
      !isBullet &&
      /projects/i.test(sectionTitle) &&
      /^.{1,100}\((?:React|Python|Next|Node|Java|Expo)[^)]*\):/i.test(line)
    ) {
      flush();
      const at = line.indexOf(":");
      e.title = line.slice(0, at);
      addDescription(e, line.slice(at + 1).trim());
      details = true;
      previousBullet = false;
      blank = false;
      continue;
    }
    if (
      isBullet &&
      /projects/i.test(sectionTitle) &&
      /^.[ ]+[^:]+:/.test(line) &&
      !/^[•*\-–—]\s+(datasets?|technologies|technology|tools|methods|results|features|links?)\s*:/i.test(
        line,
      )
    ) {
      flush();
      const at = line.indexOf(":");
      e.title = line.replace(bullet, "").slice(0, at - 2);
      addDescription(e, line.slice(at + 1).trim());
      details = true;
      previousBullet = false;
      blank = false;
      continue;
    }
    if (/^https?:\/\/\S+$/i.test(line)) {
      e.url = line;
      blank = false;
      continue;
    }
    if (isBullet) {
      addDescription(e, line);
      details = true;
      previousBullet = true;
      blank = false;
      continue;
    }
    const visibleLine = visibleText(line);
    const match = visibleLine.match(datePattern);
    const date =
      match &&
      (match.index === 0 ||
        !visibleLine.slice((match.index ?? 0) + match[0].length).trim() ||
        /^\s*\(Expected\)\s*$/i.test(
          visibleLine.slice((match.index ?? 0) + match[0].length),
        ))
        ? match[0]
        : "";
    const nextLine = lines.slice(lineIndex + 1).find((l) => l.trim()) ?? "";
    const nextIsMetadata =
      institution.test(nextLine) && !bullet.test(nextLine.trim());
    const columns = raw
      .trim()
      .split(/\s{2,}/)
      .map(clean)
      .filter(Boolean);
    const startsDegree = degree.test(line);
    const alignedTitle =
      columns.length > 1 && institution.test(columns.slice(1).join(" "));
    const hasNewTitle =
      !!e.title &&
      (startsDegree ||
        (date && !!e.date) ||
        (details &&
          !continuation(line) &&
          (blank || date || nextIsMetadata || alignedTitle)));
    if (hasNewTitle) flush();
    if (!e.title) {
      e.date = date;
      let withoutDate = clean(date ? line.replace(date, "") : line);
      if (columns.length > 1) {
        const nonDate = columns.filter((c) =>
          clean(date ? c.replace(date, "") : c),
        );
        e.title = clean(nonDate[0]?.replace(date, "") ?? withoutDate);
        if (nonDate.length > 1) {
          const meta = nonDate.slice(1).join(" | ");
          if (locationPattern.test(meta) && !institution.test(meta))
            e.location = meta;
          else e.subtitle = meta;
        }
      } else e.title = withoutDate;
      // Education often uses "Degree - Institution" or "HSC, College" on one line.
      if (kind === "education") {
        const split =
          e.title.match(/^(.*?)\s+(?:[-–—]|\|)\s+(.+)$/) ??
          e.title.match(
            /^(.*?(?:HSC|SSC|JSC|Engineering|Science|Arts|Business|PhD))[,]\s+(.+)$/i,
          );
        if (split && institution.test(split[2])) {
          e.title = split[1];
          e.subtitle = split[2];
        }
      }
      if (!e.title && date) {
        e.date = date;
      }
      blank = false;
      previousBullet = false;
      continue;
    }
    if (!details && !e.date && date) {
      e.date = date;
      line = clean(date ? line.replace(date, "") : line);
      if (!line) {
        blank = false;
        continue;
      }
    }
    if (
      !details &&
      !continuation(line) &&
      (institution.test(line) || columns.length > 1 || line.includes(" | "))
    ) {
      const parts = line.split(/\s*\|\s*|\s{2,}|\s*[·]\s*/).filter(Boolean);
      const location = parts.find(
        (p) => locationPattern.test(p) && !institution.test(p),
      );
      if (location) e.location = location;
      const meta = parts.filter((p) => p !== location).join(" | ");
      if (meta && !e.subtitle) e.subtitle = meta;
      else if (meta) addDescription(e, meta);
    } else if (
      !details &&
      !e.subtitle &&
      (e.title.endsWith("-") ||
        (e.title.length > 70 && line.length < 60 && !continuation(line)))
    ) {
      e.title =
        e.title.replace(/-$/, "") + (e.title.endsWith("-") ? "" : " ") + line;
    } else if (!details && locationPattern.test(line) && !e.location)
      e.location = line;
    else {
      addDescription(e, line, previousBullet && !blank);
      details = true;
    }
    previousBullet = previousBullet && !blank;
    blank = false;
  }
  flush();
  for (const record of result) {
    const parts = linkParts(record.title), links = parts.filter((p) => p.href);
    if (links.length === 1) {
      record.url = links[0].href!;
      record.urlLabel = links[0].text;
      const title = parts.filter((p) => !p.href).map((p) => p.text).join("").trim();
      record.title = title || links[0].text;
    }
  }
  return result.length ? result : [emptyEntry()];
}

/** Local, non-generative extraction. Ambiguous source stays editable for review. */
export function parseStructuredText(
  source: string,
  annotationLinks: string[] = [],
): CV {
  if (!source.trim()) throw new Error("Enter some CV text first.");
  if (source.length > 120000)
    throw new Error("Use up to 120,000 characters per import.");
  const cv = createCV("academic");
  cv.sections = [];
  const lines = source
    .replace(/\r/g, "")
    .replace(/\f/g, "\n")
    .replace(/\u00ad/g, "")
    .split("\n")
    .filter(
      (l) =>
        !/^\s*(?:\[Page \d+\]|.*\bPage\s+\d+\s+(?:of|\/)\s*\d+)\s*$/i.test(l),
    );
  const header: string[] = [],
    groups: { title: string; kind: Kind; lines: string[] }[] = [];
  let current: (typeof groups)[number] | null = null;
  let inSummary = false;
  for (const line of lines) {
    const label = normalizeHeading(line);
    const matched = sections.find(([re]) => re.test(label));
    if (summaryHeading.test(label)) {
      inSummary = true;
      current = null;
      continue;
    }
    if (matched) {
      inSummary = false;
      const title =
        matched[0].test("publications") && label !== "publications"
          ? clean(line)
          : matched[1];
      current = groups.find(
        (g) => g.title.toLowerCase() === title.toLowerCase(),
      ) ?? { title, kind: matched[2], lines: [] };
      if (!groups.includes(current)) groups.push(current);
      continue;
    }
    if (inSummary) {
      if (line.trim()) cv.summary += (cv.summary ? " " : "") + clean(line);
    } else if (current) current.lines.push(line);
    else header.push(line);
  }
  const h = header
    .map(clean)
    .filter(Boolean)
    .filter((l) => !/^(curriculum vitae|résumé|resume|cv)$/i.test(l));
  cv.profile.name =
    h.find((l) => l.length < 100 && !/@|https?:|\d{6}/.test(l)) ?? "";
  const contact = h.join("\n");
  cv.profile.email = contact.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] ?? "";
  cv.profile.phone =
    contact.match(/(?:\+\d[\d ()-]{7,20}\d|\b0\d{9,13}\b)/)?.[0]?.trim() ?? "";
  cv.profile.headline =
    h.find(
      (l) =>
        l !== cv.profile.name &&
        !/@|https?:|linkedin|github|website|\+\d|\b0\d{9}/i.test(l) &&
        !locationPattern.test(l),
    ) ?? "";
  cv.profile.location = (
    contact
      .split(/\n|\s*\|\s*|\s*[—]\s*/)
      .map(clean)
      .find(
        (l) =>
          locationPattern.test(l) &&
          !/@|\+\d/.test(l) &&
          l !== cv.profile.headline,
      ) ?? ""
  ).replace(/^[#+]\s*/, "");
  const links = [
    ...(contact.match(
      /(?:https?:\/\/|www\.)[^\s|]+|(?:linkedin\.com|github\.com|orcid\.org)\/[^\s|]+/gi,
    ) ?? []),
    ...annotationLinks,
  ];
  for (const url of links) {
    if (/linkedin\.com/i.test(url)) cv.profile.linkedin ||= url;
    else if (/github\.com|scholar\.google|orcid\.org/i.test(url))
      cv.profile.scholar ||= url;
    else if (!/mailto:|tel:/i.test(url)) cv.profile.website ||= url;
  }
  for (const part of linkParts(contact).filter((p) => p.href)) {
    const url = part.href!;
    const key = /linkedin\.com/i.test(url) ? "linkedin" : /github\.com|scholar\.google|orcid\.org/i.test(url) ? "scholar" : "website";
    cv.profile[key] = url;
    cv.profile[`${key}Label`] = part.text;
  }
  for (const group of groups)
    cv.sections.push({
      id: uid(),
      title: group.title,
      kind: group.kind,
      visible: true,
      entries: structuredEntries(group.lines, group.kind, group.title),
    });
  if (!groups.length && h.length > 3)
    cv.sections.push({
      id: uid(),
      title: "Unassigned information (review before use)",
      kind: "text",
      visible: true,
      entries: [{ ...emptyEntry(), description: h.slice(1).join("\n") }],
    });
  return validateCV(cv);
}

export function importReviewNotes(cv: CV): string[] {
  const notes: string[] = [];
  if (!cv.profile.name)
    notes.push("Check the full name: it could not be detected.");
  const missing = cv.sections
    .filter((s) => ["education", "experience"].includes(s.kind))
    .flatMap((s) =>
      s.entries
        .filter((e) => !e.title || !e.date)
        .map(
          (e) =>
            `${s.title}: ${e.title || "Untitled entry"} needs a title or date check.`,
        ),
    );
  if (missing.length) notes.push(...missing.slice(0, 12));
  notes.push(
    "Review all detected fields before applying. The original source remains available.",
  );
  return notes;
}
