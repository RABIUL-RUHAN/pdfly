"""FR-02: Merge two or more PDF files into one, preserving submission order."""
from pypdf import PdfReader, PdfWriter
from pypdf.errors import PdfReadError

from .validators import ValidationError


def merge_pdfs(input_paths, output_path):
    if len(input_paths) < 2:
        raise ValidationError("At least two PDF files are required to merge.")

    writer = PdfWriter()
    for path in input_paths:
        try:
            reader = PdfReader(path)
            for page in reader.pages:
                writer.add_page(page)
        except (PdfReadError, Exception) as exc:
            raise ValidationError(f"Could not read one of the uploaded files: {exc}") from exc

    with open(output_path, "wb") as f:
        writer.write(f)

    return output_path