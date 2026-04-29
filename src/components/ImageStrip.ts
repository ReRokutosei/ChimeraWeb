import { state } from '../state';
import { removeImage } from './FileDrop';

export function renderImageStrip(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'image-strip-container';

  const strip = document.createElement('div');
  strip.className = 'image-strip';

  let draggedId: string | null = null;

  function rebuild(): void {
    strip.innerHTML = '';
    if (state.images.length === 0) return;

    state.images.forEach((info, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'thumb' + (info.id === state.images[state.currentImageIndex]?.id ? ' active' : '');
      thumb.dataset.id = info.id;
      thumb.draggable = true;

      const img = document.createElement('img');
      img.src = info.src;
      img.alt = info.name;
      img.draggable = false;

      const number = document.createElement('span');
      number.className = 'thumb-number';
      number.textContent = String(idx + 1);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '×';
      removeBtn.title = '移除';
      removeBtn.addEventListener('click', e => {
        e.stopPropagation();
        removeImage(info.id);
      });

      thumb.appendChild(img);
      thumb.appendChild(number);
      thumb.appendChild(removeBtn);
      thumb.addEventListener('click', () => {
        const i = state.images.findIndex(x => x.id === info.id);
        if (i >= 0) {
          state.currentImageIndex = i;
          state.notify('currentImage');
        }
      });

      thumb.addEventListener('dragstart', e => {
        draggedId = info.id;
        e.dataTransfer!.effectAllowed = 'move';
        thumb.classList.add('dragging');
      });
      thumb.addEventListener('dragend', () => {
        draggedId = null;
        strip.querySelectorAll('.thumb').forEach(el => el.classList.remove('dragging', 'drag-over'));
      });
      thumb.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
        strip.querySelectorAll('.thumb').forEach(el => el.classList.remove('drag-over'));
        thumb.classList.add('drag-over');
      });
      thumb.addEventListener('dragleave', () => thumb.classList.remove('drag-over'));
      thumb.addEventListener('drop', e => {
        e.preventDefault();
        thumb.classList.remove('drag-over');
        if (!draggedId || draggedId === info.id) return;

        const fromIdx = state.images.findIndex(x => x.id === draggedId);
        const toIdx = state.images.findIndex(x => x.id === info.id);
        if (fromIdx < 0 || toIdx < 0) return;

        const newImages = [...state.images];
        const [moved] = newImages.splice(fromIdx, 1);
        newImages.splice(toIdx, 0, moved);

        let newIdx = state.currentImageIndex;
        if (state.currentImageIndex === fromIdx) newIdx = toIdx;
        else if (fromIdx < state.currentImageIndex && toIdx >= state.currentImageIndex) newIdx--;
        else if (fromIdx > state.currentImageIndex && toIdx <= state.currentImageIndex) newIdx++;

        state.images = newImages;
        state.currentImageIndex = newIdx;
        state.notify('images');
      });

      strip.appendChild(thumb);
    });
  }

  function render(): void {
    rebuild();
  }

  state.on('images', render);
  state.on('currentImage', () => {
    strip.querySelectorAll('.thumb').forEach(el => {
      const thumb = el as HTMLElement;
      thumb.classList.toggle('active', thumb.dataset.id === state.images[state.currentImageIndex]?.id);
    });
  });

  render();
  container.appendChild(strip);
  return container;
}
