import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Link,
  Font as PDFFont,
  pdf,
} from "@react-pdf/renderer";
import { CV, filledEntry, fonts, safeUrl, purposeOf, layoutOf } from "./model";
let registered = false;
export function registerFonts(origin = "") {
  if (registered) return;
  for (const f of fonts)
    PDFFont.register({
      family: f.family,
      fonts: [
        { src: `${origin}/fonts/${f.id}-400.woff`, fontWeight: 400 },
        { src: `${origin}/fonts/${f.id}-700.woff`, fontWeight: 700 },
      ],
    });
  PDFFont.registerHyphenationCallback((word) => [word]);
  registered = true;
}
export function PDFDocument({ cv }: { cv: CV }) {
  const d = cv.design,
    p = cv.profile;
  const family = fonts.find((f) => f.id === d.font)!.family;
  const purpose = purposeOf(cv.template),
    layout = layoutOf(cv.template);
  const center =
    (layout === "classic" && ["academic", "phd"].includes(purpose)) ||
    layout === "editorial";
  const tinted = d.accent + "10";
  const size = d.fontSize;
  const heading = {
    fontSize: size + 1.5,
    color: d.accent,
    fontWeight: 700 as const,
    marginBottom: 7,
    paddingBottom: 5,
    borderBottomWidth:
      layout === "minimal" || layout === "banner"
        ? 0
        : layout === "editorial"
          ? 1.2
          : purpose === "industry"
            ? 0
            : 0.7,
    backgroundColor: layout === "banner" ? tinted : undefined,
    borderLeftWidth: layout === "rail" ? 3 : 0,
    borderLeftColor: d.accent,
    paddingLeft: layout === "rail" || layout === "banner" ? 8 : 0,
    paddingTop: layout === "banner" ? 5 : 0,
    letterSpacing: layout === "editorial" ? 1.4 : 0,
    borderBottomColor: d.accent,
  };
  const body = { marginBottom: 3 };
  return (
    <Document
      title={`${p.name || "Untitled"} — Curriculum Vitae`}
      author={p.name}
      creator="CV Banao"
      language="en"
    >
      <Page
        size={d.paper}
        style={{
          fontFamily: family,
          fontSize: size,
          lineHeight: d.lineHeight,
          color: d.textColor,
          paddingTop: d.margins,
          paddingBottom: d.margins + 12,
          paddingHorizontal: d.margins,
        }}
      >
        <View
          style={{
            textAlign: center ? "center" : "left",
            borderBottomWidth:
              layout === "editorial" ? 1.5 : purpose === "industry" ? 2 : 0,
            borderWidth: layout === "banner" ? 1 : 0,
            borderColor: d.accent,
            borderLeftWidth:
              layout === "rail" ? 4 : layout === "banner" ? 1 : 0,
            borderLeftColor: d.accent,
            paddingLeft: layout === "rail" ? 12 : layout === "banner" ? 14 : 0,
            paddingTop: layout === "banner" ? 14 : 0,
            paddingRight: layout === "banner" ? 14 : 0,
            borderBottomColor: d.accent,
            paddingBottom:
              layout === "banner"
                ? 14
                : layout === "editorial"
                  ? 15
                  : purpose === "industry"
                    ? 12
                    : 0,
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontSize:
                layout === "editorial" ? 32 : layout === "minimal" ? 25 : 28,
              fontWeight: 700,
              color: d.accent,
              lineHeight: 1.15,
            }}
          >
            {p.name || "Your name"}
          </Text>
          {p.headline && (
            <Text style={{ fontSize: size + 1.5, marginTop: 5 }}>
              {p.headline}
            </Text>
          )}
          {[p.email, p.phone, p.location].some(Boolean) && (
            <Text
              style={{ fontSize: size - 1, color: "#525969", marginTop: 6 }}
            >
              {[p.email, p.phone, p.location].filter(Boolean).join("   |   ")}
            </Text>
          )}
          {[p.website, p.linkedin, p.scholar].filter(Boolean).map((u, i) => (
            <View key={i} style={{ marginTop: 2 }}>
              <Link
                src={safeUrl(u) || ""}
                style={{
                  fontSize: size - 1,
                  color: d.accent,
                  textDecoration: "none",
                }}
              >
                {u.replace(/^https?:\/\//, "")}
              </Link>
            </View>
          ))}
        </View>
        {cv.summary && (
          <View style={{ marginTop: d.spacing }}>
            <Text minPresenceAhead={30} style={heading}>
              {purpose === "industry" ? "Professional summary" : "Profile"}
            </Text>
            <Text>{cv.summary}</Text>
          </View>
        )}
        {cv.sections
          .filter((s) => s.visible && s.entries.some(filledEntry))
          .map((s) => (
            <View key={s.id} style={{ marginTop: d.spacing }}>
              <Text minPresenceAhead={45} style={heading}>
                {purpose === "academic" ? s.title.toUpperCase() : s.title}
              </Text>
              {s.entries.filter(filledEntry).map((e) => (
                <View key={e.id} style={{ marginBottom: 10 }}>
                  {(e.title || e.date) && (
                    <View
                      minPresenceAhead={e.description ? 65 : 32}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <Text style={{ fontWeight: 700, flex: 1 }}>
                        {e.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: size - 1,
                          maxWidth: "32%",
                          textAlign: "right",
                          color: "#525969",
                        }}
                      >
                        {e.date}
                      </Text>
                    </View>
                  )}
                  {(e.subtitle || e.location) && (
                    <Text
                      minPresenceAhead={e.description ? 20 : 0}
                      style={{
                        fontSize: size,
                        color: "#525969",
                        marginTop: 2,
                        marginBottom: 3,
                      }}
                    >
                      {[e.subtitle, e.location].filter(Boolean).join(" · ")}
                    </Text>
                  )}
                  {e.url && (
                    <Link
                      src={safeUrl(e.url) || ""}
                      style={{
                        fontSize: size - 1,
                        color: d.accent,
                        marginBottom: 3,
                      }}
                    >
                      {e.url.replace(/^https?:\/\//, "")}
                    </Link>
                  )}
                  {e.description
                    .split("\n")
                    .filter((l) => l.trim())
                    .map((line, i) =>
                      /^[•*\-]\s/.test(line) ? (
                        <View
                          key={i}
                          style={{ flexDirection: "row", marginBottom: 3 }}
                        >
                          <Text style={{ width: 12 }}>•</Text>
                          <Text style={{ flex: 1 }}>
                            {line.replace(/^[•*\-]\s/, "")}
                          </Text>
                        </View>
                      ) : (
                        <Text orphans={2} widows={2} key={i} style={body}>
                          {line}
                        </Text>
                      ),
                    )}
                </View>
              ))}
            </View>
          ))}
        {d.pageNumbers && (
          <Text
            fixed
            style={{
              position: "absolute",
              bottom: 20,
              left: d.margins,
              right: d.margins,
              textAlign: "center",
              fontSize: 8,
              color: "#6b7280",
            }}
            render={({ pageNumber, totalPages }) =>
              `${p.name ? p.name + "  ·  " : ""}${pageNumber} / ${totalPages}`
            }
          />
        )}
      </Page>
    </Document>
  );
}
export async function createPDF(cv: CV) {
  registerFonts(window.location.origin);
  return pdf(<PDFDocument cv={cv} />).toBlob();
}
