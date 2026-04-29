export interface SegmentedOption {
  label: string;
  value: string;
}

export function renderSegmentedControl(
  options: SegmentedOption[],
  activeValue: string,
  onChange: (value: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'segmented-control';

  for (const opt of options) {
    const btn = document.createElement('button');
    btn.className = 'segmented-btn' + (opt.value === activeValue ? ' active' : '');
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      if (opt.value === activeValue) return;
      container.querySelectorAll('.segmented-btn').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      onChange(opt.value);
    });
    container.appendChild(btn);
  }

  return container;
}
