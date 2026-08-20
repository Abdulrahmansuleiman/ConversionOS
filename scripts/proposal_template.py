#!/usr/bin/env python3
"""Generate the LaunchOps Proposal Template.pdf.

Builds a template-matching proposal (cover + numbered body sections) in the
same visual language as the Contract / Invoice / Receipt templates.
Run:  python scripts/proposal_template.py  ->  templates/Proposal Template.pdf
"""

import os

from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas as canvaslib
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "templates", "Proposal Template.pdf")

# ---- LaunchOps palette (matches Contract / Invoice / Receipt) ----
GOLD = colors.HexColor("#B79A5B")
SLATE = colors.HexColor("#4A5F74")
NAVY = colors.HexColor("#1F3864")
DARK = colors.HexColor("#222222")
GRAY = colors.HexColor("#9A9A9A")
RULE = colors.HexColor("#C8C8C8")

PAGE = letter
W, H = PAGE
ML, MR, MT, MB = 1.0 * inch, 0.9 * inch, 0.85 * inch, 0.8 * inch
CW = W - ML - MR  # content width


# ---------------------------------------------------------------- canvas
class NumberedCanvas(canvaslib.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_footer(num_pages)
            super().showPage()
        super().save()

    def draw_page_footer(self, page_count):
        if self._pageNumber == 1:
            return
        self.setFont("Helvetica", 8)
        self.setFillColor(GRAY)
        self.drawRightString(W - MR, 0.55 * inch, f"Page {self._pageNumber} of {page_count}")


# ---------------------------------------------------------------- styles
def st(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.8, leading=14, textColor=DARK)
    base.update(kw)
    return ParagraphStyle(name, **base)


S_WORDMARK = st("wordmark", fontName="Helvetica-Bold", fontSize=19, leading=22, textColor=DARK)
S_TITLE = st("title", fontName="Helvetica-Bold", fontSize=36, leading=40, textColor=DARK)
S_SUBTITLE = st("subtitle", fontSize=13, leading=17, textColor=DARK)
S_H1 = st("h1", fontName="Helvetica-Bold", fontSize=13.5, leading=16, textColor=NAVY, spaceBefore=16, spaceAfter=2)
S_H2 = st("h2", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=NAVY, spaceBefore=10, spaceAfter=3)
S_BODY = st("body", alignment=TA_JUSTIFY, spaceAfter=7)
S_BULLET = st("bullet", alignment=TA_JUSTIFY, leftIndent=16, bulletIndent=6, spaceAfter=5)
S_LABEL = st("lab", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=colors.white)
S_VALUE = st("val", fontSize=9.5, leading=13, textColor=DARK)
S_SMALL = st("small", fontSize=8, leading=11, textColor=GRAY)
S_THEAD = st("thead", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=colors.white)
S_TCELL = st("tcell", fontSize=9.3, leading=12, textColor=DARK)
S_SIG = st("sig", fontSize=10, leading=14, textColor=DARK, alignment=1)


def bullets(items):
    return [
        Paragraph(t, S_BULLET, bulletText="\u2014") for t in items
    ]


def body_table(header, rows, widths):
    data = [[Paragraph(h, S_THEAD) for h in header]]
    for row in rows:
        data.append([Paragraph(c, S_TCELL) for c in row])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F5F7")]),
                ("GRID", (0, 0), (-1, -1), 0.4, RULE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


# ---------------------------------------------------------------- page templates
def cover_page(canv, doc):
    canv.saveState()
    canv.setFont("Helvetica", 8)
    canv.setFillColor(GRAY)
    canv.drawCentredString(W / 2.0, 0.55 * inch,
                           "This document is confidential and intended solely for the named parties. "
                           "Distribution outside the intended recipients is not authorized.")
    canv.restoreState()


def body_page(canv, doc):
    canv.saveState()
    canv.setFont("Helvetica", 9.5)
    canv.setFillColor(DARK)
    canv.drawString(ML, H - 0.55 * inch, "LaunchOps AI")
    canv.drawRightString(W - MR, H - 0.55 * inch, "Proposal")
    canv.setStrokeColor(RULE)
    canv.setLineWidth(0.5)
    canv.line(ML, 0.8 * inch, W - MR, 0.8 * inch)
    canv.setFont("Helvetica", 8)
    canv.setFillColor(GRAY)
    canv.drawString(ML, 0.55 * inch, "Confidential — LaunchOps AI")
    canv.restoreState()


# ---------------------------------------------------------------- cover
def cover_story():
    story = []
    story.append(Spacer(1, 0.9 * inch))
    story.append(Paragraph("LAUNCHOPS", S_WORDMARK))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width=CW, thickness=2.4, color=GOLD, spaceBefore=2, spaceAfter=26))
    story.append(Paragraph("PROPOSAL", S_TITLE))
    story.append(Spacer(1, 6))
    story.append(Paragraph("AI Agent Implementation & Optimization Services", S_SUBTITLE))
    story.append(Spacer(1, 0.75 * inch))

    cover_rows = [
        ("Proposal No", "[Proposal No]"),
        ("Date", "[Date]"),
        ("Valid Until", "[Date]"),
        ("Prepared For", "[Client Company Name]"),
        ("Client Contact", "[Client Contact Name & Title]"),
        ("Client Address", "[Client Business Address]"),
        ("Service Provider", "LaunchOps AI"),
        ("Provider Contact", "[Your Name / Title]"),
    ]
    data = [[Paragraph(k, S_LABEL), Paragraph(v, S_VALUE)] for k, v in cover_rows]
    t = Table(data, colWidths=[1.75 * inch, 3.5 * inch])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), SLATE),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (1, 0), (1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LINEBELOW", (1, 0), (1, -1), 0.5, RULE),
                ("BOX", (0, 0), (-1, -1), 0.4, RULE),
            ]
        )
    )
    story.append(t)
    return story


# ---------------------------------------------------------------- body
def body_story():
    s = []

    def h1(text):
        s.append(Paragraph(text, S_H1))
        s.append(HRFlowable(width=CW, thickness=0.6, color=RULE, spaceBefore=1, spaceAfter=6))

    def h2(text):
        s.append(Paragraph(text, S_H2))

    def p(text):
        s.append(Paragraph(text, S_BODY))

    # 1. Executive Summary
    h1("1. Executive Summary")
    p("LaunchOps AI is pleased to present this proposal to [Client Company Name]. "
      "We will design, build, and deploy [e.g., a done-for-you voice/text AI agent system] that "
      "[primary business outcome, e.g., answers every inbound call, qualifies leads, books appointments, "
      "and follows up automatically without adding headcount].")
    p("[2–3 paragraph overview of the opportunity, the proposed solution, and the key benefits. "
      "This section should be compelling enough to stand alone.]")
    s.append(Paragraph("Key Highlights", S_H2))
    s.extend(bullets([
        "[Highlight 1, e.g., 24/7 automated inbound handling]",
        "[Highlight 2, e.g., leads captured, qualified, and booked into your calendar]",
        "[Highlight 3, e.g., AI-driven follow-ups that close more of your pipeline]",
    ]))

    # 2. Understanding Your Needs
    h1("2. Understanding Your Needs")
    h2("2.1 Current Situation")
    p("[Describe the client's current state and challenges — what happens today when a customer calls, "
      "messages, or submits a form, and what is being missed.]")
    h2("2.2 Goals & Objectives")
    p("[What the client wants to achieve — measurable outcomes, e.g., never miss a call, book more "
      "appointments, reduce response time, qualify leads before handoff.]")
    h2("2.3 Key Requirements")
    s.extend(bullets([
        "[Requirement 1]",
        "[Requirement 2]",
        "[Requirement 3]",
    ]))

    # 3. Proposed Solution
    h1("3. Proposed Solution")
    h2("3.1 Overview")
    p("LaunchOps AI will build a done-for-you AI agent system for [Client Company Name], deployed on "
      "GoHighLevel (GHL), n8n, Retell AI, and Supabase, trained on your business data and tuned to your "
      "real calls and conversations.")
    h2("3.2 Deliverables")
    s.append(body_table(
        ["Deliverable", "Description", "Timeline"],
        [
            ["[Deliverable 1]", "[Description]", "[When]"],
            ["[Deliverable 2]", "[Description]", "[When]"],
            ["[Deliverable 3]", "[Description]", "[When]"],
        ],
        [1.7 * inch, 2.8 * inch, 1.3 * inch],
    ))
    s.append(Spacer(1, 4))
    h2("3.3 Approach & Methodology")
    s.extend(bullets([
        "Phase 1 — Discovery & Intake: [requirements, intake form, script/prompt kickoff]",
        "Phase 2 — Build & Train: [agent build, workflows, CRM/calendar integration]",
        "Phase 3 — Review & Launch: [testing, one round of revisions, go-live]",
        "Phase 4 — Optimize & Support: [refinement from real conversation data]",
    ]))
    h2("3.4 Why This Approach")
    p("[Explain why this is the right fit — done-for-you delivery, no infrastructure to manage, "
      "fast time-to-launch, ongoing optimization.]")

    # 4. Investment
    h1("4. Investment")
    h2("4.1 Pricing Options")
    p("[Option A — Name]", )
    s.append(body_table(
        ["Item", "Price"],
        [
            ["[Service / Product]", "$[X,XXX]"],
            ["[Service / Product]", "$[X,XXX]"],
            ["Total", "$[X,XXX]"],
        ],
        [4.6 * inch, 1.5 * inch],
    ))
    s.append(Spacer(1, 4))
    s.append(Paragraph("Option B — [Name] (Recommended)", S_H2))
    s.append(body_table(
        ["Item", "Price"],
        [
            ["[Service / Product]", "$[X,XXX]"],
            ["[Service / Product]", "$[X,XXX]"],
            ["Total", "$[X,XXX]"],
        ],
        [4.6 * inch, 1.5 * inch],
    ))
    s.append(Spacer(1, 4))
    h2("4.2 Payment Terms")
    s.extend(bullets([
        "[Payment schedule, e.g., one-time setup fee billed at signature; monthly optimization fee billed monthly]",
        "[Payment methods accepted, e.g., bank transfer / Stripe]",
    ]))
    h2("4.3 What's Included")
    s.extend(bullets([
        "[Inclusion 1]",
        "[Inclusion 2]",
        "[Inclusion 3]",
    ]))
    h2("4.4 What's Not Included")
    s.extend(bullets([
        "[Exclusion 1]",
        "[Exclusion 2 — major scope additions (new agents, new integrations, new verticals) are billed separately]",
    ]))

    # 5. Timeline
    h1("5. Timeline")
    s.append(body_table(
        ["Phase", "Duration", "Start", "End"],
        [
            ["[Phase 1]", "[X weeks]", "[Date]", "[Date]"],
            ["[Phase 2]", "[X weeks]", "[Date]", "[Date]"],
            ["[Phase 3]", "[X weeks]", "[Date]", "[Date]"],
            ["Total", "[X weeks]", "", ""],
        ],
        [2.0 * inch, 1.3 * inch, 1.3 * inch, 1.3 * inch],
    ))
    s.append(Spacer(1, 4))
    p("The build timeline is typically 7–10 business days from receipt of the intake form.")

    # 6. Why LaunchOps AI
    h1("6. Why LaunchOps AI")
    h2("6.1 Our Experience")
    p("[Relevant experience and expertise — AI agent systems for voice and text, built and deployed "
      "for businesses across verticals.]")
    h2("6.2 Case Studies")
    p("**[Client Name]** — [brief success story with metrics, e.g., 100% of after-hours calls answered, "
      "X appointments booked per week].")
    h2("6.3 Our Team")
    s.append(body_table(
        ["Name", "Role", "Relevant Experience"],
        [
            ["[Name]", "[Role]", "[Brief bio]"],
            ["[Name]", "[Role]", "[Brief bio]"],
        ],
        [1.3 * inch, 1.7 * inch, 3.1 * inch],
    ))
    s.append(Spacer(1, 4))

    # 7. Next Steps
    h1("7. Next Steps")
    s.extend(bullets([
        "Review this proposal",
        "Schedule a follow-up call to discuss questions",
        "Sign the Service Agreement",
        "Complete the onboarding intake form",
        "Kick off the build on [Date]",
    ]))

    # 8. Terms & Conditions
    h1("8. Terms & Conditions")
    s.extend(bullets([
        "This proposal is valid until [Date].",
        "All pricing is in USD and excludes [taxes / additional fees] unless stated otherwise.",
        "[Payment terms — e.g., the one-time setup fee is required to begin the build and is non-refundable once work has commenced.]",
        "One round of revisions is included; further revision rounds are billed at LaunchOps AI's standard rate.",
        "This proposal is confidential and intended solely for [Client Company Name].",
        "Upon acceptance, the LaunchOps AI Service Agreement governs the engagement.",
    ]))

    # 9. Acceptance & Signatures
    s.append(NextPageTemplate("body"))
    s.append(PageBreak())
    h1("9. Acceptance & Signatures")
    p("By signing below, both parties accept the terms set forth in this proposal.")

    def sig_col(heading, name, title, date):
        inner = [
            [Paragraph(heading, S_SIG)],
            [Spacer(1, 0.5 * inch)],
            [HRFlowable(width=2.2 * inch, thickness=1.0, color=DARK)],
            [Paragraph("Signature", st("siglab", fontName="Helvetica-Oblique", fontSize=9, leading=12, textColor=GRAY))],
            [Spacer(1, 12)],
            [Paragraph(f"<b>Name:</b> {name}", S_SIG)],
            [Paragraph(f"<b>Title:</b> {title}", S_SIG)],
            [Paragraph(f"<b>Date:</b> {date}", S_SIG)],
        ]
        return Table(inner, colWidths=[3.4 * inch])

    sig = Table([[sig_col("CLIENT", "[Client Signatory Name]", "[Client Title]", "[Date]"),
                  sig_col("LAUNCHOPS AI", "[Provider Signatory Name]", "Founder, LaunchOps AI", "[Date]")]],
                colWidths=[3.4 * inch, 3.4 * inch])
    sig.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    s.append(Spacer(1, 10))
    s.append(sig)
    return s


# ---------------------------------------------------------------- build
def build():
    doc = BaseDocTemplate(
        OUT,
        pagesize=PAGE,
        leftMargin=ML, rightMargin=MR, topMargin=MT, bottomMargin=MB,
        title="Proposal — LaunchOps AI",
        author="LaunchOps AI",
    )
    frame_cover = Frame(ML, MB, CW, H - MT - MB, id="cover_frame", leftPadding=0, rightPadding=0,
                        topPadding=0, bottomPadding=0)
    frame_body = Frame(ML, MB, CW, H - MT - MB, id="body_frame", leftPadding=0, rightPadding=0,
                       topPadding=0, bottomPadding=0)
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[frame_cover], onPage=cover_page),
        PageTemplate(id="body", frames=[frame_body], onPage=body_page),
    ])

    story = cover_story()
    story.append(NextPageTemplate("body"))
    story.append(PageBreak())
    story.extend(body_story())
    doc.build(story, canvasmaker=NumberedCanvas)
    print("Wrote", OUT)


if __name__ == "__main__":
    build()
