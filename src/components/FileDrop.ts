import { state, type ImageInfo } from '../state';
import { t } from '../i18n';

let counter = 0;
let pendingImageCount = 0;
let appendQueue: Promise<void> = Promise.resolve();

type SettledValue<T> =
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; reason: unknown };

export async function settleInInputOrder<T, R>(
  items: readonly T[],
  mapper: (item: T, index: number) => Promise<R>
): Promise<SettledValue<R>[]> {
  return Promise.all(items.map(async (item, index) => {
    try {
      return { status: 'fulfilled', value: await mapper(item, index) } as const;
    } catch (reason) {
      return { status: 'rejected', reason } as const;
    }
  }));
}

function decodeImage(file: File): Promise<ImageInfo> {
  const id = `img_${Date.now()}_${counter++}`;
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({
      id,
      name: file.name,
      src: url,
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(file.name));
    };
    img.src = url;
  });
}

export function loadImages(files: File[]): void {
  let remaining = files.filter(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type));

  if (state.isCutMode) {
    const maxNew = 10 - state.images.length - pendingImageCount;
    if (maxNew <= 0) {
      alert(t('cut_max'));
      return;
    }
    if (files.length > maxNew) {
      alert(t('cut_max_auto', { n: maxNew }));
      remaining = files.slice(0, maxNew);
    }
  }

  if (remaining.length === 0) return;

  pendingImageCount += remaining.length;
  const decoded = settleInInputOrder(remaining, decodeImage);
  appendQueue = appendQueue.then(async () => {
    const results = await decoded;
    const loaded: ImageInfo[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        loaded.push(result.value);
      } else {
        alert(t('load_fail') + ': ' + remaining[index].name);
      }
    });
    if (loaded.length > 0) {
      state.images = [...state.images, ...loaded];
      state.currentImageIndex = state.images.length - 1;
      state.notify('images');
    }
  }).finally(() => {
    pendingImageCount -= remaining.length;
  });
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
