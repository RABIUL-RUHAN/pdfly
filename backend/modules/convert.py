"""
FR-05: Convert each page of a PDF to a raster image (PNG or JPG) at 150 DPI.
Single-page documents return one image; multi-page documents are bundled into a ZIP.

Requires Poppler (pdftoppm/pdfinfo) to be installed and reachable.
If Poppler is not on your system PATH (common on Windows), set POPPLER_PATH below.
"""
import os
import zipfile

from pdf2image import convert_from_path
from pdf2image.exceptions import PDFInfoNotInstalledError, PDFPageCountError

from .validators import ValidationError

# Windows only: uncomment and point this at the extracted Poppler "bin" folder if
# pdftoppm/pdfinfo are not on your system PATH.
# POPPLER_PATH = r"C:\poppler\Library\bin"
POPPLER_PATH = None

SUPPORTED_FORMATS = {"PNG": ("PNG", "png"), "JPG": ("JPEG", "jpg"), "JPEG": ("JPEG", "jpg")}


def pdf_to_images(input_path, fmt, output_dir, base_name):
    fmt = (fmt or "PNG").upper()
    if fmt not in SUPPORTED_FORMATS:
        raise ValidationError("Format must be PNG or JPG.")
    pil_fmt, ext = SUPPORTED_FORMATS[fmt]

    kwargs = {"dpi": 150}
    if POPPLER_PATH:
        kwargs["poppler_path"] = POPPLER_PATH

    try:
        images = convert_from_path(input_path, **kwargs)
    except PDFInfoNotInstalledError as exc:
        raise ValidationError(
            "PDF rendering tool (Poppler) is not installed on the server."
        ) from exc
    except PDFPageCountError as exc:
        raise ValidationError("The uploaded file is not a valid or readable PDF.") from exc

    if not images:
        raise ValidationError("No pages could be rendered from this PDF.")

    saved_paths = []
    for i, img in enumerate(images, start=1):
        filename = f"{base_name}_page{i}.{ext}"
        path = os.path.join(output_dir, filename)
        img.save(path, pil_fmt)
        saved_paths.append(path)

    if len(saved_paths) == 1:
        return saved_paths[0], False  # single file, not zipped

    zip_path = os.path.join(output_dir, f"{base_name}_images.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in saved_paths:
            zf.write(p, os.path.basename(p))
    for p in saved_paths:
        os.remove(p)  # individual files no longer needed once zipped

    return zip_path, True