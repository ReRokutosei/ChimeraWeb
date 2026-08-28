import { describe, it, expect, vi } from 'vitest';
import { state } from '../src/state';

describe('AppState', () => {
  it('notifies listeners when key is triggered', () => {
    const listener = vi.fn();
    state.on('test_event', listener);
    
    state.notify('test_event');
    expect(listener).toHaveBeenCalledTimes(1);

    state.notify('test_event');
    expect(listener).toHaveBeenCalledTimes(2);

    state.off('test_event', listener);
    state.notify('test_event');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('can store and switch views and cut presets', () => {
    state.view = 'main';
    state.cutPreset = 'x4';
    expect(state.view).toBe('main');
    expect(state.cutPreset).toBe('x4');

    state.cutPreset = 'x3';
    expect(state.cutPreset).toBe('x3');
  });
});
