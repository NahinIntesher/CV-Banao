import { RichRun } from "./rich";
import {safeUrl,fonts,Font} from "./model";
function color(value:string){if(/^#[\da-f]{6}$/i.test(value))return value;const rgb=value.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);return rgb?"#"+rgb.slice(1).map(n=>Number(n).toString(16).padStart(2,"0")).join(""):undefined;}
export function readRichDOM(root:Node):RichRun[] {
  const out:RichRun[]=[];
  function read(node:Node, inherited:Omit<RichRun,"text">={}) {
    if(node.nodeType===3){out.push({text:node.textContent||"",...inherited});return;}
    if(node.nodeType!==1&&node!==root)return;
    const el=node as HTMLElement, tag=el.tagName?.toLowerCase();
    if(["script","style","iframe","img","svg","object"].includes(tag))return;
    if(tag==="br"){out.push({text:"\n"});return;}
    const style={...inherited};
    if(["strong","b"].includes(tag))style.bold=true;
    if(["em","i"].includes(tag))style.italic=true;
    if(tag==="u")style.underline=true;
    if(tag==="a"&&safeUrl(el.getAttribute("href")||""))style.href=safeUrl(el.getAttribute("href")!);
    const font=el.getAttribute?.("data-cvb-font");if(font&&fonts.some(f=>f.id===font))style.font=font as Font;
    if(el.style){
      if(el.style.fontWeight)style.bold=el.style.fontWeight==="bold"||Number(el.style.fontWeight)>=600;
      if(el.style.fontStyle)style.italic=el.style.fontStyle==="italic";
      if(el.style.textDecoration)style.underline=el.style.textDecoration.includes("underline");
      if(el.style.color)style.color=color(el.style.color);
      if(el.style.fontSize){const n=parseFloat(el.style.fontSize)*(el.style.fontSize.endsWith("px")?.75:1);if(n>=8&&n<=40)style.fontSize=n;}
    }
    const block=node!==root&&["p","div","li"].includes(tag);
    if(block&&out.length&&!out[out.length-1].text.endsWith("\n"))out.push({text:"\n"});
    node.childNodes.forEach(child=>read(child,style));
    if(block)out.push({text:"\n"});
  }
  read(root);
  if(out.length&&out[out.length-1].text==="\n")out.pop();
  return out;
}
