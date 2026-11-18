const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const MAX_BYTES = 10 * 1024 * 1024;

export async function uploadImageFile(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Image uploads are not configured.");
  }
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Images must be 10 MB or smaller.");
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.secure_url !== "string") {
    throw new Error(data?.error?.message || "Image upload failed. Please try again.");
  }
  return data.secure_url;
}
