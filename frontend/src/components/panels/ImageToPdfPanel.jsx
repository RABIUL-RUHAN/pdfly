import { useState } from "react";
import UploadZone from "../UploadZone";
import { imagesToPdf, triggerDownload, ApiError } from "../../api";

export default function ImageToPdfPanel() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (files.length === 0) {
      setStatus("error");
      setMessage("Select at least one image.");
      return;
    }
    setStatus("processing");
    setMessage("");
    try {
      const { blob, filename } = await imagesToPdf(files);
      triggerDownload(blob, filename);
      setStatus("done");
      setMessage("PDF downloaded.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof ApiError ? e.message : "Could not convert these files.");
    }
  };

  return (
    <div className="panel">
      <h2>Image to PDF</h2>
      <p className="panel-description">
        Convert one or more PNG/JPG/WEBP images into a single PDF, one page per image, in the
        order you add them.
      </p>

      <div className="field">
        <label>Images</label>
        <UploadZone
          multiple={true}
          files={files}
          onFilesSelected={setFiles}
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          extensions={[".png", ".jpg", ".jpeg", ".webp"]}
          label="image"
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