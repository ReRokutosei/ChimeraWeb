import { beforeEach, describe, expect, it, vi } from 'vitest';
import { state } from '../src/state';
import { loadSettings, readBoolean, readEnum, readInteger } from '../src/storage';

const values = new Map<string, string>();

beforeEach(() => {
  values.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
});

describe('stored setting validation', () => {
  it('accepts known enum values and rejects unknown values', () => {
    values.set('mode', 'MAX_WIDTH');
    expect(readEnum('mode', ['NONE', 'MAX_WIDTH'], 'NONE')).toBe('MAX_WIDTH');
    values.set('mode', 'FUTURE_MODE');
    expect(readEnum('mode', ['NONE', 'MAX_WIDTH'], 'NONE')).toBe('NONE');
  });

  it('rounds and clamps finite integer settings', () => {
    values.set('number', '120.8');
    expect(readInteger('number', 10, 0, 100)).toBe(100);
    values.set('number', '-5');
    expect(readInteger('number', 10, 0, 100)).toBe(0);
    values.set('number', '"not a number"');
    expect(readInteger('number', 10, 0, 100)).toBe(10);
  });

  it('does not coerce non-boolean values', () => {
    values.set('flag', '"true"');
    expect(readBoolean('flag', false)).toBe(false);
    values.set('flag', 'true');
    expect(readBoolean('flag', false)).toBe(true);
  });

  it('loads safe fallbacks for malformed persisted settings', () => {
    values.set('output_format', 'bmp');
    values.set('output_quality', '999');
    values.set('overlay_area', 'null');
    values.set('spacing_color', '#not-a-color');
    values.set('always_prompt_save', '"false"');

    loadSettings();

    expect(state.outputFormat).toBe('png');
    expect(state.outputQuality).toBe(100);
    expect(state.overlayArea).toBe(10);
    expect(state.spacingColor).toBe('#000000');
    expect(state.alwaysPromptSave).toBe(true);
  });
});
