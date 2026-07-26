"""
FR-12: Convert one or more images (PNG/JPG) into a single PDF, one image per page,
in the order they were uploaded. Pillow-only -- no external binaries required.
"""
from PIL import Image, UnidentifiedImageError

from .validators import ValidationError


def images_to_pdf(input_paths, output_path):
    """
    Converts a list of image file paths into a single multi-page PDF.
    Returns output_path on success.
    """
    if not input_paths:
        raise ValidationError("At least one image is required.")

    pages = []
    try:
        for path in input_paths:
            img = Image.open(path)
            img.load()  # force-read now, so a truncated/corrupt file fails here, not later
            if img.mode != "RGB":
                img = img.convert("RGB")  # PDF needs RGB; also drops alpha channels safely
            pages.append(img)
    except UnidentifiedImageError as exc:
        raise ValidationError("One or more files are not valid images.") from exc
    except FileNotFoundError as exc:
        raise ValidationError("An uploaded image could not be found.") from exc

    first_page, remaining_pages = pages[0], pages[1:]
    first_page.save(output_path, "PDF", save_all=True, append_images=remaining_pages)

    return output_path