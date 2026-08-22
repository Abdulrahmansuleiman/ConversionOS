#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the LeadFlow.io proposal PDF.

Rebuilds the canonical Proposal Template (templates/Proposal Template.pdf)
section-for-section with ReportLab, using Montserrat for ALL text. Every fact
comes verbatim from clients/leadflow/facts.json + the discovery-call
transcript — nothing invented.

Output: clients/leadflow/pdfs/proposal.pdf  (US Letter)
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
    ("Proposal No", "PRO-2026-002"),
    ("Date", "August 22, 2026"),
    ("Valid Until", "September 22, 2026"),
    ("Prepared For", "LeadFlow.io"),
    ("Client Contact", "Daniel Whitfield<br/>+44 7911 123456"),
    ("Client Address", "24 Baker Street, Marylebone, London, W1U 6TU, UK"),
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
    "LaunchOps AI is pleased to present this proposal to LeadFlow.io, following our "
    "discovery call on August 20, 2026. We will design, build, and deploy a done-for-you "
    "WhatsApp AI agent for your marketing agency that answers every inbound lead with an "
    "instant response, qualifies each lead before any human time is spent, and books "
    "qualified leads straight into your calendar — without adding headcount. A custom "
    "dashboard gives you full visibility into what is actually happening with the leads "
    "you are paying for.",
    "LeadFlow.io has run paid ads for local businesses and ecommerce brands for 3 years. "
    "Today, leads from Facebook lead forms and Instagram DMs land in a shared inbox that a "
    "small team checks manually — so responses take hours, follow-up is inconsistent, and "
    "once ads go live there is no visibility on lead performance. This solution fixes all "
    "three: every lead gets an instant response on WhatsApp, qualification and booking run "
    "automatically, and the dashboard shows conversation logs, response times, and booked "
    "call stats in real time.",
]))
story.append(Paragraph(esc("Key Highlights"), H2))
story.extend(bullets([
    "24/7 automated handling — instant response to every lead on WhatsApp",
    "Budget/intent/timeline qualification filters out tire kickers before they reach your team",
    "Qualified leads booked straight into your calendar; custom dashboard with conversation logs, response times, and booked call stats",
]))

# --- 2. Understanding Your Needs ------------------------------------------
story.append(h1("2. Understanding Your Needs"))
story.append(Paragraph(esc("2.1 Current Situation"), H2))
story.extend(plain([
    "LeadFlow.io is a marketing agency that has run paid ads for local businesses and "
    "ecommerce brands for 3 years. The campaigns generate a decent volume of leads, but the "
    "problem sits on the follow-up side: leads arrive via Facebook lead forms and Instagram "
    "DMs into a shared inbox that the small team checks manually. By the time someone gets "
    "to a lead it has often been hours, and by then the lead has gone cold or messaged a "
    "competitor — a slow lead response time that directly costs signed clients.",
    "Follow-up is also inconsistent: a previous attempt to handle initial responses with a "
    "VA saw messages missed and replies arriving late on weekends. And once campaigns go "
    "live there is no visibility on lead performance — what happened to the leads, how fast "
    "they were answered, and which ones booked.",
]))
story.append(Paragraph(esc("2.2 Goals & Objectives"), H2))
story.extend(plain([
    "LeadFlow.io wants measurable outcomes: respond to every lead instantly instead of "
    "hours later; eliminate inconsistent follow-up — including weekends; filter out unqualified "
    "leads before the team spends time on them; get qualified leads booked into the "
    "calendar automatically; and see exactly what is happening with the leads being paid "
    "for, through a dashboard rather than flying blind.",
]))
story.append(Paragraph(esc("2.3 Key Requirements"), H2))
story.extend(bullets([
    "Instant response on WhatsApp — leads redirected to WhatsApp after form submission, not left in the FB inbox",
    "Qualification flow covering budget/intent/timeline before any booking is made",
    "Booking straight into the calendar once a lead qualifies",
    "Custom dashboard showing conversation logs, response times, and booked call stats",
]))

# --- 3. Proposed Solution -------------------------------------------------
story.append(h1("3. Proposed Solution"))
story.append(Paragraph(esc("3.1 Overview"), H2))
story.extend(plain([
    "LaunchOps AI will build a done-for-you WhatsApp AI agent for LeadFlow.io, deployed on "
    "GoHighLevel (GHL), n8n, and Supabase. After a lead submits a Facebook lead form (or "
    "messages via Instagram DM), the lead is redirected to WhatsApp, where the agent "
    "delivers an instant response, runs the qualification flow, and books qualified leads "
    "into the calendar. Every event is recorded in Supabase and surfaced on a custom "
    "dashboard.",
]))
story.append(Paragraph(esc("3.2 Deliverables"), H2))
story.append(build_table(
    ["Deliverable", "Description", "Timeline"],
    [
        ["WhatsApp AI Agent Build & Training",
         "WhatsApp AI agent delivering an instant response to every inbound lead, running "
         "budget/intent/timeline qualification, and booking qualified leads straight into "
         "the calendar",
         "Days 4–11 after kickoff"],
        ["Lead Redirect & Integrations",
         "Leads from Facebook lead forms and Instagram DMs redirected to WhatsApp after "
         "form submission; GoHighLevel CRM layer, n8n automation, and Supabase data storage "
         "stood up",
         "Within days 4–11 after kickoff"],
        ["Custom Dashboard Setup",
         "Dashboard with conversation logs, response times, and booked call stats — full "
         "visibility on lead performance, filterable by last week or last month",
         "At launch, by day 14"],
    ],
    [104, 266, 98],
))
story.append(Paragraph(esc("3.3 Approach & Methodology"), H2))
story.extend(bullets([
    "Phase 1 — Kickoff & Access Setup: requirements confirmed and access collected — ad "
    "account access, lead form structure, and calendar access — then build kicked off once "
    "the setup fee and signed Service Agreement are in place",
    "Phase 2 — Build & Integration: WhatsApp AI agent built and trained on the "
    "qualification flow; lead redirect wired up across Facebook lead forms and Instagram "
    "DMs; calendar booking connected; GoHighLevel, n8n, and Supabase configured",
    "Phase 3 — Testing, Review & Go-Live: end-to-end testing of response, qualification, "
    "and booking flows, one round of revisions included, then go-live within 14 days of "
    "kickoff",
    "Phase 4 — Optimize & Support: ongoing refinement from real conversations — monitoring, "
    "qualification and objection-handling tweaks, and integration maintenance",
]))
story.append(Paragraph(esc("3.4 Why This Approach"), H2))
story.extend(plain([
    "This approach is done-for-you: LaunchOps AI builds, deploys, and manages everything, so "
    "LeadFlow.io needs no infrastructure to run and no technical staff to hire. It meets "
    "leads where they already are — WhatsApp — with an instant response that removes the "
    "slow lead response time costing you signed clients today. It fits your stack — "
    "GoHighLevel as the CRM layer, n8n for automation and orchestration, and Supabase for a "
    "clean record of every conversation. And it makes performance visible — the custom "
    "dashboard ends the flying-blind period once and for all.",
]))

# --- 4. Investment --------------------------------------------------------
story.append(h1("4. Investment"))
story.append(Paragraph(esc("4.1 Pricing Options"), H2))
story.append(Paragraph(esc("Done-For-You WhatsApp AI Agent + Dashboard (Recommended)"),
                       _st("opt", parent=H2, spaceBefore=2, spaceAfter=6, fontSize=10.5)))
story.append(build_table(
    ["Item", "Price"],
    [
        ["One-time setup fee — build, testing, and deployment of the WhatsApp AI agent, "
         "lead redirect, integrations, and custom dashboard",
         "$3,000"],
        ["Monthly maintenance & optimization — ongoing monitoring, refinement from real "
         "conversations, and integration upkeep",
         "$800 per month"],
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
        "INV-2026-002, currently AWAITING PAYMENT. The monthly maintenance & optimization "
        "retainer of $800 per month is billed on the 1st of each month after go-live; a "
        "payment receipt (RCP-2026-002) is issued via Stripe once the setup fee is paid."),
    NOTE))
story.append(Paragraph(esc("4.2 Payment Terms"), H2))
story.extend(bullets([
    "One-time setup fee of $3,000 USD due before the build begins",
    "Monthly maintenance & optimization fee of $800 per month billed on the 1st of each month",
    "A 5% late fee applies to any invoice more than 5 days past due",
    "Payments processed via Stripe",
]))
story.append(Paragraph(esc("4.3 What's Included"), H2))
story.extend(bullets([
    "Done-for-you build, testing, and deployment of the WhatsApp AI agent — instant "
    "response, budget/intent/timeline qualification, and calendar booking",
    "Lead redirect from Facebook lead forms and Instagram DMs to WhatsApp, plus "
    "GoHighLevel CRM layer, n8n automation and orchestration, and Supabase data storage",
    "Custom dashboard: conversation logs, response times, and booked call stats — "
    "filterable by last week or last month",
    "Ongoing maintenance & optimization: monitoring, refining responses and qualification "
    "handling, and keeping integrations maintained",
]))
story.append(Paragraph(esc("4.4 What's Not Included"), H2))
story.extend(bullets([
    "Major scope additions — new agents, new integrations, or new verticals — are billed "
    "separately",
    "Ad spend and paid media budgets remain with LeadFlow.io; LaunchOps AI manages the "
    "lead handling, not the media buying",
]))

# --- 5. Timeline ----------------------------------------------------------
story.append(KeepTogether([
    h1("5. Timeline"),
    build_table(
        ["Phase", "Duration", "Start", "End"],
        [
            ["Phase 1 — Kickoff & Access Setup\n(ad account access, lead form structure, calendar access)",
             "Days 1–3", "August 23, 2026", "August 25, 2026"],
            ["Phase 2 — Build & Integration\n(agent, lead redirect, dashboard)",
             "Days 4–11", "August 26, 2026", "September 2, 2026"],
            ["Phase 3 — Testing, Review & Go-Live",
             "Days 12–14", "September 3, 2026", "September 5, 2026"],
            ["Total", "14 days", "Kickoff", "Go live September 5, 2026"],
        ],
        [206, 82, 90, 90],
        extra_style=[
            ("FONTNAME", (0, -1), (-1, -1), "Montserrat-Bold"),
            ("BACKGROUND", (0, -1), (-1, -1), LIGHT),
            ("LINEABOVE", (0, -1), (-1, -1), 0.5, GRID),
        ],
    ),
]))
story.extend(plain([
    "Go live within 14 days of kickoff, as agreed on the discovery call of August 20, 2026. "
    "Indicative dates assume kickoff on August 22, 2026, pending the signed Service "
    "Agreement and setup fee; all phases complete well before the proposal expires on "
    "September 22, 2026.",
]))

# --- 6. Why LaunchOps AI --------------------------------------------------
story.append(h1("6. Why LaunchOps AI"))
story.append(Paragraph(esc("6.1 Our Experience"), H2))
story.extend(plain([
    "LaunchOps AI designs, builds, and deploys done-for-you AI agents — voice and text — for "
    "businesses across verticals, answering inbound leads instantly, qualifying them before "
    "human handoff, and booking them automatically. Every deployment is managed end-to-end "
    "on GoHighLevel, n8n, and Supabase, with a real-time dashboard so clients keep full "
    "visibility.",
]))
story.append(Paragraph(esc("6.2 Case Studies"), H2))
story.append(Paragraph(
    "<b>" + esc("Lead Response & Booking Automation.") + "</b> " +
    esc("LaunchOps AI deploys exactly the pattern proposed here: a text AI agent that "
        "answers new leads instantly on their preferred channel, runs a structured "
        "qualification flow, and books qualified leads straight into the calendar — turning "
        "slow manual inboxes into a consistent, measurable pipeline with full dashboard "
        "visibility throughout."),
    BODY))
story.append(KeepTogether([
    Paragraph(esc("6.3 Our Team"), H2),
    build_table(
        ["Name", "Role", "Relevant Experience"],
        [
            ["Abdulrahman Suleiman", "Founder",
             "Founded LaunchOps AI; builds and deploys done-for-you AI agents (voice and text) on "
             "GoHighLevel, n8n, and Supabase for agencies and service businesses"],
        ],
        [104, 74, 290],
    ),
]))

# --- 7. Next Steps --------------------------------------------------------
story.append(h1("7. Next Steps"))
story.extend(bullets([
    "Review this proposal",
    "Sign the Service Agreement (CON-2026-002)",
    "Provide post-signature access: ad account access, lead form structure, and calendar access",
    "Kick off the build once the signed Service Agreement and setup fee are received",
]))

# --- 8. Terms & Conditions ------------------------------------------------
story.append(h1("8. Terms & Conditions"))
story.extend(bullets([
    "This proposal is valid until September 22, 2026.",
    "All pricing is in USD and excludes taxes and additional fees unless stated otherwise.",
    "The one-time setup fee of $3,000 is required to begin the build and is non-refundable once "
    "work has commenced.",
    "One round of revisions is included; further revision rounds are billed at LaunchOps AI's "
    "standard rate.",
    "This proposal is confidential and intended solely for LeadFlow.io.",
    "The engagement runs month-to-month after go-live; either party may end it with 14 days' "
    "written notice.",
    "Upon acceptance, the LaunchOps AI Service Agreement (CON-2026-002) governs the engagement.",
]))

# --- 9. Acceptance & Signatures -------------------------------------------
sec9 = [
    h1("9. Acceptance & Signatures"),
    Paragraph(
        esc("By signing below, both parties accept the terms set forth in this proposal."), BODY),
    Spacer(1, 6),
]


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
    [[sig_block("CLIENT", "Daniel Whitfield", "________________"),
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
story.append(KeepTogether(sec9 + [sig_table]))


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
        title="Proposal — LeadFlow.io",
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
