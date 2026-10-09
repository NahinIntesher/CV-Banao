"use client";
import {useEffect,useRef,useState} from "react";
import {Bold,Italic,Underline,Link2,RemoveFormatting} from "lucide-react";
import {encodeRich,richHTML,RichRun} from "@/lib/rich";
import {readRichDOM} from "@/lib/rich-dom";
import {safeUrl,fonts} from "@/lib/model";
export default function RichEditor({value,onChange,label,multiline=false}: {value:string;onChange:(value:string)=>void;label:string;multiline?:boolean;placeholder?:string;type?:string}) {
  const editor=useRef<HTMLDivElement>(null),range=useRef<Range|null>(null),last=useRef("");
  const [link,setLink]=useState(false),[url,setURL]=useState("");
  useEffect(()=>{if(editor.current&&value!==last.current){editor.current.innerHTML=richHTML(value);last.current=value;}},[value]);
  const remember=()=>{const selection=window.getSelection();if(selection?.rangeCount&&editor.current?.contains(selection.anchorNode))range.current=selection.getRangeAt(0).cloneRange();};
  const save=()=>{if(!editor.current)return;const result=encodeRich(readRichDOM(editor.current));if(result.length>20000)return;last.current=result;onChange(result);remember();};
  const format=(key:keyof Omit<RichRun,"text">|"clear",value?:string|number)=>{
    const root=editor.current;if(!root)return;
    const selected=range.current&&root.contains(range.current.commonAncestorContainer)?range.current.cloneRange():document.createRange();
    if(!range.current||selected.collapsed)selected.selectNodeContents(root);
    const fragment=selected.extractContents(),holder=document.createElement("div");holder.append(fragment);
    let runs=readRichDOM(holder);
    if(key==="clear")runs=runs.map(r=>({text:r.text,href:r.href,bold:false,italic:false,underline:false}));
    else if(key==="bold"||key==="italic"||key==="underline"){const next=!runs.every(r=>r[key]);runs=runs.map(r=>({...r,[key]:next}));}
    else runs=runs.map(r=>({...r,[key]:value}));
    const wrapper=document.createElement("span");wrapper.innerHTML=richHTML(encodeRich(runs));selected.insertNode(wrapper);
    selected.selectNodeContents(wrapper);window.getSelection()?.removeAllRanges();window.getSelection()?.addRange(selected);range.current=selected.cloneRange();save();
  };
  return <div className="rich-field"><span className="rich-label">{label}</span><div className="rich-toolbar" role="toolbar" aria-label={`${label} formatting`}><button type="button" title="Bold" aria-label="Bold" onMouseDown={e=>e.preventDefault()} onClick={()=>format("bold")}><Bold size={16}/></button><button type="button" title="Italic" aria-label="Italic" onMouseDown={e=>e.preventDefault()} onClick={()=>format("italic")}><Italic size={16}/></button><button type="button" title="Underline" aria-label="Underline" onMouseDown={e=>e.preventDefault()} onClick={()=>format("underline")}><Underline size={16}/></button><select aria-label="Selected text font" defaultValue="" onChange={e=>{if(e.target.value)format("font",e.target.value);e.target.value="";}}><option value="">Font</option>{fonts.filter(f=>f.id!=="editorial").map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select><select aria-label="Selected text font size" defaultValue="" onChange={e=>{if(e.target.value)format("fontSize",Number(e.target.value));e.target.value="";}}><option value="">Size</option>{[8,9,10,11,12,14,16,18,20,24,28,32,36,40].map(n=><option value={n} key={n}>{n} pt</option>)}</select><input type="color" aria-label="Selected text color" defaultValue="#202633" onChange={e=>format("color",e.target.value)}/><button type="button" title="Insert link" aria-label="Insert link" onMouseDown={e=>e.preventDefault()} onClick={()=>setLink(v=>!v)}><Link2 size={16}/></button><button type="button" title="Clear formatting" aria-label="Clear formatting" onMouseDown={e=>e.preventDefault()} onClick={()=>format("clear")}><RemoveFormatting size={16}/></button></div>{link&&<div className="inline-link-editor"><input aria-label="Link destination" value={url} onChange={e=>setURL(e.target.value)} placeholder="https://…"/><button type="button" disabled={!safeUrl(url)} onClick={()=>{format("href",safeUrl(url));setLink(false);}}>Apply link to selected text</button></div>}<div ref={editor} role="textbox" aria-label={label} aria-multiline={multiline} contentEditable suppressContentEditableWarning className={`rich-editor ${multiline?"multiline":""}`} onInput={save} onMouseUp={remember} onKeyUp={remember} onBlur={remember} onPaste={e=>{e.preventDefault();const selection=window.getSelection();if(!selection?.rangeCount)return;const r=selection.getRangeAt(0);r.deleteContents();const text=document.createTextNode(e.clipboardData.getData("text/plain"));r.insertNode(text);r.setStartAfter(text);r.collapse(true);selection.removeAllRanges();selection.addRange(r);save();}}/></div>;
}
