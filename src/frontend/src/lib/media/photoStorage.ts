// Photo capture and storage utilities with validation and error handling

export async function captureFileToPhoto(
  file: File,
  sessionId: string,
  patientId: string
): Promise<{
  imageData: Uint8Array;
  thumbnailData: Uint8Array;
  width: number;
  height: number;
  capturedAt: number;
}> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Image file is too large (max 50MB)');
  }

  try {
    // Load image
    const img = await loadImage(file);
    
    // Create full resolution data
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = img.width;
    fullCanvas.height = img.height;
    const fullCtx = fullCanvas.getContext('2d');
    if (!fullCtx) {
      throw new Error('Failed to create canvas context');
    }
    fullCtx.drawImage(img, 0, 0);
    const fullBlob = await canvasToBlob(fullCanvas, 'image/jpeg', 0.9);
    const imageData = new Uint8Array(await fullBlob.arrayBuffer());

    // Create thumbnail (max 300px)
    const maxThumbSize = 300;
    const scale = Math.min(1, maxThumbSize / Math.max(img.width, img.height));
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = img.width * scale;
    thumbCanvas.height = img.height * scale;
    const thumbCtx = thumbCanvas.getContext('2d');
    if (!thumbCtx) {
      throw new Error('Failed to create thumbnail canvas context');
    }
    thumbCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
    const thumbBlob = await canvasToBlob(thumbCanvas, 'image/jpeg', 0.7);
    const thumbnailData = new Uint8Array(await thumbBlob.arrayBuffer());

    return {
      imageData,
      thumbnailData,
      width: img.width,
      height: img.height,
      capturedAt: Date.now(),
    };
  } catch (err) {
    console.error('Failed to process image:', err);
    throw new Error('Failed to process image file. Please try a different image.');
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file'));
    };
    
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob from canvas'));
      },
      type,
      quality
    );
  });
}

export function uint8ArrayToObjectURL(data: Uint8Array, type: string = 'image/jpeg'): string {
  // Create a new Uint8Array to ensure proper ArrayBuffer type
  const newData = new Uint8Array(data);
  const blob = new Blob([newData], { type });
  return URL.createObjectURL(blob);
}
