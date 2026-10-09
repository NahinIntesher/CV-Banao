import {usedFonts} from "./rich";
import { CV, download, filename } from "./model";
import { activeLatex } from "./latex";
export async function documentFont(id: CV["design"]["font"]) {
  if (id === "editorial") {
    const regular = localStorage.getItem("cvb:editorial:regular"),
      bold = localStorage.getItem("cvb:editorial:bold");
    if (!regular || !bold)
      throw new Error(
        "Upload your licensed Editorial regular and bold fonts in Design first.",
      );
    return { regular, bold };
  }
  const read = async (weight: number) => {
    const r = await fetch(`/fonts/${id}-${weight}.ttf`);
    if (!r.ok) throw new Error("Selected font could not load.");
    const bytes = new Uint8Array(await r.arrayBuffer());
    let value = "";
    for (const byte of bytes) value += String.fromCharCode(byte);
    return btoa(value);
  };
  const [regular, bold] = await Promise.all([read(400), read(700)]);
  return { regular, bold };
}
export async function loadEditorial() {
  const font = await documentFont("editorial");
  for (const [weight, data] of [
    [400, font.regular],
    [700, font.bold],
  ] as const) {
    const face = await new FontFace(
      "CVEditorial",
      `url(data:font/ttf;base64,${data})`,
      { weight: String(weight) },
    ).load();
    document.fonts.add(face);
  }
}
export async function exportOverleaf(cv: CV) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file("main.tex", activeLatex(cv));
  for(const id of usedFonts(cv)){
    const font=await documentFont(id);
    zip.file(`fonts/${id}-400.ttf`,font.regular,{base64:true});zip.file(`fonts/${id}-700.ttf`,font.bold,{base64:true});
    if(id!=="editorial"){const license=await fetch(`/fonts/${id}-LICENSE.txt`);if(license.ok)zip.file(`fonts/${id}-LICENSE.txt`,await license.text());}
  }
  zip.file(
    "README.txt",
    "Upload this ZIP to Overleaf as a new project. Set the compiler to XeLaTeX. Custom code may need extra files you provide. Editorial is your own licensed font.",
  );
  download(
    await zip.generateAsync({ type: "blob" }),
    filename(cv) + "-overleaf.zip",
  );
}
export const pdfBlob = (base64: string) =>
  new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], {
    type: "application/pdf",
  });
let access = "";
export const setCompilerAccess = (value: string) => {
  access = value;
};
export async function compileCV(
  cv: CV,
  source = activeLatex(cv),
  signal?: AbortSignal,
) {
  const customFont =
    cv.design.font === "editorial"
      ? await documentFont("editorial")
      : undefined;
  const response = await fetch("/api/latex", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-cv-access-code": access },
    body: JSON.stringify({ source, font: cv.design.font, customFont }),
    signal,
  });
  const out = await response.json();
  if (!response.ok) throw new Error(out.error || "Compilation failed.");
  return out;
}
