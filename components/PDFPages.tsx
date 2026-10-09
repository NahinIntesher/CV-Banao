"use client";
import { useEffect, useState } from "react";
import { safeUrl } from "@/lib/model";
type PageImage = {image: string; width: number; height: number; links: {url: string; x: number; y: number; width: number; height: number; label: string}[]};
export default function PDFPages({blob}: {blob: Blob}) {
  const [pages,setPages] = useState<PageImage[]>([]), [error,setError] = useState("");
  useEffect(() => {
    let active=true, destroy: (() => Promise<void>) | undefined;
    setError("");
    (async () => {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const task = pdfjs.getDocument({data: new Uint8Array(await blob.arrayBuffer())});
      destroy = () => task.destroy();
      const doc = await task.promise, result: PageImage[]=[];
      for (let i=1;i<=doc.numPages;i++) {
        if (!active) return;
        const page = await doc.getPage(i), viewport = page.getViewport({scale:1.8});
        const canvas = document.createElement("canvas");
        canvas.width=Math.ceil(viewport.width); canvas.height=Math.ceil(viewport.height);
        await page.render({canvas,canvasContext:canvas.getContext("2d")!,viewport}).promise;
        const links = (await page.getAnnotations()).filter(a => safeUrl(a.url || "") && a.rect).map(a => {
          const [x1,y1,x2,y2] = viewport.convertToViewportRectangle(a.rect);
          return {url:safeUrl(a.url),x:Math.min(x1,x2)/viewport.width*100,y:Math.min(y1,y2)/viewport.height*100,width:Math.abs(x2-x1)/viewport.width*100,height:Math.abs(y2-y1)/viewport.height*100,label:a.url};
        });
        result.push({image:canvas.toDataURL("image/png"),width:viewport.width,height:viewport.height,links});
        page.cleanup(); canvas.width=0; canvas.height=0;
      }
      if (active) setPages(result);
      await task.destroy(); destroy=undefined;
    })().catch(e => {if(active)setError(e.message || "Could not render PDF pages.");});
    return () => {active=false; void destroy?.();};
  },[blob]);
  return <div className="exact-pdf-pages">{error && <p role="alert">{error}</p>}{!pages.length&&!error&&<p role="status">Rendering PDF pages…</p>}{pages.map((page,i) => <div className="exact-pdf-page" key={i} style={{aspectRatio:`${page.width}/${page.height}`}}><img alt={`CV page ${i+1}`} src={page.image}/>{page.links.map((link,j) => <a className="pdf-link-hit" key={j} href={link.url} target="_blank" rel="noreferrer" aria-label={`Open ${link.label}`} title={link.label} style={{left:`${link.x}%`,top:`${link.y}%`,width:`${link.width}%`,height:`${link.height}%`}}/>)}</div>)}</div>;
}
