import { useState } from "react";
import UploadZone from "../UploadZone";
import { rotatePdf, triggerDownload, ApiError } from "../../api";

const ANGLES = [
  { value: 90, label: "90° clockwise" },
  { value: 180, label: "180°" },
  { value: 270, label: "270° clockwise" },
];

export default function RotatePanel() {
  const [files, setFiles] = useState([]);
  const [angle, setAngle] = useState(90);
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
      const { blob, filename } = await rotatePdf(files[0], angle);
      triggerDownload(blob, filename);
      setStatus("done");
      setMessage("Rotated PDF downloaded.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof ApiError ? e.message : "Could not rotate this file.");
    }
  };

  return (
    <div className="panel">
      <h2>Rotate PDF</h2>
      <p className="panel-description">Rotate every page of a PDF by a fixed angle.</p>

      <div className="field">
        <label>File</label>
        <UploadZone multiple={false} files={files} onFilesSelected={setFiles} />
      </div>

      <div className="field">
        <label>Rotation</label>
        <div className="angle-options">
          {ANGLES.map((a) => (
            <div
              key={a.value}
              className={`angle-option ${angle === a.value ? "selected" : ""}`}
              onClick={() => setAngle(a.value)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setAngle(a.value)}
            >
              {a.label}
            </div>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={status === "processing"}>
        {status === "processing" ? "Rotating…" : "Rotate PDF"}
      </button>

      {message && (
        <div className={`message ${status === "error" ? "error" : "success"}`}>{message}</div>
      )}
    </div>
  );
}