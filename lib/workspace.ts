"use client";
import { useEffect, useState } from "react";
import {
  CV,
  Font,
  Profile,
  Template,
  createCV,
  fonts,
  templates,
  validateCV,
} from "./model";
import { ImportRecord, profileKeys, validateImport } from "./import-cv";
export const workspaceColors = [
  { id: "purple", name: "Dark Purple", color: "#7155d9" },
  { id: "red", name: "Dark Red", color: "#9a334a" },
  { id: "gold", name: "Dark Gold", color: "#8b6522" },
  { id: "green", name: "Dark Green", color: "#247351" },
  { id: "blue", name: "Dark Blue", color: "#315c9b" },
  { id: "teal", name: "Teal", color: "#207c80" },
  { id: "rose", name: "Rose", color: "#a84975" },
  { id: "copper", name: "Copper", color: "#985937" },
  { id: "slate", name: "Slate", color: "#536579" },
  { id: "indigo", name: "Indigo", color: "#5355aa" },
  { id: "olive", name: "Olive", color: "#68703c" },
  { id: "plum", name: "Plum", color: "#805080" },
];
export interface Workspace {
  version: 1;
  profile: Profile;
  imports: ImportRecord[];
  settings: {
    color: string;
    defaultTemplate: Template;
    defaultFont: Font;
    ocr: boolean;
    autoProfile: boolean;
  };
}
export const WORKSPACE_KEY = "cv-banao.workspace.v1";
export const defaultWorkspace = (): Workspace => ({
  version: 1,
  profile: createCV().profile,
  imports: [],
  settings: {
    color: "purple",
    defaultTemplate: "phd",
    defaultFont: "lora",
    ocr: true,
    autoProfile: false,
  },
});
export function validateWorkspace(raw: unknown): Workspace {
  const w = raw as Workspace;
  if (
    !w ||
    w.version !== 1 ||
    !w.profile ||
    !Array.isArray(w.imports) ||
    w.imports.length > 20 ||
    !w.settings
  )
    throw new Error("Invalid workspace backup.");
  for (const k of profileKeys)
    if (typeof w.profile[k] !== "string" || w.profile[k].length > 2000)
      throw new Error("Invalid profile.");
  const s = w.settings;
  if (
    !workspaceColors.some((c) => c.id === s.color) ||
    !templates.some((t) => t.id === s.defaultTemplate) ||
    !fonts.some((f) => f.id === s.defaultFont) ||
    typeof s.ocr !== "boolean" ||
    typeof s.autoProfile !== "boolean"
  )
    throw new Error("Invalid workspace settings.");
  const imports = w.imports.map(validateImport);
  if (new Set(imports.map((i) => i.id)).size !== imports.length)
    throw new Error("Duplicate imports in backup.");
  return structuredClone({ ...w, imports });
}
export function readWorkspaceBackup(text: string): {
  workspace: Workspace;
  docs: CV[];
} {
  const raw = JSON.parse(text);
  if (
    raw.format !== "cv-banao-workspace" ||
    raw.version !== 1 ||
    !Array.isArray(raw.docs) ||
    !raw.docs.length ||
    raw.docs.length > 50
  )
    throw new Error("Choose a full CV Banao workspace backup.");
  const docs = raw.docs.map(validateCV);
  if (new Set(docs.map((c: CV) => c.id)).size !== docs.length)
    throw new Error("Duplicate drafts.");
  return { workspace: validateWorkspace(raw.workspace), docs };
}
export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(defaultWorkspace),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WORKSPACE_KEY);
      if (saved) setWorkspace(validateWorkspace(JSON.parse(saved)));
    } catch {
      setError(
        "Saved workspace could not be read. Your CV drafts are kept separately. Restore a workspace backup to recover your profile and imports.",
      );
      try {
        const saved = localStorage.getItem(WORKSPACE_KEY);
        if (saved) localStorage.setItem(WORKSPACE_KEY + ".recovery", saved);
      } catch {}
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
      setError("");
    } catch {
      setError(
        "Workspace not saved: device storage is full or unavailable. Download a workspace backup now.",
      );
    }
    const color =
      workspaceColors.find((c) => c.id === workspace.settings.color) ??
      workspaceColors[0];
    document.documentElement.dataset.color = color.id;
    try {
      localStorage.setItem("cv-banao.color", color.id);
    } catch {}
  }, [workspace, loaded]);
  return { workspace, setWorkspace, loaded, error };
}
