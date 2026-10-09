import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCVText, buildFromImport } from "../lib/import-cv";
import { createCV, validateCV } from "../lib/model";
import { generateLatex, activeLatex } from "../lib/latex";
import { pdfLayoutText } from "../lib/pdf-layout";

test("PDF links attach to the nearest row and stay inside skill records", () => {
  const text = pdfLayoutText([
    { str: "Competitive programming", width: 120, height: 10, transform: [1, 0, 0, 1, 20, 720] },
    { str: "Codeforces: 270 problems", width: 150, height: 10, transform: [1, 0, 0, 1, 20, 710] },
    { str: "LeetCode: 41 problems", width: 150, height: 10, transform: [1, 0, 0, 1, 20, 696] },
  ], [
    { url: "https://codeforces.com/profile/example", rect: [20, 708, 150, 718] },
    { url: "https://leetcode.com/u/example", rect: [20, 694, 150, 704] },
  ]);
  const cv = parseCVText(["Example Person", text].join(String.fromCharCode(10)));
  assert.equal(cv.sections[0].entries.length, 2);
  assert.equal(cv.sections[0].entries[0].url, "https://codeforces.com/profile/example");
  assert.equal(cv.sections[0].entries[1].url, "https://leetcode.com/u/example");
});

test("An academic CV fills distinct records, dates, organizations and descriptions", () => {
  const cv = parseCVText(
    `Example Person\nCSE Student\nexample@example.com | +8801234567890 | Dhaka, Bangladesh\nEDUCATION\n2022–2026    B.Sc. Computer Science, Example University\nCGPA: 3.9/4.0\n2020    HSC, Example College\nGPA: 5.0\nTeaching Experience\nTeaching Assistant    Example University\n• Guided students in algorithms.\nAcademic Grader    Example University\n• Graded assignments.\nProjects\nProject Alpha    2025\n• Built a mobile application.\n• Technologies: React Native, TypeScript.\nProject Beta    2026\n• Evaluated a model.\n`,
  );
  assert.equal(cv.profile.location, "Dhaka, Bangladesh");
  const ed = cv.sections.find((s) => s.kind === "education")!;
  assert.equal(ed.entries.length, 2);
  assert.equal(ed.entries[0].date, "2022–2026");
  assert.equal(ed.entries[0].subtitle, "Example University");
  const teaching = cv.sections.find((s) => s.title === "Teaching experience")!;
  assert.equal(teaching.entries.length, 2);
  assert.equal(teaching.entries[1].title, "Academic Grader");
  assert.equal(teaching.entries[1].subtitle, "Example University");
  const projects = cv.sections.find((s) => s.title === "Projects")!;
  assert.equal(projects.entries.length, 2);
  assert.match(projects.entries[0].description, /Technologies: React Native/);
  const target = createCV("industry");
  target.design.accent = "#883f48";
  const before = JSON.stringify(target);
  const applied = buildFromImport(target, cv, [projects.id]);
  assert.equal(JSON.stringify(target), before);
  assert.equal(applied.design.accent, "#883f48");
  assert.equal(
    applied.sections.find((s) => s.title === "Projects")?.entries.length,
    2,
  );
});
test("PDF wrapped titles and bullets remain one entry; page footers disappear", () => {
  const cv = parseCVText(
    "Example Person\nResearch Works\nBuilding Awareness among Vulnerable Popu-    2025–2026\nlations\n• Conducted interviews with participants from\nComputer Science and related areas.\nExample Person | Page 1 of 2\nResearch Works (continued)\nAnother Study    2024\n• Analyzed responses.",
  );
  const records = cv.sections[0].entries;
  assert.equal(records.length, 2);
  assert.equal(
    records[0].title,
    "Building Awareness among Vulnerable Populations",
  );
  assert.match(records[0].description, /from Computer Science/);
  assert.doesNotMatch(records[0].description, /Page 1/);
});
test("Layout text retains column boundaries and hyperlinks", () => {
  const row = pdfLayoutText(
    [
      {
        str: "Degree",
        width: 50,
        height: 10,
        transform: [1, 0, 0, 1, 20, 700],
      },
      { str: "2026", width: 25, height: 10, transform: [1, 0, 0, 1, 400, 700] },
    ],
    [{ url: "https://example.com", rect: [20, 696, 70, 706] }],
  );
  assert.match(row, /\[Degree\]\(https:\/\/example.com\/\)\s{4}2026/);
  assert.match(row, /https:\/\/example.com/);
});
test("LaTeX escapes model text, honors layout styles, and preserves custom source", () => {
  const cv = createCV("academic-reference");
  cv.profile.name = "Test & Person_1";
  cv.sections[0].entries[0].title = "BSc 100% Science";
  cv.sections[0].style = {
    headingSize: 16,
    color: "#24483F",
    spacingBefore: 8,
    divider: false,
  };
  const source = generateLatex(cv);
  assert.match(source, /Test \\& Person\\_1/);
  assert.match(source, /100\\%/);
  assert.match(source, /fontspec/);
  assert.match(source, /\\cvset\{section\.0\.headingSize\}\{16\}/);
  cv.latex = {
    mode: "custom",
    source: "\\documentclass{article}\\begin{document}Custom\\end{document}",
  };
  assert.equal(activeLatex(validateCV(cv)), cv.latex.source);
  assert.throws(() =>
    validateCV({
      ...cv,
      latex: { mode: "custom", source: "x".repeat(150001) },
    }),
  );
});
