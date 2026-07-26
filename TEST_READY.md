# E2E Test Suite Ready: DropDetect AI Website Redesign

## Summary
The automated Node.js test script `website/verify-website.js` has been created and configured for the DropDetect AI Website Redesign project. It provides programmatic verification across all 5 requirements (R1–R5) defined in `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `TEST_INFRA.md`.

## Test Execution Commands
To run the automated verification test suite:

```bash
# Option 1: Direct Node execution
cd website
node verify-website.js

# Option 2: npm test runner
cd website
npm test
```

## Test Coverage Inventory

### 1. Requirement 1 (R1): Modern Bilingual (TH/EN) Website Architecture & i18n
- **`R1.1`**: i18n Context / Dictionary File (`LanguageContext.tsx` / `translations.ts`) presence verification.
- **`R1.2`**: Dual-language dictionary verification for both Thai (`'th'`) and English (`'en'`).
- **`R1.3`**: UI section key coverage (Navigation, Hero, Downloads, User Manual).
- **`R1.4`**: Header/Navbar language toggle switcher implementation check.
- **`R1.5`**: `localStorage` persistence key `'dropdetect_lang'` logic check.

### 2. Requirement 2 (R2): Branding & Interactive Media Showcase
- **`R2.1`**: Source brand icon (`website/icons/icon.png`) non-zero byte size assertion.
- **`R2.2`**: Public brand asset (`public/icon.png`, `public/favicon.ico`, or `public/droplet.svg`) presence check.
- **`R2.3`**: Logo/favicon usage in HTML markup (`index.html`) or React components (`Navbar.tsx` / `Footer.tsx`).
- **`R2.4`**: All 7 application screenshot files in `website/image-appdrpai/` (`imageappdrpai (1).png` .. `(7).png`) integrity assertion.
- **`R2.5`**: Public screenshot copies in `public/screenshots/` or `public/image-appdrpai/` verification.
- **`R2.6`**: Screenshot metadata configuration (`screenshots.ts` or `ShowcaseGallery.tsx`) with TH/EN titles, categories, and descriptions.
- **`R2.7`**: Fullscreen Lightbox modal component (`LightboxModal.tsx`) interactive preview check.

### 3. Requirement 3 (R3): Multi-Platform Download Center
- **`R3.1`**: Windows 10/11 (.exe) NSIS installer download card assertion.
- **`R3.2`**: Debian (.deb) Linux package download card assertion.
- **`R3.3`**: Linux (.AppImage) standalone executable download card assertion.
- **`R3.4`**: Fedora (.rpm) Linux package download card assertion.
- **`R3.5`**: Technical specifications check (SHA256 checksum presentation, system requirements, platform detection, fallback URLs).

### 4. Requirement 4 (R4): Bilingual User Documentation & Manual Page
- **`R4.1`**: User Manual page component (`UserManual.tsx`) existence check.
- **`R4.2`**: Topic 1 — Windows & Linux Installation Guide (.exe, .deb, .AppImage, .rpm) TH/EN assertion.
- **`R4.3`**: Topic 2 — Microscope & Optics Setup Guide (USB UVC, 4x/10x lenses, 2.79e-7 calibration factor, WHO spread factor) TH/EN assertion.
- **`R4.4`**: Topic 3 — Live AI Detection & WHO Analytics Guide (YOLOv8+ByteTrack real-time tracking, Dv0.5/SPAN, ROI tool) TH/EN assertion.
- **`R4.5`**: Topic 4 — Offline Media Import Guide (Image/Video drag-and-drop, playback speed controls, batch processing) TH/EN assertion.
- **`R4.6`**: Topic 5 — Excel Exporting & Project Files Guide (OpenPyXL reports, .drop zip archives, auto-save workspace) TH/EN assertion.
- **`R4.7`**: Sidebar sub-navigation structure for switching between guide sections verification.

### 5. Requirement 5 (R5): Clean Production Build Pass
- **`R5.1`**: Executes `npm run build` via `execSync` inside `website/` and asserts exit code 0 without fatal errors.
- **`R5.2`**: Validates generated bundle artifacts in `website/dist/` (`index.html` and static assets).

## Assertions Summary
- Total Test Assertions: 23
- Assertion Style: Requirement-driven, explicit pass/fail assertion reporting with detailed failure diagnostics and non-zero exit codes upon failure.
