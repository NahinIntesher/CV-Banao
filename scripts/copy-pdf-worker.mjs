import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
await mkdir(new URL("public", root), { recursive: true });
await copyFile(
  new URL("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", root),
  new URL("public/pdf.worker.min.mjs", root),
);
await copyFile(
  new URL("node_modules/pdfjs-dist/LICENSE", root),
  new URL("public/pdfjs-LICENSE.txt", root),
);
console.log("PDF text extraction worker and license copied");
// Local OCR assets: no third-party CDN is needed at runtime.
await mkdir(new URL("public/ocr/core/", root), { recursive: true });
await mkdir(new URL("public/ocr/lang/", root), { recursive: true });
await copyFile(
  new URL("node_modules/tesseract.js/dist/worker.min.js", root),
  new URL("public/ocr/worker.min.js", root),
);
await copyFile(
  new URL("node_modules/tesseract.js/dist/worker.min.js.LICENSE.txt", root),
  new URL("public/ocr/worker-LICENSE.txt", root),
);
await copyFile(
  new URL("node_modules/@tesseract.js-data/eng/4.0.0/eng.traineddata.gz", root),
  new URL("public/ocr/lang/eng.traineddata.gz", root),
);
const { readdir } = await import("node:fs/promises");
for (const name of await readdir(
  new URL("node_modules/tesseract.js-core/", root),
))
  if (name.endsWith(".wasm.js") || name.endsWith(".wasm") || name === "LICENSE")
    await copyFile(
      new URL("node_modules/tesseract.js-core/" + name, root),
      new URL("public/ocr/core/" + name, root),
    );
const extraFonts = [
  ["roboto", "roboto", "CVRoboto"],
  ["opensans", "open-sans", "CVOpenSans"],
  ["merriweather", "merriweather", "CVMerriweather"],
  ["baskerville", "libre-baskerville", "CVBaskerville"],
  ["noto", "noto-sans", "CVNoto"],
  ["dm", "dm-sans", "CVDM"],
];
for (const [id, pkg] of extraFonts) {
  for (const weight of [400, 700])
    await copyFile(
      new URL(
        `node_modules/@fontsource/${pkg}/files/${pkg}-latin-${weight}-normal.woff`,
        root,
      ),
      new URL(`public/fonts/${id}-${weight}.woff`, root),
    );
  await copyFile(
    new URL(`node_modules/@fontsource/${pkg}/LICENSE`, root),
    new URL(`public/fonts/${id}-LICENSE.txt`, root),
  );
}
console.log(
  "OCR worker, English language data and six additional professional fonts copied",
);
for (const weight of [400, 500, 600, 700])
  await copyFile(
    new URL(
      `node_modules/@fontsource/quicksand/files/quicksand-latin-${weight}-normal.woff`,
      root,
    ),
    new URL(`public/fonts/quicksand-${weight}.woff`, root),
  );
await copyFile(
  new URL("node_modules/@fontsource/quicksand/LICENSE", root),
  new URL("public/fonts/quicksand-LICENSE.txt", root),
);
