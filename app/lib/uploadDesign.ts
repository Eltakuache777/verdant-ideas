const UPLOAD_TIMEOUT_MS = 20000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

async function uploadViaApi(uid: string, file: Blob, filename: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, filename);
  formData.append("uid", uid);

  const response = await withTimeout(
    fetch("/api/upload/design", { method: "POST", body: formData }),
    UPLOAD_TIMEOUT_MS,
    "Upload timed out. You can still save without an image."
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Upload failed.");
  }

  return data.url;
}

export async function uploadDesignFile(uid: string, file: File): Promise<string> {
  return uploadViaApi(uid, file, file.name);
}

export async function uploadDesignBlob(uid: string, blob: Blob, extension = "png"): Promise<string> {
  return uploadViaApi(uid, blob, `design.${extension}`);
}
