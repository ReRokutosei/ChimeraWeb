export interface StitchOptions {
  direction: 'VERTICAL' | 'HORIZONTAL';
  spacing: number;
  spacingColor: string;
  overlayEnabled: boolean;
  overlayRatio: number;
  widthScale: 'NONE' | 'MIN_WIDTH' | 'MAX_WIDTH';
}

export interface StitchResult {
  canvas: OffscreenCanvas;
  width: number;
  height: number;
}

type ImgSrc = ImageBitmap;
type Dims = { img: ImgSrc; w: number; h: number };

function getScaledDimensions(images: ImgSrc[], direction: string, scale: string): Dims[] {
  const dims: Dims[] = images.map(img => ({
    img,
    w: img.width,
    h: img.height
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
  images: ImgSrc[],
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

async function stitchVertical(scaled: Dims[], options: StitchOptions): Promise<StitchResult> {
  const width = Math.max(...scaled.map(d => d.w));
  const totalHeight = scaled.reduce((s, d) => s + d.h, 0) + options.spacing * Math.max(0, scaled.length - 1);

  const canvas = new OffscreenCanvas(width, totalHeight);
  const ctx = canvas.getContext('2d')!;

  let y = 0;
  for (const d of scaled) {
    ctx.drawImage(d.img, 0, 0, d.img.width, d.img.height, 0, y, d.w, d.h);
    y += d.h;
    if (options.spacing > 0) {
      ctx.fillStyle = options.spacingColor;
      ctx.fillRect(0, y, width, options.spacing);
      y += options.spacing;
    }
  }

  return { canvas, width, height: totalHeight };
}

async function stitchHorizontal(scaled: Dims[], options: StitchOptions): Promise<StitchResult> {
  const height = Math.max(...scaled.map(d => d.h));
  const totalWidth = scaled.reduce((s, d) => s + d.w, 0) + options.spacing * Math.max(0, scaled.length - 1);

  const canvas = new OffscreenCanvas(totalWidth, height);
  const ctx = canvas.getContext('2d')!;

  let x = 0;
  for (const d of scaled) {
    ctx.drawImage(d.img, 0, 0, d.img.width, d.img.height, x, 0, d.w, d.h);
    x += d.w;
    if (options.spacing > 0) {
      ctx.fillStyle = options.spacingColor;
      ctx.fillRect(x, 0, options.spacing, height);
      x += options.spacing;
    }
  }

  return { canvas, width: totalWidth, height };
}

async function stitchOverlay(scaled: Dims[], options: StitchOptions): Promise<StitchResult> {
  if (scaled.length === 0) throw new Error('No images for overlay');
  const width = Math.max(...scaled.map(d => d.w));

  if (options.direction === 'HORIZONTAL') {
    return stitchOverlayHorizontal(scaled, options, width);
  }
  return stitchOverlayVertical(scaled, options, width);
}

async function stitchOverlayVertical(scaled: Dims[], options: StitchOptions, width: number): Promise<StitchResult> {
  const first = scaled[0];
  const stripH = Math.max(1, Math.floor(first.h * options.overlayRatio / 100));

  let totalHeight = first.h;
  for (let i = 1; i < scaled.length; i++) {
    totalHeight += Math.min(stripH, scaled[i].h);
  }

  const canvas = new OffscreenCanvas(width, totalHeight);
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(first.img, 0, 0, first.img.width, first.img.height, 0, 0, first.w, first.h);

  let y = first.h;
  for (let i = 1; i < scaled.length; i++) {
    const d = scaled[i];
    const sH = Math.min(stripH, d.h);
    const srcY = d.h - sH;
    ctx.drawImage(d.img, 0, srcY, d.img.width, sH, 0, y, d.w, sH);
    y += sH;
  }

  return { canvas, width, height: totalHeight };
}

async function stitchOverlayHorizontal(scaled: Dims[], options: StitchOptions, height: number): Promise<StitchResult> {
  const first = scaled[0];
  const stripW = Math.max(1, Math.floor(first.w * options.overlayRatio / 100));

  let totalWidth = first.w;
  for (let i = 1; i < scaled.length; i++) {
    totalWidth += Math.min(stripW, scaled[i].w);
  }

  const canvas = new OffscreenCanvas(totalWidth, height);
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(first.img, 0, 0, first.img.width, first.img.height, 0, 0, first.w, first.h);

  let x = first.w;
  for (let i = 1; i < scaled.length; i++) {
    const d = scaled[i];
    const sW = Math.min(stripW, d.w);
    const srcX = d.w - sW;
    ctx.drawImage(d.img, srcX, 0, sW, d.img.height, x, 0, sW, d.h);
    x += sW;
  }

  return { canvas, width: totalWidth, height };
}
