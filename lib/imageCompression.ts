/**
 * Reads an image file and returns a small, square, JPEG-compressed data URL
 * suitable for storing inline (localStorage or a Postgres text column)
 * without bloating storage. Center-crops to a square first so the result is
 * never stretched/distorted, matching whatever aspect ratio the source had.
 */
export function compressImageToDataUrl(file: File, maxSize = 128, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc tệp ảnh."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Không thể xử lý ảnh này."));
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Trình duyệt không hỗ trợ xử lý ảnh."));
            return;
          }
          // Center-crop the source to a square before resizing.
          const side = Math.min(img.naturalWidth, img.naturalHeight);
          const sx = (img.naturalWidth - side) / 2;
          const sy = (img.naturalHeight - side) / 2;
          ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          reject(new Error("Không thể xử lý ảnh này."));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
