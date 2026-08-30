export function addPathSuffix(path: string, suffix: number): string {
  const separatorIndex = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  const directory = path.slice(0, separatorIndex + 1);
  const fileName = path.slice(separatorIndex + 1);
  const extensionIndex = fileName.lastIndexOf('.');
  if (extensionIndex <= 0) return `${directory}${fileName}_${suffix}`;
  return `${directory}${fileName.slice(0, extensionIndex)}_${suffix}${fileName.slice(extensionIndex)}`;
}

export async function findAvailablePath(
  requestedPath: string,
  pathExists: (path: string) => Promise<boolean>
): Promise<string> {
  if (!await pathExists(requestedPath)) return requestedPath;
  for (let suffix = 2; ; suffix++) {
    const candidate = addPathSuffix(requestedPath, suffix);
    if (!await pathExists(candidate)) return candidate;
  }
}
