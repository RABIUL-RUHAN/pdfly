"""
FR-04: Reduce PDF file size using Ghostscript.
Reports original and compressed sizes; falls back to the original file if
compression didn't actually help.

Requires Ghostscript installed and reachable:
- Linux/Mac executable name: "gs"
- Windows executable name:   "gswin64c" (or "gswin32c" on 32-bit installs)
"""
import os
import platform
import shutil
import subprocess

from .validators import ValidationError

GS_EXECUTABLE = "gswin64c" if platform.system() == "Windows" else "gs"


def _resolve_gs_executable():
    """Falls back to gswin32c on 32-bit Windows installs if the 64-bit binary isn't found."""
    if shutil.which(GS_EXECUTABLE):
        return GS_EXECUTABLE
    if platform.system() == "Windows" and shutil.which("gswin32c"):
        return "gswin32c"
    return None


def compress_pdf(input_path, output_path):
    gs_bin = _resolve_gs_executable()
    if gs_bin is None:
        raise ValidationError(
            "Compression tool (Ghostscript) is not installed on the server.", status_code=500
        )

    gs_command = [
        gs_bin,
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=/ebook",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-sOutputFile={output_path}",
        input_path,
    ]

    try:
        result = subprocess.run(gs_command, capture_output=True, timeout=60)
    except subprocess.TimeoutExpired as exc:
        raise ValidationError("Compression timed out.", status_code=500) from exc

    if result.returncode != 0 or not os.path.exists(output_path):
        raise ValidationError("Compression failed. The file may be corrupt.", status_code=500)

    original_size = os.path.getsize(input_path)
    compressed_size = os.path.getsize(output_path)

    note = None
    if compressed_size >= original_size:
        # Compression didn't help — serve the original file instead.
        os.remove(output_path)
        shutil.copyfile(input_path, output_path)
        compressed_size = original_size
        note = "Compression did not reduce file size; original file returned."

    return output_path, original_size, compressed_size, note