# Chimera Web — AGENTS.md

## Project

Vite + TypeScript SPA for image stitching/cutting. Desktop wrapped via Tauri v2.

## Commands

```bash
npm run dev          # Dev server → http://localhost:19234
npm run build        # tsc + vite build → dist/
npm test             # Vitest unit test suite (9 files / 38 tests at v1.1.0)
npm run tauri build  # Windows NSIS bundle in src-tauri/target/release/bundle/nsis/
```

- `tsc` runs before `vite build` (configured in `package.json` `"build"` script)
- Unit tests run via `vitest` under `tests/`
- Tauri build requires Rust (`stable-x86_64-pc-windows-msvc`) and should be run on Windows; the WSL environment does not provide the release toolchain

## Architecture

- **Single entry**: `src/main.ts` → renders `MainView` or `ResultView` based on `state.view`
- **State**: `AppState` singleton in `src/state.ts` with `on/notify` pub/sub
- **i18n**: `src/i18n.ts` exports `t(key, params?)` supporting 4 languages (`en`, `zh`, `ja`, `ko`) — locale read from `localStorage.chimera_locale`
- **Settings**: `src/storage.ts` persists to `localStorage`; enum, integer, boolean, string, and color values are validated when loaded
- **Image pipeline**: `createImageBitmap(blob)` → `OffscreenCanvas` → `convertToBlob()`; decoded bitmaps are explicitly closed after processing
- **Output contract**: `OutputFormat` and `SplitImageResult.format` keep MIME type, quality, extension, individual saves, and ZIP exports consistent
- **Native saving**: Tauri checks for an existing path with the filesystem plugin, then appends `_2`, `_3`, and so on before invoking the native write command

## Key files

| File | Role |
|------|------|
| `src/state.ts` | Reactive state singleton |
| `src/views/MainView.ts` | Main SPA view (layout + params + action) |
| `src/views/ResultView.ts` | Stitch/split result viewer with single & ZIP export |
| `src/engine/stitch.ts` | Stitching algorithms (vertical/horizontal/overlay) |
| `src/engine/split.ts` | Grid & X Panorama split algorithms (2x2, 3x3, 1x3, 1x4) |
| `src/output.ts` | Format/MIME/extension mapping and deterministic cut filenames |
| `src/native-save.ts` | Cross-platform path suffixing and available-path selection |
| `src/object-url.ts` | Result-preview object URL registry and cleanup |
| `src/engine/bitmap.ts` | Explicit `ImageBitmap.close()` helper |
| `src/i18n.ts` | 4-language dictionary & localization helper |
| `src/storage.ts` | Validated localStorage persistence |
| `src/components/` | Reusable UI components |
| `tests/` | Vitest unit tests for engines, state, settings, naming, native paths, and resource lifecycles |
| `src-tauri/` | Rust desktop wrapper (Tauri v2) |

## Conventions

- **Imports**: Use `import` (ESM). Type-only → `import type`.
- **Strings**: All user-facing text goes through `t('key')` — never hardcode Chinese/English/Japanese/Korean strings.
- **CSS**: CSS custom properties in `:root` / `[data-theme="dark"]`. No preprocessor.
- **DOM**: No framework — manual `document.createElement` + event listeners.
- **State changes**: Always call `state.notify('key')` after mutating a field so listeners re-render.
- **Locale change**: `setLocale(lang)` saves to localStorage and reloads or re-renders UI.
- **Input order**: Concurrent image decoding must preserve the original `File[]` order; pending decodes count toward the 10-image cut limit.
- **Cut output**: PNG/JPEG/WebP and JPEG/WebP quality apply to both stitch and cut results. `SplitImageResult.format` is the source of truth for saved extensions.
- **Batch filenames**: Multi-image exports include a stable two-digit source ordinal so duplicate source basenames cannot replace each other in ZIP or native output.
- **Native conflicts**: Never silently overwrite an existing file. Use `findAvailablePath()` and report saved/renamed counts; partial failures must report how many files were already written.
- **Image bitmaps**: Every `createImageBitmap()` must have an exception-safe `close()` after drawing/encoding completes.
- **Object URLs**: Input URLs are revoked on removal/clear. Result preview URLs must be registered with `ObjectUrlRegistry` and revoked on rerender or view exit.
- **Output estimate**: `estimateStitchDimensions()` must remain consistent with direct and overlay canvas allocation. Horizontal overlay height is the maximum scaled image height, never the maximum width.
- **Tests**: Run both `npm test` and `npm run build` before committing. Tauri/export changes also require a Windows `npm run tauri build` and manual native-save smoke test before release.
