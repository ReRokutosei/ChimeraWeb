import { describe, it, expect } from 'vitest';
import { t, messages, type Locale } from '../src/i18n';

describe('i18n module', () => {
  it('translates known keys', () => {
    expect(t('stitch')).toBeDefined();
    expect(t('cut')).toBeDefined();
    expect(t('preset_x4')).toBeDefined();
  });

  it('interpolates single and multiple parameters correctly', () => {
    const single = t('save_as', { fmt: 'PNG' });
    expect(single).toContain('PNG');

    const multi = t('cut_max_auto', { n: 10 });
    expect(multi).toContain('10');
  });

  it('falls back to key name when key is not found', () => {
    expect(t('non_existent_random_key_12345')).toBe('non_existent_random_key_12345');
  });

  it('ensures all locales have identical key sets without missing translations', () => {
    const locales: Locale[] = ['zh', 'en', 'ja', 'ko'];
    const baseKeys = Object.keys(messages.en).sort();

    for (const loc of locales) {
      const locKeys = Object.keys(messages[loc]).sort();
      expect(locKeys).toEqual(baseKeys);
    }
  });

  it('ensures placeholder parameters are preserved across all translations', () => {
    const locales: Locale[] = ['zh', 'en', 'ja', 'ko'];
    const sampleParamKeys = ['save_as', 'cut_max_auto', 'save_all_title', 'save_current_title', 'saved_to'];

    for (const key of sampleParamKeys) {
      for (const loc of locales) {
        const text = messages[loc][key];
        expect(text).toBeDefined();
        if (key === 'save_as') expect(text).toContain('{fmt}');
        if (key === 'cut_max_auto' || key === 'save_all_title') expect(text).toContain('{n}');
        if (key === 'save_current_title') expect(text).toContain('{name}');
        if (key === 'saved_to') expect(text).toContain('{path}');
      }
    }
  });
});
