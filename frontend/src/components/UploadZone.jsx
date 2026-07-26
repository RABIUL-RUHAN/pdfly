import { useRef, useState } from "react";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Drag-and-drop + click-to-browse PDF upload zone.
 * multiple: allow selecting more than one file (used by Merge).
 * files / onFilesSelected: controlled from the parent panel.
 */
export default function UploadZone({
  multiple = false,
  files = [],
  onFilesSelected,
  accept = "application/pdf,.pdf",
  extensions = [".pdf"],
  label = "PDF",
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (fileList) => {
    const incoming = Array.from(fileList).filter((f) =>
      extensions.some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    if (incoming.length === 0) return;
    onFilesSelected(multiple ? [...files, ...incoming] : [incoming[0]]);
  };

  const removeFile = (index, e) => {
    e.stopPropagation();
    onFilesSelected(files.filter((_, i) => i !== index));
  };

  return (
    <div
      className={`upload-zone ${dragging ? "dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {files.length === 0 ? (
        <p>
          Drop {multiple ? `${label}s` : `a ${label}`} here, or click to browse
          {multiple ? " (2 or more)" : ""}
        </p>
      ) : (
        <ul>
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <span>{f.name}</span>
              <span className="file-size">
                {formatBytes(f.size)}
                {multiple && (
                  <>
                    {" "}
                    <a href="#" onClick={(e) => removeFile(i, e)} style={{ color: "inherit" }}>
                      ✕
                    </a>
                  </>
                )}
              </span>
            </li>
          ))}
          {multiple && (
            <li style={{ background: "transparent", color: "var(--text-dim)", justifyContent: "center" }}>
              + click or drop to add more
            </li>
          )}
        </ul>
      )}
    </div>
  );
}