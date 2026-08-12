import { authFetch } from "@/app/lib/authFetch";

const UPLOAD_TIMEOUT_MS = 20000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

async function uploadViaApi(file: Blob, filename: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, filename);

  const response = await withTimeout(
    authFetch("/api/upload/design", { method: "POST", body: formData }),
    UPLOAD_TIMEOUT_MS,
    "Upload timed out. You can still save without an image."
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Upload failed.");
  }

  return data.url;
}

export async function uploadDesignFile(file: File): Promise<string> {
  return uploadViaApi(file, file.name);
}

export async function uploadDesignBlob(blob: Blob, extension = "png"): Promise<string> {
  return uploadViaApi(blob, `design.${extension}`);
}
