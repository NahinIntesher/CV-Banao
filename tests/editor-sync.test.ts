import {test} from "node:test";
import assert from "node:assert/strict";
import {createCV,validateCV,filledEntry} from "../lib/model";
import {encodeRich,richRuns,richPlain,richHTML,joinRich} from "../lib/rich";
import {generateLatex,latexToVisual} from "../lib/latex";
import {texGroup} from "../lib/latex-bridge";
import {parseCVText} from "../lib/import-cv";
function change(source:string,key:string,value:string){const at=source.indexOf(`\\cvset{${key}}`);assert.ok(at>=0);const k=texGroup(source,at+6),v=texGroup(source,k.end);return source.slice(0,k.end)+`{${value}}`+source.slice(v.end);}
test("Visual inline styles and named links survive code round trips",()=>{
 const cv=createCV("academic-reference");cv.profile.name="Example Person";
 const runs=[{text:"Research & Development",bold:true,italic:true,underline:true,fontSize:14,color:"#883f48",font:"newsreader" as const},{text:" link",href:"https://example.com/research",font:"plexsans" as const}];
 cv.sections[0].entries[0].title="B.Sc.";cv.sections[0].entries[0].description=encodeRich(runs);
 cv.sections[0].entries[0].style={indent:4,spacingAfter:6,textAlign:"justify"};
 cv.sections[0].style={headingSize:16,color:"#24483F",spacingBefore:8,divider:false};
 const result=latexToVisual(generateLatex(cv));assert.equal(result.compatible,true);assert.deepEqual(result.issues,[]);
 assert.deepEqual(richRuns(result.cv.sections[0].entries[0].description),runs);
 assert.deepEqual(result.cv.sections[0].entries[0].style,cv.sections[0].entries[0].style);
 assert.deepEqual(result.cv.sections[0].style,cv.sections[0].style);
});
test("Code edits sync text, formatting, alignment, spacing and section color",()=>{
 const cv=createCV("industry");let source=generateLatex(cv);
 source=change(source,"entry.0.0.title","\\textbf{Updated role}");
 source=change(source,"entry.0.0.description","{\\bfseries Bold} and \\textcolor{accent}{colored}");
 source=change(source,"entry.0.0.align","center");source=change(source,"entry.0.0.indent","8");source=change(source,"section.0.color","553388");
 const result=latexToVisual(source);assert.equal(result.compatible,true);assert.deepEqual(result.issues,[]);
 assert.equal(richPlain(result.cv.sections[0].entries[0].title),"Updated role");assert.equal(richRuns(result.cv.sections[0].entries[0].title)[0].bold,true);
 assert.equal(result.cv.sections[0].entries[0].style?.textAlign,"center");assert.equal(result.cv.sections[0].entries[0].style?.indent,8);assert.equal(result.cv.sections[0].style?.color,"#553388");
 assert.equal(richRuns(result.cv.sections[0].entries[0].description)[0].bold,true);
});
test("Unsupported fields report their path while other fields still sync",()=>{
 const cv=createCV("industry");cv.sections[0].entries[0].description="Original details";
 let source=change(generateLatex(cv),"entry.0.0.description","\\unknowncustom{details}");source=change(source,"profile.name","Edited name");
 const result=latexToVisual(source);assert.equal(result.cv.profile.name,"Edited name");assert.equal(result.cv.sections[0].entries[0].description,"Original details");assert.equal(result.issues.length,1);assert.match(result.issues[0],/^entry\.0\.0\.description:/);
 const invalid=latexToVisual(change(source,"body.align","unsupported"));assert.equal(invalid.cv.profile.name,"Edited name");assert.ok(invalid.issues.some(x=>x.startsWith("body.align:")));
 const custom=latexToVisual(source.replace("\\end{document}","\\newpage Extra\\end{document}"));assert.equal(custom.compatible,false);assert.ok(custom.issues.some(x=>x.startsWith("Document layout")));
});
test("Rich text keeps Unicode and escapes active HTML and unsafe links",()=>{
 const value=encodeRich([{text:"নাহিন <script>alert(1)</script>",bold:true,href:"javascript:alert(1)",color:"red"}]);
 assert.equal(richPlain(value),"নাহিন <script>alert(1)</script>");assert.equal(richRuns(value)[0].href,undefined);assert.equal(richRuns(value)[0].color,undefined);assert.doesNotMatch(richHTML(value),/<script|href=/);assert.match(richHTML(value),/&lt;script&gt;/);
});
test("Imported project labels stay separate from link destinations",()=>{
 const cv=parseCVText("Example Person\nProjects\nProject Alpha [link](https://github.com/example/alpha)    2026\n• Built the project.\nProject Beta [Demo](https://example.com/demo)    2025\n• Tested the tool.");
 const entries=cv.sections.find(s=>s.title==="Projects")!.entries;assert.equal(entries.length,2);assert.equal(entries[0].title,"Project Alpha");assert.equal(entries[0].urlLabel,"link");assert.equal(entries[0].url,"https://github.com/example/alpha");assert.equal(entries[1].urlLabel,"Demo");
 const old=createCV("industry");old.sections[0].entries[0].title="Project [link]";old.sections[0].entries[0].url="https://example.com/project";
 const migrated=validateCV(old);assert.equal(migrated.sections[0].entries[0].title,"Project");assert.equal(migrated.sections[0].entries[0].urlLabel,"link");
});

test("Combined contact fields retain styles and empty rich fields stay empty",()=>{const contact=joinRich(["person@example.com",encodeRich([{text:"Dhaka",color:"#883f48"}])]," | ");assert.equal(richPlain(contact),"person@example.com | Dhaka");assert.equal(richRuns(contact).at(-1)?.color,"#883f48");const cv=createCV("industry");cv.sections[0].entries[0].title="cvb.rich.v1:W10=";assert.equal(filledEntry(cv.sections[0].entries[0]),false);cv.sections[0].title=encodeRich([{text:"Education",bold:true,color:"#883f48"}]);assert.equal(richPlain(validateCV(cv).sections[0].title),"Education");});
