export type Purpose = "academic" | "research" | "phd" | "industry";
export type Template =
  Purpose | `${Purpose}-${"minimal" | "rail" | "banner" | "editorial"}`;
export type Font =
  | "inter"
  | "lora"
  | "source"
  | "garamond"
  | "roboto"
  | "opensans"
  | "merriweather"
  | "baskerville"
  | "noto"
  | "dm";
export type Kind =
  "experience" | "education" | "publications" | "skills" | "text";
export interface Entry {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  date: string;
  url: string;
  description: string;
}
export interface Section {
  id: string;
  title: string;
  kind: Kind;
  visible: boolean;
  entries: Entry[];
}
export interface Profile {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  scholar: string;
}
export interface CV {
  id: string;
  label: string;
  template: Template;
  profile: Profile;
  summary: string;
  sections: Section[];
  design: {
    font: Font;
    accent: string;
    textColor: string;
    fontSize: number;
    lineHeight: number;
    margins: number;
    spacing: number;
    paper: "A4" | "LETTER";
    pageNumbers: boolean;
  };
  updatedAt: string;
}
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `cv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const templates: {
  id: Template;
  name: string;
  category: string;
  description: string;
  color: string;
  font: Font;
}[] = [
  {
    id: "academic",
    name: "The Scholar",
    category: "Academic",
    description:
      "A classic centered header and refined serif typography. Space for a complete academic record.",
    color: "#344955",
    font: "garamond",
  },
  {
    id: "research",
    name: "The Researcher",
    category: "Research",
    description:
      "Strong section hierarchy for research experience, publications, methods and impact.",
    color: "#16736b",
    font: "source",
  },
  {
    id: "phd",
    name: "The Fellow",
    category: "PhD / Higher study",
    description:
      "An elegant application CV that puts education, research interests and potential first.",
    color: "#5945a5",
    font: "lora",
  },
  {
    id: "industry",
    name: "The Professional",
    category: "Industry",
    description:
      "A clean, single-column résumé focused on experience, achievements and practical skills.",
    color: "#263d62",
    font: "inter",
  },
];
const variantNames: Record<Purpose, string[]> = {
  academic: [
    "The Archivist",
    "The Lecturer",
    "The Collegiate",
    "The Historian",
  ],
  research: [
    "The Analyst",
    "The Investigator",
    "The Scientist",
    "The Explorer",
  ],
  phd: ["The Candidate", "The Graduate", "The Aspirant", "The Laureate"],
  industry: [
    "The Executive",
    "The Strategist",
    "The Consultant",
    "The Specialist",
  ],
};
const variants = ["minimal", "rail", "banner", "editorial"] as const;
const variantFonts: Font[] = ["noto", "dm", "roboto", "baskerville"];
for (const base of [...templates])
  variants.forEach((v, i) =>
    templates.push({
      ...base,
      id: `${base.id as Purpose}-${v}`,
      name: variantNames[base.id as Purpose][i],
      font: variantFonts[i],
      description: [
        "Quiet typography, generous whitespace and understated section rules.",
        "An accent rail, aligned header and clear compact section hierarchy.",
        "A framed masthead with subtle tinted headings for a confident first impression.",
        "An editorial header and letter-spaced section labels with a refined reading rhythm.",
      ][i],
    }),
  );
export const purposeOf = (id: Template): Purpose => id.split("-")[0] as Purpose;
export const layoutOf = (id: Template) =>
  id.includes("-") ? id.split("-")[1] : "classic";
export const templateDetails = (id: Template) =>
  templates.find((t) => t.id === id)!;
export const fonts: { id: Font; name: string; family: string }[] = [
  { id: "inter", name: "Inter", family: "CVInter" },
  { id: "source", name: "Source Sans 3", family: "CVSource" },
  { id: "lora", name: "Lora", family: "CVLora" },
  { id: "garamond", name: "EB Garamond", family: "CVGaramond" },
  { id: "roboto", name: "Roboto", family: "CVRoboto" },
  { id: "opensans", name: "Open Sans", family: "CVOpenSans" },
  { id: "merriweather", name: "Merriweather", family: "CVMerriweather" },
  { id: "baskerville", name: "Libre Baskerville", family: "CVBaskerville" },
  { id: "noto", name: "Noto Sans", family: "CVNoto" },
  { id: "dm", name: "DM Sans", family: "CVDM" },
];
export const colors = [
  "#5945a5",
  "#263d62",
  "#16736b",
  "#344955",
  "#883f48",
  "#876531",
  "#1f2937",
  "#43558d",
];
export const emptyEntry = (): Entry => ({
  id: uid(),
  title: "",
  subtitle: "",
  location: "",
  date: "",
  url: "",
  description: "",
});
export function createSection(title: string, kind: Kind): Section {
  return { id: uid(), title, kind, visible: true, entries: [emptyEntry()] };
}
const outlines: Record<Purpose, [string, Kind][]> = {
  academic: [
    ["Education", "education"],
    ["Research interests", "text"],
    ["Research experience", "experience"],
    ["Publications", "publications"],
    ["Teaching experience", "experience"],
    ["Awards & scholarships", "experience"],
    ["Skills & methods", "skills"],
    ["References", "text"],
  ],
  research: [
    ["Research interests", "text"],
    ["Research experience", "experience"],
    ["Publications", "publications"],
    ["Education", "education"],
    ["Research methods", "skills"],
    ["Grants & awards", "experience"],
    ["Conferences & presentations", "publications"],
  ],
  phd: [
    ["Education", "education"],
    ["Research interests", "text"],
    ["Research experience", "experience"],
    ["Publications", "publications"],
    ["Projects", "experience"],
    ["Awards & scholarships", "experience"],
    ["Skills & methods", "skills"],
    ["References", "text"],
  ],
  industry: [
    ["Work experience", "experience"],
    ["Projects", "experience"],
    ["Education", "education"],
    ["Technical skills", "skills"],
    ["Certifications", "experience"],
    ["Languages", "skills"],
  ],
};
export function createCV(template: Template = "phd"): CV {
  const t = templates.find((t) => t.id === template)!;
  return {
    id: uid(),
    label: "Untitled CV",
    template,
    profile: {
      name: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
      scholar: "",
    },
    summary: "",
    sections: outlines[purposeOf(template)].map(([title, kind]) =>
      createSection(title, kind),
    ),
    design: {
      font: t.font,
      accent: t.color,
      textColor: "#202633",
      fontSize: 10.5,
      lineHeight: 1.4,
      margins: 42,
      spacing: 14,
      paper: "A4",
      pageNumbers: true,
    },
    updatedAt: new Date().toISOString(),
  };
}
export const filledEntry = (e: Entry) =>
  Boolean(
    [e.title, e.subtitle, e.location, e.date, e.url, e.description].some((s) =>
      s.trim(),
    ),
  );
export function safeUrl(value: string): string {
  if (!value.trim()) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return ["http:", "https:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : "";
  } catch {
    return "";
  }
}
export const filename = (cv: CV) =>
  (cv.profile.name || cv.label || "my-cv")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "") || "my-cv";
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function validateCV(raw: unknown): CV {
  const fail = () => {
    throw new Error(
      "This is not a valid CV Banao backup. Import a JSON file exported by this app.",
    );
  };
  if (!raw || typeof raw !== "object") return fail();
  const c = raw as CV;
  const str = (x: unknown, max = 20000) =>
    typeof x === "string" && x.length <= max;
  if (
    !str(c.id, 200) ||
    !str(c.label, 120) ||
    !templates.some((t) => t.id === c.template) ||
    !c.profile ||
    !str(c.summary) ||
    !Array.isArray(c.sections) ||
    c.sections.length > 40
  )
    return fail();
  for (const k of [
    "name",
    "headline",
    "email",
    "phone",
    "location",
    "website",
    "linkedin",
    "scholar",
  ] as const)
    if (!str(c.profile[k], 2000)) return fail();
  const ids = new Set<string>();
  for (const s of c.sections) {
    if (
      !s ||
      !str(s.id, 200) ||
      ids.has(s.id) ||
      !str(s.title, 120) ||
      !["experience", "education", "publications", "skills", "text"].includes(
        s.kind,
      ) ||
      typeof s.visible !== "boolean" ||
      !Array.isArray(s.entries) ||
      s.entries.length > 100
    )
      return fail();
    ids.add(s.id);
    const entryIds = new Set<string>();
    for (const e of s.entries) {
      if (!e) return fail();
      for (const k of [
        "id",
        "title",
        "subtitle",
        "location",
        "date",
        "url",
        "description",
      ] as const)
        if (!str(e[k])) return fail();
      if (entryIds.has(e.id)) return fail();
      entryIds.add(e.id);
    }
  }
  const d = c.design;
  if (d && d.textColor === undefined) d.textColor = "#202633";
  if (
    !d ||
    !fonts.some((f) => f.id === d.font) ||
    !/^#[0-9a-f]{6}$/i.test(d.accent) ||
    !/^#[0-9a-f]{6}$/i.test(d.textColor) ||
    !["A4", "LETTER"].includes(d.paper) ||
    typeof d.pageNumbers !== "boolean"
  )
    return fail();
  for (const [key, min, max] of [
    ["fontSize", 8, 14],
    ["lineHeight", 1.1, 1.8],
    ["margins", 24, 64],
    ["spacing", 8, 24],
  ] as const)
    if (
      typeof d[key] !== "number" ||
      !Number.isFinite(d[key]) ||
      d[key] < min ||
      d[key] > max
    )
      return fail();
  return structuredClone(c);
}
export function plainText(cv: CV): string {
  const p = cv.profile;
  return [
    p.name,
    p.headline,
    [p.email, p.phone, p.location].filter(Boolean).join(" | "),
    [p.website, p.linkedin, p.scholar].filter(Boolean).join("\n"),
    cv.summary,
    ...cv.sections
      .filter((s) => s.visible && s.entries.some(filledEntry))
      .map(
        (s) =>
          `${s.title.toUpperCase()}\n${s.entries
            .filter(filledEntry)
            .map((e) =>
              [
                e.title,
                [e.subtitle, e.location, e.date].filter(Boolean).join(" | "),
                e.url,
                e.description,
              ]
                .filter(Boolean)
                .join("\n"),
            )
            .join("\n\n")}`,
      ),
  ]
    .filter(Boolean)
    .join("\n\n");
}
export function checks(cv: CV) {
  return [
    {
      label: "Add your full name",
      done: !!cv.profile.name.trim(),
      target: "profile",
    },
    {
      label: "Include a valid email address",
      done: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cv.profile.email),
      target: "profile",
    },
    {
      label: "Write a short profile or objective",
      done: !!cv.summary.trim(),
      target: "profile",
    },
    {
      label: "Add your education",
      done: cv.sections.some(
        (s) =>
          s.kind === "education" &&
          s.visible &&
          s.entries.some((e) => e.title.trim()),
      ),
      target: cv.sections.find((s) => s.kind === "education")?.id || "profile",
    },
    {
      label: "Describe your experience or research",
      done: cv.sections.some(
        (s) =>
          s.visible &&
          s.kind === "experience" &&
          s.entries.some((e) => e.description.trim()),
      ),
      target: cv.sections.find((s) => s.kind === "experience")?.id || "profile",
    },
  ];
}
