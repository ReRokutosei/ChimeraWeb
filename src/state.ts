export interface ImageInfo {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
}

export interface SplitCell {
  blob: Blob;
  index: number;
}

export interface SplitImageResult {
  imageName: string;
  cells: SplitCell[];
}

type Listener = () => void;

class AppState {
  private _listeners = new Map<string, Set<Listener>>();

  view: 'main' | 'result' = 'main';
  isCutMode = false;
  cutGrid = 3;
  images: ImageInfo[] = [];
  currentImageIndex = 0;

  resultType: 'stitch' | 'split' | null = null;
  resultBlob: Blob | null = null;
  resultFormat: 'png' | 'jpeg' | 'webp' = 'png';

  splitResults: SplitImageResult[] | null = null;
  currentSplitImageIndex = 0;

  stitchMode: 'DIRECT_VERTICAL' | 'DIRECT_HORIZONTAL' = 'DIRECT_VERTICAL';
  overlayMode: 'DISABLED' | 'ENABLED' = 'DISABLED';
  overlayArea = 10;
  widthScale: 'NONE' | 'MIN_WIDTH' | 'MAX_WIDTH' = 'MIN_WIDTH';
  imageSpacing = 0;
  spacingColor = '#000000';
  outputFormat: 'png' | 'jpeg' | 'webp' = 'png';
  outputQuality = 90;

  on(key: string, fn: Listener): void {
    let set = this._listeners.get(key);
    if (!set) {
      set = new Set();
      this._listeners.set(key, set);
    }
    set.add(fn);
  }

  off(key: string, fn: Listener): void {
    this._listeners.get(key)?.delete(fn);
  }

  notify(key: string): void {
    this._listeners.get(key)?.forEach(fn => fn());
  }

  cleanup(): void {
    this._listeners.clear();
  }
}

export const state = new AppState();
