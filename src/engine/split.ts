export interface SplitCell {
  canvas: HTMLCanvasElement;
  blob: Blob;
  x: number;
  y: number;
  index: number;
}

export async function splitGrid(
  image: HTMLImageElement,
  grid: number
): Promise<SplitCell[]> {
  const cols = grid;
  const rows = grid;
  const cellW = Math.floor(image.naturalWidth / cols);
  const cellH = Math.floor(image.naturalHeight / rows);
  const cells: SplitCell[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const canvas = document.createElement('canvas');
      canvas.width = cellW;
      canvas.height = cellH;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(
        image,
        c * cellW, r * cellH, cellW, cellH,
        0, 0, cellW, cellH
      );
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => {
          if (b) resolve(b);
          else reject(new Error('canvas toBlob failed'));
        }, 'image/png');
      });
      cells.push({ canvas, blob, x: c, y: r, index: r * cols + c });
    }
  }

  return cells;
}
