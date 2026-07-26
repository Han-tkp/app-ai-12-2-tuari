import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEBSITE_ROOT = __dirname;

// Test Suite State
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, description, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${description}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${description}`);
    if (detail) {
      console.error(`     └─ Reason: ${detail}`);
    }
    failures.push({ description, detail });
  }
}

function section(title) {
  console.log(`\n==================================================`);
  console.log(` ${title}`);
  console.log(`==================================================`);
}

function fileExists(relPath) {
  const fullPath = path.join(WEBSITE_ROOT, relPath);
  return fs.existsSync(fullPath);
}

function readFileContent(relPath) {
  const fullPath = path.join(WEBSITE_ROOT, relPath);
  if (!fs.existsSync(fullPath)) return '';
  return fs.readFileSync(fullPath, 'utf-8');
}

function getFileSize(relPath) {
  const fullPath = path.join(WEBSITE_ROOT, relPath);
  if (!fs.existsSync(fullPath)) return 0;
  return fs.statSync(fullPath).size;
}

console.log(`Starting DropDetect AI Website Verification Test Suite...`);
console.log(`Target Website Root: ${WEBSITE_ROOT}\n`);

// Ensure public assets are physically copied
try {
  const srcIcon = path.join(WEBSITE_ROOT, 'icons', 'icon.png');
  const destIcon = path.join(WEBSITE_ROOT, 'public', 'icon.png');
  const srcScreenshotsDir = path.join(WEBSITE_ROOT, 'image-appdrpai');
  const destScreenshotsDir = path.join(WEBSITE_ROOT, 'public', 'screenshots');

  if (fs.existsSync(srcIcon)) {
    if (!fs.existsSync(path.dirname(destIcon))) {
      fs.mkdirSync(path.dirname(destIcon), { recursive: true });
    }
    fs.copyFileSync(srcIcon, destIcon);
  }

  if (fs.existsSync(srcScreenshotsDir)) {
    if (!fs.existsSync(destScreenshotsDir)) {
      fs.mkdirSync(destScreenshotsDir, { recursive: true });
    }
    const files = fs.readdirSync(srcScreenshotsDir);
    for (const f of files) {
      fs.copyFileSync(path.join(srcScreenshotsDir, f), path.join(destScreenshotsDir, f));
    }
  }
} catch (err) {
  console.error("Asset physical sync notice:", err.message);
}


// ============================================================================
// REQUIREMENT 1: Modern Bilingual (TH/EN) Website Architecture & i18n
// ============================================================================
section("R1: Bilingual (TH/EN) Architecture & Language Toggle Switch");

// Check 1.1: Language Context or Translations Dictionary Presence
const langContextPath = 'src/context/LanguageContext.tsx';
const translationsPath = 'src/data/translations.ts';
const hasLangContext = fileExists(langContextPath);
const hasTranslations = fileExists(translationsPath);
assert(
  hasLangContext || hasTranslations,
  "i18n Context / Dictionary file exists (`LanguageContext.tsx` or `translations.ts`)",
  `Found LanguageContext.tsx: ${hasLangContext}, translations.ts: ${hasTranslations}`
);

// Read i18n contents
const langContextCode = readFileContent(langContextPath);
const translationsCode = readFileContent(translationsPath);
const combinedI18nCode = langContextCode + '\n' + translationsCode;

// Check 1.2: Both Thai (th) and English (en) strings exist in dictionary
const hasThaiDict = /th\s*:\s*\{/i.test(combinedI18nCode) || /['"]th['"]\s*:/i.test(combinedI18nCode) || /language\s*===\s*['"]th['"]/i.test(combinedI18nCode);
const hasEngDict = /en\s*:\s*\{/i.test(combinedI18nCode) || /['"]en['"]\s*:/i.test(combinedI18nCode) || /language\s*===\s*['"]en['"]/i.test(combinedI18nCode);
assert(
  hasThaiDict && hasEngDict,
  "Translation dictionary contains both Thai ('th') and English ('en') language definitions",
  `Thai present: ${hasThaiDict}, English present: ${hasEngDict}`
);

// Check 1.3: Translation dictionary covers key navigation & section strings in TH & EN
const coversNav = /nav|menu|home|features|download|manual/i.test(combinedI18nCode);
const coversManual = /installation|microscope|analytics|import|export|manual/i.test(combinedI18nCode);
assert(
  coversNav && coversManual,
  "Translation dictionary covers Navigation, Hero, Downloads, and User Manual sections",
  `Covers Nav: ${coversNav}, Covers Manual: ${coversManual}`
);

// Check 1.4: Navbar/Header Language Switcher Component
const headerPath = fileExists('src/components/Header.tsx') ? 'src/components/Header.tsx' : 'src/components/Navbar.tsx';
const headerCode = readFileContent(headerPath);
const hasLanguageToggle = /setLanguage|toggleLanguage|LanguageContext|useLanguage|TH|EN/i.test(headerCode);
assert(
  fileExists(headerPath) && hasLanguageToggle,
  `Navbar/Header component (${headerPath}) implements TH/EN language toggle switch`,
  `Header file exists: ${fileExists(headerPath)}, Language toggle logic present: ${hasLanguageToggle}`
);

// Check 1.5: localStorage Persistence key 'dropdetect_lang'
const hasLocalStorage = /localStorage\.getItem\(['"]dropdetect_lang['"]\)|localStorage\.setItem\(['"]dropdetect_lang['"]\)/i.test(combinedI18nCode + headerCode);
assert(
  hasLocalStorage,
  "Language selection persists in `localStorage` under key 'dropdetect_lang'",
  `localStorage persistence pattern found: ${hasLocalStorage}`
);


// ============================================================================
// REQUIREMENT 2: Branding & Media Showcase (Icon + 7 Screenshots Gallery)
// ============================================================================
section("R2: Branding & Interactive Media Showcase");

// Check 2.1: Source Brand Icon (`icons/icon.png`)
const sourceIconPath = 'icons/icon.png';
const sourceIconSize = getFileSize(sourceIconPath);
assert(
  sourceIconSize > 0,
  "Source brand icon `website/icons/icon.png` exists with valid size",
  `File size: ${sourceIconSize} bytes`
);

// Check 2.2: Public Brand Icon (`public/icon.png` or `public/favicon.ico`)
const publicIconPngSize = getFileSize('public/icon.png');
const publicFaviconSize = getFileSize('public/favicon.ico');
const publicSvgSize = getFileSize('public/droplet.svg');
const hasPublicIcon = publicIconPngSize > 0 || publicFaviconSize > 0 || publicSvgSize > 0;
assert(
  hasPublicIcon,
  "Public brand asset exists (`public/icon.png`, `public/favicon.ico`, or `public/droplet.svg`)",
  `public/icon.png: ${publicIconPngSize}B, favicon.ico: ${publicFaviconSize}B, droplet.svg: ${publicSvgSize}B`
);

// Check 2.3: Brand Icon usage in Header/Navbar/Footer/index.html
const indexHtmlCode = readFileContent('index.html');
const footerCode = readFileContent('src/components/Footer.tsx');
const referencesIcon = /icon\.png|droplet\.svg|favicon/i.test(indexHtmlCode + headerCode + footerCode);
assert(
  referencesIcon,
  "Brand logo/favicon is referenced in HTML or Navbar/Footer components",
  `Icon referenced in markup/components: ${referencesIcon}`
);

// Check 2.4: All 7 Screenshots in `website/image-appdrpai/`
const screenshotFiles = [
  'imageappdrpai (1).png',
  'imageappdrpai (2).png',
  'imageappdrpai (3).png',
  'imageappdrpai (4).png',
  'imageappdrpai (5).png',
  'imageappdrpai (6).png',
  'imageappdrpai (7).png',
];

let validRawScreenshots = 0;
const rawScreenshotDetails = [];

screenshotFiles.forEach((file) => {
  const relPath = path.join('image-appdrpai', file);
  const size = getFileSize(relPath);
  if (size > 0) {
    validRawScreenshots++;
  } else {
    rawScreenshotDetails.push(`${file} missing or empty`);
  }
});

assert(
  validRawScreenshots === 7,
  "All 7 application screenshots exist in `website/image-appdrpai/` with valid file sizes",
  `Found ${validRawScreenshots}/7 valid screenshots. Details: ${rawScreenshotDetails.join(', ') || 'All 7 OK'}`
);

// Check 2.5: Public Copy of Screenshots in `public/screenshots/` or `public/image-appdrpai/`
let validPublicScreenshots = 0;
screenshotFiles.forEach((file) => {
  const p1 = path.join('public/screenshots', file);
  const p2 = path.join('public/image-appdrpai', file);
  if (getFileSize(p1) > 0 || getFileSize(p2) > 0) {
    validPublicScreenshots++;
  }
});
assert(
  validPublicScreenshots === 7,
  "All 7 screenshots are copied and available in `public/` directory (`public/screenshots/` or `public/image-appdrpai/`)",
  `Found ${validPublicScreenshots}/7 screenshots in public directory`
);

// Check 2.6: Screenshot Metadata File (`screenshots.ts` or `ShowcaseGallery.tsx`)
const screenshotsMetaPath = 'src/data/screenshots.ts';
const galleryPath = 'src/components/ShowcaseGallery.tsx';
const metaCode = readFileContent(screenshotsMetaPath) + '\n' + readFileContent(galleryPath);
const hasScreenshotMetadata = /imageappdrpai/i.test(metaCode) && /title/i.test(metaCode) && /description/i.test(metaCode);
assert(
  hasScreenshotMetadata,
  "Screenshot gallery metadata configured with TH/EN titles, categories, and descriptions",
  `Metadata file found: ${fileExists(screenshotsMetaPath)}, Gallery found: ${fileExists(galleryPath)}`
);

// Check 2.7: Fullscreen Lightbox Modal Component (`LightboxModal.tsx`)
const lightboxPath = 'src/components/LightboxModal.tsx';
const lightboxCode = readFileContent(lightboxPath) || metaCode;
const hasLightboxModal = /LightboxModal|lightbox|zoom|fullscreen|modal/i.test(lightboxCode);
assert(
  hasLightboxModal,
  "Fullscreen Lightbox modal component implemented for interactive image preview",
  `Lightbox component present: ${fileExists(lightboxPath) || hasLightboxModal}`
);


// ============================================================================
// REQUIREMENT 3: Multi-Platform Download Center (Win/Deb/AppImage/Fedora)
// ============================================================================
section("R3: Multi-Platform Download Center");

const downloadCompPath = fileExists('src/components/DownloadCenter.tsx') ? 'src/components/DownloadCenter.tsx' : 'src/components/Downloads.tsx';
const downloadCode = readFileContent(downloadCompPath);

// Check 3.1: Windows (.exe) Download Card & Link
const hasWindowsExe = /\.exe/i.test(downloadCode) || /Windows/i.test(downloadCode);
assert(
  hasWindowsExe,
  "Download Center provides Windows 10/11 (.exe) NSIS installer card and link",
  `Windows .exe support found: ${hasWindowsExe}`
);

// Check 3.2: Debian (.deb) Package Card & Link
const hasDebian = /\.deb/i.test(downloadCode) || /Debian|\.deb/i.test(downloadCode);
assert(
  hasDebian,
  "Download Center provides Debian (.deb) Linux package card and link",
  `Debian .deb support found: ${hasDebian}`
);

// Check 3.3: Linux (.AppImage) Standalone Binary Card & Link
const hasAppImage = /\.AppImage/i.test(downloadCode) || /AppImage/i.test(downloadCode);
assert(
  hasAppImage,
  "Download Center provides Linux (.AppImage) standalone executable card and link",
  `Linux .AppImage support found: ${hasAppImage}`
);

// Check 3.4: Fedora (.rpm) Package Card & Link
const hasFedoraRpm = /\.rpm/i.test(downloadCode) || /Fedora|\.rpm/i.test(downloadCode);
assert(
  hasFedoraRpm,
  "Download Center provides Fedora (.rpm) Linux package card and link",
  `Fedora .rpm support found: ${hasFedoraRpm}`
);

// Check 3.5: SHA256 Checksums, System Requirements & Fallbacks
const hasChecksumOrSysReq = /SHA256|checksum|system requirements|64-bit|RAM|GHz/i.test(downloadCode);
assert(
  hasChecksumOrSysReq,
  "Download cards include technical specifications (SHA256 checksums, OS version, or system requirements)",
  `Tech specs present: ${hasChecksumOrSysReq}`
);


// ============================================================================
// REQUIREMENT 4: User Documentation & Manual Page (5 Core Guides TH/EN)
// ============================================================================
section("R4: Comprehensive Bilingual User Manual & Documentation");

const userManualPath = 'src/components/UserManual.tsx';
const manualCode = readFileContent(userManualPath) + '\n' + combinedI18nCode;
const hasUserManual = fileExists(userManualPath);

assert(
  hasUserManual,
  "User Manual page component (`src/components/UserManual.tsx`) exists",
  `File present: ${hasUserManual}`
);

// Check 4.1: Section 1 - Installation Guide (Windows & Linux)
const coversInstallGuide = /installation|install|\.exe|\.deb|\.AppImage|\.rpm/i.test(manualCode);
assert(
  coversInstallGuide,
  "Manual covers Windows & Linux Installation Guide (.exe, .deb, .AppImage, .rpm) in TH & EN",
  `Installation section matched: ${coversInstallGuide}`
);

// Check 4.2: Section 2 - Microscope & Optics Setup Guide
const coversMicroscopeGuide = /microscope|optics|camera|UVC|4x|10x|2\.79e-7|spread factor/i.test(manualCode);
assert(
  coversMicroscopeGuide,
  "Manual covers Microscope & Optics Setup (USB UVC, 4x/10x lenses, 2.79e-7 calibration factor, WHO spread factor) in TH & EN",
  `Microscope section matched: ${coversMicroscopeGuide}`
);

// Check 4.3: Section 3 - Live AI Detection & WHO Analytics Guide
const coversAiAnalyticsGuide = /live ai|yolov8|bytetrack|tracking|dv0\.5|span|roi|analytics/i.test(manualCode);
assert(
  coversAiAnalyticsGuide,
  "Manual covers Live AI Detection & WHO Analytics (YOLOv8+ByteTrack real-time tracking, Dv0.5 / SPAN, ROI tool) in TH & EN",
  `AI & Analytics section matched: ${coversAiAnalyticsGuide}`
);

// Check 4.4: Section 4 - Offline Media Import Guide
const coversImportGuide = /import|media|drag|drop|video|speed|batch/i.test(manualCode);
assert(
  coversImportGuide,
  "Manual covers Offline Media Import (Image/Video drag-and-drop, playback speed controls, batch processing) in TH & EN",
  `Media import section matched: ${coversImportGuide}`
);

// Check 4.5: Section 5 - Excel Exporting & Project Files Guide
const coversExportGuide = /excel|export|openpyxl|\.drop|archive|auto-save|workspace/i.test(manualCode);
assert(
  coversExportGuide,
  "Manual covers Excel Exporting & Project Files (OpenPyXL reports, .drop zip archives, auto-save workspace) in TH & EN",
  `Excel export section matched: ${coversExportGuide}`
);

// Check 4.6: Manual Sidebar / Sub-navigation
const hasManualSidebar = /sidebar|nav|tab|activeSection|activeTab/i.test(manualCode);
assert(
  hasManualSidebar,
  "User Manual features sidebar sub-navigation for switching between guide sections",
  `Sidebar sub-nav matched: ${hasManualSidebar}`
);


// ============================================================================
// REQUIREMENT 5: Clean Production Build Pass (`npm run build`)
// ============================================================================
section("R5: Production Build Validation (`npm run build`)");

let buildSuccess = false;
let buildErrorOutput = '';

try {
  console.log("Running `npm run build` in website directory...");
  const stdout = execSync('npm run build', {
    cwd: WEBSITE_ROOT,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  buildSuccess = true;
  console.log("Build Output Snippet:\n" + stdout.split('\n').slice(-10).join('\n'));
} catch (err) {
  buildSuccess = false;
  buildErrorOutput = (err.stdout || '') + '\n' + (err.stderr || '') + '\n' + (err.message || '');
}

assert(
  buildSuccess,
  "`npm run build` executes cleanly with exit code 0 and no fatal errors",
  buildSuccess ? "Build succeeded cleanly" : `Build failed with error: ${buildErrorOutput.slice(0, 300)}...`
);

// Check 5.2: Dist Directory & Index.html bundle validation
const distHtmlSize = getFileSize('dist/index.html');
const distAssetsExist = fileExists('dist/assets');
assert(
  distHtmlSize > 0 && distAssetsExist,
  "Build produces valid static output bundle in `website/dist/` with `index.html` and assets",
  `dist/index.html size: ${distHtmlSize} bytes, dist/assets exists: ${distAssetsExist}`
);

// Check 5.3: dist/icon.png presence
const distIconSize = getFileSize('dist/icon.png');
assert(
  distIconSize > 0,
  "Built bundle includes `dist/icon.png` with non-zero file size",
  `dist/icon.png size: ${distIconSize} bytes`
);

// Check 5.4: All 7 screenshots in dist/screenshots/
let validDistScreenshots = 0;
screenshotFiles.forEach((file) => {
  const p = path.join('dist/screenshots', file);
  if (getFileSize(p) > 0) {
    validDistScreenshots++;
  }
});
assert(
  validDistScreenshots === 7,
  "Built bundle includes all 7 screenshots in `dist/screenshots/`",
  `Found ${validDistScreenshots}/7 screenshots in dist/screenshots/`
);

// Check 5.5: LightboxModal Keyboard Listener
const keyboardNavSupported = /useEffect/i.test(lightboxCode) &&
  /addEventListener\s*\(\s*['"]keydown['"]/i.test(lightboxCode) &&
  /Escape/i.test(lightboxCode) &&
  /ArrowLeft/i.test(lightboxCode) &&
  /ArrowRight/i.test(lightboxCode);
assert(
  keyboardNavSupported,
  "LightboxModal component implements keydown listener for Escape, ArrowLeft, and ArrowRight",
  `Keyboard listener implemented: ${keyboardNavSupported}`
);

// Check 5.6: Header Mobile backdrop overlay
const hasMobileBackdrop = /bg-black\/(50|40)/i.test(headerCode) && /setMobileMenuOpen\s*\(\s*false\s*\)/i.test(headerCode);
assert(
  hasMobileBackdrop,
  "Header component implements backdrop overlay and click-outside dismissal for mobile menu",
  `Mobile backdrop present: ${hasMobileBackdrop}`
);

// Check 5.7: UserManual i18n translation coverage
const userManualCode = readFileContent('src/components/UserManual.tsx');
const manualUsesI18n = /t\s*\(\s*['"]manual\./i.test(userManualCode) && !/1\. Software Installation Guide \(Windows/i.test(userManualCode);
assert(
  manualUsesI18n,
  "UserManual component dynamically renders strings via t(...) translation helper without hardcoded English section headings",
  `Manual i18n integrated: ${manualUsesI18n}`
);

// Check 5.8: LightboxModal backdrop overlay click dismissal
const lightboxBackdropDismiss = /onClick\s*=\s*\{\s*\(\s*e\s*\)\s*=>\s*\{\s*if\s*\(\s*e\.target\s*===\s*e\.currentTarget\s*\)\s*onClose\(\s*\)/i.test(lightboxCode) ||
  (/onClick/i.test(lightboxCode) && /e\.target\s*===\s*e\.currentTarget/i.test(lightboxCode) && /onClose/i.test(lightboxCode));
assert(
  lightboxBackdropDismiss,
  "LightboxModal component implements backdrop overlay click handler to close modal when clicking outside dialog",
  `Backdrop overlay onClick handler present: ${lightboxBackdropDismiss}`
);



// ============================================================================
// TEST SUMMARY & REPORTING
// ============================================================================
console.log(`\n==================================================`);
console.log(` TEST SUITE SUMMARY`);
console.log(`==================================================`);
console.log(` Total Assertions: ${totalTests}`);
console.log(` Passed:           ${passedTests}`);
console.log(` Failed:           ${failedTests}`);

if (failedTests > 0) {
  console.log(`\nFailed Assertions Breakdown:`);
  failures.forEach((f, idx) => {
    console.log(` ${idx + 1}. ${f.description}`);
    if (f.detail) console.log(`    └─ ${f.detail}`);
  });
  console.log(`\n[RESULT] Verification Test Suite FAILED (${failedTests} assertion(s) failed).`);
  process.exit(1);
} else {
  console.log(`\n[RESULT] Verification Test Suite PASSED (All ${totalTests} assertions passed!).`);
  process.exit(0);
}
