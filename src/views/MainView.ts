import { state, type SplitImageResult } from '../state';
import {
  loadSettings, saveStitchMode, saveWidthScale, saveOverlayMode,
  saveOverlayArea, saveImageSpacing, saveSpacingColor,
  saveCutGrid, saveOutputFormat, saveOutputQuality
} from '../storage';
import { loadImages } from '../components/FileDrop';
import { renderImageStrip } from '../components/ImageStrip';
import { renderColorPicker } from '../components/ColorPicker';
import { renderSegmentedControl } from '../components/SegmentedBtn';
import { stitchImages } from '../engine/stitch';
import { splitGrid } from '../engine/split';

const CIRCLE_COLORS = ['#FF6496', '#FABE00', '#E60046', '#006EBE'];

function renderTopBar(): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'top-bar';

  const logo = document.createElement('div');
  logo.className = 'logo';
  const circles = document.createElement('div');
  circles.className = 'circles';
  CIRCLE_COLORS.forEach(c => {
    const el = document.createElement('div');
    el.className = 'circle';
    el.style.borderColor = c;
    circles.appendChild(el);
  });
  const title = document.createElement('span');
  title.textContent = 'Chimera Web';
  logo.appendChild(circles);
  logo.appendChild(title);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const themeBtn = document.createElement('button');
  themeBtn.className = 'icon-btn';
  updateThemeIcon(themeBtn);
  themeBtn.title = '切换主题';
  themeBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', current === 'dark' ? '' : 'dark');
    updateThemeIcon(themeBtn);
  });
  actions.appendChild(themeBtn);
  bar.appendChild(logo);
  bar.appendChild(actions);
  return bar;
}

function updateThemeIcon(btn: HTMLElement): void {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.innerHTML = dark
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
}

function renderDropZoneCard(onFiles: (files: File[]) => void): HTMLElement {
  const zone = document.createElement('div');
  zone.className = 'drop-zone';
  zone.innerHTML = `
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    <div class="hint">拖拽图片到此处<br><small>或点击选择文件</small></div>
  `;
  setupDropHandlers(zone, onFiles);
  zone.addEventListener('click', () => openFilePicker(onFiles));
  return zone;
}

function openFilePicker(onFiles: (files: File[]) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'image/*';
  input.addEventListener('change', () => { if (input.files) onFiles(Array.from(input.files)); });
  input.click();
}

function setupDropHandlers(el: HTMLElement, onFiles: (files: File[]) => void): void {
  el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('dragover'); });
  el.addEventListener('dragleave', () => el.classList.remove('dragover'));
  el.addEventListener('drop', e => {
    e.preventDefault();
    el.classList.remove('dragover');
    if (e.dataTransfer?.files.length) onFiles(Array.from(e.dataTransfer.files));
  });
}

function renderModeSection(): HTMLElement {
  const section = document.createElement('div');
  section.className = 'mode-section';

  const row = document.createElement('div');
  row.className = 'param-row';

  const modeCtrl = renderSegmentedControl(
    [{ label: '拼接', value: 'stitch' }, { label: '切割', value: 'cut' }],
    state.isCutMode ? 'cut' : 'stitch',
    val => { state.isCutMode = val === 'cut'; state.notify('mode'); }
  );
  row.appendChild(modeCtrl);

  const gridCtrl = renderSegmentedControl(
    [{ label: '3×3', value: '3' }, { label: '4×4', value: '4' }],
    String(state.cutGrid),
    val => { saveCutGrid(Number(val)); }
  );
  gridCtrl.className += ' grid-ctrl';
  gridCtrl.classList.toggle('hidden', !state.isCutMode);
  state.on('mode', () => gridCtrl.classList.toggle('hidden', !state.isCutMode));

  row.appendChild(gridCtrl);
  section.appendChild(row);
  return section;
}

function renderStitchParams(): HTMLElement {
  const card = document.createElement('div');
  card.className = 'params-card';
  card.id = 'stitch-params';

  const dirRow = document.createElement('div');
  dirRow.className = 'param-row';
  dirRow.appendChild(createLabel('拼接方向'));
  const dirCtrl = renderSegmentedControl(
    [{ label: '纵向', value: 'VERTICAL' }, { label: '横向', value: 'HORIZONTAL' }],
    state.stitchMode === 'DIRECT_HORIZONTAL' ? 'HORIZONTAL' : 'VERTICAL',
    val => saveStitchMode(val === 'HORIZONTAL' ? 'DIRECT_HORIZONTAL' : 'DIRECT_VERTICAL')
  );
  dirRow.appendChild(dirCtrl);
  card.appendChild(dirRow);

  const wRow = document.createElement('div');
  wRow.className = 'param-row';
  const wLabel = createLabel('图片缩放');
  wRow.appendChild(wLabel);

  const wContainer = document.createElement('div');
  wContainer.className = 'segmented-control';

  const wOpts = [
    { value: 'MIN_WIDTH' as const, labelW: '最小宽度', labelH: '最小高度' },
    { value: 'NONE' as const, labelW: '不缩放', labelH: '不缩放' },
    { value: 'MAX_WIDTH' as const, labelW: '最大宽度', labelH: '最大高度' },
  ];

  const wButtons: HTMLElement[] = [];
  for (const opt of wOpts) {
    const isHoriz = state.stitchMode === 'DIRECT_HORIZONTAL';
    const btn = document.createElement('button');
    btn.className = 'segmented-btn' + (opt.value === state.widthScale ? ' active' : '');
    btn.textContent = isHoriz ? opt.labelH : opt.labelW;
    btn.dataset.val = opt.value;
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;
      wContainer.querySelectorAll('.segmented-btn').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      saveWidthScale(opt.value);
    });
    wContainer.appendChild(btn);
    wButtons.push(btn);
  }

  function updateScaleLabels(): void {
    const isHoriz = state.stitchMode === 'DIRECT_HORIZONTAL';
    wOpts.forEach((opt, i) => {
      wButtons[i].textContent = isHoriz ? opt.labelH : opt.labelW;
    });
  }

  function updateScaleDisabled(): void {
    const isOverlay = state.overlayMode === 'ENABLED';
    // NONE button is at index 1
    wButtons[1].classList.toggle('disabled', isOverlay);
    if (isOverlay && state.widthScale === 'NONE') {
      saveWidthScale('MIN_WIDTH');
      wButtons[0].classList.add('active');
      wButtons[1].classList.remove('active');
    }
  }

  state.on('stitchMode', updateScaleLabels);
  state.on('overlayMode', updateScaleDisabled);
  updateScaleLabels();
  updateScaleDisabled();

  wRow.appendChild(wContainer);
  card.appendChild(wRow);

  const ovRow = document.createElement('div');
  ovRow.className = 'param-row';
  ovRow.appendChild(createLabel('叠加模式'));
  const ovCtrl = renderSegmentedControl(
    [{ label: '不叠加', value: 'DISABLED' }, { label: '叠加', value: 'ENABLED' }],
    state.overlayMode,
    val => saveOverlayMode(val as typeof state.overlayMode)
  );
  ovRow.appendChild(ovCtrl);
  card.appendChild(ovRow);

  const oaRow = document.createElement('div');
  oaRow.className = 'param-row';
  oaRow.id = 'overlay-area-row';
  oaRow.style.display = state.overlayMode === 'ENABLED' ? '' : 'none';
  oaRow.appendChild(createLabel('叠加比例(%)'));
  const oaInput = createNumberInput('overlay-area-input', state.overlayArea, 0, 100);
  oaInput.addEventListener('change', () => saveOverlayArea(Number(oaInput.value)));
  oaRow.appendChild(oaInput);
  card.appendChild(oaRow);
  state.on('overlayMode', () => {
    oaRow.style.display = state.overlayMode === 'ENABLED' ? '' : 'none';
  });

  const spRow = document.createElement('div');
  spRow.className = 'param-row';
  spRow.id = 'spacing-row';
  spRow.style.display = state.overlayMode === 'ENABLED' ? 'none' : '';
  spRow.appendChild(createLabel('间隔像素'));
  const spInput = createNumberInput('spacing-input', state.imageSpacing, 0, 200);
  spInput.addEventListener('change', () => saveImageSpacing(Number(spInput.value)));
  spRow.appendChild(spInput);
  spRow.appendChild(createLabel('填充色'));
  const cp = renderColorPicker(state.spacingColor, color => saveSpacingColor(color));
  spRow.appendChild(cp);
  card.appendChild(spRow);

  state.on('overlayMode', () => {
    spRow.style.display = state.overlayMode === 'ENABLED' ? 'none' : '';
  });

  return card;
}

function renderOutputParams(): HTMLElement {
  const card = document.createElement('div');
  card.className = 'params-card';
  card.id = 'output-params';

  const fmtRow = document.createElement('div');
  fmtRow.className = 'param-row';
  fmtRow.appendChild(createLabel('输出格式'));

  const fmtSelect = document.createElement('select');
  fmtSelect.className = 'fmt-select';
  ['png', 'jpeg'].forEach(f => {
    const opt = document.createElement('option');
    opt.value = f; opt.textContent = f.toUpperCase();
    if (f === state.outputFormat) opt.selected = true;
    fmtSelect.appendChild(opt);
  });

  const qlRow = document.createElement('div');
  qlRow.className = 'param-row';
  qlRow.id = 'quality-row';
  qlRow.style.display = state.outputFormat === 'jpeg' ? '' : 'none';
  qlRow.appendChild(createLabel('质量'));
  const qlInput = createNumberInput('quality-input', state.outputQuality, 1, 100);
  qlInput.addEventListener('change', () => saveOutputQuality(Number(qlInput.value)));
  qlRow.appendChild(qlInput);
  qlRow.appendChild(createLabel('%'));

  fmtSelect.addEventListener('change', () => {
    const fmt = fmtSelect.value as 'png' | 'jpeg';
    saveOutputFormat(fmt);
    qlRow.style.display = fmt === 'jpeg' ? '' : 'none';
  });

  fmtRow.appendChild(fmtSelect);
  card.appendChild(fmtRow);
  card.appendChild(qlRow);

  return card;
}

function createLabel(text: string): HTMLElement {
  const el = document.createElement('span');
  el.className = 'param-label';
  el.textContent = text;
  return el;
}

function createNumberInput(id: string, value: number, min: number, max: number): HTMLInputElement {
  const el = document.createElement('input');
  el.type = 'number';
  el.id = id;
  el.className = 'num-input';
  el.value = String(value);
  el.min = String(min);
  el.max = String(max);
  return el;
}

function renderActionBar(onStart: () => void): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'action-bar';

  const clearBtn = document.createElement('button');
  clearBtn.className = 'clear-btn';
  clearBtn.textContent = '清空图片';
  clearBtn.addEventListener('click', () => {
    state.images.forEach(img => URL.revokeObjectURL(img.src));
    state.images = [];
    state.currentImageIndex = 0;
    state.notify('images');
  });

  const startBtn = document.createElement('button');
  startBtn.className = 'action-btn';

  function updateStartBtn(): void {
    const disabled = !state.isCutMode && state.images.length <= 1;
    startBtn.textContent = state.isCutMode ? '开始切割' : '开始拼接';
    startBtn.classList.toggle('disabled', disabled);
    (startBtn as HTMLButtonElement).disabled = disabled;
  }
  state.on('mode', updateStartBtn);
  state.on('images', updateStartBtn);
  updateStartBtn();

  startBtn.addEventListener('click', onStart);

  bar.appendChild(clearBtn);
  bar.appendChild(startBtn);
  return bar;
}

function showLoading(): () => void {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(overlay);
  return () => overlay.remove();
}

export async function renderMainView(container: HTMLElement): Promise<void> {
  try {
    container.innerHTML = '';
    loadSettings();

    // Top bar
    container.appendChild(renderTopBar());

    // Main content: 60/40 split
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    // ─── Left Panel (60%) ───
    const leftPanel = document.createElement('div');
    leftPanel.className = 'left-panel';

    const dropContainer = document.createElement('div');
    dropContainer.id = 'drop-container';
    dropContainer.className = 'drop-area';
    leftPanel.appendChild(dropContainer);

    const stripContainer = document.createElement('div');
    stripContainer.id = 'strip-container';
    stripContainer.className = 'strip-wrapper';
    stripContainer.style.display = 'none';
    leftPanel.appendChild(stripContainer);

    mainContent.appendChild(leftPanel);

    // ─── Right Panel (40%) ───
    const rightPanel = document.createElement('div');
    rightPanel.className = 'right-panel';

    const paramsScroll = document.createElement('div');
    paramsScroll.className = 'params-scroll';

    paramsScroll.appendChild(renderModeSection());

    const stitchParams = renderStitchParams();
    stitchParams.id = 'stitch-params';
    stitchParams.classList.toggle('hidden', state.isCutMode);
    state.on('mode', () => stitchParams.classList.toggle('hidden', state.isCutMode));
    paramsScroll.appendChild(stitchParams);

    paramsScroll.appendChild(renderOutputParams());
    rightPanel.appendChild(paramsScroll);

    const actionBar = renderActionBar(async () => {
      if (state.images.length === 0) return;
      if (!state.isCutMode && state.images.length <= 1) return;

      const hide = showLoading();
      try {
        if (state.isCutMode) {
          const results: SplitImageResult[] = [];
          for (const info of state.images) {
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error('加载失败: ' + info.name));
              img.src = info.src;
            });
            const cells = await splitGrid(img, state.cutGrid);
            results.push({
              imageName: info.name,
              cells: cells.map(c => ({ blob: c.blob, index: c.index }))
            });
          }
          state.splitResults = results;
          state.currentSplitImageIndex = 0;
          state.resultType = 'split';
          state.view = 'result';
          state.notify('view');
        } else {
          const loaded = await Promise.all(state.images.map(info =>
            new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error('加载失败: ' + info.name));
              img.src = info.src;
            })
          ));

          const result = await stitchImages(loaded, {
            direction: state.stitchMode === 'DIRECT_HORIZONTAL' ? 'HORIZONTAL' : 'VERTICAL',
            spacing: state.imageSpacing,
            spacingColor: state.spacingColor,
            overlayEnabled: state.overlayMode === 'ENABLED',
            overlayRatio: state.overlayArea,
            widthScale: state.widthScale
          });

          const mime = state.outputFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
          const blob = await new Promise<Blob>(resolve => {
            result.canvas.toBlob(b => resolve(b!), mime, state.outputFormat === 'jpeg' ? state.outputQuality / 100 : undefined);
          });

          state.resultType = 'stitch';
          state.resultBlob = blob;
          state.resultFormat = state.outputFormat;
          state.view = 'result';
          state.notify('view');
        }
      } catch (e) {
        alert('处理失败: ' + (e instanceof Error ? e.message : String(e)));
      } finally {
        hide();
      }
    });
    rightPanel.appendChild(actionBar);

    mainContent.appendChild(rightPanel);
    container.appendChild(mainContent);

    function updateUI(): void {
      dropContainer.innerHTML = '';
      const hasImages = state.images.length > 0;
      const dz = renderDropZoneCard(files => loadImages(files));
      dropContainer.appendChild(dz);
      dropContainer.style.flex = hasImages ? '0 0 50%' : '1';

      stripContainer.style.display = hasImages ? '' : 'none';
      stripContainer.innerHTML = '';
      if (hasImages) {
        const strip = renderImageStrip();
        stripContainer.appendChild(strip);
      }
    }

    state.on('images', updateUI);
    updateUI();
  } catch (e) {
    console.error('[MainView] ERROR:', e);
  }
}
