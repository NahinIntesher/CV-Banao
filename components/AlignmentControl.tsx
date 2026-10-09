"use client";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { TextAlign } from "@/lib/model";
const options = [["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight], ["justify", AlignJustify]] as const;
export default function AlignmentControl({value = "left", onChange, label = "Text alignment"}: {value?: TextAlign; onChange: (value: TextAlign) => void; label?: string}) {
  return <div className="alignment-field"><span>{label}</span><div className="alignment-toolbar" role="group" aria-label={label}>{options.map(([id,Icon]) => <button type="button" key={id} title={id[0].toUpperCase()+id.slice(1)} aria-label={`${label}: ${id}`} aria-pressed={value===id} onClick={() => onChange(id)}><Icon size={18}/></button>)}</div></div>;
}
