export function closeImageBitmaps(bitmaps: Iterable<ImageBitmap>): void {
  for (const bitmap of bitmaps) {
    bitmap.close();
  }
}
