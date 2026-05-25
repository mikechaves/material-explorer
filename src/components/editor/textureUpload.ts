import { MAX_TEXTURE_DATA_URL_CHARS } from '../../utils/materialStorageBudget';

const MAX_TEXTURE_SOURCE_FILE_BYTES = 16 * 1024 * 1024; // 16 MB
const MAX_TEXTURE_DIMENSION = 2048;
const COMPRESSED_TEXTURE_QUALITY = 0.82;

type ImageBitmapLike = CanvasImageSource & {
  width: number;
  height: number;
  close?: () => void;
};

export type PreparedTextureUpload = {
  dataUrl: string;
  compressed: boolean;
  originalBytes: number;
  outputBytes: number;
  originalType: string;
  outputType: string;
  originalWidth?: number;
  originalHeight?: number;
  width?: number;
  height?: number;
};

type TextureCandidate = PreparedTextureUpload & {
  priority: number;
};

export function validateTextureUploadFile(file: File): string | null {
  const type = file.type?.trim();
  if (type && !type.startsWith('image/')) {
    return 'Only image files can be used as texture maps.';
  }
  if (file.size > MAX_TEXTURE_SOURCE_FILE_BYTES) {
    return 'Texture source file is too large. Maximum supported size is 16 MB.';
  }
  return null;
}

export function validateTextureDataUrl(dataUrl: string): string | null {
  if (dataUrl.length > MAX_TEXTURE_DATA_URL_CHARS) {
    return 'Texture is too large after encoding. Use a smaller image to avoid storage limits.';
  }
  return null;
}

export async function prepareTextureUpload(file: File): Promise<PreparedTextureUpload> {
  const originalDataUrl = await blobToDataUrl(file);
  const originalCandidate: TextureCandidate = {
    dataUrl: originalDataUrl,
    compressed: false,
    originalBytes: file.size,
    outputBytes: file.size,
    originalType: file.type || 'application/octet-stream',
    outputType: file.type || 'application/octet-stream',
    priority: 2,
  };

  const optimizedCandidate = await optimizeTextureFile(file, originalDataUrl).catch(() => null);
  const candidates = [optimizedCandidate, originalCandidate]
    .filter((candidate): candidate is TextureCandidate => candidate !== null)
    .sort((a, b) => a.priority - b.priority || a.dataUrl.length - b.dataUrl.length);

  const accepted = candidates.find((candidate) => validateTextureDataUrl(candidate.dataUrl) === null);
  if (accepted) {
    const { priority: _priority, ...result } = accepted;
    return result;
  }

  throw new Error(
    validateTextureDataUrl(candidates[0]?.dataUrl ?? originalDataUrl) ?? 'Texture could not be prepared.'
  );
}

async function optimizeTextureFile(file: File, originalDataUrl: string): Promise<TextureCandidate | null> {
  if (typeof document === 'undefined') return null;

  const bitmap = await loadTextureBitmap(file);
  try {
    const target = getTargetDimensions(bitmap.width, bitmap.height);
    const outputType = getCanvasOutputType(file.type);
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;

    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, target.width, target.height);

    const blob = await canvasToBlob(
      canvas,
      outputType,
      outputType === 'image/png' ? undefined : COMPRESSED_TEXTURE_QUALITY
    );
    if (!blob) return null;

    const dataUrl = await blobToDataUrl(blob);
    const dimensionsChanged = target.width !== bitmap.width || target.height !== bitmap.height;
    const isSmaller = dataUrl.length < originalDataUrl.length;
    if (!dimensionsChanged && !isSmaller) return null;

    return {
      dataUrl,
      compressed: true,
      originalBytes: file.size,
      outputBytes: blob.size,
      originalType: file.type || 'application/octet-stream',
      outputType: blob.type || outputType,
      originalWidth: bitmap.width,
      originalHeight: bitmap.height,
      width: target.width,
      height: target.height,
      priority: dimensionsChanged ? 0 : 1,
    };
  } finally {
    bitmap.close?.();
  }
}

function getTargetDimensions(width: number, height: number): { width: number; height: number } {
  const maxDimension = Math.max(width, height);
  if (maxDimension <= MAX_TEXTURE_DIMENSION) return { width, height };
  const scale = MAX_TEXTURE_DIMENSION / maxDimension;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function getCanvasOutputType(inputType: string): string {
  if (inputType === 'image/jpeg' || inputType === 'image/webp') return inputType;
  return 'image/png';
}

async function loadTextureBitmap(file: File): Promise<ImageBitmapLike> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to decode image'));
    };
    image.src = objectUrl;
  });
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  return `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const maybeBuffer = (
    globalThis as typeof globalThis & {
      Buffer?: { from: (input: ArrayBuffer) => { toString: (encoding: 'base64') => string } };
    }
  ).Buffer;
  if (maybeBuffer) return maybeBuffer.from(buffer).toString('base64');

  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    for (let index = 0; index < chunk.length; index += 1) {
      binary += String.fromCharCode(chunk[index]);
    }
  }
  return btoa(binary);
}
