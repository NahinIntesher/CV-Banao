"use client";
import { useRef, useState, ReactNode } from "react";
import { ArrowDown, ArrowUp, GripVertical, Move } from "lucide-react";
import AlignmentControl from "./AlignmentControl";
import { CV,readableText } from "@/lib/model";
function move<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
function Reorder<T extends { id: string }>({
  items,
  onChange,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T) => ReactNode;
}) {
  const nodes = useRef<Record<string, HTMLDivElement | null>>({}),
    drag = useRef<{ id: string; y: number; target: number; centers: number[] } | null>(null);
  const [offset, setOffset] = useState({ id: "", dy: 0 });
  return (
    <div className="reorder-list">
      {items.map((item, i) => (
        <div
          className="reorder-row"
          key={item.id}
          ref={(el) => {
            nodes.current[item.id] = el;
          }}
          style={{
            transform:
              offset.id === item.id ? `translateY(${offset.dy}px)` : undefined,
            zIndex: offset.id === item.id ? 5 : undefined,
          }}
        >
          <button
            className="drag-grip"
            aria-label={`Drag ${i + 1} to reorder`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = {
                id: item.id,
                y: e.clientY,
                target: i,
                centers: items.map((x) => {
                  const rect = nodes.current[x.id]?.getBoundingClientRect();
                  return rect ? rect.top + rect.height / 2 : 0;
                }),
              };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d) return;
              setOffset({ id: d.id, dy: e.clientY - d.y });
              const middle = d.centers[i] + e.clientY - d.y;
              d.target = i;
              d.centers.forEach((center, index) => {
                if (index > i && middle > center) d.target = index;
                if (index < i && middle < center) d.target = Math.min(d.target, index);
              });
            }}
            onPointerUp={() => {
              const d = drag.current;
              if (d && d.target !== i) onChange(move(items, i, d.target));
              drag.current = null;
              setOffset({ id: "", dy: 0 });
            }}
            onPointerCancel={() => {
              drag.current = null;
              setOffset({ id: "", dy: 0 });
            }}
          >
            <GripVertical size={21} />
          </button>
          <div className="reorder-content">{render(item)}</div>
          <button
            disabled={!i}
            aria-label={`Move ${i + 1} up`}
            onClick={() => onChange(move(items, i, i - 1))}
          >
            <ArrowUp size={16} />
          </button>
          <button
            disabled={i === items.length - 1}
            aria-label={`Move ${i + 1} down`}
            onClick={() => onChange(move(items, i, i + 1))}
          >
            <ArrowDown size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
export default function LayoutEditor({
  cv,
  onChange,
}: {
  cv: CV;
  onChange: (part: Partial<CV>) => void;
}) {
  const [id, setId] = useState(cv.sections[0]?.id ?? "");
  const section = cv.sections.find((s) => s.id === id);
  const change = (part: Partial<CV["sections"][number]>) =>
    onChange({
      sections: cv.sections.map((s) => (s.id === id ? { ...s, ...part } : s)),
    });
  const style = section?.style ?? {
    headingSize: cv.design.fontSize + 2,
    color: cv.design.accent,
    spacingBefore: cv.design.spacing,
    divider: true,
  };
  return (
    <section className="layout-editor">
      <div className="feature-title">
        <Move />
        <h2>Arrange & style</h2>
      </div>
      <p>
        Drag the grip handles with your mouse or touch screen. Arrow buttons
        offer the same ordering controls. The live preview follows every change.
      </p>
      <Reorder
        items={cv.sections}
        onChange={(sections) => onChange({ sections })}
        render={(s) => (
          <>
            <strong>{readableText(s.title)}</strong>
            <span>{s.entries.length} entries</span>
          </>
        )}
      />
      <label>
        Customize a section
        <select value={id} onChange={(e) => setId(e.target.value)}>
          {cv.sections.map((s) => (
            <option key={s.id} value={s.id}>
              {readableText(s.title)}
            </option>
          ))}
        </select>
      </label>
      {section && (
        <>
          <div className="feature-card layout-controls">
            <label>
              Heading size
              <input
                type="number"
                min={10}
                max={22}
                value={style.headingSize}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (n >= 10 && n <= 22)
                    change({ style: { ...style, headingSize: n } });
                }}
              />
            </label>
            <label>
              Heading color
              <input
                type="color"
                value={style.color}
                onChange={(e) =>
                  change({ style: { ...style, color: e.target.value } })
                }
              />
            </label>
            <label>
              Space before section
              <input
                type="range"
                min={0}
                max={30}
                value={style.spacingBefore}
                onChange={(e) =>
                  change({
                    style: { ...style, spacingBefore: Number(e.target.value) },
                  })
                }
              />
              {style.spacingBefore} pt
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={style.divider}
                onChange={(e) =>
                  change({ style: { ...style, divider: e.target.checked } })
                }
              />
              Heading divider
            </label>
          </div>
          <AlignmentControl label="Section body alignment" value={section.style?.textAlign ?? cv.design.textAlign} onChange={(textAlign) => change({style: {...style,textAlign}})} />
          <h3>Entries in {readableText(section.title)}</h3>
          <Reorder
            items={section.entries}
            onChange={(entries) => change({ entries })}
            render={(entry) => (
              <>
                <strong>{entry.title || "Untitled entry"}</strong>
                <span>{entry.date || entry.subtitle}</span>
                <label>
                  Space after entry
                  <input
                    type="range"
                    min={0}
                    max={24}
                    value={entry.style?.spacingAfter ?? 6}
                    onChange={(e) =>
                      change({
                        entries: section.entries.map((x) =>
                          x.id === entry.id
                            ? {
                                ...x,
                                style: {
                                  ...x.style,
                                  indent: x.style?.indent ?? 0,
                                  spacingAfter: Number(e.target.value),
                                },
                              }
                            : x,
                        ),
                      })
                    }
                  />
                  {entry.style?.spacingAfter ?? 6} pt
                </label>
              </>
            )}
          />
        </>
      )}
    </section>
  );
}
