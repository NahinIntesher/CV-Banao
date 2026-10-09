import RichText from "./RichText";
import {profileLinkLabel,entryLinkLabel} from "@/lib/links";
import {richLines,richPlain,withoutBullet} from "@/lib/rich";
import { useEffect, type CSSProperties } from "react";
import { loadEditorial } from "@/lib/fonts";
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
  useEffect(() => {
    if (cv.design.font === "editorial") void loadEditorial().catch(() => {});
  }, [cv.design.font]);
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
        <h1><RichText text={p.name || "Your name"}/></h1>
        {p.headline ? (
          <p className="cv-headline"><RichText text={p.headline}/></p>
        ) : (
          !hasContent && (
            <p className="cv-placeholder">
              Your area of expertise or next ambition
            </p>
          )
        )}
        <div className="cv-contact">
          {[p.email, p.phone, p.location].filter(Boolean).map((v, i) => (
            <span key={i}><RichText text={v}/></span>
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
                <RichText text={profileLinkLabel(p,k)}/>
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
          <p className="cv-description" style={{textAlign:cv.design.textAlign}}><RichText text={cv.summary}/></p>
        </section>
      )}
      {cv.sections
        .filter((s) => s.visible && s.entries.some(filledEntry))
        .map((s) => (
          <section
            className="cv-section"
            key={s.id}
            style={
              s.style ? { marginTop: s.style.spacingBefore * 1.333 } : undefined
            }
          >
            <h2
              style={
                s.style
                  ? {
                      fontSize: s.style.headingSize * 1.333,
                      color: s.style.color,
                      borderBottom: s.style.divider
                        ? `1px solid ${s.style.color}`
                        : "none",
                    }
                  : undefined
              }
            >
              <RichText text={s.title}/>
            </h2>
            {s.entries.filter(filledEntry).map((e) => (
              <div
                className={`cv-entry kind-${s.kind}`}
                key={e.id}
                style={
                  {textAlign:e.style?.textAlign ?? s.style?.textAlign ?? cv.design.textAlign,
                    ...(e.style ? {
                        marginLeft: e.style.indent * 1.333,
                        marginBottom: e.style.spacingAfter * 1.333,
                      } : {})}
                }
              >
                {e.title && (
                  <div className="cv-entry-top">
                    <h3><RichText text={e.title}/></h3>
                    {e.date && <span><RichText text={e.date}/></span>}
                  </div>
                )}
                {(e.subtitle || e.location || (!e.title && e.date)) && (
                  <div className="cv-entry-sub">
                    <span><RichText text={e.subtitle}/></span>
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
                    <RichText text={entryLinkLabel(e)}/>
                  </a>
                )}
                {richLines(e.description)
                  .map((line, i) =>
                    /^[•*\-]\s/.test(richPlain(line)) ? (
                      <div className="cv-bullet" key={i}>
                        <span>•</span>
                        <span><RichText text={withoutBullet(line)}/></span>
                      </div>
                    ) : (
                      <p className="cv-description" key={i}>
                        <RichText text={line}/>
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
