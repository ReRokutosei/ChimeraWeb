import type { CutPreset, OutputFormat } from './state';

const FORMAT_DETAILS: Record<OutputFormat, { mime: string; extension: string }> = {
  png: { mime: 'image/png', extension: 'png' },
  jpeg: { mime: 'image/jpeg', extension: 'jpg' },
  webp: { mime: 'image/webp', extension: 'webp' },
};

export function getFormatDetails(format: OutputFormat): { mime: string; extension: string } {
  return FORMAT_DETAILS[format];
}

export function getEncodingOptions(
  format: OutputFormat,
  quality: number
): { type: string; quality?: number } {
  const { mime } = getFormatDetails(format);
  return format === 'png' ? { type: mime } : { type: mime, quality: quality / 100 };
}

export function getCellFilename(
  imageName: string,
  preset: CutPreset,
  index: number,
  format: OutputFormat,
  imageOrdinal?: number
): string {
  const baseName = imageName.replace(/\.[^.]+$/, '');
  const sourceSuffix = imageOrdinal === undefined
    ? ''
    : `_${String(imageOrdinal + 1).padStart(2, '0')}`;
  const pieceKind = preset === 'x3' || preset === 'x4' ? 'X' : 'grid';
  const pieceNumber = String(index + 1).padStart(2, '0');
  const { extension } = getFormatDetails(format);
  return `${baseName}${sourceSuffix}_${pieceKind}_${pieceNumber}.${extension}`;
}
