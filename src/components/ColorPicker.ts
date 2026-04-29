export function renderColorPicker(
  initialColor: string,
  onChange: (color: string) => void
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'color-picker-wrapper';

  const input = document.createElement('input');
  input.type = 'color';
  input.value = initialColor;
  input.addEventListener('input', () => onChange(input.value));

  wrapper.appendChild(input);
  return wrapper;
}
