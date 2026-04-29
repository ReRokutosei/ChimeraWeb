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

  // Top bar with back button
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
  bar.appendChild(document.createElement('div')); // spacer
  container.appendChild(bar);

  // Result content
  const resultContainer = document.createElement('div');
  resultContainer.className = 'result-container';

  if (state.resultType === 'stitch' && state.resultBlob) {
    // Single image result
    const previewArea = document.createElement('div');
    previewArea.className = 'preview-area';

    const blobUrl = URL.createObjectURL(state.resultBlob);
    const img = document.createElement('img');
    img.src = blobUrl;
    img.alt = '拼接结果';
    previewArea.appendChild(img);
    resultContainer.appendChild(previewArea);

    // Download buttons
    const actions = document.createElement('div');
    actions.className = 'result-actions';

    const downloadPng = document.createElement('button');
    downloadPng.className = 'download-btn';
    downloadPng.textContent = '下载为 PNG';
    downloadPng.addEventListener('click', async () => {
      const blob = state.resultBlob!;
      const newBlob = state.resultFormat === 'png'
        ? blob
        : await convertBlobFormat(blob, 'image/png');
      downloadBlob(newBlob, `chimera_${Date.now()}.png`);
    });
    actions.appendChild(downloadPng);

    const downloadJpeg = document.createElement('button');
    downloadJpeg.className = 'download-btn';
    downloadJpeg.textContent = '下载为 JPEG';
    downloadJpeg.addEventListener('click', async () => {
      const blob = state.resultBlob!;
      const newBlob = state.resultFormat === 'jpeg'
        ? blob
        : await convertBlobFormat(blob, 'image/jpeg');
      downloadBlob(newBlob, `chimera_${Date.now()}.jpg`);
    });
    actions.appendChild(downloadJpeg);

    resultContainer.appendChild(actions);
  } else if (state.resultType === 'split' && state.resultCells) {
    // Grid of cells
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

      img.addEventListener('click', () => {
        downloadBlob(cell.blob, `chimera_cell_${cell.index + 1}.png`);
      });
      img.title = '点击下载';

      cellDiv.appendChild(img);
      grid.appendChild(cellDiv);
    }
    resultContainer.appendChild(grid);

    // Download all as ZIP would need JSZip dependency—download individually for now
    const hint = document.createElement('p');
    hint.style.cssText = 'margin-top:12px;font-size:13px;color:var(--text-secondary);text-align:center;';
    hint.textContent = '点击任意单元格即可单独下载';
    resultContainer.appendChild(hint);
  }

  container.appendChild(resultContainer);
}

async function convertBlobFormat(blob: Blob, mime: string): Promise<Blob> {
  const img = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  img.close();
  return new Promise(resolve => {
    canvas.toBlob(b => resolve(b!), mime);
  });
}
