/**
 * Compresses an image Base64 dataURL to a maximum width and specified quality
 * using HTML5 Canvas. This prevents hitting Firestore document size limits (1MB).
 */
export function compressImage(base64Str: string, maxWidth = 800, quality = 0.55): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Keep aspect ratio but scale down if it exceeds max size
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Export as lossy compressed JPEG
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };

    img.onerror = () => {
      // Return original on load failure
      resolve(base64Str);
    };
  });
}
