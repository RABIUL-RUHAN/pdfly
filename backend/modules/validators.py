"""
Shared upload validation for every PDFly endpoint.
Implements FR-01: extension check, MIME check, size check, filename sanitization,
UUID prefixing to avoid collisions.
"""
import os
import re
import uuid

ALLOWED_EXTENSION = ".pdf"
ALLOWED_MIME_TYPES = ("application/pdf",)
MAX_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


class ValidationError(Exception):
    """Raised whenever an uploaded file fails validation. Carries the HTTP status to return."""

    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def sanitize_filename(filename):
    """Strips path separators and any character outside a safe whitelist."""
    filename = os.path.basename(filename or "")
    filename = filename.replace("..", "")
    filename = re.sub(r'[^A-Za-z0-9._-]', "_", filename)
    if not filename:
        filename = "file.pdf"
    return filename


def validate_pdf_file(file_storage):
    """
    Validates a single uploaded file object (werkzeug FileStorage).
    Raises ValidationError with an appropriate status code on any failure.
    Returns the file size in bytes on success.
    """
    if file_storage is None or file_storage.filename == "":
        raise ValidationError("No file was provided.")

    filename = file_storage.filename
    if not filename.lower().endswith(ALLOWED_EXTENSION):
        raise ValidationError("Only PDF files are accepted.")

    if file_storage.mimetype not in ALLOWED_MIME_TYPES:
        raise ValidationError("The file's content type is not a valid PDF.")

    file_storage.stream.seek(0, os.SEEK_END)
    size = file_storage.stream.tell()
    file_storage.stream.seek(0)

    if size == 0:
        raise ValidationError("The uploaded file is empty.")
    if size > MAX_SIZE_BYTES:
        raise ValidationError("File exceeds the 25 MB limit.", status_code=413)

    return size


def save_upload(file_storage, upload_dir):
    """
    Validates, sanitizes, prefixes with a UUID, and saves the file to upload_dir.
    Returns the full saved path.
    """
    validate_pdf_file(file_storage)
    safe_name = sanitize_filename(file_storage.filename)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    path = os.path.join(upload_dir, unique_name)
    file_storage.save(path)

    # Defense in depth: confirm the resolved path is still inside upload_dir.
    if os.path.commonpath([os.path.abspath(path), os.path.abspath(upload_dir)]) != os.path.abspath(upload_dir):
        os.remove(path)
        raise ValidationError("Invalid filename.")

    return path


def validate_pdf_readable(path):
    """Confirms the saved file can actually be opened as a PDF (catches corrupt uploads early)."""
    from pypdf import PdfReader
    from pypdf.errors import PdfReadError
    try:
        reader = PdfReader(path)
        _ = len(reader.pages)
        return reader
    except (PdfReadError, Exception) as exc:
        raise ValidationError("The file is not a valid or readable PDF.") from exc

ALLOWED_WORD_EXTENSIONS = (".doc", ".docx")
ALLOWED_WORD_MIME_TYPES = (
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
)


def validate_word_file(file_storage):
    """Same shape as validate_pdf_file, but for .doc/.docx uploads."""
    if file_storage is None or file_storage.filename == "":
        raise ValidationError("No file was provided.")

    filename = file_storage.filename
    if not filename.lower().endswith(ALLOWED_WORD_EXTENSIONS):
        raise ValidationError("Only .doc or .docx files are accepted.")

    if file_storage.mimetype not in ALLOWED_WORD_MIME_TYPES:
        raise ValidationError("The file's content type is not a valid Word document.")

    file_storage.stream.seek(0, os.SEEK_END)
    size = file_storage.stream.tell()
    file_storage.stream.seek(0)

    if size == 0:
        raise ValidationError("The uploaded file is empty.")
    if size > MAX_SIZE_BYTES:
        raise ValidationError("File exceeds the 25 MB limit.", status_code=413)

    return size


def save_word_upload(file_storage, upload_dir):
    """Validates, sanitizes, and saves a .doc/.docx upload. Returns the saved path."""
    validate_word_file(file_storage)
    safe_name = sanitize_filename(file_storage.filename)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    path = os.path.join(upload_dir, unique_name)
    file_storage.save(path)

    if os.path.commonpath([os.path.abspath(path), os.path.abspath(upload_dir)]) != os.path.abspath(upload_dir):
        os.remove(path)
        raise ValidationError("Invalid filename.")

    return path

ALLOWED_IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp")
ALLOWED_IMAGE_MIME_TYPES = (
    "image/png",
    "image/jpeg",
    "image/webp",
)


def validate_image_file(file_storage):
    if file_storage is None or file_storage.filename == "":
        raise ValidationError("No file was provided.")

    filename = file_storage.filename
    if not filename.lower().endswith(ALLOWED_IMAGE_EXTENSIONS):
        raise ValidationError("Only PNG, JPG, or WEBP images are accepted.")

    if file_storage.mimetype not in ALLOWED_IMAGE_MIME_TYPES:
        raise ValidationError("The file's content type is not a valid image.")

    file_storage.stream.seek(0, os.SEEK_END)
    size = file_storage.stream.tell()
    file_storage.stream.seek(0)

    if size == 0:
        raise ValidationError("The uploaded file is empty.")
    if size > MAX_SIZE_BYTES:
        raise ValidationError("File exceeds the 25 MB limit.", status_code=413)

    return size


def save_image_upload(file_storage, upload_dir):
    validate_image_file(file_storage)
    safe_name = sanitize_filename(file_storage.filename)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    path = os.path.join(upload_dir, unique_name)
    file_storage.save(path)

    if os.path.commonpath([os.path.abspath(path), os.path.abspath(upload_dir)]) != os.path.abspath(upload_dir):
        os.remove(path)
        raise ValidationError("Invalid filename.")

    return path