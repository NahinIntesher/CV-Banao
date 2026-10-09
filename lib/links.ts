import { Entry, Profile, safeUrl } from "./model";
export type LinkPart = { text: string; href?: string };
/** Small, deliberately limited inline-link syntax. Text is always escaped by the renderer. */
export function linkParts(text: string): LinkPart[] {
  const parts: LinkPart[] = [];
  const pattern = /\[([^\]\n]+)\]\(([^\s]+?)\)/g;
  let at = 0;
  for (const match of text.matchAll(pattern)) {
    const href = safeUrl(match[2]);
    if (!href) continue;
    if (match.index! > at) parts.push({ text: text.slice(at, match.index) });
    parts.push({ text: match[1], href });
    at = match.index! + match[0].length;
  }
  if (at < text.length) parts.push({ text: text.slice(at) });
  return parts.length ? parts : [{ text }];
}
export const visibleText = (text: string) => linkParts(text).map((p) => p.text).join("");
export const entryLinkLabel = (entry: Pick<Entry, "urlLabel">) => entry.urlLabel?.trim() || "Link";
export const profileLinkLabel = (p: Profile, key: "website" | "linkedin" | "scholar") => {
  const label = p[`${key}Label`]?.trim();
  return label || (key === "website" ? "Website" : key === "linkedin" ? "LinkedIn" : /github\.com/i.test(p.scholar) ? "GitHub" : /orcid\.org/i.test(p.scholar) ? "ORCID" : "Google Scholar");
};
