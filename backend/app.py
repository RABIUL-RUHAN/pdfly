"""
PDFly backend — Flask REST API implementing FR-01 through FR-10 of the SRS.
Run locally with: python app.py
Production: gunicorn app:app  (Linux only — Render's build server, not your Windows machine)
"""


import os
import uuid
import logging
import json

from flask import Flask, request, jsonify, send_file, after_this_request
from flask_cors import CORS


from modules.validators import save_upload, save_word_upload,save_image_upload, ValidationError
from modules.imagetopdf import images_to_pdf

from modules.wordtopdf import word_to_pdf
from modules.merge import merge_pdfs
from modules.split import split_pdf
from modules.rotate import rotate_pdf
from modules.watermark import add_watermark
from modules.convert import pdf_to_images
from modules.compress import compress_pdf
from modules.toword import pdf_to_word
from cleanup import start_cleanup_scheduler
from modules.editpdf import inspect_pdf, apply_edits

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pdfly.app")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# CORS: list every origin your frontend will actually be served from.
# Add your Vercel URL here once deployed (see the build guide, section 3.2).
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # "https://your-frontend.vercel.app",
]

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 30 * 1024 * 1024  # hard cap slightly above the 25MB app limit
CORS(
    app,
    origins=ALLOWED_ORIGINS,
    expose_headers=["Content-Disposition", "X-Warning", "X-Notice", "X-Original-Size", "X-Compressed-Size"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def error_response(message, status=400):
    return jsonify({"error": True, "message": message}), status


def cleanup_paths(*paths):
    for p in paths:
        try:
            if p and os.path.exists(p):
                os.remove(p)
        except OSError as exc:
            logger.warning("Cleanup failed for %s: %s", p, exc)


def new_output_path(suffix, ext="pdf"):
    return os.path.join(OUTPUT_DIR, f"{uuid.uuid4().hex}_{suffix}.{ext}")


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------
@app.errorhandler(ValidationError)
def handle_validation_error(e):
    return error_response(e.message, e.status_code)


@app.errorhandler(413)
def handle_too_large(e):
    return error_response("File exceeds the 25 MB limit.", 413)


@app.errorhandler(404)
def handle_not_found(e):
    return error_response("Endpoint not found.", 404)


@app.errorhandler(500)
def handle_server_error(e):
    logger.exception("Unhandled server error")
    return error_response("An internal error occurred. Please try again.", 500)


# ---------------------------------------------------------------------------
# FR-02: Merge
# ---------------------------------------------------------------------------
@app.route("/merge", methods=["POST"])
def merge_route():
    files = request.files.getlist("files")
    if len(files) < 2:
        return error_response("At least two PDF files are required.")

    saved_paths = []
    try:
        for f in files:
            saved_paths.append(save_upload(f, UPLOAD_DIR))

        output_path = new_output_path("merged")
        merge_pdfs(saved_paths, output_path)

        @after_this_request
        def _cleanup(response):
            cleanup_paths(*saved_paths, output_path)
            return response

        return send_file(output_path, as_attachment=True, download_name="merged_output.pdf")

    except ValidationError as e:
        cleanup_paths(*saved_paths)
        return error_response(e.message, e.status_code)
    except Exception:
        cleanup_paths(*saved_paths)
        logger.exception("Merge failed")
        return error_response("Could not merge the provided files.", 400)


# ---------------------------------------------------------------------------
# FR-03: Split
# ---------------------------------------------------------------------------
@app.route("/split", methods=["POST"])
def split_route():
    file = request.files.get("file")
    range_str = request.form.get("range", "")
    saved_path = None
    try:
        saved_path = save_upload(file, UPLOAD_DIR)
        output_path = new_output_path("split")
        split_pdf(saved_path, range_str, output_path)

        @after_this_request
        def _cleanup(response):
            cleanup_paths(saved_path, output_path)
            return response

        return send_file(output_path, as_attachment=True, download_name="split_output.pdf")

    except ValidationError as e:
        cleanup_paths(saved_path)
        return error_response(e.message, e.status_code)
    except Exception:
        cleanup_paths(saved_path)
        logger.exception("Split failed")
        return error_response("Could not split the file.", 400)


# ---------------------------------------------------------------------------
# FR-08: Rotate
# ---------------------------------------------------------------------------
@app.route("/rotate", methods=["POST"])
def rotate_route():
    file = request.files.get("file")
    angle_raw = request.form.get("angle", "")
    try:
        angle = int(angle_raw)
    except (TypeError, ValueError):
        return error_response("Invalid angle value.")

    saved_path = None
    try:
        saved_path = save_upload(file, UPLOAD_DIR)
        output_path = new_output_path("rotated")
        rotate_pdf(saved_path, angle, output_path)

        @after_this_request
        def _cleanup(response):
            cleanup_paths(saved_path, output_path)
            return response

        return send_file(output_path, as_attachment=True, download_name="rotated_output.pdf")

    except ValidationError as e:
        cleanup_paths(saved_path)
        return error_response(e.message, e.status_code)
    except Exception:
        cleanup_paths(saved_path)
        logger.exception("Rotate failed")
        return error_response("Could not rotate the file.", 400)


# ---------------------------------------------------------------------------
# FR-07: Watermark
# ---------------------------------------------------------------------------
@app.route("/watermark", methods=["POST"])
def watermark_route():
    file = request.files.get("file")
    text = request.form.get("text", "")
    saved_path = None
    try:
        saved_path = save_upload(file, UPLOAD_DIR)
        output_path = new_output_path("watermarked")
        add_watermark(saved_path, text, output_path)

        @after_this_request
        def _cleanup(response):
            cleanup_paths(saved_path, output_path)
            return response

        return send_file(output_path, as_attachment=True, download_name="watermarked_output.pdf")

    except ValidationError as e:
        cleanup_paths(saved_path)
        return error_response(e.message, e.status_code)
    except Exception:
        cleanup_paths(saved_path)
        logger.exception("Watermark failed")
        return error_response("Could not watermark the file.", 400)


# ---------------------------------------------------------------------------
# FR-05: PDF to Image
# ---------------------------------------------------------------------------
@app.route("/convert", methods=["POST"])
def convert_route():
    file = request.files.get("file")
    fmt = request.form.get("format", "PNG")
    saved_path = None
    try:
        saved_path = save_upload(file, UPLOAD_DIR)
        base_name = uuid.uuid4().hex
        result_path, is_zip = pdf_to_images(saved_path, fmt, OUTPUT_DIR, base_name)

        @after_this_request
        def _cleanup(response):
            cleanup_paths(saved_path, result_path)
            return response

        download_name = "pages.zip" if is_zip else os.path.basename(result_path)
        return send_file(result_path, as_attachment=True, download_name=download_name)

    except ValidationError as e:
        cleanup_paths(saved_path)
        return error_response(e.message, e.status_code)
    except Exception:
        cleanup_paths(saved_path)
        logger.exception("Convert failed")
        return error_response("Could not convert the file. Check that the PDF is valid.", 400)

# ---------------------------------------------------------------------------
# FR-12: Image to PDF
# ---------------------------------------------------------------------------
@app.route("/imagetopdf", methods=["POST"])
def imagetopdf_route():
    files = request.files.getlist("files")
    if len(files) < 1:
        return error_response("At least one image is required.")

    saved_paths = []
    try:
        for f in files:
            saved_paths.append(save_image_upload(f, UPLOAD_DIR))

        output_path = new_output_path("images")
        images_to_pdf(saved_paths, output_path)

        @after_this_request
        def _cleanup(response):
            cleanup_paths(*saved_paths, output_path)
            return response

        return send_file(output_path, as_attachment=True, download_name="converted.pdf")

    except ValidationError as e:
        cleanup_paths(*saved_paths)
        return error_response(e.message, e.status_code)
    except Exception:
        cleanup_paths(*saved_paths)
        logger.exception("Image to PDF failed")
        return error_response("Could not convert the images to PDF.", 400)
# ---------------------------------------------------------------------------
# FR-04: Compress
# ---------------------------------------------------------------------------
@app.route("/compress", methods=["POST"])
def compress_route():
    file = request.files.get("file")
    saved_path = None
    try:
        saved_path = save_upload(file, UPLOAD_DIR)
        output_path = new_output_path("compressed")
        result_path, orig_size, comp_size, note = compress_pdf(saved_path, output_path)

        @after_this_request
        def _cleanup(response):
            cleanup_paths(saved_path, result_path)
            return response

        response = send_file(result_path, as_attachment=True, download_name="compressed_output.pdf")
        response.headers["X-Original-Size"] = str(orig_size)
        response.headers["X-Compressed-Size"] = str(comp_size)
        response.headers["Access-Control-Expose-Headers"] = (
            "X-Original-Size, X-Compressed-Size, X-Notice, X-Warning"
        )
        if note:
            response.headers["X-Notice"] = note
        return response

    except ValidationError as e:
        cleanup_paths(saved_path)
        return error_response(e.message, e.status_code)
    except Exception:
        cleanup_paths(saved_path)
        logger.exception("Compress failed")
        return error_response("Compression failed.", 500)


# ---------------------------------------------------------------------------
# FR-06: PDF to Word
# ---------------------------------------------------------------------------
@app.route("/toword", methods=["POST"])
def toword_route():
    file = request.files.get("file")
    saved_path = None
    try:
        saved_path = save_upload(file, UPLOAD_DIR)
        output_path = new_output_path("converted", ext="docx")
        result_path, warning = pdf_to_word(saved_path, output_path)

        @after_this_request
        def _cleanup(response):
            cleanup_paths(saved_path, result_path)
            return response

        response = send_file(
            result_path,
            as_attachment=True,
            download_name="converted.docx",
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        response.headers["Access-Control-Expose-Headers"] = "X-Warning"
        if warning:
            response.headers["X-Warning"] = warning
        return response

    except ValidationError as e:
        cleanup_paths(saved_path)
        return error_response(e.message, e.status_code)
    except Exception:
        cleanup_paths(saved_path)
        logger.exception("PDF to Word failed")
        return error_response("Could not convert PDF to Word.", 500)


# ---------------------------------------------------------------------------
# FR-11: Word to PDF
# ---------------------------------------------------------------------------
@app.route("/wordtopdf", methods=["POST"])
def wordtopdf_route():
    file = request.files.get("file")
    saved_path = None
    try:
        saved_path = save_word_upload(file, UPLOAD_DIR)
        output_path = new_output_path("converted", ext="pdf")
        result_path = word_to_pdf(saved_path, output_path)

        @after_this_request
        def _cleanup(response):
            cleanup_paths(saved_path, result_path)
            return response

        return send_file(
            result_path,
            as_attachment=True,
            download_name="converted.pdf",
            mimetype="application/pdf",
        )

    except ValidationError as e:
        cleanup_paths(saved_path)
        return error_response(e.message, e.status_code)
    except Exception:
        cleanup_paths(saved_path)
        logger.exception("Word to PDF failed")
        return error_response("Could not convert Word document to PDF.", 500)

# ---------------------------------------------------------------------------
# FR-13: Edit PDF (page ops + best-effort text editing)
# ---------------------------------------------------------------------------
@app.route("/edit/inspect", methods=["POST"])
def edit_inspect_route():
    file = request.files.get("file")
    saved_path = None
    try:
        saved_path = save_upload(file, UPLOAD_DIR)
        structure = inspect_pdf(saved_path)
        return jsonify(structure)
    except ValidationError as e:
        return error_response(e.message, e.status_code)
    except Exception:
        logger.exception("PDF inspect failed")
        return error_response("Could not read this PDF.", 400)
    finally:
        cleanup_paths(saved_path)


@app.route("/edit/apply", methods=["POST"])
def edit_apply_route():
    file = request.files.get("file")
    edits_raw = request.form.get("edits")
    saved_path = None
    try:
        saved_path = save_upload(file, UPLOAD_DIR)
        try:
            edits = json.loads(edits_raw) if edits_raw else {}
        except (TypeError, ValueError):
            raise ValidationError("Invalid edit instructions.")

        output_path = new_output_path("edited")
        apply_edits(saved_path, edits, output_path)

        @after_this_request
        def _cleanup(response):
            cleanup_paths(saved_path, output_path)
            return response

        return send_file(output_path, as_attachment=True, download_name="edited.pdf")

    except ValidationError as e:
        cleanup_paths(saved_path)
        return error_response(e.message, e.status_code)
    except Exception:
        cleanup_paths(saved_path)
        logger.exception("Apply edits failed")
        return error_response("Could not apply your edits to this PDF.", 400)

# ---------------------------------------------------------------------------
# Health check (useful for confirming Render deployment is alive)
# ---------------------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# ---------------------------------------------------------------------------
# Background cleanup job (FR-10)
# ---------------------------------------------------------------------------
start_cleanup_scheduler(UPLOAD_DIR, OUTPUT_DIR)


if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False)