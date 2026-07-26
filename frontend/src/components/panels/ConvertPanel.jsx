import { useState } from "react";
import UploadZone from "../UploadZone";
import { convertPdf, triggerDownload, ApiError } from "../../api";

export default function ConvertPanel() {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState("PNG");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (files.length === 0) {
      setStatus("error");
      setMessage("Select a PDF file first.");
      return;
    }
    setStatus("processing");
    setMessage("");
    try {
      const { blob, filename } = await convertPdf(files[0], format);
      triggerDownload(blob, filename);
      setStatus("done");
      setMessage("Image(s) downloaded. Multi-page PDFs are bundled as a ZIP.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof ApiError ? e.message : "Could not convert this file.");
    }
  };

  return (
    <div className="panel">
      <h2>PDF to Image</h2>
      <p className="panel-description">
        Convert each page to a raster image at 150 DPI. Multi-page PDFs download as a ZIP.
      </p>

      <div className="field">
        <label>File</label>
        <UploadZone multiple={false} files={files} onFilesSelected={setFiles} />
      </div>

      <div className="field">
        <label htmlFor="convert-format">Output format</label>
        <select id="convert-format" value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="PNG">PNG</option>
          <option value="JPG">JPG</option>
        </select>
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={status === "processing"}>
        {status === "processing" ? "Converting…" : "Convert to Image"}
      </button>

      {message && (
        <div className={`message ${status === "error" ? "error" : "success"}`}>{message}</div>
      )}
    </div>
  );
}