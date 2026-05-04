"""
ocr_service.py – Extract expense data from an uploaded image using pytesseract.
"""

import re
from datetime import datetime
from io import BytesIO
from typing import Dict, Any

import pytesseract
from fastapi import UploadFile
from PIL import Image, ImageFilter

from logic import normalize_currency_text


# Regex patterns for monetary values
_AMOUNT_PATTERNS = [
    # "TOTAL R$ 123,45" / "VALOR TOTAL R$ 1.234,56"
    r"(?:TOTAL|VALOR\s+PAGO|VALOR\s+TOTAL)\s*[:\-]?\s*(R\$?\s*[\d.,]+)",
    # standalone R$ amount
    r"R\$\s*([\d.,]+)",
    # plain numeric value with comma/period
    r"\b(\d{1,6}[.,]\d{2})\b",
]

_DATE_PATTERNS = [
    # DD/MM/YYYY or DD-MM-YYYY
    r"(\d{2}[/\-]\d{2}[/\-]\d{4})",
    # YYYY-MM-DD
    r"(\d{4}[/\-]\d{2}[/\-]\d{2})",
]


def _preprocess_image(image: Image.Image) -> Image.Image:
    """Convert to greyscale and apply slight sharpening for better OCR."""
    image = image.convert("L")
    image = image.filter(ImageFilter.SHARPEN)
    return image


def _extract_amount(text: str) -> tuple[float | None, float]:
    """Try to extract a monetary amount from *text*.

    Returns (amount, confidence_score).
    Higher pattern index → lower base confidence.
    """
    upper = text.upper()
    for idx, pattern in enumerate(_AMOUNT_PATTERNS):
        match = re.search(pattern, upper)
        if match:
            raw = match.group(1)
            try:
                normalized = normalize_currency_text(raw)
                amount = float(normalized)
                # Confidence decreases with pattern specificity
                confidence = round(0.95 - idx * 0.10, 2)
                return amount, confidence
            except (ValueError, IndexError):
                continue
    return None, 0.0


def _extract_date(text: str) -> str | None:
    """Try to extract a date from *text* and return an ISO 8601 string."""
    for pattern in _DATE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            raw = match.group(1)
            for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%Y-%m-%d"):
                try:
                    dt = datetime.strptime(raw, fmt)
                    return dt.isoformat()
                except ValueError:
                    continue
    return None


async def extract_expense_from_image(file: UploadFile) -> Dict[str, Any]:
    """Run OCR on *file* and return structured expense data."""
    contents = await file.read()
    image = Image.open(BytesIO(contents))
    image = _preprocess_image(image)

    raw_text: str = pytesseract.image_to_string(image, lang="por+eng")

    amount, confidence = _extract_amount(raw_text)
    date_str = _extract_date(raw_text) or datetime.utcnow().isoformat()

    return {
        "amount": amount,
        "date": date_str,
        "confidence_score": confidence,
        "raw_text": raw_text,
    }
