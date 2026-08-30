import { state } from './state';

function getStored(key: string): unknown {
  const v = localStorage.getItem(key);
  if (v === null) return undefined;
  try { return JSON.parse(v) as unknown; } catch { return v; }
}

export function readEnum<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const value = getStored(key);
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback;
}

export function readInteger(key: string, fallback: number, min: number, max: number): number {
  const value = getStored(key);
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function readBoolean(key: string, fallback: boolean): boolean {
  const value = getStored(key);
  return typeof value === 'boolean' ? value : fallback;
}

export function readString(key: string, fallback: string): string {
  const value = getStored(key);
  return typeof value === 'string' ? value : fallback;
}

function readColor(key: string, fallback: string): string {
  const value = readString(key, fallback);
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
}

export function loadSettings(): void {
  state.stitchMode = readEnum('stitch_mode', ['DIRECT_VERTICAL', 'DIRECT_HORIZONTAL'], 'DIRECT_VERTICAL');
  state.widthScale = readEnum('width_scale', ['NONE', 'MIN_WIDTH', 'MAX_WIDTH'], 'MIN_WIDTH');
  state.overlayArea = readInteger('overlay_area', 10, 0, 100);
  state.overlayMode = readEnum('overlay_mode', ['DISABLED', 'ENABLED'], 'DISABLED');
  state.imageSpacing = readInteger('image_spacing', 0, 0, 200);
  state.spacingColor = readColor('spacing_color', '#000000');
  state.cutPreset = readEnum('cut_preset', ['grid2', 'grid3', 'x3', 'x4'], 'x4');
  state.outputFormat = readEnum('output_format', ['png', 'jpeg', 'webp'], 'png');
  state.outputQuality = readInteger('output_quality', 90, 1, 100);
  state.defaultSaveDir = readString('default_save_dir', '');
  state.alwaysPromptSave = readBoolean('always_prompt_save', true);
}

export function saveStitchMode(v: typeof state.stitchMode): void {
  state.stitchMode = v; set('stitch_mode', v); state.notify('stitchMode');
}
export function saveWidthScale(v: typeof state.widthScale): void {
  state.widthScale = v; set('width_scale', v); state.notify('widthScale');
}
export function saveOverlayMode(v: typeof state.overlayMode): void {
  state.overlayMode = v; set('overlay_mode', v); state.notify('overlayMode');
}
export function saveOverlayArea(v: number): void {
  state.overlayArea = v; set('overlay_area', v); state.notify('overlayArea');
}
export function saveImageSpacing(v: number): void {
  state.imageSpacing = v; set('image_spacing', v); state.notify('imageSpacing');
}
export function saveSpacingColor(v: string): void {
  state.spacingColor = v; set('spacing_color', v); state.notify('spacingColor');
}
export function saveCutPreset(v: typeof state.cutPreset): void {
  state.cutPreset = v; set('cut_preset', v); state.notify('cutPreset');
}
export function saveOutputFormat(v: typeof state.outputFormat): void {
  state.outputFormat = v; set('output_format', v);
}
export function saveOutputQuality(v: number): void {
  state.outputQuality = v; set('output_quality', v);
}
export function saveDefaultSaveDir(v: string): void {
  state.defaultSaveDir = v; set('default_save_dir', v); state.notify('exportSettings');
}
export function saveAlwaysPromptSave(v: boolean): void {
  state.alwaysPromptSave = v; set('always_prompt_save', v);
}

export type Theme = 'light' | 'dark' | 'auto';

export function getTheme(): Theme {
  const v = localStorage.getItem('chimera_theme');
  if (v === 'light' || v === 'dark' || v === 'auto') return v;
  return 'auto';
}

export function saveTheme(v: Theme): void {
  localStorage.setItem('chimera_theme', v);
  applyThemeDOM(v);
}

export function applyThemeDOM(theme: Theme): void {
  const isDark = theme === 'auto'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : theme === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');
}
