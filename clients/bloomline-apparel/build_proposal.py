#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the Bloomline Apparel proposal PDF.

Rebuilds the canonical Proposal Template (templates/Proposal Template.pdf)
section-for-section with ReportLab, using Montserrat for ALL text. Every fact
comes verbatim from clients/bloomline-apparel/facts.json + the discovery-call
transcript — nothing invented.

Output: clients/bloomline-apparel/pdfs/proposal.pdf  (US Letter, 5 pages)
"""

import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
)

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(BASE))          # onboarding-agent root
FONT_DIR = os.path.join(ROOT, "fonts", "Montserrat")
PDF_DIR = os.path.join(BASE, "pdfs")
OUT = os.path.join(PDF_DIR, "proposal.pdf")

PAGE_W, PAGE_H = letter  # 612 x 792

# --------------------------------------------------------------------------
# Colours lifted from the reference template
# --------------------------------------------------------------------------
NAVY = colors.Color(0.121569, 0.219608, 0.392157)      # headings / table header
DARK = colors.Color(0.133333, 0.133333, 0.133333)      # body text
GRAY = colors.Color(0.603922, 0.603922, 0.603922)      # footer / secondary
LIGHT = colors.Color(0.956863, 0.960784, 0.968627)     # zebra row
SLATE = colors.Color(0.290196, 0.372549, 0.454902)     # cover accent bar
GRID = colors.Color(0.784314, 0.784314, 0.784314)      # table gridlines

# --------------------------------------------------------------------------
# Montserrat registration (MANDATORY — never Helvetica/Times)
# --------------------------------------------------------------------------
FONT_FILES = {
    "Montserrat": "Montserrat-Regular.ttf",
    "Montserrat-Bold": "Montserrat-Bold.ttf",
    "Montserrat-Italic": "Montserrat-Italic.ttf",
    "Montserrat-BoldItalic": "Montserrat-BoldItalic.ttf",
    "Montserrat-Medium": "Montserrat-Medium.ttf",
    "Montserrat-SemiBold": "Montserrat-SemiBold.ttf",
    "Montserrat-ExtraBold": "Montserrat-ExtraBold.ttf",
}
for _name, _fn in FONT_FILES.items():
    pdfmetrics.registerFont(TTFont(_name, os.path.join(FONT_DIR, _fn)))
# Map <b>/<i> markup inside Montserrat paragraphs to Montserrat variants
pdfmetrics.registerFontFamily(
    "Montserrat",
    normal="Montserrat",
    bold="Montserrat-Bold",
    italic="Montserrat-Italic",
    boldItalic="Montserrat-BoldItalic",
)


def esc(text):
    """Escape XML-special characters for ReportLab Paragraph markup."""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


# --------------------------------------------------------------------------
# Styles
# --------------------------------------------------------------------------
def _st(name, **kw):
    return ParagraphStyle(name, **kw)


H1 = _st("h1", fontName="Montserrat-Bold", fontSize=13.5, leading=17,
         textColor=NAVY, spaceBefore=10, spaceAfter=5)
H2 = _st("h2", fontName="Montserrat-Bold", fontSize=11, leading=14,
         textColor=NAVY, spaceBefore=8, spaceAfter=4)
BODY = _st("body", fontName="Montserrat", fontSize=9.7, leading=12.9,
           textColor=DARK, spaceAfter=4)
BULLET = _st("bullet", fontName="Montserrat", fontSize=9.7, leading=12.9,
             textColor=DARK, leftIndent=22, firstLineIndent=-16, spaceAfter=3.5)
NOTE = _st("note", fontName="Montserrat", fontSize=9.2, leading=12.2,
           textColor=DARK, spaceBefore=3, spaceAfter=4)

CELL = _st("cell", fontName="Montserrat", fontSize=9.1, leading=11.5,
           textColor=DARK)
CELL_H = _st("cellh", fontName="Montserrat-Bold", fontSize=9, leading=11,
             textColor=colors.white)

SIG_HDR = _st("sighdr", fontName="Montserrat-Bold", fontSize=10.5, leading=13,
              textColor=DARK, spaceAfter=6)
SIG_LBL = _st("siglbl", fontName="Montserrat-Italic", fontSize=9, leading=11,
              textColor=GRAY)
SIG_ROW = _st("sigrow", fontName="Montserrat-Bold", fontSize=10, leading=13,
              textColor=DARK, spaceAfter=4)

MARGIN_L = 72
MARGIN_R = 72
MARGIN_T = 82
MARGIN_B = 52
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R  # 468


def bullets(items):
    return [Paragraph(esc("•  " + it), BULLET) for it in items]


def plain(paras):
    return [Paragraph(esc(p), BODY) for p in paras]


def h1(text):
    return Paragraph(esc(text), H1)


def h2(text):
    return Paragraph(esc(text), H2)


def build_table(header, rows, widths, extra_style=None):
    data = [[Paragraph(esc(h), CELL_H) for h in header]]
    for r in rows:
        data.append([Paragraph(esc(c), CELL) for c in r])
    t = Table(data, colWidths=widths, repeatRows=1)
    st = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Montserrat-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("LEADING", (0, 0), (-1, 0), 11),
        ("FONTNAME", (0, 1), (-1, -1), "Montserrat"),
        ("FONTSIZE", (0, 1), (-1, -1), 9.1),
        ("LEADING", (0, 1), (-1, -1), 11.5),
        ("TEXTCOLOR", (0, 1), (-1, -1), DARK),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
        ("GRID", (0, 0), (-1, -1), 0.5, GRID),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]
    if extra_style:
        st += extra_style
    t.setStyle(TableStyle(st))
    return t


# --------------------------------------------------------------------------
# Cover page (drawn on canvas, page 1)
# --------------------------------------------------------------------------
COVER_ROWS = [
    ("Proposal No", "PRO-2026-001"),
    ("Date", "August 5, 2026"),
    ("Valid Until", "September 4, 2026"),
    ("Prepared For", "Bloomline Apparel"),
    ("Client Contact", "Mike Johnson — Owner<br/>raymon4d.scales@gmail.com<br/>+44 7700 900123"),
    ("Client Address", "14 Marlowe Street, Manchester, M1 4BT, United Kingdom"),
    ("Service Provider", "LaunchOps AI<br/>27 Baker Court, London, EC1A 1BB, United Kingdom"),
    ("Provider Contact", "Raymon (Abdulrahman Suleiman) — Founder<br/>abdul123rahmanj@gmail.com<br/>+44 7700 900456"),
]


def draw_cover(c, total_pages):
    # Title block
    c.setFillColor(DARK)
    c.setFont("Montserrat-SemiBold", 19)
    c.drawString(72, PAGE_H - 130, "LAUNCHOPS")
    c.setFont("Montserrat-ExtraBold", 36)
    c.drawString(72, PAGE_H - 190, "PROPOSAL")
    c.setFont("Montserrat-Medium", 13)
    c.drawString(72, PAGE_H - 231, "AI Agent Implementation & Optimization Services")

    # Field label / value rows (two-pass: measure, then draw)
    vstyle = _st("covval", fontName="Montserrat", fontSize=9.5, leading=13.5,
                 textColor=DARK)
    y = PAGE_H - 308
    placed = []  # (label_y, value_y, value_h, label)
    for label, value in COVER_ROWS:
        p = Paragraph(value, vstyle)
        w, h = p.wrap(283.4, 300)
        placed.append((y - 11, y - h, h, label))
        y -= h + 18
    bar_top = placed[0][0] + 10
    bar_bottom = placed[-1][1] - 14

    # Slate accent bar behind the labels
    c.setFillColor(SLATE)
    c.rect(120.6, bar_bottom, 126.0, bar_top - bar_bottom, stroke=0, fill=1)

    # Labels (white, on the bar)
    c.setFont("Montserrat-Bold", 8.5)
    for label_y, value_y, value_h, label in placed:
        c.setFillColor(colors.white)
        c.drawString(130.6, label_y, label)
    # Values (dark, right of the bar)
    y = PAGE_H - 308
    for label, value in COVER_ROWS:
        p = Paragraph(value, vstyle)
        w, h = p.wrap(283.4, 300)
        p.drawOn(c, 256.6, y - h)
        y -= h + 18

    # Confidential footer (template cover wording)
    c.setFillColor(GRAY)
    c.setFont("Montserrat", 8)
    c.drawString(70.8, 50,
                 "This document is confidential and intended solely for the named parties.")
    c.drawString(70.8, 40,
                 "Distribution outside the intended recipients is not authorized.")


# --------------------------------------------------------------------------
# Content-page chrome: header + footer (+ cover on page 1)
# --------------------------------------------------------------------------
def draw_chrome(c, page_no, total_pages):
    if page_no == 1:
        draw_cover(c, total_pages)
        return
    # Header
    c.setFillColor(DARK)
    c.setFont("Montserrat", 9.5)
    c.drawString(72, PAGE_H - 38, "LaunchOps AI")
    c.drawRightString(PAGE_W - 72, PAGE_H - 38, "Proposal")
    c.setStrokeColor(GRID)
    c.setLineWidth(0.5)
    c.line(72, PAGE_H - 50, PAGE_W - 72, PAGE_H - 50)
    # Footer
    c.setFillColor(GRAY)
    c.setFont("Montserrat", 8)
    c.drawCentredString(PAGE_W / 2.0, 44, "Confidential — LaunchOps AI")
    c.drawRightString(PAGE_W - 72, 44, "Page %d of %d" % (page_no, total_pages))


class NumberedCanvas(pdfcanvas.Canvas):
    """Draw chrome per page and add the total page count to the footer."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            draw_chrome(self, self._pageNumber, total)
            super().showPage()
        super().save()


# --------------------------------------------------------------------------
# Story — sections 1–9, matched section-for-section to the template
# --------------------------------------------------------------------------
story = []
story.append(PageBreak())  # page 1 = cover (drawn in chrome)

# --- 1. Executive Summary ------------------------------------------------
story.append(h1("1. Executive Summary"))
story.extend(plain([
    "LaunchOps AI is pleased to present this proposal to Bloomline Apparel. We will design, "
    "build, and deploy a done-for-you text AI agent for your ecommerce business that handles "
    "every inbound customer conversation — order status lookups, product and sizing questions, "
    "and abandoned cart follow-up — automatically and around the clock, without adding headcount. "
    "The agent will also qualify wholesale and bulk-order leads and hand them directly to you, "
    "so no bulk order is ever missed and no bulk pricing is ever negotiated by a bot.",
    "Bloomline Apparel currently receives 40-50 inbound messages per day across Instagram DM and "
    "website chat, and a single support person is maxed out. This solution answers customers "
    "instantly, recovers revenue from abandoned carts, and surfaces every bulk-order opportunity "
    "— with full visibility through a real-time dashboard.",
]))
story.append(Paragraph(esc("Key Highlights"), H2))
story.extend(bullets([
    "24/7 automated handling of Instagram DMs and website chat",
    "Abandoned cart recovery — every cart followed up automatically",
    "Bulk and wholesale order leads qualified and flagged to Mike — human handoff on your terms",
]))

# --- 2. Understanding Your Needs ------------------------------------------
story.append(h1("2. Understanding Your Needs"))
story.append(Paragraph(esc("2.1 Current Situation"), H2))
story.extend(plain([
    "Bloomline Apparel is an ecommerce brand selling women's activewear. Today, every customer "
    "message lands on one support person. Between Instagram DM and the website chat widget, the "
    "store receives roughly 40-50 inbound messages per day — about half are 'where is my order' "
    "queries and half are pre-purchase sizing and product questions. Abandoned carts are not "
    "followed up on at all, and the existing support capacity is maxed out — which is why hiring "
    "a second support person is being considered.",
]))
story.append(Paragraph(esc("2.2 Goals & Objectives"), H2))
story.extend(plain([
    "Bloomline Apparel wants measurable, visible outcomes: never miss a customer query on any "
    "channel; answer order-status and pre-purchase sizing questions faster than manual support "
    "allows; recover revenue from abandoned carts automatically; qualify wholesale and bulk-order "
    "leads before any human handoff; and keep full visibility into every conversation through a "
    "dashboard.",
]))
story.append(Paragraph(esc("2.3 Key Requirements"), H2))
story.extend(bullets([
    "Order status lookups — instant 'where is my order' answers pulled from Shopify",
    "Product and sizing answers for pre-purchase questions",
    "Abandoned cart follow-up via email, without duplicating Klaviyo sends",
    "Wholesale and bulk-order lead qualification with direct human handoff to Mike",
]))

# --- 3. Proposed Solution -------------------------------------------------
story.append(h1("3. Proposed Solution"))
story.append(Paragraph(esc("3.1 Overview"), H2))
story.extend(plain([
    "LaunchOps AI will build a done-for-you text AI agent for Bloomline Apparel, deployed on "
    "GoHighLevel (GHL), n8n, and Supabase, trained on your product catalog and brand voice, and "
    "wired into the channels your customers already use.",
]))
story.append(Paragraph(esc("3.2 Deliverables"), H2))
story.append(build_table(
    ["Deliverable", "Description", "Timeline"],
    [
        ["AI Agent Build & Training",
         "Text AI agent trained on Bloomline Apparel's product catalog and brand voice — order "
         "status lookups, product and sizing questions, abandoned cart follow-up, and bulk-order "
         "qualification with human handoff",
         "7-10 business days"],
        ["Integrations",
         "Shopify (order status), Instagram DM, website chat widget, and email (abandoned cart "
         "follow-up), plus read-only Klaviyo so the agent never duplicates an email already "
         "going out",
         "Within 7-10 business days"],
        ["Dashboard Setup",
         "Real-time KPI dashboard: conversations by channel, AI-resolved vs. human handoff, "
         "bulk-order leads flagged, response times, and outstanding follow-ups, filterable by "
         "last week or last month",
         "At launch, within 7-10 business days"],
    ],
    [104, 266, 98],
))
story.append(Paragraph(esc("3.3 Approach & Methodology"), H2))
story.extend(bullets([
    "Phase 1 — Discovery & Intake: requirements confirmed, onboarding intake form completed with "
    "product catalog and brand voice guidelines, and build kicked off once the setup fee and "
    "signed Service Agreement are in place",
    "Phase 2 — Build & Train: agent built and trained; workflows configured across Shopify, "
    "Instagram DM, website chat, and email; read-only Klaviyo wired in; GoHighLevel CRM layer, "
    "n8n automation, and Supabase data storage stood up",
    "Phase 3 — Review & Launch: end-to-end testing, one round of revisions included, then go-live "
    "across all channels",
    "Phase 4 — Optimize & Support: ongoing refinement from real conversations — monitoring, "
    "response and objection-handling tweaks, and integration maintenance",
]))
story.append(Paragraph(esc("3.4 Why This Approach"), H2))
story.extend(plain([
    "This approach is done-for-you: LaunchOps AI builds, deploys, and manages everything, so "
    "Bloomline Apparel needs no infrastructure to run and no technical staff to hire. It is fast "
    "— a working agent is typically live within 7-10 business days of receiving the intake form. "
    "It fits your stack — GoHighLevel as the CRM layer, n8n for automation and orchestration, and "
    "Supabase for a clean record of every conversation. And it keeps improving — refined from "
    "real conversations, with full dashboard visibility throughout.",
]))

# --- 4. Investment --------------------------------------------------------
story.append(h1("4. Investment"))
story.append(Paragraph(esc("4.1 Pricing Options"), H2))
story.append(Paragraph(esc("Option A — Done-For-You Text AI Agent (Recommended)"),
                       _st("opt", parent=H2, spaceBefore=2, spaceAfter=6, fontSize=10.5)))
story.append(build_table(
    ["Item", "Price"],
    [
        ["One-time setup fee — build, testing, and deployment across all four integrations",
         "$3,000"],
        ["Monthly optimization & maintenance — ongoing monitoring, refinement from real "
         "conversations, and integration upkeep",
         "$750 per month"],
        ["Total — initial investment due before build",
         "$3,000"],
    ],
    [352, 116],
    extra_style=[
        ("FONTNAME", (0, -1), (-1, -1), "Montserrat-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), LIGHT),
        ("LINEABOVE", (0, -1), (-1, -1), 0.5, GRID),
    ],
))
story.append(Paragraph(
    esc("The setup fee covers everything through go-live and is billed in USD as invoice "
        "INV-2026-001, currently AWAITING PAYMENT. The monthly optimization & maintenance "
        "retainer of $750 per month is billed on the 1st of each month after go-live; a payment "
        "receipt (RCP-2026-001) is issued via Stripe once the setup fee is paid."),
    NOTE))
story.append(Paragraph(esc("4.2 Payment Terms"), H2))
story.extend(bullets([
    "One-time setup fee of $3,000 USD due before the build begins",
    "Monthly optimization & maintenance fee of $750 per month billed on the 1st of each month",
    "A 5% late fee applies to any invoice more than 5 days past due",
    "Payments processed via Stripe",
]))
story.append(Paragraph(esc("4.3 What's Included"), H2))
story.extend(bullets([
    "Done-for-you build, testing, and deployment across all four integrations (Shopify, Instagram "
    "DM, website chat, email), plus read-only Klaviyo",
    "GoHighLevel CRM layer, n8n automation and orchestration, and Supabase data storage with a "
    "clean record of every conversation",
    "Real-time dashboard: conversations by channel, AI-resolved vs. human handoff, bulk-order "
    "leads flagged, response times, and outstanding follow-ups — filterable by last week or last "
    "month",
    "Ongoing optimization & maintenance: monitoring, refining responses and objection handling, "
    "and keeping integrations maintained",
]))
story.append(Paragraph(esc("4.4 What's Not Included"), H2))
story.extend(bullets([
    "Major scope additions — new agents, new integrations, or new verticals — are billed "
    "separately",
    "Bulk or wholesale pricing negotiation — the agent qualifies and hands off bulk-order leads "
    "but does not negotiate pricing",
]))

# --- 5. Timeline ----------------------------------------------------------
story.append(KeepTogether([
    h1("5. Timeline"),
    build_table(
        ["Phase", "Duration", "Start", "End"],
        [
            ["Phase 1 — Discovery & Intake", "1-2 business days",
             "August 5, 2026", "August 6, 2026"],
            ["Phase 2 — Build & Train", "4-6 business days",
             "August 7, 2026", "August 13, 2026"],
            ["Phase 3 — Review & Launch", "2-3 business days",
             "August 14, 2026", "August 18, 2026"],
            ["Total", "7-10 business days", "—", "—"],
        ],
        [206, 102, 80, 80],
        extra_style=[
            ("FONTNAME", (0, -1), (-1, -1), "Montserrat-Bold"),
            ("BACKGROUND", (0, -1), (-1, -1), LIGHT),
            ("LINEABOVE", (0, -1), (-1, -1), 0.5, GRID),
        ],
    ),
]))
story.extend(plain([
    "The build timeline is typically 7-10 business days from receipt of the intake form. "
    "Indicative dates assume kickoff on August 5, 2026, pending the signed Service Agreement, "
    "setup fee, and completed intake form; all phases complete well before the proposal expires "
    "on September 4, 2026.",
]))

# --- 6. Why LaunchOps AI --------------------------------------------------
story.append(h1("6. Why LaunchOps AI"))
story.append(Paragraph(esc("6.1 Our Experience"), H2))
story.extend(plain([
    "LaunchOps AI designs, builds, and deploys done-for-you AI agents — voice and text — for "
    "businesses across verticals, handling high volumes of inbound customer conversations, "
    "qualifying leads before human handoff, and following up automatically. Every deployment is "
    "managed end-to-end on GoHighLevel, n8n, and Supabase, with a real-time dashboard so clients "
    "keep full visibility.",
]))
story.append(Paragraph(esc("6.2 Case Studies"), H2))
story.append(Paragraph(
    "<b>" + esc("Ecommerce Messaging Automation.") + "</b> " +
    esc("LaunchOps AI deploys exactly the pattern proposed here: a text AI agent on Instagram DM "
        "and website chat that answers order-status and pre-purchase questions instantly, "
        "recovers abandoned carts with automated follow-up, and flags bulk-order leads for human "
        "handoff — keeping a busy ecommerce store covered without adding headcount, with full "
        "dashboard visibility throughout."),
    BODY))
story.append(KeepTogether([
    Paragraph(esc("6.3 Our Team"), H2),
    build_table(
        ["Name", "Role", "Relevant Experience"],
        [
            ["Abdulrahman Suleiman", "Founder",
             "Founded LaunchOps AI; builds and deploys done-for-you AI agents (voice and text) on "
             "GoHighLevel, n8n, and Supabase for ecommerce and service businesses"],
        ],
        [104, 74, 290],
    ),
]))

# --- 7. Next Steps --------------------------------------------------------
story.append(h1("7. Next Steps"))
story.extend(bullets([
    "Review this proposal",
    "Sign the Service Agreement",
    "Complete the onboarding intake form",
    "Kick off the build once the signed Service Agreement and setup fee are received",
]))

# --- 8. Terms & Conditions ------------------------------------------------
story.append(h1("8. Terms & Conditions"))
story.extend(bullets([
    "This proposal is valid until September 4, 2026.",
    "All pricing is in USD and excludes taxes and additional fees unless stated otherwise.",
    "The one-time setup fee of $3,000 is required to begin the build and is non-refundable once "
    "work has commenced.",
    "One round of revisions is included; further revision rounds are billed at LaunchOps AI's "
    "standard rate.",
    "This proposal is confidential and intended solely for Bloomline Apparel.",
    "The engagement runs month-to-month after go-live; either party may end it with 14 days' "
    "written notice.",
    "Upon acceptance, the LaunchOps AI Service Agreement (CON-2026-001) governs the engagement.",
]))

# --- 9. Acceptance & Signatures -------------------------------------------
story.append(h1("9. Acceptance & Signatures"))
story.append(Paragraph(
    esc("By signing below, both parties accept the terms set forth in this proposal."), BODY))
story.append(Spacer(1, 6))


def sig_block(title, name, title_line):
    return [
        Paragraph(esc(title), SIG_HDR),
        Paragraph(esc("Signature"), SIG_LBL),
        HRFlowable(width=200, thickness=0.7, color=DARK, spaceBefore=2, spaceAfter=12),
        Paragraph(esc("Name: " + name), SIG_ROW),
        Paragraph(esc("Title: " + title_line), SIG_ROW),
        Paragraph(esc("Date: ______________"), SIG_ROW),
    ]


sig_table = Table(
    [[sig_block("CLIENT", "Mike Johnson", "Owner"),
      sig_block("LAUNCHOPS AI", "Abdulrahman Suleiman", "Founder, LaunchOps AI")]],
    colWidths=[234, 234],
)
sig_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ("TOPPADDING", (0, 0), (-1, -1), 0),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
]))
story.append(sig_table)


# --------------------------------------------------------------------------
# Build
# --------------------------------------------------------------------------
def main():
    os.makedirs(PDF_DIR, exist_ok=True)
    doc = BaseDocTemplate(
        OUT,
        pagesize=letter,
        leftMargin=MARGIN_L,
        rightMargin=MARGIN_R,
        topMargin=MARGIN_T,
        bottomMargin=MARGIN_B,
        title="Proposal — Bloomline Apparel",
        author="LaunchOps AI",
        subject="AI Agent Implementation & Optimization Services",
        creator="LaunchOps AI",
    )
    frame = Frame(MARGIN_L, MARGIN_B, CONTENT_W,
                  PAGE_H - MARGIN_T - MARGIN_B, id="main",
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="page", frames=[frame])])
    doc.build(story, canvasmaker=NumberedCanvas)
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
