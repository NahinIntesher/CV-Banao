import { linkParts, LinkPart } from "./links";
import { safeUrl,fonts,Font,CV } from "./model";
export type RichRun = LinkPart & {bold?: boolean; italic?: boolean; underline?: boolean; fontSize?: number; font?: Font; color?: string};
const prefix="cvb.rich.v1:";
export function richRuns(value:string): RichRun[] {
  if(value.startsWith(prefix))try {
    const raw=JSON.parse(decodeURIComponent(Array.from(atob(value.slice(prefix.length)),c=>"%"+c.charCodeAt(0).toString(16).padStart(2,"0")).join("")));
    if(!Array.isArray(raw)||raw.length>1000)throw Error();
    let length=0;
    return raw.map((r:RichRun) => {
      if(!r||typeof r.text!=="string"||(length+=r.text.length)>20000)throw Error();
      const result:RichRun={text:r.text};
      if(r.font&&fonts.some(f=>f.id===r.font))result.font=r.font;
      if(r.href&&safeUrl(r.href))result.href=safeUrl(r.href);
      for(const k of ["bold","italic","underline"] as const)if(typeof r[k]==="boolean")result[k]=r[k];
      if(typeof r.fontSize==="number"&&r.fontSize>=8&&r.fontSize<=40)result.fontSize=r.fontSize;
      if(typeof r.color==="string"&&/^#[a-f\d]{6}$/i.test(r.color))result.color=r.color;
      return result;
    });
  }catch{return [{text:value}];}
  return linkParts(value);
}
export function encodeRich(runs:RichRun[]):string {
  const merged:RichRun[]=[];
  for(const r of runs){if(!r.text)continue;const previous=merged[merged.length-1];if(previous&&JSON.stringify({...previous,text:""})===JSON.stringify({...r,text:""}))previous.text+=r.text;else merged.push({...r});}
  if(merged.every(r=>Object.keys(r).every(k=>k==="text")))return merged.map(r=>r.text).join("");
  const binary=encodeURIComponent(JSON.stringify(merged)).replace(/%([\dA-F]{2})/g,(_,hex)=>String.fromCharCode(parseInt(hex,16)));
  return prefix+btoa(binary);
}
export const richPlain=(value:string)=>richRuns(value).map(r=>r.text).join("");
export function richLines(value:string):string[] {
  const lines:RichRun[][]=[[]];
  for(const run of richRuns(value))run.text.split("\n").forEach((text,i)=>{if(i)lines.push([]);if(text)lines[lines.length-1].push({...run,text});});
  return lines.filter(line=>line.some(r=>r.text.trim())).map(encodeRich);
}
export function withoutBullet(value:string):string {
  let skip=richPlain(value).match(/^[•*\-–—]\s+/)?.[0].length || 0;
  return encodeRich(richRuns(value).map(run=>{const n=Math.min(skip,run.text.length);skip-=n;return {...run,text:run.text.slice(n)};}));
}
const escape=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
export function richHTML(value:string):string {
  return richRuns(value).map(r=>{
    const style=[r.bold!==undefined?`font-weight:${r.bold?700:400}`:"",r.italic!==undefined?`font-style:${r.italic?"italic":"normal"}`:"",r.underline!==undefined?`text-decoration:${r.underline?"underline":"none"}`:"",r.fontSize?`font-size:${r.fontSize}pt`:"",r.color?`color:${r.color}`:"",r.font?`font-family:${fonts.find(f=>f.id===r.font)?.family}`:""].filter(Boolean).join(";");
    const text=escape(r.text).replace(/\n/g,"<br>");
    const body=style?`<span ${r.font?`data-cvb-font="${r.font}" `:""}style="${style}">${text}</span>`:text;
    return r.href?`<a href="${escape(r.href)}" target="_blank" rel="noreferrer">${body}</a>`:body;
  }).join("");
}

export function usedFonts(cv:CV):Font[] {const ids=new Set<Font>([cv.design.font]);function walk(v:unknown){if(typeof v==="string")richRuns(v).forEach(r=>{if(r.font)ids.add(r.font);});else if(v&&typeof v==="object")Object.entries(v).filter(([k])=>k!=="latex").forEach(([,v])=>walk(v));}walk(cv);return [...ids];}

export const richUpperCase=(value:string)=>encodeRich(richRuns(value).map(run=>({...run,text:run.text.toUpperCase()})));
export function joinRich(values:string[],separator:string):string {const runs:RichRun[]=[];values.filter(v=>richPlain(v).trim()).forEach((v,i)=>{if(i)runs.push({text:separator});runs.push(...richRuns(v));});return encodeRich(runs);}
