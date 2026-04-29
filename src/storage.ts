import { state } from './state';

function get<T>(key: string, fallback: T): T {
  const v = localStorage.getItem(key);
  if (v === null) return fallback;
  try { return JSON.parse(v) as T; } catch { return v as T; }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
}

export function loadSettings(): void {
  state.stitchMode = get('stitch_mode', 'DIRECT_VERTICAL');
  state.widthScale = get('width_scale', 'MIN_WIDTH');
  state.overlayArea = get('overlay_area', 10);
  state.overlayMode = get('overlay_mode', 'DISABLED');
  state.imageSpacing = get('image_spacing', 0);
  state.spacingColor = get('spacing_color', '#000000');
  state.cutGrid = get('cut_grid', 3);
  state.outputFormat = get('output_format', 'png');
  state.outputQuality = get('output_quality', 90);
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
  state.overlayArea = v; set('overlay_area', v);
}
export function saveImageSpacing(v: number): void {
  state.imageSpacing = v; set('image_spacing', v);
}
export function saveSpacingColor(v: string): void {
  state.spacingColor = v; set('spacing_color', v); state.notify('spacingColor');
}
export function saveCutGrid(v: number): void {
  state.cutGrid = v; set('cut_grid', v);
}
export function saveOutputFormat(v: 'png' | 'jpeg'): void {
  state.outputFormat = v; set('output_format', v);
}
export function saveOutputQuality(v: number): void {
  state.outputQuality = v; set('output_quality', v);
}
