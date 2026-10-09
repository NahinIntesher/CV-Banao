> Editing update: Word-style inline font, size, color, bold/italic/underline and named links; left/center/right/justify alignment; resizable LaTeX workspace; two-way CV-field synchronization with individual unsupported-part reporting. Live preview and PDF download share the same generated PDF. Custom LaTeX can recover editable text and links from its compiled PDF after review.

> Latest update: structured per-entry CV import with review, editable XeLaTeX and compiled PDF preview, Overleaf export, drag ordering/style controls, 22 templates and 15 font choices (Editorial requires your licensed upload). See PATCH_INSTRUCTIONS.md in the update ZIP and the included backend/latex/README.md for compiler setup.

# CV Banao

A dedicated CV builder for academic, research, PhD / higher study and industry applications. Next.js, React, TypeScript and Lucide React, with a Quicksand interface.

## Run

Requires Node.js 22.13+.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Installation bundles PDF extraction, English OCR assets and the ten professional CV fonts locally. No external font or OCR CDN is required when using the app.

```sh
npm test
npm run build
npm start
```

## Workspace

- Dashboard with draft search and quick creation.
- 20 named templates: four purposes with five layout systems (classic, minimal, rail, banner and editorial).
- 10 embedded CV fonts: Inter, Source Sans 3, Lora, EB Garamond, Roboto, Open Sans, Merriweather, Libre Baskerville, Noto Sans and DM Sans.
- Independent CV colors and a 12-color workspace palette, with Light / Dark / System appearance.
- Profile for reusable contact information and settings for new-CV defaults.
- Purpose-specific sections, editable content, reorder controls, undo/redo, multiple drafts, autosave, PDF/TXT/JSON exports and full workspace backup/restore.

## Import an existing CV

Use **Import current CV** to upload PDF, DOCX, TXT or a CV JSON backup, or choose **Paste CV text**.

1. Review extracted contact fields and section content against the expandable original source.
2. Correct missing fields and split section text into separate entries when needed.
3. Choose **Save information only** to store it in your information library without modifying your current CV.
4. When creating a new CV, choose **Use imported information**, select a saved import, and select the fields/sections to use.
5. To update an existing CV, open **Review & use**, select fields/sections, choose **Update current CV** and confirm. This also saves the reviewed import. Matching selected sections are replaced; other sections stay unchanged. Undo is available during the editing session.

Contact and section detection uses conservative rules and does not infer qualifications. PDF columns or unusual headings may require manual correction. Unclassified text is preserved in an explicitly labelled section. PDF sources retain page markers. JSON imports preserve fully structured CV data. Raw PDF/DOCX file bytes are not retained; extracted text and reviewed information are saved locally.

Limits: 10 MB per import, 2 MB per CV JSON backup, 120,000 source characters, 60 searchable PDF pages, 12 pages for scanned PDFs, 20 saved imports and 50 drafts. English OCR runs locally and can take longer than text extraction. Image-based DOCX files need PDF conversion or pasted text. Password-protected documents must be unlocked first.

## Research PDFs to CV wording

Copy `.env.example` to `.env.local`, set `OPENAI_API_KEY` and a private `CV_AI_ACCESS_CODE`, then restart. Keep secrets on the server.

Research PDF text extraction runs in the browser. Generating AI wording sends extracted text and the stated role to the server/OpenAI. Evidence passages are checked against cited pages. Review factual accuracy and your own contribution before adding entries. No API key is required for ordinary CV imports, English OCR or the CV editor.

The included API guard and rate limiter suit a private workspace. A public multi-user service needs hosted authentication, persistent rate limiting and an account database. This deliverable does not provide cloud accounts or cross-device synchronization.

## Data and compatibility

Profile, imported information and CV drafts are stored in this browser/device. Keep the same site address and browser profile to retain access. Export a **workspace backup** in Settings to move profile, imports, settings and drafts to another device. Restoring replaces the current workspace; export before restoring if you want to keep both versions. Clearing browser data can remove local work. Storage failures are displayed instead of claiming success.

Existing CV Studio drafts and CV JSON backups remain compatible. The previous draft and theme keys are retained deliberately for migration; the profile/import workspace uses a separate versioned key.

The interface responds to desktop, tablet and mobile widths. CV pages remain white, and document fonts/colors are separate from the workspace appearance. The continuous HTML preview approximates the document; PDF export supplies actual pagination. Review the final PDF before submitting.

Bundled CV fonts cover Latin text. Additional script-specific document fonts would be needed for Bengali CV export. English OCR is the included OCR language.
