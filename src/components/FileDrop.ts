import { state, type ImageInfo } from '../state';

let counter = 0;

export function loadImages(files: File[]): void {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
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
