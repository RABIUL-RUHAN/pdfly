import { useState } from "react";
import UploadZone from "../UploadZone";
import { splitPdf, triggerDownload, ApiError } from "../../api";

export default function SplitPanel() {
  const [files, setFiles] = useState([]);
  const [range, setRange] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (files.length === 0) {
      setStatus("error");
      setMessage("Select a PDF file first.");
      return;
    }
    if (!range.trim()) {
      setStatus("error");
      setMessage("Enter a page range, e.g. 2-5 or 1,3,7.");
      return;
    }
    setStatus("processing");
    setMessage("");
    try {
      const { blob, filename } = await splitPdf(files[0], range.trim());
      triggerDownload(blob, filename);
      setStatus("done");
      setMessage("Split PDF downloaded.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof ApiError ? e.message : "Could not split this file.");
    }
  };

  return (
    <div className="panel">
      <h2>Split PDF</h2>
      <p className="panel-description">
        Extract a page range or a specific list of pages into a new document.
      </p>

      <div className="field">
        <label>File</label>
        <UploadZone multiple={false} files={files} onFilesSelected={setFiles} />
      </div>

      <div className="field">
        <label htmlFor="split-range">Page range</label>
        <input
          id="split-range"
          type="text"
          placeholder="e.g. 2-5 or 1,3,7"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        />
        <div className="field-hint">Use a dash for a range, commas for individual pages.</div>
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={status === "processing"}>
        {status === "processing" ? "Splitting…" : "Split PDF"}
      </button>

      {message && (
        <div className={`message ${status === "error" ? "error" : "success"}`}>{message}</div>
      )}
    </div>
  );
}