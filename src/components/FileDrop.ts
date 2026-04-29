import { state, type ImageInfo } from '../state';

let counter = 0;

export function loadImages(files: File[]): void {
  let remaining = files;

  if (state.isCutMode) {
    const maxNew = 10 - state.images.length;
    if (maxNew <= 0) {
      alert('切割模式最多支持 10 张图片');
      return;
    }
    if (files.length > maxNew) {
      alert(`切割模式最多添加 ${maxNew} 张图片，已自动保留前 ${maxNew} 张`);
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
    img.src = url;
  }
}

export function removeImage(id: string): void {
  const info = state.images.find(img => img.id === id);
  if (info) URL.revokeObjectURL(info.src);
  state.images = state.images.filter(img => img.id !== id);
  if (state.currentImageIndex >= state.images.length) {
    state.currentImageIndex = Math.max(0, state.images.length - 1);
  }
  state.notify('images');
}
