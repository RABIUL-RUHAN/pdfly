import { useState } from "react";
import UploadZone from "../UploadZone";
import { compressPdf, triggerDownload, ApiError } from "../../api";

function formatBytes(bytes) {
  const n = Number(bytes);
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CompressPanel() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [sizes, setSizes] = useState(null); // { original, compressed }
  const [notice, setNotice] = useState("");

  const handleSubmit = async () => {
    if (files.length === 0) {
      setStatus("error");
      setMessage("Select a PDF file first.");
      return;
    }
    setStatus("processing");
    setMessage("");
    setSizes(null);
    setNotice("");
    try {
      const { blob, filename, originalSize, compressedSize, notice: n } = await compressPdf(
        files[0]
      );
      triggerDownload(blob, filename);
      setStatus("done");
      setMessage("Compressed PDF downloaded.");
      setSizes({ original: originalSize, compressed: compressedSize });
      if (n) setNotice(n);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof ApiError ? e.message : "Compression failed.");
    }
  };

  const reduced =
    sizes && Number(sizes.compressed) < Number(sizes.original) ? true : false;

  return (
    <div className="panel">
      <h2>Compress PDF</h2>
      <p className="panel-description">
        Reduce file size. If compression doesn't help, the original file is returned instead.
      </p>

      <div className="field">
        <label>File</label>
        <UploadZone multiple={false} files={files} onFilesSelected={setFiles} />
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={status === "processing"}>
        {status === "processing" ? "Compressing…" : "Compress PDF"}
      </button>

      {message && (
        <div className={`message ${status === "error" ? "error" : "success"}`}>{message}</div>
      )}

      {sizes && (
        <div className="size-comparison">
          <div className="size-block">
            <div className="size-label">Original</div>
            <div className="size-value">{formatBytes(sizes.original)}</div>
          </div>
          <div className="size-block">
            <div className="size-label">Compressed</div>
            <div className={`size-value ${reduced ? "reduced" : ""}`}>
              {formatBytes(sizes.compressed)}
            </div>
          </div>
        </div>
      )}

      {notice && <div className="message notice">{notice}</div>}
    </div>
  );
}