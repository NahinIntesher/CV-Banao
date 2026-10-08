# Validation record

## Automated checks

- Production build and TypeScript checking pass.
- Model tests cover all four presets, backup validation, unsafe URL rejection, omission of hidden/empty sections and content-check behavior.
- Browser checks exercise content editing, template switching, font/color controls, autosave after reload, PDF and JSON download, draft import/duplication/rename, undo/redo and mobile navigation.
- No browser JavaScript errors were observed in the tested flows.
- A 390px mobile viewport was checked for horizontal document overflow.

## PDF checks

- All four templates were rendered through the application's PDF component using their bundled fonts.
- Synthetic long CVs produced multi-page PDFs. Text extraction confirmed selectable text and expected content.
- The first page of a multi-page PDF was visually inspected. Entry headings reserve room for following content.
- A PDF was also generated and downloaded in the browser.

## Visual checks

The desktop workspace and mobile editor/preview were inspected through screenshots. The app includes responsive navigation, native modal focus handling, explicit form labels, visible focus styles and reduced-motion support.

## Practical limits

This is a tested local-first application, not a claim of universal production certification. It has no cloud accounts, synchronization, collaboration or server backups. Browser storage can be cleared or run out. Use JSON backups. Unicode scripts beyond the bundled Latin font subsets and every possible extreme-length document have not been validated. PDF preview should be reviewed before submission.

## Research PDF feature (v1.1)

- Actual PDF text extraction was tested in Chromium using the bundled PDF.js worker and a synthetic searchable PDF.
- Browser checks verified source-text preview, relationship/contribution controls, request payload, an explicitly mocked structured AI result, manual confirmation before insertion, and persistence/editing of the added CV entry.
- API unit tests verify disabled configuration, access-code rejection, role validation, structured success handling, provider refusals and evidence-quote/page validation. All 8 test cases pass.
- The complete v1.1 production build passes, including the server summary endpoint.
- No real paid OpenAI request was made: live model quality, account billing/model availability and provider connectivity must be verified with the owner's API key. The bundled app contains no API credentials.
- Scanned PDFs, information only in figures and OCR are not supported by this text-extraction path.

## CV Banao 2.0 update

- Production build and TypeScript checks pass; 12 automated tests pass.
- Model tests validate all 20 template ids, four purposes, five layouts and all 10 CV fonts, legacy backups, selective application with fresh section ids, source preservation and full workspace backup validation.
- Real Chromium checks cover PDF, DOCX, pasted text and legacy JSON import, editable review, saving separately from the active CV, reload persistence, selective existing-CV updates, import retention after updates and undo.
- A synthetic image-only PDF was read through actual local English OCR. The import source, personal fields and editable content were verified. No mocked OCR or paid API was used.
- New-CV creation from a saved import, template search/category filtering, reusable profiles, all 12 workspace palettes, Light/Dark controls, appearance persistence, complete workspace backup download/restore and mobile navigation were exercised.
- Actual downloadable PDFs were generated for all 10 CV fonts. A banner-template PDF was rasterized and visually inspected.
- Horizontal document overflow was checked at 320, 360, 390, 430, 600, 720, 768, 820, 1024, 1280 and 1920 pixels. Dashboard/settings and mobile preview screenshots were inspected.
- The existing editor regression checks still pass: content editing, template/font/color controls, autosave, PDF/JSON export, backup import, draft duplication/renaming and undo/redo.
- No JavaScript runtime errors were observed in these tested flows.

This update adds OCR to **current-CV import**. The separate research-paper summary feature still uses searchable PDF text and retains the v1.1 limitations recorded above. CV field detection is conservative and requires review, particularly for unusual layouts and headings. English is the bundled OCR language. Accounts/cloud sync are not part of this device-local workspace.
