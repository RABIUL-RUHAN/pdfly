"""
FR-11: Convert a Word document (.doc/.docx) to PDF using LibreOffice's
headless conversion (`soffice --convert-to pdf`). Mirror of the Word-import
side of the toword.py pipeline, just running in the opposite direction.
"""
import shutil
import subprocess
import tempfile
from pathlib import Path

from .validators import ValidationError


def word_to_pdf(input_path, output_path):
    """
    Converts a .doc/.docx file at input_path into a PDF at output_path.
    Returns output_path on success.
    """
    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        try:
            result = subprocess.run(
                [
                    "soffice", "--headless", "--norestore",
                    "--convert-to", "pdf",
                    "--outdir", str(tmp_dir),
                    input_path,
                ],
                check=True,
                capture_output=True,
                text=True,
                timeout=180,
            )
        except FileNotFoundError as exc:
            raise ValidationError("LibreOffice (soffice) is not installed.") from exc
        except subprocess.CalledProcessError as exc:
            raise ValidationError(f"Word to PDF conversion failed: {exc.stderr}") from exc
        except subprocess.TimeoutExpired as exc:
            raise ValidationError("Word to PDF conversion timed out.") from exc

        produced = tmp_dir / (Path(input_path).stem + ".pdf")
        if not produced.exists():
            raise ValidationError(f"Conversion did not produce output: {result.stdout}")

        shutil.copyfile(produced, output_path)

    return output_path