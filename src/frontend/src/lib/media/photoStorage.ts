// Photo capture and storage utilities with improved error handling, validation, and user-friendly error messages for iPad Safari

export function uint8ArrayToObjectURL(data: Uint8Array): string {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'image/jpeg' });
  return URL.createObjectURL(blob);
}

export async function captureFileToPhoto(
  file: File,
  sessionId: string,
  patientId: string
): Promise<{
  id: string;
  imageData: Uint8Array;
  thumbnailData: Uint8Array;
  timestamp: number;
  width: number;
  height: number;
}> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Unsupported file type. Please select an image file (JPEG, PNG, etc.).');
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Create a new Uint8Array from the ArrayBuffer
    // This ensures we have the correct type for Blob constructor
    const imageData = new Uint8Array(arrayBuffer);

    // Validate image by attempting to decode it
    let img: HTMLImageElement;
    try {
      img = await loadImageFromBytes(imageData);
    } catch (err) {
      console.error('Image decode error:', err);
      throw new Error('Unable to read image file. The file may be corrupted or in an unsupported format.');
    }

    const width = img.width;
    const height = img.height;

    // Validate dimensions
    if (width === 0 || height === 0) {
      throw new Error('Invalid image dimensions. The image file may be corrupted.');
    }

    // Generate thumbnail
    let thumbnailData: Uint8Array;
    try {
      thumbnailData = await generateThumbnail(img);
    } catch (err) {
      console.error('Thumbnail generation error:', err);
      throw new Error('Failed to generate thumbnail. Please try again.');
    }

    return {
      id: crypto.randomUUID(),
      imageData,
      thumbnailData,
      timestamp: Date.now(),
      width,
      height,
    };
  } catch (err) {
    // Re-throw with user-friendly message if not already formatted
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Failed to process image. Please try again with a different file.');
  }
}

async function loadImageFromBytes(imageData: Uint8Array): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([imageData.buffer as ArrayBuffer], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('Image loading timeout'));
    }, 10000); // 10 second timeout

    img.onload = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image'));
    };

    img.src = url;
  });
}

async function generateThumbnail(img: HTMLImageElement): Promise<Uint8Array> {
  const maxSize = 200;
  const scale = Math.min(maxSize / img.width, maxSize / img.height);
  const width = Math.floor(img.width * scale);
  const height = Math.floor(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('Failed to create thumbnail blob'));
          return;
        }

        try {
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          resolve(uint8Array);
        } catch (err) {
          reject(err);
        }
      },
      'image/jpeg',
      0.8
    );
  });
}
