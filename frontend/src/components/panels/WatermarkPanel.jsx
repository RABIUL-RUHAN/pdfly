import { useState } from "react";
import UploadZone from "../UploadZone";
import { watermarkPdf, triggerDownload, ApiError } from "../../api";

export default function WatermarkPanel() {
  const [files, setFiles] = useState([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (files.length === 0) {
      setStatus("error");
      setMessage("Select a PDF file first.");
      return;
    }
    if (!text.trim()) {
      setStatus("error");
      setMessage("Enter the watermark text.");
      return;
    }
    setStatus("processing");
    setMessage("");
    try {
      const { blob, filename } = await watermarkPdf(files[0], text.trim());
      triggerDownload(blob, filename);
      setStatus("done");
      setMessage("Watermarked PDF downloaded.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof ApiError ? e.message : "Could not watermark this file.");
    }
  };

  return (
    <div className="panel">
      <h2>Add Watermark</h2>
      <p className="panel-description">
        Stamp a diagonal text watermark across every page of a PDF.
      </p>

      <div className="field">
        <label>File</label>
        <UploadZone multiple={false} files={files} onFilesSelected={setFiles} />
      </div>

      <div className="field">
        <label htmlFor="watermark-text">Watermark text</label>
        <input
          id="watermark-text"
          type="text"
          placeholder="e.g. CONFIDENTIAL"
          maxLength={200}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={status === "processing"}>
        {status === "processing" ? "Stamping…" : "Add Watermark"}
      </button>

      {message && (
        <div className={`message ${status === "error" ? "error" : "success"}`}>{message}</div>
      )}
    </div>
  );
}