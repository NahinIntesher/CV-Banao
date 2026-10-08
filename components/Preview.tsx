import type { CSSProperties } from "react";
import {
  CV,
  filledEntry,
  fonts,
  safeUrl,
  purposeOf,
  layoutOf,
} from "@/lib/model";
export default function Preview({
  cv,
  mini = false,
}: {
  cv: CV;
  mini?: boolean;
}) {
  const p = cv.profile;
  const hasContent =
    cv.summary ||
    cv.sections.some((s) => s.visible && s.entries.some(filledEntry));
  const family = fonts.find((f) => f.id === cv.design.font)!.family;
  return (
    <article
      className={`cv-paper template-${purposeOf(cv.template)} layout-${layoutOf(cv.template)} ${mini ? "mini" : ""}`}
      style={
        {
          "--accent": cv.design.accent,
          color: cv.design.textColor,
          fontFamily: family,
          fontSize: cv.design.fontSize * 1.333,
          lineHeight: cv.design.lineHeight,
          padding: cv.design.margins * 1.333,
          "--section-gap": `${cv.design.spacing * 1.333}px`,
          minHeight: cv.design.paper === "A4" ? 1123 : 1056,
        } as CSSProperties
      }
    >
      <header className="cv-header">
        <h1>{p.name || "Your name"}</h1>
        {p.headline ? (
          <p className="cv-headline">{p.headline}</p>
        ) : (
          !hasContent && (
            <p className="cv-placeholder">
              Your area of expertise or next ambition
            </p>
          )
        )}
        <div className="cv-contact">
          {[p.email, p.phone, p.location].filter(Boolean).map((v, i) => (
            <span key={i}>{v}</span>
          ))}
        </div>
        <div className="cv-links">
          {(["website", "linkedin", "scholar"] as const)
            .filter((k) => p[k])
            .map((k) => (
              <a
                key={k}
                href={safeUrl(p[k]) || undefined}
                target="_blank"
                rel="noreferrer"
              >
                {p[k].replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            ))}
        </div>
      </header>
      {cv.summary && (
        <section className="cv-section">
          <h2>
            {purposeOf(cv.template) === "industry"
              ? "Professional summary"
              : "Profile"}
          </h2>
          <p className="cv-description">{cv.summary}</p>
        </section>
      )}
      {cv.sections
        .filter((s) => s.visible && s.entries.some(filledEntry))
        .map((s) => (
          <section className="cv-section" key={s.id}>
            <h2>{s.title}</h2>
            {s.entries.filter(filledEntry).map((e) => (
              <div className={`cv-entry kind-${s.kind}`} key={e.id}>
                {e.title && (
                  <div className="cv-entry-top">
                    <h3>{e.title}</h3>
                    {e.date && <span>{e.date}</span>}
                  </div>
                )}
                {(e.subtitle || e.location || (!e.title && e.date)) && (
                  <div className="cv-entry-sub">
                    <span>{e.subtitle}</span>
                    <span>
                      {[e.location, !e.title && e.date]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                )}
                {e.url && (
                  <a
                    className="cv-entry-url"
                    href={safeUrl(e.url) || undefined}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {e.url.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {e.description
                  .split("\n")
                  .filter((l) => l.trim())
                  .map((line, i) =>
                    /^[•*\-]\s/.test(line) ? (
                      <div className="cv-bullet" key={i}>
                        <span>•</span>
                        <span>{line.replace(/^[•*\-]\s/, "")}</span>
                      </div>
                    ) : (
                      <p className="cv-description" key={i}>
                        {line}
                      </p>
                    ),
                  )}
              </div>
            ))}
          </section>
        ))}
      {!hasContent && (
        <div className="empty-paper">
          <span className="empty-paper-line" />
          <h2>Your next chapter starts here</h2>
          <p>
            Add your details on the left.
            <br />
            Your CV will take shape as you write.
          </p>
          <div className="skeleton-section">
            <i />
            <b />
            <b />
            <b />
          </div>
          <div className="skeleton-section">
            <i />
            <b />
            <b />
          </div>
        </div>
      )}
    </article>
  );
}
