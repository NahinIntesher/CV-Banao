import {CV,validateCV,fonts,Font} from "./model";
import {encodeRich,RichRun,richRuns,richPlain} from "./rich";
export const texEscape=(value:string)=>value.replace(/[\\{}%$&#_^~]/g,c=>({"\\":"\\textbackslash{}","{":"\\{","}":"\\}","%":"\\%","$":"\\$","&":"\\&","#":"\\#","_":"\\_","^":"\\textasciicircum{}","~":"\\textasciitilde{}"})[c]!);
export function richLatex(value:string):string {
  return richRuns(value).map(r=>{
    let text=texEscape(r.text).replace(/\n/g,"\\par\n");
    if(r.bold===false)text=`\\textmd{${text}}`;
    if(r.bold)text=`\\textbf{${text}}`;
    if(r.italic===false)text=`\\textup{${text}}`;
    if(r.italic)text=`\\textit{${text}}`;
    if(r.underline)text=`\\underline{${text}}`;
    if(r.fontSize)text=`{\\fontsize{${r.fontSize}}{${(r.fontSize*1.35).toFixed(2)}}\\selectfont ${text}}`;
    if(r.color)text=`\\textcolor[HTML]{${r.color.slice(1)}}{${text}}`;
    if(r.font)text=`{\\cvfont{${r.font}}${text}}`;
    if(r.href)text=`\\href{${texEscape(r.href)}}{${text}}`;
    return text;
  }).join("");
}
const base64=(value:string)=>btoa(encodeURIComponent(value).replace(/%([\dA-F]{2})/g,(_,hex)=>String.fromCharCode(parseInt(hex,16))));
const unbase64=(value:string)=>decodeURIComponent(Array.from(atob(value),c=>"%"+c.charCodeAt(0).toString(16).padStart(2,"0")).join(""));
export function bridgeState(cv:CV):string {
  const copy=structuredClone(cv);delete copy.latex;
  return base64(JSON.stringify(copy));
}
export function texGroup(source:string,at:number):{value:string;end:number} {
  while(/\s/.test(source[at]||"")&&at<source.length)at++;
  if(source[at]!=="{")throw Error("Keep each CV field inside balanced braces.");
  const start=++at;let depth=1;
  for(;at<source.length;at++){
    if(source[at]==="\\"){at++;continue;}
    if(source[at]==="{")depth++;
    if(source[at]==="}"&&!--depth)return {value:source.slice(start,at),end:at+1};
  }
  throw Error("Finish the closing brace to sync this field.");
}
const group=texGroup;
export function scaffold(source:string):string {
  let text=source.replace(/^% CVB-STATE .*$/gm,"");
  let at=0;
  while((at=text.indexOf("\\cvset{",at))>=0){const key=group(text,at+6),value=group(text,key.end);text=text.slice(0,at)+"CVFIELD"+text.slice(value.end);at+=7;}
  return text.replace(/^%.*$/gm,"").replace(/\s+/g,"");
}
function parseRichTex(source:string,colors:Record<string,string>={}):string {
  const out:RichRun[]=[];
  function parse(text:string,style:Omit<RichRun,"text">={}) {
    let at=0;
    const add=(value:string)=>{if(value)out.push({text:value,...style});};
    while(at<text.length){
      if(text[at]==="{"){const g=group(text,at);parse(g.value,style);at=g.end;continue;}
      if(text[at]!=="\\"){let end=text.indexOf("\\",at);const brace=text.indexOf("{",at);if(end<0)end=text.length;if(brace>=0)end=Math.min(end,brace);add(text.slice(at,end));at=end;continue;}
      const escaped=text.slice(at).match(/^\\([{}%$&#_])/);
      if(escaped){add(escaped[1]);at+=2;continue;}
      const command=text.slice(at).match(/^\\([a-zA-Z]+|\\)/);if(!command)throw Error("Unsupported escape in this CV field.");
      const name=command[1];at+=command[0].length;
      if(["textbf","textmd","textup","textit","emph","underline"].includes(name)){const g=group(text,at);parse(g.value,{...style,...(name==="textbf"?{bold:true}:name==="textmd"?{bold:false}:name==="textup"?{italic:false}:name==="underline"?{underline:true}:{italic:true})});at=g.end;}
      else if(name==="href"){const url=group(text,at),label=group(text,url.end);parse(label.value,{...style,href:parseRichTex(url.value,colors)});at=label.end;}
      else if(name==="textcolor"||name==="color"){const html=text.slice(at).startsWith("[HTML]");if(html)at+=6;const color=group(text,at),hex=html?color.value:colors[color.value];if(!hex||!/^[\da-f]{6}$/i.test(hex))throw Error("Use a defined HTML color or six-digit textcolor[HTML].");if(name==="color"){parse(text.slice(color.end),{...style,color:"#"+hex});return;}const content=group(text,color.end);parse(content.value,{...style,color:"#"+hex});at=content.end;}
      else if(["bfseries","mdseries","itshape","upshape","normalfont"].includes(name)){parse(text.slice(at).replace(/^\s+/,""),{...style,...(name==="bfseries"?{bold:true}:name==="mdseries"?{bold:false}:name==="itshape"?{italic:true}:name==="upshape"?{italic:false}:{bold:false,italic:false})});return;}
      else if(name==="fontsize"){const size=group(text,at),height=group(text,size.end);const n=Number(size.value);if(!Number.isFinite(n)||n<8||n>40)throw Error("Supported font sizes are 8–40 pt.");const rest=text.slice(height.end).replace(/^\s*\\selectfont\s*/,"");parse(rest,{...style,fontSize:n});return;}
      else if(name==="cvfont"){const font=group(text,at);if(!fonts.some(f=>f.id===font.value))throw Error("Unknown font.");parse(text.slice(font.end),{...style,font:font.value as Font});return;}
      else if(name==="begin"||name==="end"){const g=group(text,at);if(g.value!=="itemize")throw Error("This environment stays in custom code mode.");at=g.end;while(/\s/.test(text[at]||"")&&at<text.length)at++;}
      else if(name==="item"){if(out.length&&!out[out.length-1].text.endsWith("\n"))add("\n");add("• ");while(text[at]===" ")at++;}
      else if(name==="par"||name==="\\"){add("\n");while(/\s/.test(text[at]||"")&&at<text.length)at++;}
      else if(name==="textbackslash"||name==="textasciicircum"||name==="textasciitilde"){add(name==="textbackslash"?"\\":name==="textasciicircum"?"^":"~");if(text.slice(at,at+2)==="{}")at+=2;}
      else throw Error(`\\${name} cannot be represented in the visual editor. Your custom code is retained.`);
    }
  }
  parse(source.trim());
  // Newlines between TeX commands are formatting whitespace, not extra paragraphs.
  while(out.length&&/^\s*$/.test(out[out.length-1].text))out.pop();
  return encodeRich(out);
}
export function syncLatex(source:string):{cv:CV;issues:string[]} {
  const metadata=source.match(/^% CVB-STATE ([A-Za-z\d+/=]+)$/m);
  if(!metadata)throw Error("Custom LaTeX layout. Regenerate CV Banao code to enable two-way visual editing.");
  const cv=validateCV(JSON.parse(unbase64(metadata[1])));
  const issues:string[]=[];
  const colors=Object.fromEntries([...source.matchAll(/\\definecolor\{([^}]+)\}\{HTML\}\{([a-f\d]{6})\}/gi)].map(m=>[m[1],m[2]]));
  let at=0;const seen=new Set<string>();
  while((at=source.indexOf("\\cvset{",at))>=0){
    const key=group(source,at+6),value=group(source,key.end);at=value.end;
    if(seen.has(key.value))throw Error("Each CV field must have one cvset definition.");seen.add(key.value);
    const path=key.value.split(".");
    try {
    if(path[0]==="profile"&&["name","headline","email","phone","location","website","linkedin","scholar","websiteLabel","linkedinLabel","scholarLabel"].includes(path[1]))cv.profile[path[1] as keyof CV["profile"]]=["website","linkedin","scholar","email","phone"].includes(path[1])?richPlain(parseRichTex(value.value,colors)):parseRichTex(value.value,colors);
    else if(key.value==="summary")cv.summary=parseRichTex(value.value,colors);
    else if(path[0]==="entry"&&path.length===4){const entry=cv.sections[Number(path[1])]?.entries[Number(path[2])];if(!entry)throw Error("Unknown entry. Regenerate after adding sections.");if(path[3]==="indent"||path[3]==="spacingAfter"){const n=Number(value.value);if(!Number.isFinite(n)||n<0||n>24)throw Error("Use a spacing value from 0–24 pt.");entry.style={indent:entry.style?.indent??0,spacingAfter:entry.style?.spacingAfter??10,...entry.style,[path[3]]:n};}else if(path[3]==="align"){const alignment=value.value as NonNullable<CV["design"]["textAlign"]>;if(!["left","center","right","justify"].includes(alignment))throw Error("Use left, center, right or justify.");entry.style={indent:entry.style?.indent??0,spacingAfter:entry.style?.spacingAfter??10,...entry.style,textAlign:alignment};}else if(["title","subtitle","date","location","url","urlLabel","description"].includes(path[3]))entry[path[3] as "title"]=path[3]==="url"?richPlain(parseRichTex(value.value,colors)):parseRichTex(value.value,colors);else throw Error("Unknown CV field.");}
    else if(path[0]==="section"&&cv.sections[Number(path[1])]&&["headingSize","color","spacingBefore","divider"].includes(path[2])){
      const section=cv.sections[Number(path[1])],style={headingSize:cv.design.fontSize+2,color:cv.design.accent,spacingBefore:cv.design.spacing,divider:true,...section.style};
      if(path[2]==="color"){if(!/^[a-f\d]{6}$/i.test(value.value))throw Error("Use a six-digit HTML color.");style.color="#"+value.value;}
      else if(path[2]==="divider"){if(!["0","1"].includes(value.value))throw Error("Use 0 or 1 for the divider.");style.divider=value.value==="1";}
      else{const n=Number(value.value),max=path[2]==="headingSize"?22:30,min=path[2]==="headingSize"?10:0;if(!Number.isFinite(n)||n<min||n>max)throw Error(`Use ${min}–${max} pt for ${path[2]}.`);style[path[2] as "headingSize"]=n;}
      section.style=style;
    }
    else if(key.value==="body.align"){if(!["left","center","right","justify"].includes(value.value))throw Error("Use left, center, right or justify.");cv.design.textAlign=value.value as CV["design"]["textAlign"];}
    else if(path[0]==="section"&&path[2]==="title"&&cv.sections[Number(path[1])])cv.sections[Number(path[1])].title=parseRichTex(value.value,colors);
    } catch(e) {issues.push(`${key.value}: ${(e as Error).message}`);}
  }
  if(!seen.has("profile.name")||!seen.has("summary"))throw Error("Keep the CV field definitions to enable visual editing.");
  const accent=source.match(/\\definecolor\{accent\}\{HTML\}\{([\da-f]{6})\}/i);if(accent)cv.design.accent="#"+accent[1];
  const ink=source.match(/\\definecolor\{bodyink\}\{HTML\}\{([\da-f]{6})\}/i);if(ink)cv.design.textColor="#"+ink[1];
  const margin=source.match(/\\usepackage\[margin=([\d.]+)pt\]\{geometry\}/);if(margin){const n=Number(margin[1]);if(n>=24&&n<=64)cv.design.margins=n;else issues.push("design.margins: visual editing supports 24–64 pt; custom value stays in code.");}
  const size=source.match(/\\color\{bodyink\}\\fontsize\{([\d.]+)\}\{([\d.]+)\}/);if(size){const n=Number(size[1]),height=Number(size[2])/n;if(n>=8&&n<=14&&height>=1.1&&height<=1.8){cv.design.fontSize=n;cv.design.lineHeight=height;}else issues.push("design.fontSize / lineHeight: visual editing supports 8–14 pt and 1.1–1.8 line height; custom values stay in code.");}
  const faceIds=[...source.matchAll(/fonts\/([a-z]+)-400\.ttf/g)].map(m=>m[1]);
  if(faceIds.length&&faceIds.every(id=>id===faceIds[0])&&fonts.some(f=>f.id===faceIds[0]))cv.design.font=faceIds[0] as Font;
  return {cv:validateCV(cv),issues};
}
export const visualFromLatex=(source:string)=>syncLatex(source).cv;
