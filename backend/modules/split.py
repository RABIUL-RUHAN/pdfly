"""FR-03: Extract a page range or page list from a PDF."""
import re

from pypdf import PdfReader, PdfWriter
from pypdf.errors import PdfReadError

from .validators import ValidationError

RANGE_TOKEN_RE = re.compile(r"^\d+(-\d+)?$")


def parse_page_range(range_str, page_count):
    """
    Parses '2-5' or '1,3,7' or a mix like '1,3-5,9' into a 0-indexed page list.
    Raises ValidationError on malformed input or out-of-range pages.
    """
    if not range_str or not range_str.strip():
        raise ValidationError("No page range was provided.")

    parts = [p.strip() for p in range_str.replace(" ", "").split(",") if p.strip()]
    if not parts:
        raise ValidationError("No page range was provided.")

    pages = []
    for part in parts:
        if not RANGE_TOKEN_RE.match(part):
            raise ValidationError(f"'{part}' is not a valid page or range.")
        if "-" in part:
            start_str, end_str = part.split("-")
            start, end = int(start_str), int(end_str)
            if start > end:
                raise ValidationError(f"Invalid range '{part}': start is after end.")
            pages.extend(range(start, end + 1))
        else:
            pages.append(int(part))

    for p in pages:
        if p < 1 or p > page_count:
            raise ValidationError(
                f"Page {p} is out of range. This document has {page_count} pages."
            )

    return [p - 1 for p in pages]  # convert to 0-indexed for pypdf


def split_pdf(input_path, range_str, output_path):
    try:
        reader = PdfReader(input_path)
    except (PdfReadError, Exception) as exc:
        raise ValidationError("The uploaded file is not a valid PDF.") from exc

    page_count = len(reader.pages)
    indices = parse_page_range(range_str, page_count)

    writer = PdfWriter()
    for idx in indices:
        writer.add_page(reader.pages[idx])

    with open(output_path, "wb") as f:
        writer.write(f)

    return output_path