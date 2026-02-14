import { describe, expect, it } from 'vitest';
import { validateTextureDataUrl, validateTextureUploadFile } from './textureUpload';

describe('textureUpload', () => {
  it('accepts supported image files under size limits', () => {
    const file = { type: 'image/png', size: 1024 } as File;
    expect(validateTextureUploadFile(file)).toBeNull();
  });

  it('rejects non-image file types', () => {
    const file = { type: 'application/json', size: 1024 } as File;
    expect(validateTextureUploadFile(file)).toContain('Only image files');
  });

  it('rejects oversized files', () => {
    const file = { type: 'image/png', size: 4 * 1024 * 1024 + 1 } as File;
    expect(validateTextureUploadFile(file)).toContain('Maximum supported size is 4 MB');
  });

  it('rejects oversized encoded data URLs', () => {
    const dataUrl = `data:image/png;base64,${'a'.repeat(2_500_001)}`;
    expect(validateTextureDataUrl(dataUrl)).toContain('too large after encoding');
  });
});
