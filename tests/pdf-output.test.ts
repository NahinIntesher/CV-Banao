import {test} from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createCV} from "../lib/model";
import {encodeRich} from "../lib/rich";
import {createPDF} from "../lib/pdf";
test("Live preview and export share PDF bytes with styled, named hyperlinks",async()=>{
 const server=createServer(async(req,res)=>{try{const path=req.url||"";if(!/^\/fonts\/[a-z]+-(400|700)(-italic)?\.woff$/.test(path)){res.writeHead(404).end();return;}res.end(await readFile(resolve("public"+path)));}catch{res.writeHead(404).end();}});
 await new Promise<void>(done=>server.listen(0,"127.0.0.1",done));const port=(server.address() as {port:number}).port;
 Object.assign(globalThis,{window:{location:{origin:`http://127.0.0.1:${port}`}}});
 try{
  const cv=createCV("academic-reference");cv.profile.name="Example Person";cv.profile.website="https://example.com";cv.profile.websiteLabel="Website";cv.profile.linkedin="https://linkedin.com/in/example";cv.profile.linkedinLabel="LinkedIn";cv.profile.scholar="https://github.com/example";cv.profile.scholarLabel="GitHub";
  cv.sections[0].entries[0].title="Bachelor of Science";cv.sections[0].entries[0].description=encodeRich([{text:"Research work",bold:true,italic:true,font:"newsreader",color:"#883f48"}]);
  const preview=createPDF(cv),download=createPDF(structuredClone(cv));assert.equal(preview,download);
  const a=await preview,b=await download;assert.equal(a,b);assert.equal(a.type,"application/pdf");const bytes=Buffer.from(await a.arrayBuffer());assert.equal(bytes.subarray(0,5).toString(),"%PDF-");assert.ok(bytes.length>5000);
  const extracted=spawnSync("pdftotext",["-bbox","-","-"],{input:bytes,encoding:"utf8"});
  if(extracted.error && (extracted.error as NodeJS.ErrnoException).code==="ENOENT")return;
  assert.equal(extracted.status,0,extracted.stderr);
  const words=[...extracted.stdout.matchAll(/<word[^>]*yMin="([\d.-]+)"[^>]*>([^<]*)<\/word>/g)];
  const labels=words.filter(w=>["Website","LinkedIn","GitHub"].includes(w[2]));assert.equal(labels.length,3);assert.ok(Math.max(...labels.map(w=>Number(w[1])))-Math.min(...labels.map(w=>Number(w[1])))<1);
  const footer=words.filter(w=>["1","/"].includes(w[2]));assert.equal(footer.length,3);assert.ok(footer.every(w=>Number(w[1])>780 && Number(w[1])<842));
 }finally{await new Promise<void>(done=>server.close(()=>done()));delete (globalThis as any).window;}
});
