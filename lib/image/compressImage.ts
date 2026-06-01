import imageCompression from 'browser-image-compression';

export type CompressImageOptions = {
  targetKB?: number;
  toleranceKB?: number;
  maxDimension?: number;
  minQuality?: number;
  maxAttempts?: number;
  outputType?: 'image/jpeg' | 'image/webp';
};

export type CompressImageResult = {
  file: File;
  widthHint: number;
  qualityHint: number;
  finalSizeKB: number;
};

/**
 * Compresses an image client-side aiming for a target weight of ~50KB (corridor 35-65KB)
 * using an adaptive iterative algorithm adjusting resolution and quality.
 */
export async function compressImageToTarget(
  file: File,
  options: CompressImageOptions = {},
): Promise<CompressImageResult> {
  const {
    targetKB = 50,
    toleranceKB = 15,
    maxDimension = 1600,
    minQuality = 0.45,
    maxAttempts = 8,
    outputType,
  } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error('Выбранный файл не является изображением.');
  }

  const targetBytes = targetKB * 1024;
  const maxBytes = (targetKB + toleranceKB) * 1024;
  const minBytes = Math.max(10 * 1024, (targetKB - toleranceKB) * 1024);

  // Preserve alpha transparency by converting PNG/WebP to WebP. Convert other types to JPEG.
  const isPNGOrWebP = file.type === 'image/png' || file.type === 'image/webp';
  const resolvedOutputType = outputType || (isPNGOrWebP ? 'image/webp' : 'image/jpeg');
  const ext = resolvedOutputType === 'image/webp' ? 'webp' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '');

  let currentMaxDimension = maxDimension;
  let currentQuality = 0.82;

  let bestFile: File | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: maxBytes / 1024 / 1024,
        maxWidthOrHeight: currentMaxDimension,
        useWebWorker: true,
        fileType: resolvedOutputType,
        initialQuality: currentQuality,
        maxIteration: 10,
      });

      const candidate = new File(
        [compressed],
        `${baseName}.${ext}`,
        { type: resolvedOutputType, lastModified: Date.now() },
      );

      const size = candidate.size;
      const score = Math.abs(size - targetBytes);

      if (score < bestScore) {
        bestScore = score;
        bestFile = candidate;
      }

      // Check if size is inside the target corridor
      if (size >= minBytes && size <= maxBytes) {
        return {
          file: candidate,
          widthHint: currentMaxDimension,
          qualityHint: currentQuality,
          finalSizeKB: Math.round(size / 1024),
        };
      }

      if (size > maxBytes) {
        // Decrease quality
        currentQuality = Math.max(minQuality, currentQuality - 0.08);

        // If quality reached the minimum, fallback to reducing physical resolution
        if (currentQuality <= minQuality + 0.01) {
          currentMaxDimension = Math.max(640, Math.round(currentMaxDimension * 0.88));
        }
      } else {
        // Size is too small, increase quality to get better visual details
        currentQuality = Math.min(0.92, currentQuality + 0.05);
      }
    } catch (err) {
      console.warn(`Attempt ${attempt} of image compression failed:`, err);
    }
  }

  if (!bestFile) {
    throw new Error('Не удалось сжать изображение.');
  }

  return {
    file: bestFile,
    widthHint: currentMaxDimension,
    qualityHint: currentQuality,
    finalSizeKB: Math.round(bestFile.size / 1024),
  };
}
