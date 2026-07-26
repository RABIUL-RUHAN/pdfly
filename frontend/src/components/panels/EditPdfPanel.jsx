import { useState, useRef } from "react";
import { inspectPdf, applyPdfEdits, triggerDownload, ApiError } from "../../api";

function PageCard({ page, textOverrides, onTextChange, onDelete, onRotate, onMoveUp, onMoveDown, isFirst, isLast }) {
  const imgRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  const handleImgLoad = () => {
    if (imgRef.current) setScale(imgRef.current.clientWidth / page.width);
  };

  const startEdit = (line) => {
    setEditingId(line.id);
    setDraft(textOverrides[line.id] ?? line.text);
  };

  const commitEdit = (line) => {
    onTextChange(line.id, draft, page.index, line);
    setEditingId(null);
  };

  return (
    <div className="edit-page-card">
      <div className="edit-page-toolbar">
        <span>Page {page.index + 1}</span>
        <button onClick={() => onMoveUp(page.index)} disabled={isFirst} title="Move up">↑</button>
        <button onClick={() => onMoveDown(page.index)} disabled={isLast} title="Move down">↓</button>
        <button onClick={() => onRotate(page.index)} title="Rotate 90°">⟳</button>
        <button onClick={() => onDelete(page.index)} title="Delete page" className="danger">✕</button>
      </div>
      <div className="edit-page-canvas" style={{ transform: `rotate(${page.rotation}deg)` }}>
        <img ref={imgRef} src={page.thumbnail} alt={`Page ${page.index + 1}`} onLoad={handleImgLoad} draggable={false} />
        {page.text_lines.map((line) => {
          const [x0, y0, x1, y1] = line.bbox;
          const style = {
            position: "absolute",
            left: x0 * scale,
            top: y0 * scale,
            width: (x1 - x0) * scale,
            height: (y1 - y0) * scale,
            fontSize: Math.max(8, line.font_size * scale),
          };
          const isEditing = editingId === line.id;
          const displayText = textOverrides[line.id] ?? line.text;
          return isEditing ? (
            <input
              key={line.id}
              autoFocus
              className="edit-text-input"
              style={style}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commitEdit(line)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit(line);
                if (e.key === "Escape") setEditingId(null);
              }}
            />
          ) : (
            <div key={line.id} className="edit-text-overlay" style={style} title="Click to edit this line" onClick={() => startEdit(line)}>
              {displayText}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EditPdfPanel() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [order, setOrder] = useState([]);
  const [textOverrides, setTextOverrides] = useState({});
  const [changedLines, setChangedLines] = useState({});
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleFileInput = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setStatus("loading");
    setMessage("");
    try {
      const data = await inspectPdf(f);
      setPages(data.pages.map((p) => ({ ...p, rotation: 0 })));
      setOrder(data.pages.map((p) => p.index));
      setTextOverrides({});
      setChangedLines({});
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof ApiError ? err.message : "Could not read this PDF.");
    }
  };

  const handleTextChange = (lineId, newText, pageIndex, line) => {
    setTextOverrides((prev) => ({ ...prev, [lineId]: newText }));
    setChangedLines((prev) => ({
      ...prev,
      [lineId]: { page: pageIndex, bbox: line.bbox, new_text: newText, font_size: line.font_size, color: line.color },
    }));
  };

  const handleDelete = (pageIndex) => setOrder((prev) => prev.filter((i) => i !== pageIndex));

  const handleRotate = (pageIndex) =>
    setPages((prev) => prev.map((p) => (p.index === pageIndex ? { ...p, rotation: (p.rotation + 90) % 360 } : p)));

  const move = (pageIndex, direction) => {
    setOrder((prev) => {
      const pos = prev.indexOf(pageIndex);
      const swapWith = pos + direction;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[pos], next[swapWith]] = [next[swapWith], next[pos]];
      return next;
    });
  };

  const handleSave = async () => {
    if (order.length === 0) {
      setStatus("error");
      setMessage("At least one page must remain.");
      return;
    }
    setStatus("saving");
    setMessage("");
    const rotations = {};
    pages.forEach((p) => {
      if (p.rotation !== 0) rotations[p.index] = p.rotation;
    });
    const edits = { page_order: order, rotations, text_edits: Object.values(changedLines) };
    try {
      const { blob, filename } = await applyPdfEdits(file, edits);
      triggerDownload(blob, filename);
      setStatus("done");
      setMessage("Edited PDF downloaded.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof ApiError ? err.message : "Could not apply your edits.");
    }
  };

  return (
    <div className="panel">
      <h2>Edit PDF</h2>
      <p className="panel-description">
        Delete, reorder, and rotate pages. Click any line of text to edit it in place
        (best-effort — works well for simple text; complex layouts may shift slightly).
      </p>

      {!file && (
        <div className="field">
          <label>PDF File</label>
          <input type="file" accept=".pdf,application/pdf" onChange={handleFileInput} />
        </div>
      )}

      {status === "loading" && <p>Reading PDF…</p>}

      {status !== "loading" && pages.length > 0 && (
        <>
          <div className="edit-page-grid">
            {order.map((pageIndex, i) => {
              const page = pages.find((p) => p.index === pageIndex);
              if (!page) return null;
              return (
                <PageCard
                  key={pageIndex}
                  page={page}
                  textOverrides={textOverrides}
                  onTextChange={handleTextChange}
                  onDelete={handleDelete}
                  onRotate={handleRotate}
                  onMoveUp={() => move(pageIndex, -1)}
                  onMoveDown={() => move(pageIndex, 1)}
                  isFirst={i === 0}
                  isLast={i === order.length - 1}
                />
              );
            })}
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save & Download"}
          </button>
        </>
      )}

      {message && <div className={`message ${status === "error" ? "error" : "success"}`}>{message}</div>}
    </div>
  );
}