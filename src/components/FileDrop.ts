import { state, type ImageInfo } from '../state';
import { t } from '../i18n';

let counter = 0;

export function loadImages(files: File[]): void {
  let remaining = files;

  if (state.isCutMode) {
    const maxNew = 10 - state.images.length;
    if (maxNew <= 0) {
      alert(t('cut_max'));
      return;
    }
    if (files.length > maxNew) {
      alert(t('cut_max_auto', { n: maxNew }));
      remaining = files.slice(0, maxNew);
    }
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  for (const file of remaining) {
    if (!allowed.includes(file.type)) continue;
    const id = `img_${Date.now()}_${counter++}`;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const info: ImageInfo = { id, name: file.name, src: url, width: img.naturalWidth, height: img.naturalHeight };
      state.images = [...state.images, info];
      state.currentImageIndex = state.images.length - 1;
      state.notify('images');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert(t('load_fail') + ': ' + file.name);
    };
    img.src = url;
  }
}

export function removeImage(id: string): void {
  const idx = state.images.findIndex(img => img.id === id);
  if (idx < 0) return;
  URL.revokeObjectURL(state.images[idx].src);
  state.images = state.images.filter(img => img.id !== id);
  if (idx < state.currentImageIndex) {
    state.currentImageIndex--;
  } else if (state.currentImageIndex >= state.images.length) {
    state.currentImageIndex = Math.max(0, state.images.length - 1);
  }
  state.notify('images');
}
