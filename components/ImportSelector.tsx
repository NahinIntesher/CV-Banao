import { CV } from "@/lib/model";
export default function ImportSelector({
  cv,
  selected,
  onChange,
}: {
  cv: CV;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const options = [
    { id: "profile", label: "Contact & personal information" },
    { id: "summary", label: "Profile / summary" },
    ...cv.sections.map((s) => ({ id: s.id, label: s.title })),
  ];
  return (
    <fieldset className="import-selection">
      <legend>Choose information to use</legend>
      <div className="selection-tools">
        <button
          type="button"
          onClick={() => onChange(options.map((o) => o.id))}
        >
          Select all
        </button>
        <button type="button" onClick={() => onChange([])}>
          Clear selection
        </button>
      </div>
      {options.map((o) => (
        <label key={o.id}>
          <input
            type="checkbox"
            checked={selected.includes(o.id)}
            onChange={() =>
              onChange(
                selected.includes(o.id)
                  ? selected.filter((id) => id !== o.id)
                  : [...selected, o.id],
              )
            }
          />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
