import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSummary } from "../lib/research";
import { POST, GET } from "../app/api/research-summary/route";
const quote =
  "The study measured water quality using a controlled laboratory experiment.";
const source = {
  name: "test.pdf",
  pages: 2,
  text: `[Page 1]\n${quote}\nThe researchers compared treatment methods using standardized measurements and documented their limitations.\n[Page 2]\nThe team reported exploratory findings.`,
};
const summary = {
  title: "Water quality study",
  authors: "",
  year: "",
  venue: "",
  url: "",
  publicationStatus: "",
  summary: "A study of water quality.",
  bullets: [
    {
      text: "Reviewed a study of laboratory water quality measurements.",
      evidence: quote,
      page: 1,
    },
  ],
  methods: ["Laboratory measurements"],
  cautions: [],
};
const input = {
  source,
  purpose: "research",
  relationship: "literature",
  role: "",
  length: "concise",
};
let n = 0;
const request = (data: unknown, code = "test-code") =>
  new Request("http://localhost/api/research-summary", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cv-access-code": code,
      "x-forwarded-for": `test-${n++}`,
    },
    body: JSON.stringify(data),
  });
test("source verification locates evidence on the correct page", () => {
  assert.equal(validateSummary(summary, source).bullets.length, 1);
  assert.throws(() =>
    validateSummary(
      { ...summary, bullets: [{ ...summary.bullets[0], page: 2 }] },
      source,
    ),
  );
  assert.throws(() =>
    validateSummary(
      {
        ...summary,
        bullets: [
          {
            ...summary.bullets[0],
            evidence: "This invented evidence does not exist in the paper.",
          },
        ],
      },
      source,
    ),
  );
});
test("invalid and unsupported AI bullets are never silently trusted", () => {
  const output = validateSummary(
    {
      ...summary,
      bullets: [
        ...summary.bullets,
        {
          text: "An invented claim.",
          evidence: "This invented evidence does not exist in the paper.",
          page: 1,
        },
      ],
    },
    source,
  );
  assert.equal(output.bullets.length, 1);
  assert.equal(output.cautions.length, 1);
  assert.throws(() => validateSummary({ title: "Incomplete" }, source));
});
test("API configuration, authentication, validation, success and refusal paths", async () => {
  const key = process.env.OPENAI_API_KEY,
    access = process.env.CV_AI_ACCESS_CODE,
    originalFetch = globalThis.fetch;
  try {
    delete process.env.OPENAI_API_KEY;
    delete process.env.CV_AI_ACCESS_CODE;
    assert.deepEqual(await (await GET()).json(), { configured: false });
    assert.equal((await POST(request(input))).status, 503);
    process.env.OPENAI_API_KEY = "test-key-not-real";
    process.env.CV_AI_ACCESS_CODE = "test-code";
    assert.equal((await POST(request(input, "wrong"))).status, 401);
    assert.equal(
      (await POST(request({ ...input, relationship: "my_work", role: "" })))
        .status,
      400,
    );
    let callBody: any;
    globalThis.fetch = (async (_url, opts) => {
      callBody = JSON.parse(String(opts?.body));
      return Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [{ type: "output_text", text: JSON.stringify(summary) }],
          },
        ],
      });
    }) as typeof fetch;
    const response = await POST(request(input));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).result.bullets.length, 1);
    assert.equal(callBody.store, false);
    assert.equal(callBody.text.format.strict, true);
    assert.ok(callBody.instructions.includes("never imply authorship"));
    globalThis.fetch = (async () =>
      Response.json({
        status: "completed",
        output: [{ content: [{ type: "refusal" }] }],
      })) as typeof fetch;
    assert.equal((await POST(request(input))).status, 422);
  } finally {
    globalThis.fetch = originalFetch;
    if (key === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = key;
    if (access === undefined) delete process.env.CV_AI_ACCESS_CODE;
    else process.env.CV_AI_ACCESS_CODE = access;
  }
});
