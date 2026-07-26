# PDFly backend — includes Poppler, Ghostscript, LibreOffice, Tesseract
FROM python:3.11-slim

# System dependencies required by convert.py, compress.py, wordtopdf.py, toword.py
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    ghostscript \
    libreoffice \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p uploads outputs

# Render injects $PORT at runtime; default to 10000 for local docker run
ENV PORT=10000
EXPOSE 10000

CMD gunicorn app:app --bind 0.0.0.0:${PORT} --workers 2 --timeout 120
