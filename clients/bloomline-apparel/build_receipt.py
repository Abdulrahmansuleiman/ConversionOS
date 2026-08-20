#!/usr/bin/env python3
"""Build the Payment Receipt for Bloomline Apparel (client: bloomline-apparel).

Structure follows templates/Receipt Template.pdf EXACTLY (US Letter page):
  - black logo square top-left, business details top-right
  - "Payment Receipt" title + divider rule
  - RECEIPT NO. / BILLED TO / ADDRESS block
  - DESCRIPTION | QTY. | UNIT PRICE | TOTAL item table (header band + 4 grid rows)
  - PAYMENT METHOD / TRANSACTION ID (left), SUB-TOTAL / DISCOUNT / TOTAL (right)
  - NOTES, footer contact line, SIGNATURE box (SIGNATURE / name / FOUNDER)

Template fields ARRIVE / DEPART (travel dates) are NOT applicable to a service
payment receipt and have no facts -> omitted by design (flagged in report).

Every must_appear token from facts.json is placed VERBATIM (via token lookup,
never retyped). Font: Montserrat only (fonts/Montserrat/).
"""

import json
import os
import re
import sys

from reportlab.lib.colors import Color, black
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# --------------------------------------------------------------------------
# Paths
# --------------------------------------------------------------------------
BASE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(BASE))
FACTS_PATH = os.path.join(BASE, "facts.json")
OUT_DIR = os.path.join(BASE, "pdfs")
OUT_PATH = os.path.join(OUT_DIR, "receipt.pdf")
FONT_DIR = os.path.join(REPO, "fonts", "Montserrat")

# --------------------------------------------------------------------------
# Facts (single source of truth)
# --------------------------------------------------------------------------
with open(FACTS_PATH, encoding="utf-8") as f:
    FACTS = json.load(f)
MUST = FACTS["must_appear"]
MUST_NOT = FACTS.get("must_not_contain", [])


def find(prefix):
    """Return the exact must_appear token starting with `prefix`."""
    for tok in MUST:
        if tok.startswith(prefix):
            return tok
    raise KeyError(f"No fact token starts with {prefix!r}")


# --------------------------------------------------------------------------
# Fonts (Montserrat — never Helvetica/Times)
# --------------------------------------------------------------------------
pdfmetrics.registerFont(TTFont("Montserrat", os.path.join(FONT_DIR, "Montserrat-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-Bold", os.path.join(FONT_DIR, "Montserrat-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-Medium", os.path.join(FONT_DIR, "Montserrat-Medium.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-SemiBold", os.path.join(FONT_DIR, "Montserrat-SemiBold.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-ExtraBold", os.path.join(FONT_DIR, "Montserrat-ExtraBold.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-Italic", os.path.join(FONT_DIR, "Montserrat-Italic.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-BoldItalic", os.path.join(FONT_DIR, "Montserrat-BoldItalic.ttf")))

PAGE_W, PAGE_H = letter  # US Letter: 612 x 792 pt

CREAM = Color(1.0, 0.9961, 0.9804)  # table-header text colour from the template

c = canvas.Canvas(OUT_PATH, pagesize=letter, initialFontName="Montserrat")
c.setTitle("Payment Receipt - Bloomline Apparel")
c.setAuthor("LaunchOps AI")
c.setFont("Montserrat", 11)  # canvas default font is Montserrat from page start: never Helvetica

placed = []  # every drawn string, for build-time fact verification


def draw(text, x, top, font="Montserrat", size=11, color=black, align="left"):
    """Draw `text` at x with its glyph top at `top` (distance from page top)."""
    c.setFont(font, size)
    c.setFillColor(color)
    baseline = PAGE_H - top - 0.78 * size
    if align == "left":
        c.drawString(x, baseline, text)
    elif align == "right":
        c.drawRightString(x, baseline, text)
    elif align == "center":
        c.drawCentredString(x, baseline, text)
    placed.append(text)


def wrap(text, font, size, max_w):
    """Greedy word wrap by measured width; returns list of lines (no mid-word splits)."""
    lines, cur = [], ""
    for word in text.split(" "):
        trial = word if not cur else cur + " " + word
        if pdfmetrics.stringWidth(trial, font, size) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def protect(text):
    """Keep phone numbers and 'N days' phrases atomic so wrapping never splits them."""
    text = re.sub(r"(\+44 \d{4} \d{6})", lambda m: m.group(1).replace(" ", "\u00A0"), text)
    text = re.sub(r"(\d+) days", lambda m: m.group(1) + "\u00A0days", text)
    return text


def line(x0, y_top, x1, width=1.0, color=black):
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x0, PAGE_H - y_top, x1, PAGE_H - y_top)


def rect(x, y_top, w, h, color=black, fill=True, stroke=False):
    if fill:
        c.setFillColor(color)
    if stroke:
        c.setStrokeColor(color)
    c.rect(x, PAGE_H - y_top - h, w, h, fill=fill, stroke=stroke)


# ==========================================================================
# Layout (coordinates mirror the reference Receipt Template)
# ==========================================================================

# -- Logo square (top-left, same position as template) ----------------------
rect(59.5, 47.4, 51.8, 51.8, color=black, fill=True)

# -- Business details (top-right; template's address block) ------------------
draw("LaunchOps AI", 535.9, 68.7, font="Montserrat-SemiBold", size=11, align="right")
draw(find("27 Baker Court"), 535.9, 82.7, size=11, align="right")

# -- Title + divider ---------------------------------------------------------
draw("Payment Receipt", 59.5, 112.6, size=36)
line(59.5, 115.4, 535.9)

# -- Receipt no / billed to / address ----------------------------------------
draw("RECEIPT NO.:", 59.5, 188.0, font="Montserrat-Bold", size=11)
draw(find("RCP-2026-001"), 145.5, 188.0, size=11)
draw("BILLED TO:", 59.5, 200.8, font="Montserrat-Bold", size=11)
draw(find("Mike Johnson") + " / " + find("Bloomline Apparel"), 145.5, 200.8, size=11)
draw("ADDRESS:", 59.5, 213.5, font="Montserrat-Bold", size=11)
draw(find("14 Marlowe Street"), 145.5, 213.5, size=11)

# NOTE: template ARRIVE / DEPART travel fields omitted (no facts, N/A) - flagged.

# -- Item table --------------------------------------------------------------
# header band (filled black row, same extents as template's four segments)
rect(59.5, 316.9, 476.3, 28.9, color=black, fill=True)
draw("DESCRIPTION", 178.8, 323.0, size=11, color=CREAM, align="center")
draw("QTY.", 337.5, 323.0, size=11, color=CREAM, align="center")
draw("UNIT PRICE", 416.7, 323.0, size=11, color=CREAM, align="center")
draw("TOTAL", 496.0, 323.0, size=11, color=CREAM, align="center")

# grid
for gy in (317.1, 345.6, 384.3, 423.1, 461.8, 500.5):
    line(59.5, gy, 535.9)
for gx in (59.9, 297.9, 377.1, 456.3, 535.6):
    c.setStrokeColor(black)
    c.setLineWidth(1.0)
    c.line(gx, PAGE_H - 500.1, gx, PAGE_H - 317.5)

# data row 1 (row 1 of 4; template rows 2-4 stay empty)
row_top = 359.5
draw("AI agent setup fee", 71.5, row_top, size=11)
draw("1", 337.5, row_top, size=11, align="center")
draw(find("$3,000"), 448.3, row_top, size=11, align="right")
draw(find("$3,000"), 527.8, row_top, size=11, align="right")

# -- Payment method / transaction id (left) ----------------------------------
draw("PAYMENT METHOD:", 59.5, 570.2, font="Montserrat-Bold", size=11)
draw(find("Stripe"), 187.1, 570.2, size=11)
draw("TRANSACTION ID:", 59.5, 582.9, font="Montserrat-Bold", size=11)
draw(find("RCP-2026-001"), 187.1, 582.9, size=11)  # no transaction-id fact: reuse receipt no (flagged)

# -- Sub-total / discount / total (right column) ------------------------------
for gy in (572.5, 592.8, 613.1, 633.3):
    line(376.9, gy, 535.9)
draw("SUB-TOTAL:", 376.9, 573.9, size=11)
draw(find("$3,000"), 467.9, 573.9, font="Montserrat-Bold", size=11)
draw("DISCOUNT:", 376.9, 594.2, size=11)  # no discount -> blank, as in template
draw("TOTAL:", 376.9, 637.0, font="Montserrat-Bold", size=20)
draw(find("$3,000"), 457.6, 639.7, font="Montserrat-Bold", size=15)

# -- Notes --------------------------------------------------------------------
draw("NOTES:", 59.5, 615.4, font="Montserrat-Bold", size=11)

note = (
    f"Status: {find('AWAITING PAYMENT')}. Receipt for the AI agent setup fee for "
    f"{find('Bloomline Apparel')} - ecommerce, {find('women')} ({find('40-50')} "
    f"messages/day via Instagram and Shopify; stack: GoHighLevel, n8n, Supabase; "
    f"Klaviyo; Stripe; USD). Ongoing: {find('$750')}/mo on the {find('1st')}; "
    f"{find('5%')} late fee after {find('5 days')} past due; build: {find('7-10')}; "
    f"{find('14 days')} notice. Client: {find('Mike Johnson')}, Owner "
    f"({find('raymon4d.scales@gmail.com')}, {find('+44 7700 900123')}). Related: "
    f"{find('PRO-2026-001')}, {find('CON-2026-001')}, {find('INV-2026-001')} "
    f"(proposal valid until {find('September 4, 2026')}). Issued: {find('August 5, 2026')}."
)
note = protect(note)

NOTE_MAX_W = 310.0
NOTE_TOP = 628.5
NOTE_MAX_LINES = 8
chosen = None
for size_candidate in (8.0, 7.5, 7.0):
    wrapped = wrap(note, "Montserrat", size_candidate, NOTE_MAX_W)
    leading = size_candidate + 1.4
    last_bottom = NOTE_TOP + (len(wrapped) - 1) * leading + size_candidate
    if len(wrapped) <= NOTE_MAX_LINES and last_bottom <= 702.0:
        chosen = (size_candidate, leading, wrapped)
        break
if chosen is None:
    sys.exit(f"FAIL: notes do not fit the template NOTES area (widest line {pdfmetrics.stringWidth(wrapped, 'Montserrat', 7.0):.0f}pt)")
notes_size, notes_leading, note_lines = chosen
for i, ln in enumerate(note_lines):
    draw(ln, 59.5, NOTE_TOP + i * notes_leading, size=notes_size)

# -- Footer divider + contact line --------------------------------------------
line(59.5, 703.2, 535.9)
footer = protect(
    f"For appointments or inquiries, reach out to {find('Raymon')} at "
    f"{find('abdul123rahmanj@gmail.com')} or {find('+44 7700 900456')}."
)
footer_lines = wrap(footer, "Montserrat-Italic", 11, 360.0)
for i, ln in enumerate(footer_lines):
    draw(ln, 59.5, 708.3 + i * 12.8, font="Montserrat-Italic", size=11)

# -- Signature block -----------------------------------------------------------
rect(426.9, 693.3, 83.7, 90.9, color=black, fill=False, stroke=True)  # signature box
draw("SIGNATURE", 468.75, 709.3, size=10, align="center")
draw(find("Abdulrahman Suleiman"), 468.75, 761.9, font="Montserrat-Bold", size=11, align="center")
draw(find("Founder"), 468.75, 776.1, size=11, align="center")

# ==========================================================================
# Build-time self verification (mirror of scripts/verify_document.py)
# ==========================================================================
def normalize(s):
    return re.sub(r"\s+", "", s)


all_text = "\n".join(placed)
norm_text = normalize(all_text)

missing = [tok for tok in MUST if normalize(tok) not in norm_text]
if missing:
    sys.exit(f"BUILD-TIME FAIL — missing or altered facts: {missing}")

leftovers = [p for p in MUST_NOT if p in all_text]
if leftovers:
    sys.exit(f"BUILD-TIME FAIL — forbidden tokens present: {leftovers}")

if re.search(r"\{\{[^}]*\}\}", all_text):
    sys.exit("BUILD-TIME FAIL — leftover placeholder braces found")

# --------------------------------------------------------------------------
os.makedirs(OUT_DIR, exist_ok=True)
c.save()
print(f"OK: {OUT_PATH}")
print(f"notes size={notes_size} leading={notes_leading} lines={len(wrapped)}")
print(f"all {len(MUST)} facts verified present in drawn text; no forbidden tokens")
