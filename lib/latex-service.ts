const requests = new Map<string, number[]>();
export function allowCompile(client: string) {
  const now = Date.now();
  for (const [key, list] of requests)
    if (list.every((t) => now - t > 900000)) requests.delete(key);
  const recent = (requests.get(client) ?? []).filter((t) => now - t < 900000);
  if (recent.length >= 120 || (requests.size >= 10000 && !requests.has(client)))
    return false;
  requests.set(client, [...recent, now]);
  return true;
}
export async function compileLatex(body: unknown) {
  const url = process.env.LATEX_SERVICE_URL,
    token = process.env.LATEX_SERVICE_TOKEN;
  if (!url || !token)
    throw new Error(
      "The LaTeX compiler is not configured. Start the included compiler service and set LATEX_SERVICE_URL and LATEX_SERVICE_TOKEN.",
    );
  const b = body as {
    source?: string;
    font?: string;
    customFont?: { regular: string; bold: string };
  };
  if (
    !b ||
    typeof b.source !== "string" ||
    !b.source.trim() ||
    b.source.length > 150000
  )
    throw new Error("Use nonempty LaTeX up to 150,000 characters.");
  const response = await fetch(url.replace(/\/$/, "") + "/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Latex-Token": token },
    body: JSON.stringify(b),
    signal: AbortSignal.timeout(65000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "LaTeX compilation failed.");
  return result;
}
