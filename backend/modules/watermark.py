"""FR-07: Stamp a diagonal text watermark across every page of a PDF."""
import io

from pypdf import PdfReader, PdfWriter
from pypdf.errors import PdfReadError
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color

from .validators import ValidationError

MAX_WATERMARK_LENGTH = 200


def _make_watermark_page(width, height, text):
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(width, height))
    c.saveState()
    c.setFillColor(Color(0.55, 0.55, 0.55, alpha=0.35))
    font_size = max(18, int(min(width, height) / 14))
    c.setFont("Helvetica-Bold", font_size)
    c.translate(width / 2, height / 2)
    c.rotate(45)
    c.drawCentredString(0, 0, text)
    c.restoreState()
    c.save()
    buf.seek(0)
    return PdfReader(buf).pages[0]


def add_watermark(input_path, text, output_path):
    if not text or not text.strip():
        raise ValidationError("Watermark text cannot be empty.")
    text = text.strip()
    if len(text) > MAX_WATERMARK_LENGTH:
        raise ValidationError(f"Watermark text must be {MAX_WATERMARK_LENGTH} characters or fewer.")

    try:
        reader = PdfReader(input_path)
    except (PdfReadError, Exception) as exc:
        raise ValidationError("The uploaded file is not a valid PDF.") from exc

    writer = PdfWriter()
    for page in reader.pages:
        try:
            width = float(page.mediabox.width)
            height = float(page.mediabox.height)
        except Exception as exc:
            raise ValidationError("Could not read page dimensions.") from exc

        wm_page = _make_watermark_page(width, height, text)
        page.merge_page(wm_page)
        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)

    return output_path