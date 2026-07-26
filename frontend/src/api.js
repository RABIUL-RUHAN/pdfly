// Central API client — every backend call goes through here.
// Set VITE_API_BASE in a .env file (or Vercel env vars) to point at your deployed backend.
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function filenameFromDisposition(disposition, fallback) {
  if (!disposition) return fallback;
  const match = disposition.match(/filename="?([^"]+)"?/);
  return match ? match[1] : fallback;
}

async function postForFile(endpoint, formData, fallbackFilename) {
  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { method: "POST", body: formData });
  } catch (networkErr) {
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      0
    );
  }

  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const data = await res.json();
      if (data && data.message) message = data.message;
    } catch {
      /* response wasn't JSON — keep the generic message */
    }
    throw new ApiError(message, res.status);
  }

  const blob = await res.blob();
  const filename = filenameFromDisposition(
    res.headers.get("Content-Disposition"),
    fallbackFilename
  );

  return {
    blob,
    filename,
    originalSize: res.headers.get("X-Original-Size"),
    compressedSize: res.headers.get("X-Compressed-Size"),
    notice: res.headers.get("X-Notice"),
    warning: res.headers.get("X-Warning"),
  };
}

export function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function mergePdfs(files) {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  return postForFile("/merge", fd, "merged_output.pdf");
}

export function splitPdf(file, range) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("range", range);
  return postForFile("/split", fd, "split_output.pdf");
}

export function rotatePdf(file, angle) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("angle", String(angle));
  return postForFile("/rotate", fd, "rotated_output.pdf");
}

export function watermarkPdf(file, text) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("text", text);
  return postForFile("/watermark", fd, "watermarked_output.pdf");
}

export function convertPdf(file, format) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("format", format);
  return postForFile("/convert", fd, `converted.${format.toLowerCase()}`);
}

export function compressPdf(file) {
  const fd = new FormData();
  fd.append("file", file);
  return postForFile("/compress", fd, "compressed_output.pdf");
}

export function toWordPdf(file) {
  const fd = new FormData();
  fd.append("file", file);
  return postForFile("/toword", fd, "converted.docx");
}

export function wordToPdf(file) {
  const fd = new FormData();
  fd.append("file", file);
  return postForFile("/wordtopdf", fd, "converted.pdf");
}

export function imagesToPdf(files) {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  return postForFile("/imagetopdf", fd, "converted.pdf");
}

export async function inspectPdf(file) {
  const fd = new FormData();
  fd.append("file", file);
  let res;
  try {
    res = await fetch(`${API_BASE}/edit/inspect`, { method: "POST", body: fd });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }
  if (!res.ok) {
    let message = "Could not read this PDF.";
    try {
      const data = await res.json();
      if (data && data.message) message = data.message;
    } catch {}
    throw new ApiError(message, res.status);
  }
  return res.json();
}

export function applyPdfEdits(file, edits) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("edits", JSON.stringify(edits));
  return postForFile("/edit/apply", fd, "edited.pdf");
}

export { ApiError };