import { state } from '../state';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function renderResultView(container: HTMLElement): void {
  container.innerHTML = '';

  const bar = document.createElement('div');
  bar.className = 'top-bar';

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> 返回';
  backBtn.addEventListener('click', () => {
    state.view = 'main';
    state.resultType = null;
    state.resultBlob = null;
    state.splitResults = null;
    state.notify('view');
  });

  const title = document.createElement('span');
  title.style.fontWeight = '600';
  title.style.fontSize = '16px';
  title.textContent = '结果预览';

  bar.appendChild(backBtn);
  bar.appendChild(title);
  bar.appendChild(document.createElement('div'));
  container.appendChild(bar);

  const resultContainer = document.createElement('div');
  resultContainer.className = 'result-container';

  if (state.resultType === 'stitch' && state.resultBlob) {
    renderStitchResult(resultContainer);
  } else if (state.resultType === 'split' && state.splitResults) {
    renderSplitResultUI(resultContainer);
  }

  container.appendChild(resultContainer);
}

function renderStitchResult(container: HTMLElement): void {
  const previewArea = document.createElement('div');
  previewArea.className = 'preview-area';
  const blobUrl = URL.createObjectURL(state.resultBlob!);
  const img = document.createElement('img');
  img.src = blobUrl;
  img.alt = '拼接结果';
  previewArea.appendChild(img);
  container.appendChild(previewArea);

  const actions = document.createElement('div');
  actions.className = 'result-actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'download-btn';
  const ext = state.resultFormat === 'jpeg' ? 'jpg' : 'png';
  saveBtn.textContent = `保存为 ${state.resultFormat.toUpperCase()}`;
  saveBtn.addEventListener('click', () => {
    downloadBlob(state.resultBlob!, `chimera_stitch_${Date.now()}.${ext}`);
  });
  actions.appendChild(saveBtn);
  container.appendChild(actions);
}

function renderSplitResultUI(container: HTMLElement): void {
  container.innerHTML = '';

  const results = state.splitResults!;
  const total = results.length;
  const idx = state.currentSplitImageIndex;
  const current = results[idx];

  if (!current) return;

  const header = document.createElement('div');
  header.style.cssText = 'font-size:14px;color:var(--text-secondary);margin-bottom:12px;text-align:center;';
  header.textContent = `${current.imageName}  (${idx + 1}/${total})`;
  container.appendChild(header);

  const navRow = document.createElement('div');
  navRow.style.cssText = 'display:flex;gap:12px;margin-bottom:16px;justify-content:center;';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'download-btn';
  prevBtn.textContent = '← 上一张';
  prevBtn.disabled = idx === 0;
  prevBtn.style.opacity = idx === 0 ? '0.4' : '';
  prevBtn.addEventListener('click', () => {
    if (state.currentSplitImageIndex > 0) {
      state.currentSplitImageIndex--;
      renderSplitResultUI(container);
    }
  });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'download-btn';
  nextBtn.textContent = '下一张 →';
  nextBtn.disabled = idx >= total - 1;
  nextBtn.style.opacity = idx >= total - 1 ? '0.4' : '';
  nextBtn.addEventListener('click', () => {
    if (state.currentSplitImageIndex < total - 1) {
      state.currentSplitImageIndex++;
      renderSplitResultUI(container);
    }
  });

  navRow.appendChild(prevBtn);
  navRow.appendChild(nextBtn);
  container.appendChild(navRow);

  const grid = document.createElement('div');
  grid.className = 'split-grid';
  grid.classList.add(state.cutGrid === 3 ? 'split-grid-3' : 'split-grid-2');

  for (const cell of current.cells) {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'cell';
    const url = URL.createObjectURL(cell.blob);
    const cImg = document.createElement('img');
    cImg.src = url;
    cImg.alt = `cell_${cell.index}`;
    cImg.addEventListener('click', () => {
      const baseName = current.imageName.replace(/\.[^.]+$/, '');
      downloadBlob(cell.blob, `${baseName}_cell_${cell.index + 1}.png`);
    });
    cImg.title = '点击下载';
    cellDiv.appendChild(cImg);
    grid.appendChild(cellDiv);
  }
  container.appendChild(grid);

  const saveAllBtn = document.createElement('button');
  saveAllBtn.className = 'download-btn';
  saveAllBtn.style.marginTop = '16px';
  saveAllBtn.textContent = '保存全部';
  saveAllBtn.addEventListener('click', () => {
    for (const r of results) {
      const baseName = r.imageName.replace(/\.[^.]+$/, '');
      for (const cell of r.cells) {
        downloadBlob(cell.blob, `${baseName}_cell_${cell.index + 1}.png`);
      }
    }
  });
  container.appendChild(saveAllBtn);

  const hint = document.createElement('p');
  hint.style.cssText = 'margin-top:12px;font-size:13px;color:var(--text-secondary);text-align:center;';
  hint.textContent = '点击任意单元格即可单独下载';
  container.appendChild(hint);
}
