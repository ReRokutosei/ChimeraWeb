import { state } from '../state';
import { loadSettings, saveOutputFormat, saveSpacingColor, saveCutGrid } from '../storage';
import { loadImages } from '../components/FileDrop';
import { renderImageStrip } from '../components/ImageStrip';
import { renderColorPicker } from '../components/ColorPicker';
import { renderSegmentedControl } from '../components/SegmentedBtn';
import { stitchImages } from '../engine/stitch';
import { splitGrid } from '../engine/split';

function renderTopBar(): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'top-bar';

  const logo = document.createElement('div');
  logo.className = 'logo';
  const circles = document.createElement('div');
  circles.className = 'circles';
  for (let i = 0; i < 4; i++) {
    const c = document.createElement('div');
    c.className = 'circle';
    circles.appendChild(c);
  }
  const title = document.createElement('span');
  title.textContent = 'Chimera Web';
  logo.appendChild(circles);
  logo.appendChild(title);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const themeBtn = document.createElement('button');
  themeBtn.className = 'icon-btn';
  themeBtn.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark'
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
  themeBtn.title = '切换主题';
  themeBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? '' : 'dark';
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
    }
  });

  actions.appendChild(themeBtn);
  bar.appendChild(logo);
  bar.appendChild(actions);
  return bar;
}

function renderDropZone(onFiles: (files: File[]) => void): HTMLElement {
  const zone = document.createElement('div');
  zone.className = 'drop-zone';

  zone.innerHTML = `
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    <div class="hint">
      拖拽图片到此处<br>
      <small>或点击选择文件</small>
    </div>
  `;

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer?.files.length) onFiles(Array.from(e.dataTransfer.files));
  });
  zone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.addEventListener('change', () => {
      if (input.files) onFiles(Array.from(input.files));
    });
    input.click();
  });
  return zone;
}

function renderModeBar(): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'mode-bar';

  const modeCtrl = renderSegmentedControl(
    [{ label: '拼接', value: 'stitch' }, { label: '切割', value: 'cut' }],
    state.isCutMode ? 'cut' : 'stitch',
    val => {
      state.isCutMode = val === 'cut';
      state.notify('mode');
    }
  );
  bar.appendChild(modeCtrl);

  const gridCtrl = renderSegmentedControl(
    [{ label: '3×3', value: '3' }, { label: '4×4', value: '4' }],
    String(state.cutGrid),
    val => {
      saveCutGrid(Number(val));
      state.notify('cutGrid');
    }
  );
  gridCtrl.style.display = state.isCutMode ? '' : 'none';
  bar.appendChild(gridCtrl);

  state.on('mode', () => {
    gridCtrl.style.display = state.isCutMode ? '' : 'none';
  });

  return bar;
}

function renderSettingsBar(): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'settings-bar';

  // Spacing color
  const colorGroup = document.createElement('div');
  colorGroup.className = 'spacing-option';
  const colorLabel = document.createElement('span');
  colorLabel.className = 'label';
  colorLabel.textContent = '间隔填充色';
  const cp = renderColorPicker(state.spacingColor, color => {
    saveSpacingColor(color);
  });
  colorGroup.appendChild(colorLabel);
  colorGroup.appendChild(cp);
  bar.appendChild(colorGroup);

  // Spacing amount
  const spaceGroup = document.createElement('div');
  spaceGroup.className = 'spacing-option';
  const spaceLabel = document.createElement('span');
  spaceLabel.className = 'label';
  spaceLabel.textContent = '间隔像素';
  const spaceInput = document.createElement('input');
  spaceInput.type = 'number';
  spaceInput.className = 'spacing-input';
  spaceInput.value = '0';
  spaceInput.min = '0';
  spaceInput.max = '200';
  spaceGroup.appendChild(spaceLabel);
  spaceGroup.appendChild(spaceInput);
  bar.appendChild(spaceGroup);

  // Output format
  const fmtGroup = document.createElement('div');
  fmtGroup.className = 'spacing-option';
  const fmtLabel = document.createElement('span');
  fmtLabel.className = 'label';
  fmtLabel.textContent = '输出格式';
  const fmtSelect = document.createElement('select');
  ['png', 'jpeg'].forEach(f => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f.toUpperCase();
    if (f === state.outputFormat) opt.selected = true;
    fmtSelect.appendChild(opt);
  });
  fmtSelect.addEventListener('change', () => saveOutputFormat(fmtSelect.value as 'png' | 'jpeg'));
  fmtGroup.appendChild(fmtLabel);
  fmtGroup.appendChild(fmtSelect);
  bar.appendChild(fmtGroup);

  return bar;
}

function renderActionButton(onClick: () => void): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'action-btn';
  btn.id = 'action-btn';

  function updateLabel(): void {
    btn.textContent = state.isCutMode ? '开始切割' : '开始拼接';
  }
  state.on('mode', updateLabel);
  updateLabel();

  btn.addEventListener('click', onClick);
  return btn;
}

function showLoading(): () => void {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(overlay);
  return () => overlay.remove();
}

export async function renderMainView(container: HTMLElement): Promise<void> {
  container.innerHTML = '';
  loadSettings();

  const topBar = renderTopBar();
  container.appendChild(topBar);

  // Drop zone
  let dropZone = renderDropZone(files => loadImages(files));
  container.appendChild(dropZone);

  // Dynamic content area (shown after images are loaded)
  const contentArea = document.createElement('div');
  contentArea.id = 'content-area';
  contentArea.style.display = 'none';
  container.appendChild(contentArea);

  // Build content when images arrive
  function buildContent(): void {
    contentArea.innerHTML = '';

    const modeBar = renderModeBar();
    contentArea.appendChild(modeBar);

    const strip = renderImageStrip();
    contentArea.appendChild(strip);

    const settingsBar = renderSettingsBar();
    contentArea.appendChild(settingsBar);

    const actionBtn = renderActionButton(async () => {
      const hide = showLoading();
      try {
        if (state.isCutMode) {
          // Cut mode: use selected (current) image
          const current = state.images[state.currentImageIndex];
          if (!current) return;
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = current.src;
          });
          const cells = await splitGrid(img, state.cutGrid);
          state.resultType = 'split';
          state.resultCells = cells.map(c => ({ blob: c.blob, index: c.index }));
          state.notify('view');
        } else {
          // Stitch mode: use all images
          const loaded = await Promise.all(state.images.map(info => {
            return new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = info.src;
            });
          }));
          const spacing = Number((settingsBar.querySelector('.spacing-input') as HTMLInputElement)?.value || 0);
          const result = await stitchImages(loaded, spacing, state.spacingColor);
          const blob = await new Promise<Blob>(resolve => {
            result.canvas.toBlob(b => resolve(b!), 'image/' + state.outputFormat);
          });
          state.resultType = 'stitch';
          state.resultBlob = blob;
          state.resultFormat = state.outputFormat;
          state.view = 'result';
          state.notify('view');
        }
      } finally {
        hide();
      }
    });
    contentArea.appendChild(actionBtn);
  }

  function onImages(): void {
    if (state.images.length > 0) {
      dropZone.style.display = 'none';
      contentArea.style.display = '';
      buildContent();
    } else {
      dropZone.style.display = '';
      contentArea.style.display = 'none';
    }
  }

  state.on('images', onImages);
}
