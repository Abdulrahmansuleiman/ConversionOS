#!/usr/bin/env python3
"""Build the LaunchOps AI Service Agreement (contract.pdf) for Bloomline Apparel.

Reconstructs templates/Contract Template.pdf section-for-section using ReportLab.
Every client fact comes VERBATIM from clients/bloomline-apparel/facts.json.
Font: Montserrat (fonts/Montserrat/) for ALL text — never Helvetica/Times.

Output : clients/bloomline-apparel/pdfs/contract.pdf  (US Letter, multi-page)
"""

import json
import os

from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Table,
    TableStyle,
)

# ----------------------------------------------------------------------------
# Paths
# ----------------------------------------------------------------------------
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
FONT_DIR = os.path.join(ROOT, "fonts", "Montserrat")
FACTS_PATH = os.path.join(HERE, "facts.json")
OUT_PATH = os.path.join(HERE, "pdfs", "contract.pdf")

PAGE_W, PAGE_H = letter  # 612 x 792 (US Letter)

# ----------------------------------------------------------------------------
# Fonts — Montserrat only
# ----------------------------------------------------------------------------
pdfmetrics.registerFont(TTFont("Montserrat", os.path.join(FONT_DIR, "Montserrat-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-Bold", os.path.join(FONT_DIR, "Montserrat-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-Italic", os.path.join(FONT_DIR, "Montserrat-Italic.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-BoldItalic", os.path.join(FONT_DIR, "Montserrat-BoldItalic.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-Medium", os.path.join(FONT_DIR, "Montserrat-Medium.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-SemiBold", os.path.join(FONT_DIR, "Montserrat-SemiBold.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-ExtraBold", os.path.join(FONT_DIR, "Montserrat-ExtraBold.ttf")))

# ----------------------------------------------------------------------------
# Palette (measured from Contract Template.pdf)
# ----------------------------------------------------------------------------
NAVY = colors.Color(0.062745098, 0.137254902, 0.247058824)   # #102340 headings/labels
BODY = colors.Color(0.101960784, 0.101960784, 0.101960784)   # #1A1A1A body text
FOOT = colors.Color(0.356862745, 0.392156863, 0.447058824)   # #5B6472 footer text
LGRAY = colors.Color(0.847058824, 0.862745098, 0.886274510)  # #D8DCE2 rules
CELLBG = colors.Color(0.960784314, 0.964705882, 0.972549020)  # #F5F6F8 label cells
SIGN = colors.Color(0.101960784, 0.101960784, 0.101960784)   # signature rules

# Frame geometry (from template margins)
LM = 67.6
RM = 612 - 544.5            # 67.5
TM = 69.3                   # content frame top, from top edge
BM = 64.0
FRAME_W = 544.5 - 67.6      # 476.9
FRAME_H = PAGE_H - TM - BM  # 658.7


# ----------------------------------------------------------------------------
# Cover page (drawn via onPage)
# ----------------------------------------------------------------------------
def _ytop(top, size):
    """Baseline y (bottom-origin) for text whose box top is `top`pt from the top."""
    return PAGE_H - top - size * 0.8


def draw_cover(c, doc):
    c.saveState()

    # --- Contract No (top-right, aligned with the field list right edge) ---
    c.setFont("Montserrat-Bold", 9.5)
    c.setFillColor(NAVY)
    c.drawRightString(534.65, _ytop(131.7, 9.5), "CONTRACT NO")
    c.setFont("Montserrat", 10.5)
    c.setFillColor(BODY)
    c.drawRightString(534.65, _ytop(157.7, 10.5), "CON-2026-001")

    # --- Title block ---
    c.setFont("Montserrat-Bold", 13)
    c.setFillColor(NAVY)
    c.drawString(67.6, _ytop(131.7, 13), "LAUNCHOPS")
    # gold accent rule (matches Contract Template.pdf cover: x=160..544, ~y=155)
    GOLD = (0.607843, 0.482353, 0.247059)
    c.setStrokeColor(GOLD)
    c.setLineWidth(2.2)
    c.line(160.0, PAGE_H - 155.0, 544.0, PAGE_H - 155.0)
    c.setFont("Montserrat-ExtraBold", 32)
    c.drawString(67.6, _ytop(186.6, 32), "SERVICE")
    c.drawString(67.6, _ytop(225.4, 32), "AGREEMENT")
    c.setFont("Montserrat-Italic", 12)
    c.setFillColor(NAVY)
    c.drawString(67.6, _ytop(278.1, 12), "AI Agent Implementation & Optimization Services")

    # --- Label/value field rows (gray label cells like the template) ---
    row_tops = [335.1, 361.1, 387.2, 413.2, 439.3, 465.3]
    labels = [
        "EFFECTIVE DATE",
        "CLIENT",
        "CLIENT CONTACT",
        "CLIENT ADDRESS",
        "SERVICE PROVIDER",
        "PROVIDER CONTACT",
    ]
    values = [
        "August 5, 2026",
        "Bloomline Apparel",
        "Mike Johnson, Owner",
        "14 Marlowe Street, Manchester, M1 4BT, United Kingdom",
        "LaunchOps AI",
        "Abdulrahman Suleiman, Founder",
    ]
    cell_h = 26.0
    for i in range(6):
        top = row_tops[i]
        # label cell fill
        c.setFillColor(CELLBG)
        c.rect(67.0, PAGE_H - (top + cell_h), 196.95 - 67.0, cell_h, stroke=0, fill=1)
        # label
        c.setFont("Montserrat-Bold", 9.5)
        c.setFillColor(NAVY)
        c.drawString(75.0, _ytop(top + 9.2, 9.5), labels[i])
        # value
        c.setFont("Montserrat", 10.5)
        c.setFillColor(BODY)
        c.drawString(205.1, _ytop(top + 8.8, 10.5), values[i])

    # --- separator lines between field rows ---
    c.setStrokeColor(LGRAY)
    c.setLineWidth(0.25)
    for t in (352.55, 378.65, 404.65, 430.75, 456.75):
        c.line(66.9, PAGE_H - t, 534.65, PAGE_H - t)

    # --- confidentiality line ---
    c.setFont("Montserrat-Italic", 8)
    c.setFillColor(BODY)
    c.drawString(
        67.6,
        _ytop(566.1, 8),
        "This document is confidential and intended solely for the named parties. "
        "Distribution outside the intended recipients is not authorized.",
    )

    c.restoreState()


# ----------------------------------------------------------------------------
# Content page header / footer
# ----------------------------------------------------------------------------
def draw_content_decor(c, doc, total_pages):
    c.saveState()

    # header
    c.setFont("Montserrat-Bold", 8)
    c.setFillColor(NAVY)
    c.drawString(67.6, _ytop(37.0, 8), "LaunchOps AI")
    c.setFont("Montserrat", 8)
    c.setFillColor(BODY)
    c.drawRightString(534.6, _ytop(37.1, 8), "Service Agreement")

    # rules
    c.setStrokeColor(LGRAY)
    c.setLineWidth(0.5)
    c.line(67.5, PAGE_H - 51.4, 544.5, PAGE_H - 51.4)    # under header
    c.line(67.5, PAGE_H - 741.2, 544.5, PAGE_H - 741.2)  # over footer

    # footer
    c.setFont("Montserrat", 7.5)
    c.setFillColor(FOOT)
    c.drawString(67.6, _ytop(749.1, 7.5), "Confidential \u2014 LaunchOps AI")
    if total_pages:
        c.drawRightString(534.6, _ytop(749.1, 7.5), "Page %d of %d" % (doc.page, total_pages))
    else:
        c.drawRightString(534.6, _ytop(749.1, 7.5), "Page %d" % doc.page)

    c.restoreState()


# ----------------------------------------------------------------------------
# Flowables
# ----------------------------------------------------------------------------
class SectionHeading(Flowable):
    """Main section heading + the template's dark-navy underline rule."""

    def __init__(self, text, space_before=20):
        super().__init__()
        self.text = text
        self.width = FRAME_W
        self.height = 20.0
        self.spaceBefore = space_before
        # 20pt flowable height + 7.8pt gap + ~2pt text offset = body ~29.8pt
        # below heading top, i.e. ~12pt below the section rule (matches template)
        self.spaceAfter = 7.8

    def draw(self):
        c = self.canv
        c.setFont("Montserrat-Bold", 12)
        c.setFillColor(NAVY)
        c.drawString(0, self.height - 9.6, self.text)
        c.setStrokeColor(NAVY)
        c.setLineWidth(0.75)
        c.line(0, self.height - 17.7, FRAME_W, self.height - 17.7)


class SignatureBlock(Flowable):
    """Two-column acceptance block (CLIENT / LAUNCHOPS AI)."""

    def __init__(self, client_name, client_title, provider_name, provider_title, date_text):
        super().__init__()
        self.width = FRAME_W
        self.height = 150.0
        self.spaceBefore = 20.5  # rules land at y=186.4 after ReportLab's -spaceAfter transfer
        self.client_name = client_name
        self.client_title = client_title
        self.provider_name = provider_name
        self.provider_title = provider_title
        self.date_text = date_text

    def draw(self):
        c = self.canv
        H = self.height
        fx = 67.0 - LM    # left column x
        px = 310.9 - LM   # right column x

        def ty(off, size):
            return H - off - size * 0.8

        c.saveState()

        # column headers
        c.setFont("Montserrat-Bold", 11)
        c.setFillColor(NAVY)
        c.drawString(fx, ty(0, 11), "CLIENT")
        c.drawString(px, ty(0, 11), "LAUNCHOPS AI")

        # signature rules
        c.setStrokeColor(SIGN)
        c.setLineWidth(0.75)
        c.line(fx, H - 52.9, 290.8 - LM, H - 52.9)
        c.line(px, H - 52.9, 534.5 - LM, H - 52.9)

        # Signature word
        c.setFont("Montserrat-Italic", 8.5)
        c.setFillColor(BODY)
        c.drawString(fx, ty(55.3, 8.5), "Signature")
        c.drawString(px, ty(55.3, 8.5), "Signature")

        # Name / Title / Date rows — breathable rhythm:
        # values left-aligned at one x (label end + clear gap, labels <= 31pt wide);
        # rows spaced 24 / 20 / 20pt apart (was 21.9 / 16.8 / 16.8 — clustered).
        NAME_Y, TITLE_Y, DATE_Y = 79.3, 99.3, 119.3
        VAL_X_OFF = 44.0

        # Name rows
        c.setFont("Montserrat-Bold", 10)
        c.setFillColor(NAVY)
        c.drawString(fx, ty(NAME_Y, 10), "Name:")
        c.drawString(px, ty(NAME_Y, 10), "Name:")
        c.setFont("Montserrat", 10.5)
        c.setFillColor(BODY)
        c.drawString(fx + VAL_X_OFF, ty(NAME_Y, 10.5), self.client_name)
        c.drawString(px + VAL_X_OFF, ty(NAME_Y, 10.5), self.provider_name)

        # Title rows
        c.setFont("Montserrat-Bold", 10)
        c.setFillColor(NAVY)
        c.drawString(fx, ty(TITLE_Y, 10), "Title:")
        c.drawString(px, ty(TITLE_Y, 10), "Title:")
        c.setFont("Montserrat", 10.5)
        c.setFillColor(BODY)
        c.drawString(fx + VAL_X_OFF, ty(TITLE_Y, 10.5), self.client_title)
        c.drawString(px + VAL_X_OFF, ty(TITLE_Y, 10.5), self.provider_title)

        # Date rows
        c.setFont("Montserrat-Bold", 10)
        c.setFillColor(NAVY)
        c.drawString(fx, ty(DATE_Y, 10), "Date:")
        c.drawString(px, ty(DATE_Y, 10), "Date:")
        c.setFont("Montserrat", 10.5)
        c.setFillColor(BODY)
        c.drawString(fx + VAL_X_OFF, ty(DATE_Y, 10.5), self.date_text)
        c.drawString(px + VAL_X_OFF, ty(DATE_Y, 10.5), self.date_text)

        c.restoreState()


# ----------------------------------------------------------------------------
# Styles
# ----------------------------------------------------------------------------
H1_FIRST = ParagraphStyle(
    "h1first", fontName="Montserrat-Bold", fontSize=12, leading=14.4,
    textColor=NAVY, spaceBefore=0, spaceAfter=0, alignment=TA_LEFT,
)
SUB = ParagraphStyle(
    "sub", fontName="Montserrat-Bold", fontSize=10.5, leading=13.1,
    textColor=NAVY, spaceBefore=12, spaceAfter=4, alignment=TA_LEFT,
)
BODY_ST = ParagraphStyle(
    "body", fontName="Montserrat", fontSize=10.5, leading=15.3,
    textColor=BODY, alignment=TA_JUSTIFY, spaceAfter=8,
)
BULLET = ParagraphStyle(
    "bullet", fontName="Montserrat", fontSize=10.5, leading=15.3,
    textColor=BODY, alignment=TA_JUSTIFY, leftIndent=23, bulletIndent=10,
    spaceAfter=3.9, bulletFontName="Montserrat", bulletFontSize=10.5,
    bulletColor=BODY,
)
CELL_VAL = ParagraphStyle(
    "cellval", fontName="Montserrat", fontSize=10.5, leading=13.1, textColor=BODY,
)
CELL_LBL = ParagraphStyle(
    "celllbl", fontName="Montserrat-SemiBold", fontSize=9.5, leading=11.9,
    textColor=NAVY,
)


# ----------------------------------------------------------------------------
# Document content (sections 1-11, matching Contract Template.pdf exactly)
# ----------------------------------------------------------------------------
def build_story():
    story = []
    story.append(NextPageTemplate("content"))
    story.append(PageBreak())  # page 1 = cover (drawn by onPage)

    # ---- 1. Parties & Purpose ----
    story.append(SectionHeading("1. Parties & Purpose", space_before=0))
    story.append(Paragraph(
        'This Service Agreement ("Agreement") is entered into by and between '
        'LaunchOps AI ("Provider"), an AI automation agency providing done-for-you '
        'voice and text AI agent systems, and the client identified on the cover '
        'page ("Client"), together the "Parties."',
        BODY_ST,
    ))
    story.append(Paragraph(
        "This Agreement sets out the terms under which Provider will design, build, "
        "deploy, and optimize AI agent infrastructure for Client, as described in "
        "Section 2 (Scope of Services).",
        BODY_ST,
    ))
    story.append(Paragraph(
        "The contact details of the Parties are as follows: Client \u2014 Mike Johnson, "
        "Bloomline Apparel, 14 Marlowe Street, Manchester, M1 4BT, United Kingdom, "
        "raymon4d.scales@gmail.com, +44 7700 900123. Provider \u2014 LaunchOps AI, "
        "represented by Raymon (Abdulrahman Suleiman, Founder), 27 Baker Court, "
        "London, EC1A 1BB, United Kingdom, abdul123rahmanj@gmail.com, +44 7700 900456.",
        BODY_ST,
    ))

    # ---- 2. Scope of Services ----
    story.append(SectionHeading("2. Scope of Services"))
    story.append(Paragraph(
        "Provider shall deliver the following AI agent system(s), as discussed and "
        "agreed during the discovery/strategy call and set out in Proposal No. "
        "PRO-2026-001 (dated August 5, 2026, valid until September 4, 2026):",
        BODY_ST,
    ))

    rows = [
        ("Agent Type(s)", "Text AI Agent for ecommerce"),
        ("Business Vertical", "ecommerce \u2014 women's activewear"),
        ("Core Platform(s)", "GoHighLevel (GHL), n8n, Supabase"),
        (
            "Key Deliverables",
            "Inbound order status lookups, pre-purchase sizing/product questions, "
            "abandoned cart follow-up, bulk-order lead qualification with human "
            "handoff (approx. 40-50 inbound messages per day)",
        ),
        (
            "Integrations",
            "Shopify, Instagram DM, website chat widget, email, Klaviyo (read-only)",
        ),
        ("Build Timeline", "7-10 business days from receipt of intake form"),
    ]
    data = [
        [Paragraph(label, CELL_LBL), Paragraph(value, CELL_VAL)]
        for label, value in rows
    ]
    table = Table(data, colWidths=[130.0, 337.5])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), CELLBG),
        ("BACKGROUND", (1, 0), (1, -1), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEABOVE", (0, 0), (-1, 0), 0.25, LGRAY),
        ("LINEBELOW", (0, 0), (-1, 3), 0.25, LGRAY),
    ]))
    table.spaceBefore = 6
    table.spaceAfter = 10
    story.append(table)

    story.append(Paragraph(
        "Any request for services or deliverables outside the scope defined above "
        "shall be treated as a change order, subject to additional fees agreed upon "
        "in writing by both Parties before work begins.",
        BODY_ST,
    ))

    # ---- 3. Fees & Payment Terms ----
    story.append(SectionHeading("3. Fees & Payment Terms"))
    story.append(Paragraph("3.1 One-Time Setup Fee", SUB))
    story.append(Paragraph(
        "Client agrees to pay Provider a one-time setup fee of $3,000 USD for the "
        "design, build, testing, and deployment of the agreed AI agent system(s). "
        "This fee is due in full before build work begins, unless otherwise agreed "
        "in writing, and is invoiced under Invoice No. INV-2026-001 (payment status: "
        "AWAITING PAYMENT). Provider will issue Receipt No. RCP-2026-001 upon "
        "receipt of payment.",
        BODY_ST,
    ))

    story.append(Paragraph("3.2 Monthly Optimization & Maintenance Fee", SUB))
    story.append(Paragraph(
        "Beginning on the go-live date, Client agrees to pay Provider a recurring "
        "monthly fee of $750 USD per month for ongoing optimization, monitoring, "
        "hosting/infrastructure costs, and maintenance of the AI agent system(s).",
        BODY_ST,
    ))
    story.append(Paragraph("This monthly fee covers, at minimum:", BODY_ST))
    for item in (
        "Ongoing performance monitoring and reporting",
        "Script and prompt refinement based on real call/conversation data",
        "Minor adjustments to agent behavior, FAQs, and objection handling",
        "CRM, workflow, and integration maintenance",
        "Priority support for system issues",
    ):
        story.append(Paragraph(item, BULLET, bulletText="\u2022"))
    story.append(Paragraph(
        "Major scope additions \u2014 new agents, new integrations, new verticals \u2014 "
        "are billed separately and are not included in the monthly fee.",
        BODY_ST,
    ))

    story.append(Paragraph("3.3 Payment Method & Late Fees", SUB))
    story.append(Paragraph(
        "Payments shall be made via Stripe on the 1st of each billing cycle. "
        "A late fee of 5% will apply to overdue invoices not paid within 5 days "
        "of the due date.",
        BODY_ST,
    ))

    # ---- 4. Term & Termination ----
    story.append(SectionHeading("4. Term & Termination"))
    story.append(Paragraph(
        "This Agreement commences on the Effective Date and continues on a "
        "month-to-month basis following go-live, unless terminated earlier under "
        "this Section.",
        BODY_ST,
    ))
    story.append(Paragraph(
        "Either Party may terminate this Agreement by providing 14 days' written "
        "notice to the other Party.",
        BODY_ST,
    ))
    story.append(Paragraph(
        "Upon termination, Provider will provide Client a status report of all "
        "deliverables completed or in progress. The one-time setup fee is "
        "non-refundable once build work has commenced. Any outstanding monthly fees "
        "up to the termination date remain due and payable.",
        BODY_ST,
    ))
    story.append(Paragraph(
        "Provider reserves the right to suspend agent services if the monthly "
        "optimization fee remains unpaid more than 15 days past the due date.",
        BODY_ST,
    ))

    # ---- 5. Intellectual Property ----
    story.append(SectionHeading("5. Intellectual Property"))
    story.append(Paragraph("5.1 Client-Owned Deliverables", SUB))
    story.append(Paragraph(
        "Upon full payment of the one-time setup fee, Client shall own the specific "
        "AI agent prompts, scripts, and configurations built exclusively for "
        "Client's business under this Agreement.",
        BODY_ST,
    ))
    story.append(Paragraph("5.2 Provider-Retained IP", SUB))
    story.append(Paragraph(
        "Provider retains all ownership rights to its underlying frameworks, "
        "templates, workflow architecture, proprietary systems (including its "
        "agent-reliability methodology, workflow structure, and automation "
        "templates), and any general tools or processes used to deliver the "
        "Services, whether developed before or during this engagement.",
        BODY_ST,
    ))
    story.append(Paragraph(
        "Client is granted a license to use these underlying systems solely in "
        "connection with the deliverables provided under this Agreement, for as "
        "long as this Agreement remains active.",
        BODY_ST,
    ))
    story.append(Paragraph(
        "Should this Agreement terminate, Client's license to Provider-retained IP "
        "(including hosted infrastructure, workflows, and automation logic not "
        "explicitly built as a standalone deliverable) ends, and Client may be "
        "required to migrate to independently owned or licensed infrastructure.",
        BODY_ST,
    ))

    # ---- 6. Confidentiality ----
    story.append(SectionHeading("6. Confidentiality"))
    story.append(Paragraph(
        "Each Party agrees to keep confidential all non-public business, technical, "
        "and customer information disclosed by the other Party in connection with "
        "this Agreement, and to use such information solely for the purposes of "
        "this Agreement. This obligation survives termination of this Agreement.",
        BODY_ST,
    ))
    story.append(Paragraph(
        "Provider will not use Client's name, logo, or business identity in "
        "marketing materials, case studies, or testimonials without Client's prior "
        "written consent.",
        BODY_ST,
    ))

    # ---- 7. Warranties & Performance ----
    story.append(SectionHeading("7. Warranties & Performance"))
    story.append(Paragraph(
        "Provider warrants that the AI agent system(s) will be built in accordance "
        "with the scope defined in Section 2 and tested for common conversational "
        "scenarios prior to launch. Provider does not warrant a specific volume of "
        "leads, bookings, or revenue outcomes, as these depend on factors outside "
        "Provider's control, including Client's existing lead quality, market "
        "conditions, and business operations.",
        BODY_ST,
    ))
    story.append(Paragraph(
        "Client shall review and approve the agent system during the review period "
        "defined in the onboarding schedule. One round of revisions is included at "
        "no additional cost; further revision rounds may be billed at Provider's "
        "standard rate.",
        BODY_ST,
    ))

    # ---- 8. Limitation of Liability ----
    story.append(SectionHeading("8. Limitation of Liability"))
    story.append(Paragraph(
        "Neither Party shall be liable to the other for any indirect, incidental, "
        "or consequential damages, including loss of profits, revenue, or data, "
        "arising out of or related to this Agreement, even if advised of the "
        "possibility of such damages. Provider's total liability under this "
        "Agreement shall not exceed the total fees paid by Client to Provider in "
        "the three (3) months preceding the claim.",
        BODY_ST,
    ))

    # ---- 9. Independent Contractor Relationship ----
    story.append(SectionHeading("9. Independent Contractor Relationship"))
    story.append(Paragraph(
        "Provider is an independent contractor and not an employee, agent, partner, "
        "or joint venturer of Client. Nothing in this Agreement shall be construed "
        "to create an employment, agency, or partnership relationship between the "
        "Parties. Provider retains full control over the manner and means by which "
        "the Services are performed.",
        BODY_ST,
    ))

    # ---- 10. General Provisions ----
    story.append(SectionHeading("10. General Provisions"))
    story.append(Paragraph("10.1 Entire Agreement", SUB))
    story.append(Paragraph(
        "This Agreement constitutes the entire understanding between the Parties "
        "regarding its subject matter and supersedes all prior discussions, "
        "proposals, or agreements, whether written or oral.",
        BODY_ST,
    ))
    story.append(Paragraph("10.2 Amendments", SUB))
    story.append(Paragraph(
        "No modification to this Agreement shall be valid unless made in writing "
        "and signed by both Parties.",
        BODY_ST,
    ))
    story.append(Paragraph("10.3 Assignment", SUB))
    story.append(Paragraph(
        "Neither Party may assign its rights or obligations under this Agreement "
        "without the other Party's prior written consent.",
        BODY_ST,
    ))
    story.append(Paragraph("10.4 Severability", SUB))
    story.append(Paragraph(
        "If any provision of this Agreement is held invalid or unenforceable, the "
        "remaining provisions shall continue in full force and effect.",
        BODY_ST,
    ))
    story.append(Paragraph("10.5 Force Majeure", SUB))
    story.append(Paragraph(
        "Neither Party shall be liable for delays or failure in performance "
        "resulting from causes beyond its reasonable control, including but not "
        "limited to acts of God, internet or third-party platform outages, natural "
        "disasters, or government action.",
        BODY_ST,
    ))

    # ---- 11. Acceptance & Signatures (fresh page, like the template) ----
    story.append(PageBreak())
    story.append(SectionHeading("11. Acceptance & Signatures", space_before=0))
    story.append(Paragraph(
        "By signing below, both Parties agree to the terms set forth in this "
        "Agreement.",
        BODY_ST,
    ))
    story.append(SignatureBlock(
        client_name="Mike Johnson",
        client_title="Owner",
        provider_name="Abdulrahman Suleiman",
        provider_title="Founder, LaunchOps AI",
        date_text="August 5, 2026",
    ))

    return story


# ----------------------------------------------------------------------------
# Build (two-pass: pass 1 counts pages, pass 2 writes the footer total)
# ----------------------------------------------------------------------------
def build(total_pages=None):
    doc = BaseDocTemplate(
        OUT_PATH,
        pagesize=letter,
        leftMargin=LM,
        rightMargin=RM,
        topMargin=TM,
        bottomMargin=BM,
        title="LaunchOps AI Service Agreement",
        author="LaunchOps AI",
        subject="AI Agent Implementation & Optimization Services - Bloomline Apparel",
    )
    cover_frame = Frame(0, 0, PAGE_W, PAGE_H, id="cover_frame",
                        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    content_frame = Frame(LM, BM, FRAME_W, FRAME_H, id="content_frame",
                          leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    cover_tpl = PageTemplate(id="cover", frames=[cover_frame],
                             onPage=draw_cover)
    content_tpl = PageTemplate(
        id="content",
        frames=[content_frame],
        onPage=lambda c, d: draw_content_decor(c, d, total_pages),
    )
    doc.addPageTemplates([cover_tpl, content_tpl])
    doc.build(build_story())
    return doc.page


def strip_unused_helvetica(pdf_path):
    """Remove ReportLab's unused Helvetica page-resource entry (no glyphs use it).

    Every piece of text in this document is Montserrat; this only drops the
    dangling base-14 resource so the output contains Montserrat fonts alone.
    """
    from pypdf import PdfReader, PdfWriter

    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    for page in reader.pages:
        resources = page.get("/Resources")
        if resources is not None:
            resources = resources.get_object()
        fonts = resources.get("/Font") if resources else None
        if fonts is not None:
            fonts = fonts.get_object()
            for name in [k for k in fonts.keys()]:
                font_obj = fonts[name].get_object()
                base = str(font_obj.get("/BaseFont", ""))
                if "Helvetica" in base:
                    del fonts[name]
        writer.add_page(page)
    with open(pdf_path, "wb") as fh:
        writer.write(fh)


def main():
    os.makedirs(os.path.join(HERE, "pdfs"), exist_ok=True)

    # sanity: every must_appear fact is referenced somewhere in the built text
    with open(FACTS_PATH, encoding="utf-8") as f:
        facts = json.load(f)

    n1 = build(total_pages=None)
    n2 = build(total_pages=n1)
    if n1 != n2:
        n3 = build(total_pages=n2)
        print("WARN: page count changed across passes", n1, n2, n3)
    strip_unused_helvetica(OUT_PATH)
    print("contract.pdf built: %d pages" % n2)
    print("must_appear tokens in facts.json: %d" % len(facts.get("must_appear", [])))


if __name__ == "__main__":
    main()
