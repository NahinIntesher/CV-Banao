import { timingSafeEqual } from "node:crypto";
import { allowCompile } from "@/lib/latex-service";
import { structureCV } from "@/lib/structure-cv";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const expected = process.env.CV_AI_ACCESS_CODE;
  if (!expected)
    return Response.json(
      {
        error:
          "Set a private workspace access code and configure the compiler service.",
      },
      { status: 503 },
    );
  const got = Buffer.from(req.headers.get("x-cv-access-code") ?? ""),
    want = Buffer.from(expected);
  if (got.length !== want.length || !timingSafeEqual(got, want))
    return Response.json(
      { error: "Incorrect workspace access code." },
      { status: 401 },
    );
  if (
    !allowCompile(
      req.headers.get("x-forwarded-for")?.split(",")[0] ?? "workspace",
    )
  )
    return Response.json(
      { error: "Too many compile requests." },
      { status: 429 },
    );
  const bytes = await req.arrayBuffer();
  if (bytes.byteLength > 600 * 1024)
    return Response.json({ error: "Input is too large." }, { status: 413 });
  try {
    return Response.json(
      await structureCV(JSON.parse(new TextDecoder().decode(bytes)).source),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Compilation failed." },
      { status: 422 },
    );
  }
}
