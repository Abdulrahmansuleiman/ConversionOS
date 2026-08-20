# -*- coding: utf-8 -*-
"""
build_invoice.py — Bloomline Apparel invoice (INV-2026-001)

Rebuilds templates/Invoice Template.pdf structure faithfully, filled with
facts from clients/bloomline-apparel/facts.json (verbatim).
Page size: US Letter (612 x 792). Font: Montserrat (all text).

Parallel invoice sub-agent: touches ONLY pdfs/invoice.pdf + this script.
"""
import os

from reportlab.lib.colors import Color
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# --------------------------------------------------------------------------
# Paths
# --------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))          # clients/bloomline-apparel
FONT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "fonts", "Montserrat"))
OUT_PDF = os.path.join(BASE_DIR, "pdfs", "invoice.pdf")

# --------------------------------------------------------------------------
# Fonts (Montserrat ONLY — never Helvetica/Times)
# --------------------------------------------------------------------------
FONT_REGULAR = "Montserrat-Regular"
FONT_BOLD = "Montserrat-Bold"
FONT_ITALIC = "Montserrat-Italic"
FONT_MEDIUM = "Montserrat-Medium"
FONT_SEMIBOLD = "Montserrat-SemiBold"
FONT_EXTRABOLD = "Montserrat-ExtraBold"

for _f in ["Montserrat-Regular", "Montserrat-Bold", "Montserrat-Italic",
           "Montserrat-Medium", "Montserrat-SemiBold", "Montserrat-ExtraBold",
           "Montserrat-BoldItalic"]:
    pdfmetrics.registerFont(TTFont(_f, os.path.join(FONT_DIR, _f + ".ttf")))

# --------------------------------------------------------------------------
# Colors (sampled from the reference template)
# --------------------------------------------------------------------------
BLUE = Color(0.0, 74 / 255.0, 173 / 255.0)          # header bars / table accents
LIGHT = Color(239 / 255.0, 249 / 255.0, 250 / 255.0)  # info box fill
BLACK = Color(0, 0, 0)
GREY = Color(0.35, 0.35, 0.35)                       # secondary terms text
WHITE = Color(1, 1, 1)

# --------------------------------------------------------------------------
# Geometry (US Letter). All y values are "top based" (0 = top of page).
# Template x-coordinates were shifted +8.25pt to center on 612pt page.
# --------------------------------------------------------------------------
PAGE_W, PAGE_H = letter                     # 612 x 792
SHIFT = (612.0 - 595.5) / 2.0               # center template content on Letter
TABLE_L = 42.4 + SHIFT                      # 50.65
TABLE_R = 553.1 + SHIFT                     # 561.35
DIVIDER_X = 427.4 + SHIFT                   # 435.65
AMOUNT_RIGHT = 521.6 + SHIFT                # 529.85
LEFT_X = 59.5 + SHIFT                       # 67.75
MID_X = 238.8 + SHIFT                       # 247.05 — Invoice No / ref lines
DATE_X = 252.5 + SHIFT                      # 260.75 — Date line (template position)
RIGHT_X = 535.9 + SHIFT                     # 544.15 right-align (template right edge)

BAR_H = 21                                  # top / bottom bars

TITLE_TOP = 62
TITLE_SIZE = 50

INFO_TOP = 128
INFO_BOTTOM = 274

HEADER_TOP = 331                            # blue header band
HEADER_BOT = 371
BODY_BOTTOM = 455                           # table body bottom edge
DIVIDER_BOT = 533                           # divider runs through totals box

TOTALS_TOP = 453                            # blue Sub-Total/Total box
TOTALS_BOT = 533
TOTALS_L = 304.7 + SHIFT                    # 312.95
SEP_Y = 491                                 # white separator inside totals box

TERMS_HEADING_TOP = 559
TERMS_BODY_TOP = 580
TERMS_MAX_W = 260.0                         # body width before signature block


def wrap(text, font, size, max_w):
    """Word-wrap text to max_w points; returns list of lines.
    A literal "\n" inside text forces a hard line break."""
    lines_out = []
    for segment in text.split("\n"):
        words = segment.split(" ")
        lines, cur = [], ""
        for w in words:
            trial = (cur + " " + w).strip()
            if pdfmetrics.stringWidth(trial, font, size) <= max_w:
                cur = trial
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        lines_out.extend(lines)
    return lines_out


def main():
    c = canvas.Canvas(OUT_PDF, pagesize=letter,
                      initialFontName=FONT_REGULAR, initialFontSize=10)
    c.setTitle("INVOICE — Bloomline Apparel — INV-2026-001")
    c.setAuthor("LaunchOps AI")

    def text(x, y_top, s, font=FONT_REGULAR, size=10, color=BLACK,
             align="left"):
        """Draw text. y_top is the top-based position of the cap line."""
        c.setFont(font, size)
        c.setFillColor(color)
        baseline = PAGE_H - y_top - size * 0.72
        if align == "left":
            c.drawString(x, baseline, s)
        elif align == "right":
            c.drawRightString(x, baseline, s)
        elif align == "center":
            c.drawCentredString(x, baseline, s)

    # ----------------------------------------------------------------
    # Top bar
    # ----------------------------------------------------------------
    c.setFillColor(BLUE)
    c.rect(-10, PAGE_H - BAR_H, PAGE_W + 20, BAR_H, stroke=0, fill=1)

    # ----------------------------------------------------------------
    # Title
    # ----------------------------------------------------------------
    text(PAGE_W / 2.0, TITLE_TOP, "INVOICE", font=FONT_BOLD, size=TITLE_SIZE,
         color=BLACK, align="center")

    # ----------------------------------------------------------------
    # Info box (light fill, no border)
    # ----------------------------------------------------------------
    c.setFillColor(LIGHT)
    c.rect(TABLE_L, PAGE_H - INFO_BOTTOM, TABLE_R - TABLE_L,
           INFO_BOTTOM - INFO_TOP, stroke=0, fill=1)

    # Left column — INVOICE TO
    text(LEFT_X, 148, "INVOICE TO :", font=FONT_BOLD, size=10, color=BLACK)
    text(LEFT_X, 166, "Mike Johnson", font=FONT_BOLD, size=16, color=BLACK)
    # decorative underline under client name (as in template)
    name_w = pdfmetrics.stringWidth("Mike Johnson", FONT_BOLD, 16)
    c.setStrokeColor(BLUE)
    c.setLineWidth(2)
    c.line(LEFT_X, PAGE_H - 190.5, LEFT_X + name_w * 0.6, PAGE_H - 190.5)
    text(LEFT_X, 199, "Bloomline Apparel", font=FONT_MEDIUM, size=10, color=BLACK)
    text(LEFT_X, 212, "Owner", font=FONT_MEDIUM, size=10, color=BLACK)
    text(LEFT_X, 225, "14 Marlowe Street, Manchester,", font=FONT_REGULAR, size=9, color=BLACK)
    text(LEFT_X, 237, "M1 4BT, United Kingdom", font=FONT_REGULAR, size=9, color=BLACK)
    text(LEFT_X, 251, "raymon4d.scales@gmail.com", font=FONT_REGULAR, size=9, color=BLACK)
    text(LEFT_X, 263, "+44 7700 900123", font=FONT_REGULAR, size=9, color=BLACK)

    # Middle column — Date / document numbers
    text(DATE_X, 148, "Date : August 5, 2026", font=FONT_BOLD, size=10, color=BLACK)
    text(MID_X, 176, "Invoice No : INV-2026-001", font=FONT_BOLD, size=10, color=BLACK)
    text(MID_X, 195, "Proposal No : PRO-2026-001", font=FONT_BOLD, size=10, color=BLACK)
    text(MID_X, 210, "Proposal Date : September 4, 2026", font=FONT_BOLD, size=10, color=BLACK)
    text(MID_X, 225, "Contract No : CON-2026-001", font=FONT_BOLD, size=10, color=BLACK)
    text(MID_X, 240, "Receipt No : RCP-2026-001", font=FONT_BOLD, size=10, color=BLACK)

    # Right column — Total due + status
    text(RIGHT_X, 148, "TOTAL DUE :", font=FONT_BOLD, size=10, color=BLACK, align="right")
    text(RIGHT_X, 166, "USD: $3,000", font=FONT_BOLD, size=16, color=BLACK, align="right")
    text(RIGHT_X, 205, "AWAITING PAYMENT", font=FONT_SEMIBOLD, size=10,
         color=BLUE, align="right")

    # ----------------------------------------------------------------
    # Table outline + header band
    # ----------------------------------------------------------------
    c.setStrokeColor(BLUE)
    c.setLineWidth(2)
    c.rect(TABLE_L, PAGE_H - BODY_BOTTOM, TABLE_R - TABLE_L,
           BODY_BOTTOM - HEADER_TOP, stroke=1, fill=0)
    c.setFillColor(BLUE)
    c.rect(TABLE_L, PAGE_H - HEADER_BOT, TABLE_R - TABLE_L,
           HEADER_BOT - HEADER_TOP, stroke=0, fill=1)
    # header labels — white bold 16, centered in their columns
    text((TABLE_L + DIVIDER_X) / 2.0, HEADER_TOP + (HEADER_BOT - HEADER_TOP - 16) / 2.0,
         "Description", font=FONT_BOLD, size=16, color=WHITE, align="center")
    text((DIVIDER_X + TABLE_R) / 2.0, HEADER_TOP + (HEADER_BOT - HEADER_TOP - 16) / 2.0,
         "Amount", font=FONT_BOLD, size=16, color=WHITE, align="center")

    # vertical divider — runs from header top through the totals box
    c.setStrokeColor(BLUE)
    c.setLineWidth(2.5)
    c.line(DIVIDER_X, PAGE_H - HEADER_TOP, DIVIDER_X, PAGE_H - DIVIDER_BOT)

    # line item
    text(LEFT_X, 387, "AI agent setup fee \u2014 build, testing, deployment",
         font=FONT_REGULAR, size=10.5, color=BLACK)
    text(AMOUNT_RIGHT, 387, "$3,000", font=FONT_SEMIBOLD, size=10.5, color=BLACK,
         align="right")

    # ----------------------------------------------------------------
    # Sub-Total / Total box — blue fill, white bold 16 (as in template)
    # ----------------------------------------------------------------
    c.setFillColor(BLUE)
    c.rect(TOTALS_L, PAGE_H - TOTALS_BOT, TABLE_R - TOTALS_L,
           TOTALS_BOT - TOTALS_TOP, stroke=0, fill=1)
    c.setStrokeColor(BLUE)
    c.setLineWidth(2)
    c.rect(TOTALS_L, PAGE_H - TOTALS_BOT, TABLE_R - TOTALS_L,
           TOTALS_BOT - TOTALS_TOP, stroke=1, fill=0)
    # white separator between the two rows
    c.setStrokeColor(WHITE)
    c.setLineWidth(1.5)
    c.line(TOTALS_L + 1, PAGE_H - SEP_Y, TABLE_R - 1, PAGE_H - SEP_Y)

    center_x = (TOTALS_L + DIVIDER_X) / 2.0   # labels centered left of divider
    text(center_x, 465, "Sub-Total", font=FONT_BOLD, size=16, color=WHITE, align="center")
    text(AMOUNT_RIGHT, 465, "$3,000", font=FONT_BOLD, size=16, color=WHITE, align="right")
    text(center_x, 505, "Total", font=FONT_BOLD, size=16, color=WHITE, align="center")
    text(AMOUNT_RIGHT, 505, "$3,000", font=FONT_BOLD, size=16, color=WHITE, align="right")

    # ----------------------------------------------------------------
    # Terms and Conditions + payment note (template copy kept verbatim)
    # ----------------------------------------------------------------
    text(LEFT_X, TERMS_HEADING_TOP, "Terms and Conditions", font=FONT_BOLD,
         size=16, color=BLACK)

    paragraphs = [
        ("note", "Please send payment within 1-2 days of receiving this invoice.",
         FONT_ITALIC, 9.5, BLACK),
        ("term", "Monthly retainer: $750, billed on the 1st of each month. Retainer invoices "
                 "are due within 5 days of issue; a late fee of 5% applies to late payments.",
         FONT_REGULAR, 9, GREY),
        ("term", "Scope: an AI agent for ecommerce for Bloomline Apparel's women's activewear "
                 "brand.\nIt handles 40-50 inbound messages per day.",
         FONT_REGULAR, 9, GREY),
        ("term", "Platforms: Shopify, Instagram, Klaviyo, Stripe, GoHighLevel, n8n, Supabase. "
                 "Delivery timeline: 7-10 business days. Notice period: 14 days.",
         FONT_REGULAR, 9, GREY),
        ("term", "Remit payment to LaunchOps AI, 27 Baker Court, London, EC1A 1BB, "
                 "United Kingdom. Contact Raymon at abdul123rahmanj@gmail.com or "
                 "+44 7700 900456.",
         FONT_REGULAR, 9, GREY),
    ]

    y = TERMS_BODY_TOP
    rendered = []                       # (y_top, height) per paragraph for signature centering
    leading_note = 11.5
    leading_term = 11.0
    for kind, para, font, size, color in paragraphs:
        lines = wrap(para, font, size, TERMS_MAX_W)
        lead = leading_note if kind == "note" else leading_term
        first_y = y
        for ln in lines:
            text(LEFT_X, y, ln, font=font, size=size, color=color)
            y += lead
        rendered.append((first_y, y - first_y))
        y += 2.0                        # paragraph gap

    body_bottom = y - 2.0
    # signature block — vertically centred against the terms body
    body_center = (TERMS_BODY_TOP + body_bottom) / 2.0
    sig_name_y = body_center - 16.5
    sig_title_y = body_center + 11.5
    text(RIGHT_X, sig_name_y, "Abdulrahman Suleiman", font=FONT_BOLD, size=16,
         color=BLACK, align="right")
    name_center = RIGHT_X - pdfmetrics.stringWidth("Abdulrahman Suleiman", FONT_BOLD, 16) / 2.0
    text(name_center, sig_title_y, "Founder", font=FONT_REGULAR, size=10,
         color=BLACK, align="center")

    # ----------------------------------------------------------------
    # Bottom bar
    # ----------------------------------------------------------------
    c.setFillColor(BLUE)
    c.rect(-10, 0, PAGE_W + 20, BAR_H, stroke=0, fill=1)

    c.showPage()
    c.save()
    print("Wrote", OUT_PDF)
    print("Terms body: top=%s bottom=%s (bottom bar at top=771)" % (TERMS_BODY_TOP, round(body_bottom, 1)))


if __name__ == "__main__":
    main()
