export interface StitchResult {
  canvas: HTMLCanvasElement;
  blob: Blob;
}

export async function stitchImages(
  images: HTMLImageElement[],
  spacing: number,
  spacingColor: string
): Promise<StitchResult> {
  const width = Math.max(...images.map(img => img.naturalWidth));
  const totalHeight = images.reduce((h, img) => h + img.naturalHeight, 0)
    + spacing * Math.max(0, images.length - 1);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;

  let y = 0;
  for (const img of images) {
    ctx.drawImage(img, 0, y, img.naturalWidth, img.naturalHeight);
    y += img.naturalHeight;
    if (spacing > 0 && images.indexOf(img) < images.length - 1) {
      ctx.fillStyle = spacingColor;
      ctx.fillRect(0, y, width, spacing);
      y += spacing;
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => {
      if (b) resolve(b);
      else reject(new Error('canvas toBlob failed'));
    }, 'image/png');
  });

  return { canvas, blob };
}
