import { useState } from "react";
import UploadZone from "../UploadZone";
import { wordToPdf, triggerDownload, ApiError } from "../../api";

export default function WordToPdfPanel() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (files.length === 0) {
      setStatus("error");
      setMessage("Select a Word document first.");
      return;
    }
    setStatus("processing");
    setMessage("");
    try {
      const { blob, filename } = await wordToPdf(files[0]);
      triggerDownload(blob, filename);
      setStatus("done");
      setMessage("PDF downloaded.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof ApiError ? e.message : "Could not convert this file.");
    }
  };

  return (
    <div className="panel">
      <h2>Word to PDF</h2>
      <p className="panel-description">
        Convert a .doc or .docx file into a PDF using LibreOffice's layout-aware engine.
      </p>

      <div className="field">
        <label>File</label>
        <UploadZone
          multiple={false}
          files={files}
          onFilesSelected={setFiles}
          accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          extensions={[".doc", ".docx"]}
          label="Word document"
        />
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={status === "processing"}>
        {status === "processing" ? "Converting…" : "Convert to PDF"}
      </button>

      {message && (
        <div className={`message ${status === "error" ? "error" : "success"}`}>{message}</div>
      )}
    </div>
  );
}