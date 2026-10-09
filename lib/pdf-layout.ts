import { safeUrl } from "./model";
/** Keep PDF columns and turn annotation rectangles into labelled inline links. */
export function pdfLayoutText(items: unknown[], annotations: unknown[] = []): string {
  type Item = { str: string; transform: number[]; width: number; height: number };
  type Annotation = { url: string; rect: number[] };
  const rows: { y: number; height: number; items: Item[]; links: Annotation[] }[] = [];
  for (const value of items) {
    const item = value as Item;
    if (!item || typeof item.str !== "string" || !item.str.trim() || !Array.isArray(item.transform)) continue;
    const y = item.transform[5];
    let row = rows.find((r) => Math.abs(r.y - y) < 2.5);
    if (!row) { row = { y, height: Math.abs(item.height) || 10, items: [], links: [] }; rows.push(row); }
    row.items.push(item);
  }
  rows.sort((a, b) => b.y - a.y);
  for (const value of annotations) {
    const a = value as Annotation;
    if (!a || !safeUrl(a.url) || !Array.isArray(a.rect) || a.rect.length !== 4) continue;
    const y = (a.rect[1] + a.rect[3]) / 2;
    const row = rows.reduce<(typeof rows)[number] | undefined>((best, r) => !best || Math.abs(r.y - y) < Math.abs(best.y - y) ? r : best, undefined);
    if (row && Math.abs(row.y - y) < row.height + 5) row.links.push(a);
  }
  return rows.map((row, index) => {
    row.items.sort((a,b) => a.transform[4] - b.transform[4]);
    let line = "", right = 0;
    const glyphs: {start: number; end: number; left: number; right: number}[] = [];
    row.items.forEach((item,i) => {
      const x = item.transform[4], gap = x - right;
      if (i) line += gap > Math.max(12,row.height) ? "    " : gap > 1 ? " " : "";
      for (let j=0;j<item.str.length;j++) glyphs.push({start:line.length+j,end:line.length+j+1,left:x+item.width*j/item.str.length,right:x+item.width*(j+1)/item.str.length});
      line += item.str; right = x+item.width;
    });
    const ranges = row.links.map((a) => {
      const covered = glyphs.filter(g => (g.left+g.right)/2 >= a.rect[0]-1 && (g.left+g.right)/2 <= a.rect[2]+1);
      return covered.length ? {start:covered[0].start,end:covered[covered.length-1].end,url:safeUrl(a.url)} : null;
    }).filter((r): r is NonNullable<typeof r> => !!r).sort((a,b) => b.start-a.start);
    let boundary = line.length;
    for (const range of ranges) {
      if (range.end > boundary) continue;
      const raw = line.slice(range.start,range.end);
      const label = raw.trim().replace(/^\[|\]$/g, "") || "Link";
      line = line.slice(0,range.start) + `[${label}](${range.url})` + line.slice(range.end);
      boundary = range.start;
    }
    const blank = index && rows[index-1].y-row.y > row.height*1.8 ? "\n" : "";
    return blank+line.trim();
  }).join("\n");
}
