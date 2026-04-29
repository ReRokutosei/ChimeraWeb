const locale = localStorage.getItem('chimera_locale') === 'en' ? 'en' : 'zh';

type Messages = Record<string, string>;

const messages: Record<string, Messages> = {
  zh: {
    stitch: '拼接',
    cut: '切割',
    grid_2x2: '2×2',
    grid_3x3: '3×3',
    grid_label: '切割宫格',
    direction: '拼接方向',
    vertical: '纵向',
    horizontal: '横向',
    width_scale: '图片缩放',
    min_width: '最小宽度',
    no_scale: '不缩放',
    max_width: '最大宽度',
    min_height: '最小高度',
    max_height: '最大高度',
    overlay: '叠加模式',
    overlay_disabled: '不叠加',
    overlay_enabled: '叠加',
    overlay_ratio: '叠加比例(%)',
    spacing: '间隔像素',
    fill_color: '间隔填充色',
    output_format: '输出格式',
    output_quality: '输出质量',
    clear: '清空图片',
    start_stitch: '开始拼接',
    start_cut: '开始切割',
    drop_hint: '拖拽图片到此处',
    drop_hint_small: '或点击选择文件',
    cut_max: '切割模式最多支持 10 张图片',
    cut_max_auto: '切割模式最多添加 {n} 张图片，已自动保留前 {n} 张',
    fail: '处理失败',
    load_fail: '加载失败',
    result_title: '结果预览',
    back: '返回',
    save_as: '保存为 {fmt}',
    prev: '← 上一张',
    next: '下一张 →',
    save_all: '保存全部子图',
    save_all_title: '保存全部 {n} 张图片的所有子图',
    save_current: '保存本图子图',
    save_current_title: '保存「{name}」的所有子图',
    click_download: '点击任意单元格即可单独下载',
    toggle_theme: '切换主题',
    lang_zh: '中文',
    lang_en: 'English',
    github: 'GitHub 仓库',
  },
  en: {
    stitch: 'Stitch',
    cut: 'Cut',
    grid_2x2: '2×2',
    grid_3x3: '3×3',
    grid_label: 'Grid',
    direction: 'Direction',
    vertical: 'Vertical',
    horizontal: 'Horizontal',
    width_scale: 'Scale',
    min_width: 'Min Width',
    no_scale: 'None',
    max_width: 'Max Width',
    min_height: 'Min Height',
    max_height: 'Max Height',
    overlay: 'Overlay',
    overlay_disabled: 'Off',
    overlay_enabled: 'On',
    overlay_ratio: 'Overlap(%)',
    spacing: 'Gap',
    fill_color: 'Gap Color',
    output_format: 'Format',
    output_quality: 'Quality',
    clear: 'Clear',
    start_stitch: 'Start',
    start_cut: 'Cut',
    drop_hint: 'Drop images here',
    drop_hint_small: 'or click to select',
    cut_max: 'Max 10 images in cut mode',
    cut_max_auto: 'Max {n} images, keeping first {n}',
    fail: 'Failed',
    load_fail: 'Failed to load',
    result_title: 'Result',
    back: 'Back',
    save_as: 'Save as {fmt}',
    prev: '← Prev',
    next: 'Next →',
    save_all: 'Save All',
    save_all_title: 'Save sub-images from {n} images',
    save_current: 'Save Current',
    save_current_title: 'Save sub-images from 「{name}」',
    click_download: 'Click any cell to download',
    toggle_theme: 'Toggle theme',
    lang_zh: '中文',
    lang_en: 'English',
    github: 'GitHub repository',
  },
};

export function t(key: string, params?: Record<string, string | number>): string {
  const msg = messages[locale]?.[key];
  if (msg === undefined) return key;
  if (!params) return msg;
  let result = msg;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(`{${k}}`, String(v));
  }
  return result;
}

export function getLocale(): string {
  return locale;
}

export function toggleLocale(): void {
  const next = locale === 'zh' ? 'en' : 'zh';
  localStorage.setItem('chimera_locale', next);
  location.reload();
}
