import { afterEach, describe, expect, it, vi } from 'vitest';
import { ObjectUrlRegistry } from '../src/object-url';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('object URL lifecycle', () => {
  it('revokes every registered URL once and can be reused', () => {
    const createObjectURL = vi.fn()
      .mockReturnValueOnce('blob:first')
      .mockReturnValueOnce('blob:second')
      .mockReturnValueOnce('blob:third');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const registry = new ObjectUrlRegistry();

    registry.create(new Blob());
    registry.create(new Blob());
    registry.revokeAll();
    registry.revokeAll();
    registry.create(new Blob());
    registry.revokeAll();

    expect(revokeObjectURL.mock.calls).toEqual([
      ['blob:first'],
      ['blob:second'],
      ['blob:third'],
    ]);
  });
});
