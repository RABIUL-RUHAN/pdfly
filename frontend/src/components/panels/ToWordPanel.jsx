import { useState } from "react";
import UploadZone from "../UploadZone";
import { toWordPdf, triggerDownload, ApiError } from "../../api";

export default function ToWordPanel() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");

  const handleSubmit = async () => {
    if (files.length === 0) {
      setStatus("error");
      setMessage("Select a PDF file first.");
      return;
    }
    setStatus("processing");
    setMessage("");
    setWarning("");
    try {
      const { blob, filename, warning: w } = await toWordPdf(files[0]);
      triggerDownload(blob, filename);
      setStatus("done");
      setMessage("Word document downloaded.");
      if (w) setWarning(w);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof ApiError ? e.message : "Could not convert this file.");
    }
  };

  return (
    <div className="panel">
      <h2>PDF to Word</h2>
      <p className="panel-description">
        Extract embedded text into a .docx file. Scanned PDFs with no text layer still produce a
        document, flagged with a warning.
      </p>

      <div className="field">
        <label>File</label>
        <UploadZone multiple={false} files={files} onFilesSelected={setFiles} />
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={status === "processing"}>
        {status === "processing" ? "Converting…" : "Convert to Word"}
      </button>

      {message && (
        <div className={`message ${status === "error" ? "error" : "success"}`}>{message}</div>
      )}
      {warning && <div className="message notice">{warning}</div>}
    </div>
  );
}