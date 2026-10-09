"use client";
import { useEffect,useState } from "react";
import { CV } from "@/lib/model";
import { createPDF } from "@/lib/pdf";
import PDFPages from "./PDFPages";
export default function ExactPDFPreview({cv}: {cv:CV}) {
  const [result,setResult]=useState<{key:string;blob:Blob}|null>(null),[error,setError]=useState(""),[zoom,setZoom]=useState("fit");
  const key=JSON.stringify(cv);
  useEffect(() => {
    let active=true;
    const timer=setTimeout(() => {setError("");createPDF(cv).then(blob => {if(active)setResult({key,blob});}).catch(e => {if(active)setError(e.message);});},350);
    return () => {active=false;clearTimeout(timer);};
  },[key]);
  return <section className="preview-pane" aria-label="Exact PDF live preview"><div className="preview-toolbar"><div><span className="live-dot"/> Live PDF <span className="preview-paper-label">{cv.design.paper}</span></div><select aria-label="PDF preview zoom" value={zoom} onChange={e=>setZoom(e.target.value)}><option value="fit">Fit to width</option><option value="80">80%</option><option value="100">100%</option></select></div><div className="preview-scroll"><p className="pdf-render-status" role="status">{error || (result?.key===key ? "Up to date · preview and download use the same PDF" : "Updating PDF…")}</p><div className="exact-pdf-stage" style={{width:zoom==="fit" ? "100%" : (cv.design.paper==="A4" ? 794 : 816)*Number(zoom)/100,maxWidth:zoom==="fit" ? 850 : undefined}}>{result && <PDFPages blob={result.blob}/>}</div></div></section>;
}
