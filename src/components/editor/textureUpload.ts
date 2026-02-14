const MAX_TEXTURE_FILE_BYTES = 4 * 1024 * 1024; // 4 MB
const MAX_TEXTURE_DATA_URL_CHARS = 2_500_000;

export function validateTextureUploadFile(file: File): string | null {
  const type = file.type?.trim();
  if (type && !type.startsWith('image/')) {
    return 'Only image files can be used as texture maps.';
  }
  if (file.size > MAX_TEXTURE_FILE_BYTES) {
    return 'Texture file is too large. Maximum supported size is 4 MB.';
  }
  return null;
}

export function validateTextureDataUrl(dataUrl: string): string | null {
  if (dataUrl.length > MAX_TEXTURE_DATA_URL_CHARS) {
    return 'Texture is too large after encoding. Use a smaller image to avoid storage limits.';
  }
  return null;
}
