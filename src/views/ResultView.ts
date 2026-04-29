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
    state.resultCells = null;
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
    const previewArea = document.createElement('div');
    previewArea.className = 'preview-area';
    const blobUrl = URL.createObjectURL(state.resultBlob);
    const img = document.createElement('img');
    img.src = blobUrl;
    img.alt = '拼接结果';
    previewArea.appendChild(img);
    resultContainer.appendChild(previewArea);

    const actions = document.createElement('div');
    actions.className = 'result-actions';

    const dPng = document.createElement('button');
    dPng.className = 'download-btn';
    dPng.textContent = '下载为 PNG';
    dPng.addEventListener('click', () => {
      const blob = state.resultBlob!;
      if (state.resultFormat === 'png') {
        downloadBlob(blob, `chimera_${Date.now()}.png`);
      } else {
        convertBlobFormat(blob, 'image/png').then(b => downloadBlob(b, `chimera_${Date.now()}.png`));
      }
    });
    actions.appendChild(dPng);

    const dJpeg = document.createElement('button');
    dJpeg.className = 'download-btn';
    dJpeg.textContent = '下载为 JPEG';
    dJpeg.addEventListener('click', () => {
      const blob = state.resultBlob!;
      if (state.resultFormat === 'jpeg') {
        downloadBlob(blob, `chimera_${Date.now()}.jpg`);
      } else {
        convertBlobFormat(blob, 'image/jpeg', state.outputQuality).then(b => downloadBlob(b, `chimera_${Date.now()}.jpg`));
      }
    });
    actions.appendChild(dJpeg);

    resultContainer.appendChild(actions);

  } else if (state.resultType === 'split' && state.resultCells) {
    const grid = document.createElement('div');
    grid.className = 'split-grid';
    grid.classList.add(state.cutGrid === 3 ? 'split-grid-3' : 'split-grid-4');

    for (const cell of state.resultCells) {
      const cellDiv = document.createElement('div');
      cellDiv.className = 'cell';
      const url = URL.createObjectURL(cell.blob);
      const img = document.createElement('img');
      img.src = url;
      img.alt = `cell_${cell.index}`;
      img.addEventListener('click', () => downloadBlob(cell.blob, `chimera_cell_${cell.index + 1}.png`));
      img.title = '点击下载';
      cellDiv.appendChild(img);
      grid.appendChild(cellDiv);
    }
    resultContainer.appendChild(grid);

    const hint = document.createElement('p');
    hint.style.cssText = 'margin-top:12px;font-size:13px;color:var(--text-secondary);text-align:center;';
    hint.textContent = '点击任意单元格即可单独下载';
    resultContainer.appendChild(hint);
  }

  container.appendChild(resultContainer);
}

async function convertBlobFormat(blob: Blob, mime: string, quality?: number): Promise<Blob> {
  const img = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  img.close();
  return new Promise(resolve => {
    const q = quality && mime === 'image/jpeg' ? quality / 100 : undefined;
    canvas.toBlob(b => resolve(b!), mime, q);
  });
}
