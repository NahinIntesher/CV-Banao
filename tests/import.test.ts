import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createCV,
  fonts,
  templates,
  validateCV,
  purposeOf,
  layoutOf,
} from "../lib/model";
import {
  buildFromImport,
  parseCVText,
  importBackup,
  checkDocx,
  validateImport,
} from "../lib/import-cv";
import { readWorkspaceBackup, defaultWorkspace } from "../lib/workspace";
test("Reference formats and additional fonts preserve existing templates and purpose support", () => {
  assert.equal(templates.length, 22);
  assert.equal(new Set(templates.map((t) => t.id)).size, 22);
  assert.equal(fonts.length, 15);
  for (const t of templates) {
    const c = createCV(t.id);
    assert.equal(validateCV(c).template, t.id);
    assert.ok(c.sections.some((s) => s.kind === "education"));
    assert.ok(
      ["academic", "research", "phd", "industry"].includes(purposeOf(t.id)),
    );
  }
  assert.equal(new Set(templates.map((t) => layoutOf(t.id))).size, 7);
  for (const f of fonts) {
    const c = createCV();
    c.design.font = f.id;
    assert.equal(validateCV(c).design.font, f.id);
  }
});
test("text import preserves source content and never fabricates absent qualifications", () => {
  const text =
    "Example Person\nexample@example.com\nEducation\nBSc Biology\nExample University\nSkills\nPython, statistics\n";
  const c = parseCVText(text);
  assert.equal(c.profile.name, "Example Person");
  assert.equal(c.profile.email, "example@example.com");
  assert.equal(c.profile.location, "");
  assert.equal(
    c.sections.find((s) => s.kind === "education")?.entries[0].title,
    "BSc Biology",
  );
  assert.ok(
    c.sections.some((s) =>
      s.entries.some((e) => e.description.includes("Python, statistics")),
    ),
  );
  assert.throws(() => parseCVText(""));
  assert.throws(() => parseCVText("x".repeat(120001)));
});
test("selective imports update only selected data with fresh ids and no source mutation", () => {
  const target = createCV("industry-banner");
  target.profile.name = "Existing";
  target.summary = "Keep summary";
  const source = parseCVText("Imported Person\nEducation\nNew qualification");
  const snapshot = JSON.stringify(source);
  const selected = source.sections.find((s) => s.kind === "education")!;
  const next = buildFromImport(target, source, [selected.id]);
  assert.equal(next.id, target.id);
  assert.equal(next.profile.name, "Existing");
  assert.equal(next.summary, "Keep summary");
  assert.equal(next.template, target.template);
  assert.notEqual(
    next.sections.find((s) => s.kind === "education")?.id,
    selected.id,
  );
  assert.equal(JSON.stringify(source), snapshot);
  const personal = buildFromImport(target, source, ["profile"]);
  assert.equal(personal.profile.name, "Imported Person");
  assert.equal(target.profile.name, "Existing");
});
test("legacy CV backups and full workspace backup restore validate", () => {
  const cv = createCV();
  assert.equal(
    importBackup(JSON.stringify({ format: "cv-studio", version: 1, cv }))
      .template,
    "phd",
  );
  const w = defaultWorkspace();
  const payload = {
    format: "cv-banao-workspace",
    version: 1,
    workspace: w,
    docs: [cv],
  };
  assert.equal(readWorkspaceBackup(JSON.stringify(payload)).docs.length, 1);
  assert.throws(() =>
    readWorkspaceBackup(JSON.stringify({ ...payload, docs: [cv, cv] })),
  );
  assert.throws(() => validateImport({ id: "a" }));
  assert.throws(() => checkDocx(new Uint8Array([0, 1, 2])));
});
