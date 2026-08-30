import { describe, expect, it, vi } from 'vitest';
import { addPathSuffix, findAvailablePath } from '../src/native-save';

describe('native save conflict handling', () => {
  it('adds suffixes without changing the extension', () => {
    expect(addPathSuffix('C:\\Pictures\\image.png', 2)).toBe('C:\\Pictures\\image_2.png');
    expect(addPathSuffix('/pictures/archive.tar.webp', 3)).toBe('/pictures/archive.tar_3.webp');
    expect(addPathSuffix('/pictures/image', 2)).toBe('/pictures/image_2');
  });

  it('returns the requested path when it is available', async () => {
    const exists = vi.fn().mockResolvedValue(false);
    await expect(findAvailablePath('/pictures/image.png', exists))
      .resolves.toBe('/pictures/image.png');
    expect(exists).toHaveBeenCalledOnce();
  });

  it('selects the first available numeric suffix', async () => {
    const occupied = new Set(['/pictures/image.png', '/pictures/image_2.png']);
    const exists = vi.fn(async (path: string) => occupied.has(path));
    await expect(findAvailablePath('/pictures/image.png', exists))
      .resolves.toBe('/pictures/image_3.png');
  });
});
