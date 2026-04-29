import { state } from './state';

const KEY_SPACING_COLOR = 'chimera_spacing_color';
const KEY_OUTPUT_FORMAT = 'chimera_output_format';
const KEY_CUT_GRID = 'chimera_cut_grid';

export function loadSettings(): void {
  const color = localStorage.getItem(KEY_SPACING_COLOR);
  if (color) state.spacingColor = color;

  const fmt = localStorage.getItem(KEY_OUTPUT_FORMAT);
  if (fmt === 'png' || fmt === 'jpeg') state.outputFormat = fmt;

  const grid = localStorage.getItem(KEY_CUT_GRID);
  if (grid === '3' || grid === '4') state.cutGrid = Number(grid);
}

export function saveSpacingColor(color: string): void {
  state.spacingColor = color;
  localStorage.setItem(KEY_SPACING_COLOR, color);
  state.notify('spacingColor');
}

export function saveOutputFormat(fmt: 'png' | 'jpeg'): void {
  state.outputFormat = fmt;
  localStorage.setItem(KEY_OUTPUT_FORMAT, fmt);
}

export function saveCutGrid(grid: number): void {
  state.cutGrid = grid;
  localStorage.setItem(KEY_CUT_GRID, String(grid));
}
