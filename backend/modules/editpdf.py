"""
FR-13: Edit PDF -- delete/reorder/rotate pages, and best-effort in-place text editing
(redact existing text, re-insert replacement text at the same position).

Two-step flow:
  1. inspect_pdf() -> extract page thumbnails + editable text lines, sent to the frontend
  2. apply_edits()  -> apply page order/rotation/text changes, produce the final PDF

Requires PyMuPDF (`pip install PyMuPDF`), imported as `fitz`. No external binaries needed.
"""
import base64

import fitz  # PyMuPDF

from .validators import ValidationError

THUMBNAIL_ZOOM = 1.5     # render scale for the page preview images sent to the frontend
DEFAULT_FONT = "helv"    # PyMuPDF's built-in Helvetica alias, used for re-inserted text


def inspect_pdf(input_path):
    """
    Returns a JSON-serializable structure: for every page, a preview image (base64 PNG)
    plus every editable line of text with its position, font size, and color, so the
    frontend can render a click-to-edit overlay on top of the preview image.
    """
    try:
        doc = fitz.open(input_path)
    except Exception as exc:
        raise ValidationError("The uploaded file is not a valid PDF.") from exc

    pages = []
    for page_index in range(len(doc)):
        page = doc[page_index]
        pix = page.get_pixmap(matrix=fitz.Matrix(THUMBNAIL_ZOOM, THUMBNAIL_ZOOM))
        thumbnail_b64 = base64.b64encode(pix.tobytes("png")).decode("ascii")

        text_lines = []
        raw = page.get_text("dict")
        for block_i, block in enumerate(raw.get("blocks", [])):
            if block.get("type") != 0:  # 0 = text block, 1 = image block
                continue
            for line_i, line in enumerate(block.get("lines", [])):
                spans = line.get("spans", [])
                if not spans:
                    continue
                text = "".join(s["text"] for s in spans).strip()
                if not text:
                    continue
                x0 = min(s["bbox"][0] for s in spans)
                y0 = min(s["bbox"][1] for s in spans)
                x1 = max(s["bbox"][2] for s in spans)
                y1 = max(s["bbox"][3] for s in spans)
                first = spans[0]
                text_lines.append({
                    "id": f"{page_index}:{block_i}:{line_i}",
                    "bbox": [round(x0, 1), round(y0, 1), round(x1, 1), round(y1, 1)],
                    "text": text,
                    "font_size": round(first.get("size", 11), 1),
                    "color": _int_to_rgb(first.get("color", 0)),
                })

        pages.append({
            "index": page_index,
            "width": page.rect.width,
            "height": page.rect.height,
            "thumbnail": f"data:image/png;base64,{thumbnail_b64}",
            "text_lines": text_lines,
        })

    doc.close()
    return {"page_count": len(pages), "pages": pages}

def _fit_text_into_rect(page, rect, text, font_size, color, fontname=DEFAULT_FONT, min_font_size=6):
    """
    Inserts `text` into `rect`, auto-shrinking the font size if it doesn't fit.
    If it still doesn't fit at the minimum size, grows the box to the right and
    downward (capped at the page edge) and tries once more.
    Returns True if the text was actually drawn, False if it still didn't fit.
    """
    page_rect = page.rect
    working_rect = fitz.Rect(rect)

    size = font_size
    while size >= min_font_size:
        leftover = page.insert_textbox(
            working_rect, text, fontsize=size, fontname=fontname, color=color, align=0,
        )
        if leftover >= 0:
            return True
        size -= 0.5

    # Still doesn't fit even at the minimum size -- grow the box outward.
    working_rect.x1 = min(page_rect.x1 - 4, working_rect.x1 + 150)
    working_rect.y1 = min(page_rect.y1 - 4, working_rect.y1 + 40)
    leftover = page.insert_textbox(
        working_rect, text, fontsize=min_font_size, fontname=fontname, color=color, align=0,
    )
    return leftover >= 0


def apply_edits(input_path, edits, output_path):
    try:
        doc = fitz.open(input_path)
    except Exception as exc:
        raise ValidationError("The uploaded file is not a valid PDF.") from exc

    page_order = edits.get("page_order")
    rotations = edits.get("rotations", {}) or {}
    text_edits = edits.get("text_edits", []) or []

    if not page_order:
        raise ValidationError("No pages were selected for the output PDF.")
    if any(p < 0 or p >= len(doc) for p in page_order):
        raise ValidationError("Page selection refers to a page that doesn't exist.")

    PAD = 1.5  # points of breathing room around the tight bbox, on every side

    for edit in text_edits:
        page_idx = edit.get("page")
        if page_idx is None or page_idx < 0 or page_idx >= len(doc):
            continue
        page = doc[page_idx]
        tight = fitz.Rect(edit["bbox"])
        padded = fitz.Rect(tight.x0 - PAD, tight.y0 - PAD, tight.x1 + PAD, tight.y1 + PAD)

        page.add_redact_annot(padded, fill=(1, 1, 1))
        page.apply_redactions()

        color = tuple(c / 255 for c in edit.get("color", [0, 0, 0]))
        _fit_text_into_rect(page, padded, edit.get("new_text", ""), edit.get("font_size", 11), color)

    for page_idx_str, angle in rotations.items():
        page_idx = int(page_idx_str)
        if 0 <= page_idx < len(doc) and angle in (0, 90, 180, 270):
            doc[page_idx].set_rotation(angle)

    doc.select(page_order)
    doc.save(output_path)
    doc.close()
    return output_path

def _int_to_rgb(color_int):
    r = (color_int >> 16) & 255
    g = (color_int >> 8) & 255
    b = color_int & 255
    return [r, g, b]