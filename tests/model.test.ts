import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createCV,
  createSection,
  validateCV,
  plainText,
  safeUrl,
  checks,
} from "../lib/model";
test("all four presets have unique sections and validate", () => {
  for (const t of ["academic", "research", "phd", "industry"] as const) {
    const cv = createCV(t);
    assert.equal(validateCV(cv).template, t);
    assert.equal(
      new Set(cv.sections.map((s) => s.id)).size,
      cv.sections.length,
    );
    assert.ok(cv.sections.some((s) => s.kind === "education"));
  }
});
test("exports exclude hidden and empty sections", () => {
  const cv = createCV();
  cv.profile.name = "Test Person";
  cv.sections[0].entries[0].title = "BSc";
  const hidden = createSection("Private note", "text");
  hidden.entries[0].description = "DO NOT EXPORT";
  hidden.visible = false;
  cv.sections.push(hidden);
  const text = plainText(cv);
  assert.ok(text.includes("BSc"));
  assert.ok(!text.includes("DO NOT EXPORT"));
  assert.ok(!text.includes("PUBLICATIONS"));
});
test("rejects hostile or invalid backups", () => {
  const cv = createCV();
  assert.throws(() => validateCV(null));
  assert.throws(() =>
    validateCV({
      ...cv,
      design: { ...cv.design, accent: "red;position:fixed" },
    }),
  );
  assert.throws(() =>
    validateCV({ ...cv, design: { ...cv.design, fontSize: 100 } }),
  );
  assert.throws(() =>
    validateCV({ ...cv, sections: [cv.sections[0], cv.sections[0]] }),
  );
  assert.throws(() =>
    validateCV({ ...cv, profile: { name: "Only one field" } }),
  );
});
test("URL validation permits web URLs only", () => {
  assert.equal(safeUrl("example.com"), "https://example.com/");
  assert.equal(
    safeUrl("https://example.com/paper?q=test"),
    "https://example.com/paper?q=test",
  );
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("https://user:pass@example.com"), "");
  assert.equal(safeUrl(""), "");
});
test("content checks respond to real content", () => {
  const cv = createCV();
  assert.equal(checks(cv).filter((c) => c.done).length, 0);
  cv.profile.name = "Nahin Intesher";
  cv.profile.email = "invalid";
  assert.equal(checks(cv).filter((c) => c.done).length, 1);
  cv.profile.email = "test@example.com";
  assert.equal(checks(cv).filter((c) => c.done).length, 2);
});
