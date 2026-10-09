import {CV,Entry,filledEntry,layoutOf,safeUrl,TextAlign} from "./model";
import {entryLinkLabel,profileLinkLabel} from "./links";
import {richLines,richPlain,withoutBullet} from "./rich";
import {bridgeState,richLatex,texEscape,syncLatex,scaffold} from "./latex-bridge";
export const escapeLatex=texEscape;
function description(value:string):string {
  let text="", list=false;
  for(const line of richLines(value)){
    if(/^[•*\-–—]\s/.test(richPlain(line))){if(!list){text+="\\begin{itemize}\n";list=true;}text+="\\item "+richLatex(withoutBullet(line))+"\n";}
    else{if(list){text+="\\end{itemize}\n";list=false;}text+=richLatex(line)+"\\par\n";}
  }
  return text+(list?"\\end{itemize}\n":"");
}
/** Editable CV fields + normal XeLaTeX. No executable conversion step is used. */
export function generateLatex(cv:CV):string {
  const d=cv.design,p=cv.profile,layout=layoutOf(cv.template),compact=["reference","teaching"].includes(layout);
  const centered=compact||layout==="editorial"||["academic","phd"].includes(cv.template);
  const defs=new Map<string,string>();
  const field=(key:string,value:string,body=false)=>{defs.set(key,body?description(value):richLatex(value));return `\\cvfield{${key}}`;};
  const align=(key:string,value:TextAlign)=>{defs.set(key,value);return `\\cvfield{${key}}`;};
  // Keep every field present even when blank, so code can fill an empty CV.
  for(const k of ["name","headline","email","phone","location","website","linkedin","scholar","websiteLabel","linkedinLabel","scholarLabel"] as const)field(`profile.${k}`,p[k] ?? "");
  field("summary",cv.summary,true);
  const bodyAlign=align("body.align",d.textAlign ?? "left");
  const name=field("profile.name",p.name);
  const contact=(["email","phone","location"] as const).filter(k=>p[k]).map(k=>`\\cvfield{profile.${k}}`).join(" \\quad|\\quad ");
  const links=(["website","linkedin","scholar"] as const).filter(k=>safeUrl(p[k])).map(k=>`\\href{\\cvfield{profile.${k}}}{${field(`profile.${k}Label`,profileLinkLabel(p,k))}}`).join(" \\quad|\\quad ");
  function entry(x:Entry,si:number,ei:number,education:boolean):string {
    const key=`entry.${si}.${ei}`;defs.set(key+".spacingAfter",String(x.style?.spacingAfter ?? (compact?3:6)));defs.set(key+".indent",String(x.style?.indent ?? 0));
    const entryAlign=align(key+".align",x.style?.textAlign ?? cv.sections[si].style?.textAlign ?? d.textAlign ?? "left");
    for(const k of ["title","subtitle","location","date","url","urlLabel","description"] as const)field(`${key}.${k}`,x[k] ?? "",k==="description");
    field(key+".urlLabel",entryLinkLabel(x));
    const title=`\\textbf{\\cvfield{${key}.title}}`,date=`{\\small\\cvfield{${key}.date}}`;
    const row=layout==="reference"&&education?`\\begin{tabularx}{\\linewidth}{@{}p{.20\\linewidth}X@{}}${date} & ${title}\\end{tabularx}\n`:`\\begin{tabularx}{\\linewidth}{@{}X >{\\raggedleft\\arraybackslash}p{.23\\linewidth}@{}}${title} & ${date}\\end{tabularx}\n`;
    const sub=["subtitle","location"].filter(k=>x[k as "subtitle"]).map(k=>`\\cvfield{${key}.${k}}`).join(" \\enspace\\textperiodcentered\\enspace ");
    return `\\Needspace{3\\baselineskip}\n\\begin{adjustwidth}{\\cvfield{${key}.indent}pt}{0pt}\n${row}${sub?`{\\small\\itshape ${sub}}\\par\n`:""}${safeUrl(x.url)?`\\href{\\cvfield{${key}.url}}{\\cvfield{${key}.urlLabel}}\\par\n`:""}\\cvbody{${entryAlign}}{\\cvfield{${key}.description}}\n\\end{adjustwidth}\n\\vspace{\\cvfield{${key}.spacingAfter}pt}\n`;
  }
  function section(title:string,body:string,style?:CV["sections"][number]["style"],si?:number):string {
    if(si !== undefined){const key=`section.${si}`;defs.set(key+".headingSize",String(style?.headingSize ?? d.fontSize+2));defs.set(key+".color",(style?.color ?? d.accent).slice(1));defs.set(key+".spacingBefore",String(style?.spacingBefore ?? d.spacing));defs.set(key+".divider",(style?.divider ?? layout!=="reference")?"1":"0");
      return `\\Needspace{6\\baselineskip}\n\\vspace{\\cvfield{${key}.spacingBefore}pt}\n{\\fontsize{\\cvfield{${key}.headingSize}}{\\dimexpr\\cvfield{${key}.headingSize}pt+2pt\\relax}\\selectfont\\bfseries\\color[HTML]{\\cvfield{${key}.color}}${title}}\\par\n\\ifnum\\cvfield{${key}.divider}=1 {\\color{accent!40}\\hrule height .4pt}\\vspace{3pt}\\else\\vspace{2pt}\\fi\n${body}`;
    }
    return `\\Needspace{6\\baselineskip}\n\\vspace{${style?.spacingBefore ?? d.spacing}pt}\n{\\fontsize{${style?.headingSize ?? d.fontSize+2}}{${d.fontSize+4}}\\selectfont\\bfseries\\color[HTML]{${(style?.color ?? d.accent).slice(1)}}${title}}\\par\n${(style?.divider ?? layout!=="reference")?"{\\color{accent!40}\\hrule height .4pt}\\vspace{3pt}\n":"\\vspace{2pt}\n"}${body}`;
  }
  const body=(cv.summary?section("Profile",`\\cvbody{${bodyAlign}}{\\cvfield{summary}}`):"")+cv.sections.map((s,si)=>{
    const entries=s.entries.map((x,ei)=>entry(x,si,ei,s.kind==="education"));
    const title=field(`section.${si}.title`,s.title);
    const output=section(layout==="teaching"?`\\MakeUppercase{${title}}`:title,entries.filter((_,i)=>filledEntry(s.entries[i])).join("\n"),s.style,si);
    return s.visible&&s.entries.some(filledEntry)?output:"";
  }).join("\n");
  return `% CV Banao. Compiler: XeLaTeX. Edit cvset fields to sync with the visual editor.\n\\documentclass[11pt,${d.paper==="A4"?"a4paper":"letterpaper"}]{article}
\\usepackage[margin=${d.margins}pt]{geometry}
\\usepackage{fontspec,xcolor,tabularx,enumitem,needspace,fancyhdr,lastpage,changepage,hyperref,ragged2e}
\\definecolor{accent}{HTML}{${d.accent.slice(1)}}
\\definecolor{bodyink}{HTML}{${d.textColor.slice(1)}}
\\IfFileExists{fonts/${d.font}-400.ttf}{\\setmainfont[Path=fonts/,BoldFont=${d.font}-700.ttf,ItalicFont=${d.font}-400.ttf,ItalicFeatures={FakeSlant=.15},BoldItalicFont=${d.font}-700.ttf,BoldItalicFeatures={FakeSlant=.15}]{${d.font}-400.ttf}}{\\setmainfont{Latin Modern Roman}}
\\hypersetup{colorlinks=true,urlcolor=accent,linkcolor=accent}
\\newcommand{\\cvfont}[1]{\\fontspec[Path=fonts/,BoldFont=#1-700.ttf,ItalicFont=#1-400.ttf,ItalicFeatures={FakeSlant=.15},BoldItalicFont=#1-700.ttf,BoldItalicFeatures={FakeSlant=.15}]{#1-400.ttf}}
\\newcommand{\\cvset}[2]{\\expandafter\\def\\csname cvbfield:#1\\endcsname{#2}}
\\newcommand{\\cvfield}[1]{\\csname cvbfield:#1\\endcsname}
\\makeatletter
\\def\\cvbalign@left{\\RaggedRight}\\def\\cvbalign@center{\\centering}\\def\\cvbalign@right{\\RaggedLeft}\\def\\cvbalign@justify{\\justifying}
\\newcommand{\\cvbody}[2]{\\begingroup\\csname cvbalign@#1\\endcsname #2\\par\\endgroup}
\\makeatother
% Editable text and inline styles. Keep field keys and braces.
${Array.from(defs,([key,value])=>`\\cvset{${key}}{${value}}`).join("\n")}
\\setlength{\\parindent}{0pt}\\setlength{\\parskip}{2pt}
\\setlength{\\emergencystretch}{3em}
\\setlist[itemize]{leftmargin=1.2em,itemsep=1pt,topsep=2pt,parsep=0pt}
\\pagestyle{fancy}\\fancyhf{}\\renewcommand{\\headrulewidth}{0pt}
${d.pageNumbers?`\\fancyfoot[C]{\\small\\color{bodyink!65}${name} \\quad|\\quad Page \\thepage\\ of \\pageref*{LastPage}}`:""}
\\begin{document}
\\color{bodyink}\\fontsize{${d.fontSize}}{${(d.fontSize*d.lineHeight).toFixed(2)}}\\selectfont
${centered?"\\begin{center}\n":""}{\\fontsize{28}{32}\\selectfont\\bfseries\\color{accent}${name}}\\par
${p.headline?"\\cvfield{profile.headline}\\par\n":""}{\\small ${contact}}\\par
${links?`{\\small ${links}}\\par\n`:""}${centered?"\\end{center}\n":""}
${body}
\\end{document}
% CVB-STATE ${bridgeState(cv)}
`;
}
export const activeLatex=(cv:CV)=>cv.latex?.mode==="custom"?cv.latex.source:generateLatex(cv);
export function latexToVisual(source:string):{cv:CV;issues:string[];compatible:boolean} {
  const result=syncLatex(source);
  let compatible=false;
  try {
    const marker=source.match(/^% CVB-STATE (.+)$/m)![1];
    const original=JSON.parse(decodeURIComponent(Array.from(atob(marker),c=>"%"+c.charCodeAt(0).toString(16).padStart(2,"0")).join("")));
    compatible=scaffold(source)===scaffold(generateLatex(original))||scaffold(source)===scaffold(generateLatex(result.cv));
  }catch{}
  if(!compatible)result.issues.push("Document layout / custom commands: retained in LaTeX. Text fields were synced; this layout has no exact visual-editor equivalent.");
  return {...result,compatible};
}
