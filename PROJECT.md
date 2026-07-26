# Project: DropDetect AI Website Redesign

## Architecture
- Framework: React 19 + Vite 6 + TypeScript 5.6
- Styling: TailwindCSS v4 + Lucide React Icons
- i18n Architecture: Custom `LanguageContext` supporting Thai (`th`) and English (`en`) with `localStorage` persistence and fallback mechanisms.
- Router / Page Navigation: Single Page Application (SPA) with tab-based or route-based state (`home` vs `manual` vs `downloads` vs `gallery`).
- Build Output: Clean static website bundle output to `website/dist`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Bilingual i18n Engine | Thai/English Language Context, dictionary system, language switcher in Header | M1 | R1, Survey |
| 2 | Brand Logo & Favicon Setup | Utilize `website/icons/icon.png` as favicon, navbar icon, and high-res brand badge | M1 | R2, Survey |
| 3 | Core Layout & Navigation | Header, Navbar, Footer, and responsive mobile menu with TH/EN support | M1 | R1, Survey |
| 4 | Hero Section | Compelling hero banner, product tagline, key features grid, quick CTAs in TH & EN | M2 | R1, Survey |
| 5 | Multi-Platform Download Center | Download cards for Windows (.exe), Debian (.deb), Linux (.AppImage), Fedora (.rpm) with SHA256 / sys reqs | M2 | R3, Survey |
| 6 | Interactive Media Showcase | Gallery & slider showcasing 7 app screenshots from `website/image-appdrpai/` with category filters | M3 | R2, Survey |
| 7 | Full-Screen Lightbox Modal | Interactive image preview modal with zoom controls, TH/EN captions, keyboard shortcuts | M3 | R2, Survey |
| 8 | Installation Manual (Win/Linux) | Detailed bilingual installation guides for Windows NSIS (.exe) and Linux (.deb/.AppImage/.rpm) | M4 | R4, Survey |
| 9 | Microscope & Optics Setup Guide | Setup instructions for USB UVC camera, 4x/10x objective lenses, 2.79e-7 calibration, WHO spread factor | M4 | R4, Survey |
| 10 | Live AI Detection & WHO Analytics Guide | Step-by-step documentation for YOLOv8+ByteTrack real-time tracking, Dv0.5/SPAN stats, ROI tool | M4 | R4, Survey |
| 11 | Offline Media Import Guide | User guide for image/video drag-and-drop, playback speed controls, batch processing | M4 | R4, Survey |
| 12 | Excel Exporting & Project Files Guide | Documentation for OpenPyXL TH/EN report generation, .drop zip archives, auto-save workspace | M4 | R4, Survey |
| 13 | E2E Verification & Clean Build Pass | Verification of all acceptance criteria R1-R5 and `npm run build` clean pass | M5 | R5, Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Architecture, i18n & Layout | Set up React/Vite/Tailwind, i18n system, Header, Footer, Favicon (`icon.png`) | None | PLANNED |
| M2 | Hero & Download Center | Build Hero banner and Download Center (Win .exe, Linux .deb/.AppImage/.rpm) | M1 | PLANNED |
| M3 | Media Showcase & Lightbox | Interactive gallery/slider with 7 screenshots & full-screen lightbox modal | M1 | PLANNED |
| M4 | Bilingual User Manual Page | Comprehensive user manual covering installation, setup, AI, import, Excel export | M1 | PLANNED |
| M5 | E2E Validation & Clean Build | Pass E2E test suite, audit checks, and clean `npm run build` | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### `LanguageContext.tsx` ↔ All Components
- `language`: `'th' | 'en'`
- `setLanguage`: `(lang: 'th' | 'en') => void`
- `t`: `(key: string) => string`
- Local storage key: `'dropdetect_lang'`

### `App.tsx` Page State
- `activeTab`: `'home' | 'manual' | 'downloads' | 'gallery'`
- `setActiveTab`: `(tab: 'home' | 'manual' | 'downloads' | 'gallery') => void`

## Code Layout
- `website/public/icon.png`: Brand favicon & logo asset
- `website/public/screenshots/`: Copied screenshot images from `website/image-appdrpai/`
- `website/src/context/LanguageContext.tsx`: Bilingual i18n context provider & dictionary
- `website/src/data/translations.ts`: Comprehensive TH & EN dictionary for all UI text & manual sections
- `website/src/data/screenshots.ts`: Screenshot metadata (paths, titles TH/EN, categories, descriptions TH/EN)
- `website/src/components/Header.tsx`: Navigation bar with brand logo, nav links, and TH/EN language toggle
- `website/src/components/Footer.tsx`: Footer with brand details, platform links, and copyright
- `website/src/components/Hero.tsx`: Hero section banner
- `website/src/components/DownloadCenter.tsx`: Multi-platform download cards (.exe, .deb, .AppImage, .rpm)
- `website/src/components/ShowcaseGallery.tsx`: Interactive gallery & slider component
- `website/src/components/LightboxModal.tsx`: Fullscreen lightbox image viewer component
- `website/src/components/UserManual.tsx`: Comprehensive bilingual documentation page with sidebar sub-navigation
- `website/src/App.tsx`: Main app component routing & tab control
