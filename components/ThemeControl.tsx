"use client";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
type Theme = "light" | "dark" | "system";
const options: { id: Theme; label: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
];
export default function ThemeControl() {
  const [theme, setTheme] = useState<Theme>("system");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const t = localStorage.getItem("cv-studio.theme");
      if (t === "light" || t === "dark" || t === "system") setTheme(t);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const mode =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = mode;
      document.documentElement.style.colorScheme = mode;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, ready]);
  const choose = (value: Theme) => {
    setTheme(value);
    try {
      localStorage.setItem("cv-studio.theme", value);
    } catch {}
  };
  return (
    <div className="theme-control" role="group" aria-label="Appearance">
      {options.map(({ id, label, Icon }) => (
        <button
          key={id}
          className="theme-option"
          aria-label={`${label} mode`}
          title={`${label} mode`}
          aria-pressed={theme === id}
          onClick={() => choose(id)}
        >
          <Icon size={15} />
          <span>{label}</span>
        </button>
      ))}
      <label className="theme-mobile">
        <span className="sr-only">Color theme</span>
        {theme === "dark" ? (
          <Moon size={17} />
        ) : theme === "light" ? (
          <Sun size={17} />
        ) : (
          <Monitor size={17} />
        )}
        <select
          aria-label="Color theme"
          value={theme}
          onChange={(e) => choose(e.target.value as Theme)}
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
