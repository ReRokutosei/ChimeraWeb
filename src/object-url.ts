export class ObjectUrlRegistry {
  private readonly urls = new Set<string>();

  create(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  revokeAll(): void {
    for (const url of this.urls) {
      URL.revokeObjectURL(url);
    }
    this.urls.clear();
  }
}
