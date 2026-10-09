import { richRuns,richLines,richPlain,withoutBullet,joinRich,richUpperCase } from "./rich";
import React from "react";
import { documentFont, compileCV, pdfBlob } from "./fonts";
import { linkParts, entryLinkLabel, profileLinkLabel } from "./links";
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
  for (const f of fonts.filter((f) => f.id !== "editorial"))
    PDFFont.register({
      family: f.family,
      fonts: [
        { src: `${origin}/fonts/${f.id}-400.woff`, fontWeight: 400 },
        { src: `${origin}/fonts/${f.id}-700.woff`, fontWeight: 700 },
        { src: `${origin}/fonts/${f.id}-400-italic.woff`, fontWeight: 400, fontStyle:"italic" },
        { src: `${origin}/fonts/${f.id}-700-italic.woff`, fontWeight: 700, fontStyle:"italic" },
      ],
    });
  PDFFont.registerHyphenationCallback((word) => [word]);
  registered = true;
}
function Inline({text, accent}: {text:string;accent:string}) {
  return <>{richRuns(text).map((p,i) => {
    const style={fontFamily:p.font?fonts.find(f=>f.id===p.font)?.family:undefined,fontSize:p.fontSize,color:p.color ?? (p.href?accent:undefined),fontWeight:p.bold===undefined?undefined:p.bold?700:400,fontStyle:p.italic?"italic" as const:undefined,textDecoration:p.underline?"underline" as const:undefined};
    return p.href ? <Link key={i} src={p.href} style={style}>{p.text}</Link> : <Text key={i} style={style}>{p.text}</Text>;
  })}</>;
}
export function PDFDocument({ cv }: { cv: CV }) {
  const d = cv.design,
    p = cv.profile;
  const family = fonts.find((f) => f.id === d.font)!.family;
  const purpose = purposeOf(cv.template),
    layout = layoutOf(cv.template);
  const center =
    (layout === "classic" && ["academic", "phd"].includes(purpose)) ||
    ["editorial", "reference", "teaching"].includes(layout);
  const tinted = d.accent + "10";
  const size = d.fontSize;
  const heading = {
    fontSize: size + 1.5,
    color: d.accent,
    fontWeight: 700 as const,
    marginBottom: 7,
    paddingBottom: 5,
    borderBottomWidth:
      layout === "minimal" || layout === "banner" || layout === "reference"
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
      title={`${richPlain(p.name) || "Untitled"} — Curriculum Vitae`}
      author={richPlain(p.name)}
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
            <Inline text={p.name || "Your name"} accent={d.accent}/>
          </Text>
          {!!p.headline && (
            <Text style={{ fontSize: size + 1.5, marginTop: 5 }}>
              <Inline text={p.headline} accent={d.accent}/>
            </Text>
          )}
          {[p.email, p.phone, p.location].some(Boolean) && (
            <Text
              style={{ fontSize: size - 1, color: "#525969", marginTop: 6 }}
            >
              <Inline text={joinRich([p.email, p.phone, p.location],"   |   ")} accent={d.accent}/>
            </Text>
          )}
          <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:center?"center":"flex-start",gap:11.25,marginTop:3}}>
            {(["website","linkedin","scholar"] as const).filter(k=>safeUrl(p[k])).map(k => <Link key={k} src={safeUrl(p[k])} style={{fontSize:size*.9,color:d.accent,textDecoration:"none"}}><Inline text={profileLinkLabel(p,k)} accent={d.accent}/></Link>)}
          </View>
        </View>
        {!!cv.summary && (
          <View style={{ marginTop: d.spacing }}>
            <Text minPresenceAhead={30} style={heading}>
              {purpose === "industry" ? "Professional summary" : "Profile"}
            </Text>
            <Text style={{textAlign:d.textAlign ?? "left"}}><Inline text={cv.summary} accent={d.accent}/></Text>
          </View>
        )}
        {cv.sections
          .filter((s) => s.visible && s.entries.some(filledEntry))
          .map((s) => (
            <View
              key={s.id}
              style={{ marginTop: s.style?.spacingBefore ?? d.spacing }}
            >
              <Text
                minPresenceAhead={45}
                style={
                  s.style
                    ? {
                        ...heading,
                        fontSize: s.style.headingSize,
                        color: s.style.color,
                        borderBottomWidth: s.style.divider ? 0.7 : 0,
                        borderBottomColor: s.style.color,
                      }
                    : heading
                }
              >
                <Inline text={layout === "teaching" || (purpose === "academic" && layout !== "reference") ? richUpperCase(s.title) : s.title} accent={d.accent}/>
              </Text>
              {s.entries.filter(filledEntry).map((e) => (
                <View
                  key={e.id}
                  style={{
                    marginBottom: e.style?.spacingAfter ?? 10,
                    marginLeft: e.style?.indent ?? 0,
                    textAlign:e.style?.textAlign ?? s.style?.textAlign ?? d.textAlign ?? "left",
                  }}
                >
                  {!!(e.title || e.date) && (
                    <View
                      minPresenceAhead={e.description ? 65 : 32}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <Text style={{ fontWeight: 700, flex: 1 }}>
                        <Inline text={e.title} accent={d.accent}/>
                      </Text>
                      <Text
                        style={{
                          fontSize: size - 1,
                          maxWidth: "32%",
                          textAlign: "right",
                          color: "#525969",
                        }}
                      >
                        <Inline text={e.date} accent={d.accent}/>
                      </Text>
                    </View>
                  )}
                  {!!(e.subtitle || e.location) && (
                    <Text
                      minPresenceAhead={e.description ? 20 : 0}
                      style={{
                        fontSize: size,
                        color: "#525969",
                        marginTop: 2,
                        marginBottom: 3,
                      }}
                    >
                      <Inline text={joinRich([e.subtitle, e.location]," · ")} accent={d.accent}/>
                    </Text>
                  )}
                  {!!e.url && (
                    <Link
                      src={safeUrl(e.url) || ""}
                      style={{
                        fontSize: size - 1,
                        color: d.accent,
                        marginBottom: 3,
                      }}
                    >
                      <Inline text={entryLinkLabel(e)} accent={d.accent}/>
                    </Link>
                  )}
                  {richLines(e.description)
                    .map((line, i) =>
                      /^[•*\-]\s/.test(richPlain(line)) ? (
                        <View
                          key={i}
                          style={{ flexDirection: "row", marginBottom: 3 }}
                        >
                          <Text style={{ width: 12 }}>•</Text>
                          <Text style={{ flex: 1 }}>
                            <Inline text={withoutBullet(line)} accent={d.accent}/>
                          </Text>
                        </View>
                      ) : (
                        <Text orphans={2} widows={2} key={i} style={body}>
                          <Inline text={line} accent={d.accent}/>
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
              top: (d.paper === "A4" ? 841.89 : 792) - 32,
              left: d.margins,
              right: d.margins,
              textAlign: "center",
              fontSize: 8,
              lineHeight: 1.2,
              fontFamily: "Helvetica",
              color: "#6b7280",
            }}
            render={({ pageNumber, totalPages }) =>
              `${p.name ? richPlain(p.name) + "  ·  " : ""}${pageNumber} / ${totalPages}`
            }
          />
        )}
      </Page>
    </Document>
  );
}
async function renderPDF(cv: CV) {
  if (cv.latex?.mode === "custom") return pdfBlob((await compileCV(cv)).pdf);
  if (cv.design.font === "editorial") {
    const f = await documentFont("editorial");
    PDFFont.register({
      family: "CVEditorial",
      fonts: [
        { src: "data:font/ttf;base64," + f.regular, fontWeight: 400 },
        { src: "data:font/ttf;base64," + f.bold, fontWeight: 700 },
        { src: "data:font/ttf;base64," + f.regular, fontWeight: 400, fontStyle:"italic" },
        { src: "data:font/ttf;base64," + f.bold, fontWeight: 700, fontStyle:"italic" },
      ],
    });
  }
  registerFonts(window.location.origin);
  return pdf(<PDFDocument cv={cv} />).toBlob();
}

// One rendering result serves live preview, preview modal and download. Serialize
// React-PDF renders because font registration and the renderer are process-global.
const cache = new Map<string, Promise<Blob>>();
let queue: Promise<unknown> = Promise.resolve();
export function createPDF(cv: CV): Promise<Blob> {
  const fontKey=cv.design.font === "editorial" && typeof localStorage !== "undefined" ? localStorage.getItem("cvb:editorial:regular")+":"+localStorage.getItem("cvb:editorial:bold") : "";
  const key=JSON.stringify(cv)+fontKey;
  const existing=cache.get(key); if(existing)return existing;
  const snapshot=structuredClone(cv);
  const result=queue.then(() => renderPDF(snapshot));
  queue=result.catch(() => {});
  cache.set(key,result);
  while(cache.size>3)cache.delete(cache.keys().next().value!);
  result.catch(() => {if(cache.get(key)===result)cache.delete(key);});
  return result;
}
