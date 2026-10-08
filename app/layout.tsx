import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CV Banao",
  description:
    "Import your existing CV and build an academic, research, PhD or industry CV with 20 templates and 10 fonts. Customize typography, organize your experience, and export a professional PDF. Local-first, no account required.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('cv-studio.theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light';var c=localStorage.getItem('cv-banao.color');if(['purple','red','gold','green','blue','teal','rose','copper','slate','indigo','olive','plum'].includes(c))document.documentElement.dataset.color=c}catch(e){document.documentElement.dataset.theme='light'}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
