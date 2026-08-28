import { state, type CutPreset, type SplitImageResult } from '../state';
import { t } from '../i18n';
import { save, open as openDialog } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { isDesktop } from '../env';
import JSZip from 'jszip';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getCellFilename(imageName: string, preset: CutPreset, index: number): string {
  const baseName = imageName.replace(/\.[^.]+$/, '');
  const numStr = String(index + 1).padStart(2, '0');
  if (preset === 'x3' || preset === 'x4') {
    return `${baseName}_X_${numStr}.png`;
  }
  return `${baseName}_grid_${numStr}.png`;
}

async function downloadZip(results: SplitImageResult[], zipName: string): Promise<void> {
  const zip = new JSZip();
  for (const r of results) {
    for (const cell of r.cells) {
      const fileName = getCellFilename(r.imageName, r.preset, cell.index);
      zip.file(fileName, cell.blob);
    }
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, zipName);
}

async function saveBlobNative(blob: Blob, defaultFilename: string): Promise<void> {
  if (!isDesktop()) {
    downloadBlob(blob, defaultFilename);
    return;
  }
  try {
    const ext = defaultFilename.split('.').pop() || '';
    
    let targetPath = '';
    if (!state.alwaysPromptSave && state.defaultSaveDir) {
      const sep = state.defaultSaveDir.includes('\\') ? '\\' : '/';
      targetPath = state.defaultSaveDir.endsWith(sep) ? `${state.defaultSaveDir}${defaultFilename}` : `${state.defaultSaveDir}${sep}${defaultFilename}`;
    } else {
      const p = await save({
        defaultPath: state.defaultSaveDir ? `${state.defaultSaveDir}/${defaultFilename}` : defaultFilename,
        filters: [{ name: 'Image', extensions: [ext] }]
      });
      if (p) targetPath = p;
    }

    if (targetPath) {
      const arr = new Uint8Array(await blob.arrayBuffer());
      await invoke('save_file_bypass', { path: targetPath, data: Array.from(arr) });
    }
  } catch (e) {
    console.error('Failed to save file', e);
    alert(t('fail') + ': ' + e);
  }
}

export function renderResultView(container: HTMLElement): void {
  state.cleanup();
  container.innerHTML = '';

  const bar = document.createElement('div');
  bar.className = 'top-bar';

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> ' + t('back');
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
  title.textContent = t('result_title');

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
  img.alt = t('result_title');
  previewArea.appendChild(img);
  container.appendChild(previewArea);

  const actions = document.createElement('div');
  actions.className = 'result-actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'download-btn';
  const extMap: Record<string, string> = { png: 'png', jpeg: 'jpg', webp: 'webp' };
  const ext = extMap[state.resultFormat] || 'png';
  saveBtn.textContent = t('save_as', { fmt: state.resultFormat.toUpperCase() });
  saveBtn.addEventListener('click', () => {
    saveBlobNative(state.resultBlob!, `chimera_stitch_${Date.now()}.${ext}`);
  });
  actions.appendChild(saveBtn);
  container.appendChild(actions);
}

function renderSplitResultUI(container: HTMLElement): void {
  container.innerHTML = '';

  const results = state.splitResults!;
  const total = results.length;
  const isMulti = total > 1;
  const idx = state.currentSplitImageIndex;
  const current = results[idx];

  if (!current) return;

  const header = document.createElement('div');
  header.style.cssText = 'font-size:14px;color:var(--text-secondary);margin-bottom:12px;text-align:center;';
  header.textContent = isMulti ? `${current.imageName}  (${idx + 1}/${total})` : current.imageName;
  container.appendChild(header);

  // Seamless ribbon preview for X 3/4 presets
  if (current.preset === 'x3' || current.preset === 'x4') {
    const ribbonCard = document.createElement('div');
    ribbonCard.className = 'seamless-ribbon-card';

    const ribbonHeader = document.createElement('div');
    ribbonHeader.className = 'seamless-ribbon-header';
    ribbonHeader.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px">view_carousel</span> ${t('seamless_preview')}`;
    ribbonCard.appendChild(ribbonHeader);

    const ribbonTrack = document.createElement('div');
    ribbonTrack.className = 'seamless-ribbon-track';

    for (const cell of current.cells) {
      const cellWrap = document.createElement('div');
      cellWrap.className = 'seamless-ribbon-cell';
      
      const img = document.createElement('img');
      img.src = URL.createObjectURL(cell.blob);
      
      const badge = document.createElement('span');
      badge.className = 'seamless-ribbon-badge';
      badge.textContent = String(cell.index + 1).padStart(2, '0');
      
      cellWrap.appendChild(img);
      cellWrap.appendChild(badge);
      ribbonTrack.appendChild(cellWrap);
    }

    ribbonCard.appendChild(ribbonTrack);
    container.appendChild(ribbonCard);
  }

  // Prev / Next navigation (hidden when only 1 image)
  if (isMulti) {
    const navRow = document.createElement('div');
    navRow.style.cssText = 'display:flex;gap:12px;margin-bottom:12px;justify-content:center;';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'download-btn';
    prevBtn.textContent = t('prev');
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
    nextBtn.textContent = t('next');
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
  }

  // Save buttons
  const saveRow = document.createElement('div');
  saveRow.style.cssText = 'display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;justify-content:center;';

  const baseName = current.imageName.replace(/\.[^.]+$/, '');

  // ZIP Download button
  const zipBtn = document.createElement('button');
  zipBtn.className = 'download-btn';
  zipBtn.textContent = t('download_zip');
  zipBtn.addEventListener('click', async () => {
    await downloadZip([current], `${baseName}_split.zip`);
  });
  saveRow.appendChild(zipBtn);

  if (isMulti) {
    const saveAllBtn = document.createElement('button');
    saveAllBtn.className = 'download-btn';
    saveAllBtn.textContent = t('save_all');
    saveAllBtn.title = t('save_all_title', { n: total });
    saveAllBtn.addEventListener('click', async () => {
      if (!isDesktop()) {
        await downloadZip(results, `chimera_all_split.zip`);
        return;
      }

      let targetDir = state.defaultSaveDir;
      if (state.alwaysPromptSave || !targetDir) {
        const selected = await openDialog({
          directory: true,
          multiple: false,
          defaultPath: state.defaultSaveDir || undefined,
        });
        if (!selected || typeof selected !== 'string') return;
        targetDir = selected;
      }

      try {
        for (const r of results) {
          for (const cell of r.cells) {
            const arr = new Uint8Array(await cell.blob.arrayBuffer());
            const fileName = getCellFilename(r.imageName, r.preset, cell.index);
            const sep = targetDir.includes('\\') ? '\\' : '/';
            const fullPath = targetDir.endsWith(sep) ? `${targetDir}${fileName}` : `${targetDir}${sep}${fileName}`;
            await invoke('save_file_bypass', { path: fullPath, data: Array.from(arr) });
          }
        }
        alert(t('saved_to', { path: targetDir }));
      } catch (e) {
        console.error('Failed to save all', e);
        alert(t('fail') + ': ' + e);
      }
    });
    saveRow.appendChild(saveAllBtn);
  }

  const saveCurrentBtn = document.createElement('button');
  saveCurrentBtn.className = 'download-btn';
  saveCurrentBtn.textContent = t('save_current');
  saveCurrentBtn.title = t('save_current_title', { name: current.imageName });
  saveCurrentBtn.addEventListener('click', async () => {
    if (!isDesktop()) {
      for (const cell of current.cells) {
        const fileName = getCellFilename(current.imageName, current.preset, cell.index);
        downloadBlob(cell.blob, fileName);
      }
      return;
    }

    let targetDir = state.defaultSaveDir;
    if (state.alwaysPromptSave || !targetDir) {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        defaultPath: state.defaultSaveDir || undefined,
      });
      if (!selected || typeof selected !== 'string') return;
      targetDir = selected;
    }

    try {
      for (const cell of current.cells) {
        const arr = new Uint8Array(await cell.blob.arrayBuffer());
        const fileName = getCellFilename(current.imageName, current.preset, cell.index);
        const sep = targetDir.includes('\\') ? '\\' : '/';
        const fullPath = targetDir.endsWith(sep) ? `${targetDir}${fileName}` : `${targetDir}${sep}${fileName}`;
        await invoke('save_file_bypass', { path: fullPath, data: Array.from(arr) });
      }
      alert(t('saved_to', { path: targetDir }));
    } catch (e) {
      console.error('Failed to save current', e);
      alert(t('fail') + ': ' + e);
    }
  });
  saveRow.appendChild(saveCurrentBtn);
  container.appendChild(saveRow);

  const hint = document.createElement('p');
  hint.style.cssText = 'margin-bottom:12px;font-size:13px;color:var(--text-secondary);text-align:center;';
  hint.textContent = t('click_download');
  container.appendChild(hint);

  const grid = document.createElement('div');
  grid.className = 'split-grid';
  if (current.preset === 'x3') {
    grid.classList.add('split-grid-1x3');
  } else if (current.preset === 'x4') {
    grid.classList.add('split-grid-1x4');
  } else if (current.preset === 'grid2') {
    grid.classList.add('split-grid-2');
  } else {
    grid.classList.add('split-grid-3');
  }

  for (const cell of current.cells) {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'cell';
    const url = URL.createObjectURL(cell.blob);
    const cImg = document.createElement('img');
    cImg.src = url;
    cImg.alt = `cell_${cell.index}`;
    cImg.addEventListener('click', () => {
      const fileName = getCellFilename(current.imageName, current.preset, cell.index);
      saveBlobNative(cell.blob, fileName);
    });
    cImg.title = `${t('click_download')} (${String(cell.index + 1).padStart(2, '0')})`;
    
    const badge = document.createElement('span');
    badge.className = 'seamless-ribbon-badge';
    badge.textContent = String(cell.index + 1).padStart(2, '0');

    cellDiv.appendChild(cImg);
    cellDiv.appendChild(badge);
    grid.appendChild(cellDiv);
  }
  container.appendChild(grid);
}

