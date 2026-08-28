import type { SplitCell, CutPreset } from '../state';

function computeSegments(total: number, n: number): { start: number; size: number }[] {
  const base = Math.floor(total / n);
  const rem = total % n;
  let pos = 0;
  const segs: { start: number; size: number }[] = [];
  for (let i = 0; i < n; i++) {
    const size = base + (i < rem ? 1 : 0);
    segs.push({ start: pos, size });
    pos += size;
  }
  return segs;
}

export function getPresetDimensions(preset: CutPreset): { rows: number; cols: number } {
  switch (preset) {
    case 'grid2': return { rows: 2, cols: 2 };
    case 'grid3': return { rows: 3, cols: 3 };
    case 'x3': return { rows: 1, cols: 3 };
    case 'x4': return { rows: 1, cols: 4 };
    default: return { rows: 1, cols: 4 };
  }
}

export async function splitGrid(
  image: ImageBitmap,
  preset: CutPreset
): Promise<{ rows: number; cols: number; cells: SplitCell[] }> {
  const { rows, cols } = getPresetDimensions(preset);
  const colSegs = computeSegments(image.width, cols);
  const rowSegs = computeSegments(image.height, rows);
  const cells: SplitCell[] = [];

  let index = 0;
  for (const rs of rowSegs) {
    for (const cs of colSegs) {
      const canvas = new OffscreenCanvas(cs.size, rs.size);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, cs.start, rs.start, cs.size, rs.size, 0, 0, cs.size, rs.size);
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      cells.push({ blob, index });
      index++;
    }
  }

  return { rows, cols, cells };
}

