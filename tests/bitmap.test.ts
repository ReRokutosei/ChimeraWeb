import { describe, expect, it, vi } from 'vitest';
import { closeImageBitmaps } from '../src/engine/bitmap';

describe('bitmap lifecycle', () => {
  it('closes every decoded bitmap', () => {
    const first = { close: vi.fn() } as unknown as ImageBitmap;
    const second = { close: vi.fn() } as unknown as ImageBitmap;

    closeImageBitmaps([first, second]);

    expect(first.close).toHaveBeenCalledOnce();
    expect(second.close).toHaveBeenCalledOnce();
  });
});
