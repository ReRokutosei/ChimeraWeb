export interface StitchOptions {
  direction: 'VERTICAL' | 'HORIZONTAL';
  spacing: number;
  spacingColor: string;
  overlayEnabled: boolean;
  overlayArea: number;
  widthScale: 'NONE' | 'MIN_WIDTH' | 'MAX_WIDTH';
}

export interface StitchResult {
  canvas: HTMLCanvasElement;
  blob: Blob;
  width: number;
  height: number;
}

function getScaledDimensions(images: HTMLImageElement[], direction: string, scale: string): { img: HTMLImageElement; w: number; h: number }[] {
  const dims = images.map(img => ({
    img,
    w: img.naturalWidth,
    h: img.naturalHeight
  }));

  if (direction === 'VERTICAL') {
    const targetW = scale === 'MIN_WIDTH' ? Math.min(...dims.map(d => d.w))
                  : scale === 'MAX_WIDTH' ? Math.max(...dims.map(d => d.w))
                  : 0;
    if (targetW > 0) {
      return dims.map(d => {
        const ratio = targetW / d.w;
        return { ...d, w: targetW, h: Math.round(d.h * ratio) };
      });
    }
  } else {
    const targetH = scale === 'MIN_WIDTH' ? Math.min(...dims.map(d => d.h))
                  : scale === 'MAX_WIDTH' ? Math.max(...dims.map(d => d.h))
                  : 0;
    if (targetH > 0) {
      return dims.map(d => {
        const ratio = targetH / d.h;
        return { ...d, h: targetH, w: Math.round(d.w * ratio) };
      });
    }
  }
  return dims;
}

export async function stitchImages(
  images: HTMLImageElement[],
  options: StitchOptions
): Promise<StitchResult> {
  if (images.length === 0) throw new Error('No images to stitch');

  const scaled = getScaledDimensions(images, options.direction, options.widthScale);

  if (options.overlayEnabled) {
    return stitchOverlay(scaled, options);
  }

  if (options.direction === 'HORIZONTAL') {
    return stitchHorizontal(scaled, options);
  }

  return stitchVertical(scaled, options);
}

async function stitchVertical(
  scaled: { img: HTMLImageElement; w: number; h: number }[],
  options: StitchOptions
): Promise<StitchResult> {
  const width = Math.max(...scaled.map(d => d.w));
  const totalHeight = scaled.reduce((s, d) => s + d.h, 0) + options.spacing * Math.max(0, scaled.length - 1);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;

  let y = 0;
  for (const d of scaled) {
    if (d.img.naturalWidth === 0 || d.img.naturalHeight === 0) continue;
    ctx.drawImage(d.img, 0, 0, d.img.naturalWidth, d.img.naturalHeight, 0, y, d.w, d.h);
    y += d.h;
    if (options.spacing > 0) {
      ctx.fillStyle = options.spacingColor;
      ctx.fillRect(0, y, width, options.spacing);
      y += options.spacing;
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => { if (b) resolve(b); else reject(new Error('toBlob failed')); }, 'image/png');
  });

  return { canvas, blob, width, height: totalHeight };
}

async function stitchHorizontal(
  scaled: { img: HTMLImageElement; w: number; h: number }[],
  options: StitchOptions
): Promise<StitchResult> {
  const height = Math.max(...scaled.map(d => d.h));
  const totalWidth = scaled.reduce((s, d) => s + d.w, 0) + options.spacing * Math.max(0, scaled.length - 1);

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  let x = 0;
  for (const d of scaled) {
    if (d.img.naturalWidth === 0 || d.img.naturalHeight === 0) continue;
    ctx.drawImage(d.img, 0, 0, d.img.naturalWidth, d.img.naturalHeight, x, 0, d.w, d.h);
    x += d.w;
    if (options.spacing > 0) {
      ctx.fillStyle = options.spacingColor;
      ctx.fillRect(x, 0, options.spacing, height);
      x += options.spacing;
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => { if (b) resolve(b); else reject(new Error('toBlob failed')); }, 'image/png');
  });

  return { canvas, blob, width: totalWidth, height };
}

async function stitchOverlay(
  scaled: { img: HTMLImageElement; w: number; h: number }[],
  options: StitchOptions
): Promise<StitchResult> {
  const width = Math.max(...scaled.map(d => d.w));

  if (options.direction === 'HORIZONTAL') {
    const height = Math.max(...scaled.map(d => d.h));
    const totalWidth = scaled.reduce((s, d) => s + d.w, 0) - options.overlayArea * Math.max(0, scaled.length - 1);
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    let x = 0;
    for (const d of scaled) {
      ctx.drawImage(d.img, 0, 0, d.img.naturalWidth, d.img.naturalHeight, x, 0, d.w, d.h);
      x += d.w - options.overlayArea;
    }
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => { if (b) resolve(b); else reject(new Error('toBlob failed')); }, 'image/png');
    });
    return { canvas, blob, width: totalWidth, height };
  }

  // Vertical overlay
  const totalHeight = scaled.reduce((s, d) => s + d.h, 0) - options.overlayArea * Math.max(0, scaled.length - 1);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;

  let y = 0;
  for (const d of scaled) {
    ctx.drawImage(d.img, 0, 0, d.img.naturalWidth, d.img.naturalHeight, 0, y, d.w, d.h);
    y += d.h - options.overlayArea;
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => { if (b) resolve(b); else reject(new Error('toBlob failed')); }, 'image/png');
  });
  return { canvas, blob, width, height: totalHeight };
}
