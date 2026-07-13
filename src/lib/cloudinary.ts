/**
 * Cloudinary unsigned upload helper (client-side).
 *
 * Uses an *unsigned* upload preset, so images are uploaded straight from the
 * browser to Cloudinary without exposing any secret. The cloud name and preset
 * name are public by design (they travel in every upload request).
 *
 * Configure in the host environment (e.g. Vercel):
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 */
export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
}

export interface UploadedImage {
  url: string;
  publicId: string;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadedImage> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Image uploads aren't configured yet.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image is too large (max 10 MB).");
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  // Use XHR so we can report upload progress.
  return new Promise<UploadedImage>((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve({ url: data.secure_url, publicId: data.public_id });
        } else {
          reject(new Error(data?.error?.message ?? "Upload failed"));
        }
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(form);
  });
}
