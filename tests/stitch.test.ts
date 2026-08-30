import { afterEach, describe, it, expect, vi } from 'vitest';
import { estimateStitchDimensions, getScaledDimensions, stitchImages } from '../src/engine/stitch';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('stitch engine', () => {
  describe('getScaledDimensions', () => {
    const sampleImages = [
      { width: 1000, height: 500 },
      { width: 800, height: 400 },
      { width: 1200, height: 600 }
    ];

    it('handles NONE scale without altering dimensions', () => {
      const scaled = getScaledDimensions(sampleImages, 'VERTICAL', 'NONE');
      expect(scaled).toEqual([
        { img: undefined, w: 1000, h: 500 },
        { img: undefined, w: 800, h: 400 },
        { img: undefined, w: 1200, h: 600 }
      ]);
    });

    it('scales to MIN_WIDTH in vertical mode', () => {
      const scaled = getScaledDimensions(sampleImages, 'VERTICAL', 'MIN_WIDTH');
      // min width is 800
      expect(scaled[0].w).toBe(800);
      expect(scaled[0].h).toBe(Math.round(500 * (800 / 1000))); // 400
      expect(scaled[1].w).toBe(800);
      expect(scaled[1].h).toBe(400);
      expect(scaled[2].w).toBe(800);
      expect(scaled[2].h).toBe(Math.round(600 * (800 / 1200))); // 400
    });

    it('scales to MAX_WIDTH in vertical mode', () => {
      const scaled = getScaledDimensions(sampleImages, 'VERTICAL', 'MAX_WIDTH');
      // max width is 1200
      expect(scaled[0].w).toBe(1200);
      expect(scaled[0].h).toBe(Math.round(500 * (1200 / 1000))); // 600
      expect(scaled[1].w).toBe(1200);
      expect(scaled[1].h).toBe(Math.round(400 * (1200 / 800))); // 600
      expect(scaled[2].w).toBe(1200);
      expect(scaled[2].h).toBe(600);
    });

    it('scales to MIN_WIDTH (min height) in horizontal mode', () => {
      const scaled = getScaledDimensions(sampleImages, 'HORIZONTAL', 'MIN_WIDTH');
      // min height is 400
      expect(scaled[0].h).toBe(400);
      expect(scaled[0].w).toBe(Math.round(1000 * (400 / 500))); // 800
      expect(scaled[1].h).toBe(400);
      expect(scaled[1].w).toBe(800);
      expect(scaled[2].h).toBe(400);
      expect(scaled[2].w).toBe(Math.round(1200 * (400 / 600))); // 800
    });

    it('handles ImageBitmap objects correctly retaining img reference', () => {
      const mockBitmap1 = { width: 1000, height: 500, close: () => {} } as unknown as ImageBitmap;
      const mockBitmap2 = { width: 800, height: 400, close: () => {} } as unknown as ImageBitmap;
      const scaled = getScaledDimensions([mockBitmap1, mockBitmap2], 'VERTICAL', 'MIN_WIDTH');
      expect(scaled[0].img).toBe(mockBitmap1);
      expect(scaled[0].w).toBe(800);
      expect(scaled[1].img).toBe(mockBitmap2);
      expect(scaled[1].w).toBe(800);
    });

    it('handles object with explicit img field', () => {
      const mockBmp = { width: 1000, height: 500 } as ImageBitmap;
      const item = { width: 1000, height: 500, img: mockBmp };
      const scaled = getScaledDimensions([item], 'VERTICAL', 'NONE');
      expect(scaled[0].img).toBe(mockBmp);
    });
  });

  describe('estimateStitchDimensions', () => {
    const images = [
      { width: 100, height: 200 },
      { width: 80, height: 100 },
    ];

    it('includes spacing in direct output dimensions', () => {
      expect(estimateStitchDimensions(images, {
        direction: 'VERTICAL',
        spacing: 10,
        spacingColor: '#000000',
        overlayEnabled: false,
        overlayRatio: 10,
        widthScale: 'NONE',
      })).toEqual({ width: 100, height: 310, pixels: 31_000 });
    });

    it('matches horizontal scaling and overlay strip behavior', () => {
      expect(estimateStitchDimensions(images, {
        direction: 'HORIZONTAL',
        spacing: 0,
        spacingColor: '#000000',
        overlayEnabled: true,
        overlayRatio: 25,
        widthScale: 'MIN_WIDTH',
      })).toEqual({ width: 62, height: 100, pixels: 6_200 });
    });

    it('returns null without input images', () => {
      expect(estimateStitchDimensions([], {
        direction: 'VERTICAL',
        spacing: 0,
        spacingColor: '#000000',
        overlayEnabled: false,
        overlayRatio: 10,
        widthScale: 'NONE',
      })).toBeNull();
    });

    it('uses image height for a horizontal overlay canvas', async () => {
      const context = { drawImage: vi.fn() };
      class MockOffscreenCanvas {
        constructor(public width: number, public height: number) {}
        getContext(): typeof context { return context; }
      }
      vi.stubGlobal('OffscreenCanvas', MockOffscreenCanvas);
      const images = [
        { width: 300, height: 100, close: () => {} },
        { width: 200, height: 80, close: () => {} },
      ] as unknown as ImageBitmap[];

      const result = await stitchImages(images, {
        direction: 'HORIZONTAL',
        spacing: 0,
        spacingColor: '#000000',
        overlayEnabled: true,
        overlayRatio: 10,
        widthScale: 'NONE',
      });

      expect(result.height).toBe(100);
      expect(result.canvas.height).toBe(100);
    });
  });
});
