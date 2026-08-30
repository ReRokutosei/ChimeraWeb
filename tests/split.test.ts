import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeSegments, getPresetDimensions } from '../src/engine/split';
import { getCellFilename, getEncodingOptions } from '../src/output';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('split engine', () => {
  describe('getPresetDimensions', () => {
    it('returns 2x2 for grid2', () => {
      expect(getPresetDimensions('grid2')).toEqual({ rows: 2, cols: 2 });
    });

    it('returns 3x3 for grid3', () => {
      expect(getPresetDimensions('grid3')).toEqual({ rows: 3, cols: 3 });
    });

    it('returns 1x3 for x3', () => {
      expect(getPresetDimensions('x3')).toEqual({ rows: 1, cols: 3 });
    });

    it('returns 1x4 for x4', () => {
      expect(getPresetDimensions('x4')).toEqual({ rows: 1, cols: 4 });
    });
  });

  describe('computeSegments', () => {
    it('divides evenly when width is divisible', () => {
      const segs = computeSegments(2000, 4);
      expect(segs).toHaveLength(4);
      expect(segs[0]).toEqual({ start: 0, size: 500 });
      expect(segs[1]).toEqual({ start: 500, size: 500 });
      expect(segs[2]).toEqual({ start: 1000, size: 500 });
      expect(segs[3]).toEqual({ start: 1500, size: 500 });
      expect(segs.reduce((sum, s) => sum + s.size, 0)).toBe(2000);
    });

    it('distributes remainders perfectly for odd numbers (1983 / 4)', () => {
      const segs = computeSegments(1983, 4);
      expect(segs).toHaveLength(4);
      // 1983 = 495 * 4 + 3 => sizes: 496, 496, 496, 495
      expect(segs.map(s => s.size)).toEqual([496, 496, 496, 495]);
      
      // Ensure zero gaps and zero overlaps
      for (let i = 0; i < segs.length - 1; i++) {
        expect(segs[i].start + segs[i].size).toBe(segs[i + 1].start);
      }
      expect(segs.reduce((sum, s) => sum + s.size, 0)).toBe(1983);
    });

    it('handles prime numbers and various split counts without gaps', () => {
      const testCases = [
        { total: 1001, n: 3 },
        { total: 2049, n: 4 },
        { total: 3840, n: 3 },
        { total: 777, n: 2 },
        { total: 1080, n: 3 },
      ];

      for (const { total, n } of testCases) {
        const segs = computeSegments(total, n);
        expect(segs).toHaveLength(n);
        expect(segs[0].start).toBe(0);
        
        for (let i = 0; i < n - 1; i++) {
          expect(segs[i].start + segs[i].size).toBe(segs[i + 1].start);
        }
        
        const last = segs[n - 1];
        expect(last.start + last.size).toBe(total);
        expect(segs.reduce((sum, s) => sum + s.size, 0)).toBe(total);
      }
    });
  });

  describe('output contract', () => {
    it('maps formats to encoding options', () => {
      expect(getEncodingOptions('png', 42)).toEqual({ type: 'image/png' });
      expect(getEncodingOptions('jpeg', 80)).toEqual({ type: 'image/jpeg', quality: 0.8 });
      expect(getEncodingOptions('webp', 75)).toEqual({ type: 'image/webp', quality: 0.75 });
    });

    it('uses the actual format and an optional source ordinal in filenames', () => {
      expect(getCellFilename('photo.jpg', 'grid3', 0, 'jpeg')).toBe('photo_grid_01.jpg');
      expect(getCellFilename('photo.jpg', 'x4', 2, 'webp', 1)).toBe('photo_02_X_03.webp');
    });

    it('keeps same-named sources unique in a batch', () => {
      const first = getCellFilename('photo.jpg', 'grid2', 0, 'png', 0);
      const second = getCellFilename('photo.jpg', 'grid2', 0, 'png', 1);
      expect(first).not.toBe(second);
    });
  });
});
