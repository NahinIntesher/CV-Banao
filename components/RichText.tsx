import { fonts } from "@/lib/model";
import { richRuns } from "@/lib/rich";
export default function RichText({text}: {text: string}) {
  return <>{richRuns(text).map((p,i) => {const style={fontFamily:p.font?fonts.find(f=>f.id===p.font)?.family:undefined,fontWeight:p.bold===undefined?undefined:p.bold?700:400,fontStyle:p.italic===undefined?undefined:p.italic?"italic":"normal",textDecoration:p.underline===undefined?undefined:p.underline?"underline":"none",fontSize:p.fontSize ? `${p.fontSize}pt` : undefined,color:p.color};return p.href ? <a key={i} style={style} href={p.href} target="_blank" rel="noreferrer">{p.text}</a> : <span key={i} style={style}>{p.text}</span>;})}</>;
}
