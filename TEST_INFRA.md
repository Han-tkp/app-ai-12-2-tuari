# E2E Test Infra: DropDetect AI Website Redesign

## Test Philosophy
- Opaque-box, requirement-driven verification for website components, i18n, download center, media gallery, user manual, and build outputs.
- Category-Partition + Boundary Value Analysis + Pairwise + Real-World Workloads.

## Feature Inventory & Test Coverage Goals
| # | Feature | Requirement | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Real-World) |
|---|---------|-------------|:-----------------:|:-----------------:|:---------------------:|:-------------------:|
| 1 | Bilingual i18n Engine | R1 | 5 tests | 5 tests | ✓ | ✓ |
| 2 | Brand Logo & Favicon | R2 | 5 tests | 5 tests | ✓ | ✓ |
| 3 | Core Layout & Navbar | R1 | 5 tests | 5 tests | ✓ | ✓ |
| 4 | Hero Section | R1 | 5 tests | 5 tests | ✓ | ✓ |
| 5 | Download Center (Win/Linux) | R3 | 5 tests | 5 tests | ✓ | ✓ |
| 6 | Media Showcase & Gallery | R2 | 5 tests | 5 tests | ✓ | ✓ |
| 7 | Lightbox Modal | R2 | 5 tests | 5 tests | ✓ | ✓ |
| 8 | User Manual (Win/Linux Install) | R4 | 5 tests | 5 tests | ✓ | ✓ |
| 9 | User Manual (Microscope Setup) | R4 | 5 tests | 5 tests | ✓ | ✓ |
| 10| User Manual (Live AI & WHO) | R4 | 5 tests | 5 tests | ✓ | ✓ |
| 11| User Manual (Import Media) | R4 | 5 tests | 5 tests | ✓ | ✓ |
| 12| User Manual (Excel & Projects) | R4 | 5 tests | 5 tests | ✓ | ✓ |
| 13| Build Script Clean Pass | R5 | 5 tests | 5 tests | ✓ | ✓ |

## Test Architecture
- Test Suite Runner: Node.js verification script (`website/test-e2e.js` or `website/test-suite.ts`) executing DOM structure, i18n string checks, asset presence checks, TypeScript compile checks, and `npm run build` execution.
