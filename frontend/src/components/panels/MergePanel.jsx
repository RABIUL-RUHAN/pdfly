import { useState } from "react";
import UploadZone from "../UploadZone";
import { mergePdfs, triggerDownload, ApiError } from "../../api";

export default function MergePanel() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | processing | done | error
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (files.length < 2) {
      setStatus("error");
      setMessage("Select at least two PDF files to merge.");
      return;
    }
    setStatus("processing");
    setMessage("");
    try {
      const { blob, filename } = await mergePdfs(files);
      triggerDownload(blob, filename);
      setStatus("done");
      setMessage("Merged PDF downloaded.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof ApiError ? e.message : "Could not merge these files.");
    }
  };

  return (
    <div className="panel">
      <h2>Merge PDF</h2>
      <p className="panel-description">
        Combine two or more PDFs into one document. Pages appear in the order you add the files.
      </p>

      <div className="field">
        <label>Files</label>
        <UploadZone multiple files={files} onFilesSelected={setFiles} />
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={status === "processing"}>
        {status === "processing" ? "Merging…" : "Merge PDFs"}
      </button>

      {message && (
        <div className={`message ${status === "error" ? "error" : "success"}`}>{message}</div>
      )}
    </div>
  );
}