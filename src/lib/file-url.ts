export function toFileUrl(relativePath?: string | null) {
  if (!relativePath) {
    return null;
  }

  return `/api/files/${relativePath}`;
}
