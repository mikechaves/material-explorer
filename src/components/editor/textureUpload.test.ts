import { afterEach, describe, expect, it, vi } from 'vitest';
import { prepareTextureUpload, validateTextureDataUrl, validateTextureUploadFile } from './textureUpload';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('textureUpload', () => {
  it('accepts supported image files under size limits', () => {
    const file = { type: 'image/png', size: 1024 } as File;
    expect(validateTextureUploadFile(file)).toBeNull();
  });

  it('rejects non-image file types', () => {
    const file = { type: 'application/json', size: 1024 } as File;
    expect(validateTextureUploadFile(file)).toContain('Only image files');
  });

  it('allows oversized-but-compressible images under the hard source cap', () => {
    const file = { type: 'image/jpeg', size: 4 * 1024 * 1024 + 1 } as File;
    expect(validateTextureUploadFile(file)).toBeNull();
  });

  it('rejects files beyond the hard source cap', () => {
    const file = { type: 'image/png', size: 16 * 1024 * 1024 + 1 } as File;
    expect(validateTextureUploadFile(file)).toContain('Maximum supported size is 16 MB');
  });

  it('rejects oversized encoded data URLs', () => {
    const dataUrl = `data:image/png;base64,${'a'.repeat(2_500_001)}`;
    expect(validateTextureDataUrl(dataUrl)).toContain('too large after encoding');
  });

  it('downscales and compresses large valid image files before embedding', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 4096, height: 2048, close }));
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({ drawImage: vi.fn() })),
        toBlob: vi.fn((callback: BlobCallback, type: string) => {
          callback(new Blob(['compressed-texture'], { type }));
        }),
      })),
    });

    const file = new File([new Uint8Array(5 * 1024 * 1024)], 'large-texture.jpg', { type: 'image/jpeg' });

    const result = await prepareTextureUpload(file);

    expect(result.compressed).toBe(true);
    expect(result.originalWidth).toBe(4096);
    expect(result.originalHeight).toBe(2048);
    expect(result.width).toBe(2048);
    expect(result.height).toBe(1024);
    expect(result.outputType).toBe('image/jpeg');
    expect(result.dataUrl).toContain('data:image/jpeg;base64,');
    expect(close).toHaveBeenCalled();
  });

  it('rejects images that still exceed the data URL budget after optimization fails', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('decode failed')));
    const file = new File([new Uint8Array(4 * 1024 * 1024)], 'broken-texture.png', { type: 'image/png' });

    await expect(prepareTextureUpload(file)).rejects.toThrow('too large after encoding');
  });
});
