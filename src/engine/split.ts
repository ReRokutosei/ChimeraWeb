export interface SplitCell {
  canvas: OffscreenCanvas;
  blob: Blob;
  index: number;
}

export async function splitGrid(
  image: ImageBitmap,
  grid: number
): Promise<SplitCell[]> {
  const cols = grid;
  const rows = grid;
  const cellW = Math.floor(image.width / cols);
  const cellH = Math.floor(image.height / rows);
  const cells: SplitCell[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const canvas = new OffscreenCanvas(cellW, cellH);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, c * cellW, r * cellH, cellW, cellH, 0, 0, cellW, cellH);
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      cells.push({ canvas, blob, index: r * cols + c });
    }
  }

  return cells;
}
