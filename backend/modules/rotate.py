"""FR-08: Rotate all pages of a PDF by 90, 180, or 270 degrees clockwise."""
from pypdf import PdfReader, PdfWriter
from pypdf.errors import PdfReadError

from .validators import ValidationError

VALID_ANGLES = {90, 180, 270}


def rotate_pdf(input_path, angle, output_path):
    if angle not in VALID_ANGLES:
        raise ValidationError("Angle must be 90, 180, or 270 degrees.")

    try:
        reader = PdfReader(input_path)
    except (PdfReadError, Exception) as exc:
        raise ValidationError("The uploaded file is not a valid PDF.") from exc

    writer = PdfWriter()
    for page in reader.pages:
        page.rotate(angle)
        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)

    return output_path