# Chimera Web — AGENTS.md

## Project

Vite + TypeScript SPA for image stitching/cutting. Desktop wrapped via Tauri v2.

## Commands

```powershell
npm run dev          # Dev server → http://localhost:19234
npm run build        # tsc + vite build → dist/
npm run tauri build  # Full desktop MSI/NSIS in src-tauri/target/release/bundle/
```

- `tsc` runs before `vite build` (configured in `package.json` `"build"` script)
- Tauri build requires Rust (stable-x86_64-pc-windows-msvc)

## Architecture

- **Single entry**: `src/main.ts` → renders `MainView` or `ResultView` based on `state.view`
- **State**: `AppState` singleton in `src/state.ts` with `on/notify` pub/sub
- **i18n**: `src/i18n.ts` exports `t(key, params?)` — locale read from `localStorage.chimera_locale`
- **Settings**: `src/storage.ts` with `get<T>()`/`set<T>()` helpers, persists to `localStorage`
- **Image pipeline**: `createImageBitmap(blob)` → `OffscreenCanvas` → `convertToBlob()`

## Key files

| File | Role |
|------|------|
| `src/state.ts` | Reactive state singleton |
| `src/views/MainView.ts` | Main SPA view (layout + params + action) |
| `src/views/ResultView.ts` | Stitch/split result viewer |
| `src/engine/stitch.ts` | Stitching algorithms (vertical/horizontal/overlay) |
| `src/engine/split.ts` | Grid split algorithm |
| `src/i18n.ts` | Chinese/English translations |
| `src/storage.ts` | localStorage persistence |
| `src/components/` | Reusable UI components |
| `src-tauri/` | Rust desktop wrapper (Tauri v2) |

## Conventions

- **Imports**: Use `import` (ESM). Type-only → `import type`.
- **Strings**: All user-facing text goes through `t('key')` — never hardcode Chinese/English.
- **CSS**: CSS custom properties in `:root` / `[data-theme="dark"]`. No preprocessor.
- **DOM**: No framework — manual `document.createElement` + event listeners.
- **State changes**: Always call `state.notify('key')` after mutating a field so listeners re-render.
- **Locale change**: `toggleLocale()` saves to localStorage and calls `location.reload()`.
- **Image blobs**: Created via `URL.createObjectURL(file)`, revoked in `removeImage()`.
