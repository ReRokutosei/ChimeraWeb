import { state } from '../state';
import { loadImages, removeImage } from './FileDrop';

export function renderImageStrip(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'image-strip-container';

  const strip = document.createElement('div');
  strip.className = 'image-strip';

  function rebuild(): void {
    strip.innerHTML = '';
    if (state.images.length === 0) return;

    for (const info of state.images) {
      const thumb = document.createElement('div');
      thumb.className = 'thumb' + (info.id === state.images[state.currentImageIndex]?.id ? ' active' : '');
      thumb.dataset.id = info.id;

      const img = document.createElement('img');
      img.src = info.src;
      img.alt = info.name;
      img.draggable = false;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '×';
      removeBtn.title = '移除';
      removeBtn.addEventListener('click', e => {
        e.stopPropagation();
        removeImage(info.id);
      });

      thumb.appendChild(img);
      thumb.appendChild(removeBtn);
      thumb.addEventListener('click', () => {
        const idx = state.images.findIndex(i => i.id === info.id);
        if (idx >= 0) {
          state.currentImageIndex = idx;
          state.notify('currentImage');
        }
      });

      strip.appendChild(thumb);
    }
  }

  const addBtn = document.createElement('div');
  addBtn.className = 'thumb';
  addBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;border:2px dashed var(--border);background:var(--bg-secondary);cursor:pointer;font-size:24px;color:var(--text-secondary);';
  addBtn.textContent = '+';
  addBtn.title = '添加图片';
  addBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.addEventListener('change', () => {
      if (input.files) loadImages(Array.from(input.files));
    });
    input.click();
  });

  function render(): void {
    rebuild();
    strip.appendChild(addBtn);
  }

  state.on('images', render);
  state.on('currentImage', () => {
    strip.querySelectorAll('.thumb').forEach(el => {
      const thumb = el as HTMLElement;
      if (thumb.classList.contains('thumb') && !thumb.querySelector('.remove-btn')) return;
      thumb.classList.toggle('active', thumb.dataset.id === state.images[state.currentImageIndex]?.id);
    });
  });

  render();
  container.appendChild(strip);
  return container;
}
