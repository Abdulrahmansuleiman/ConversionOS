
import modal
import os
import json
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

# Define the Modal Stub
stub = modal.App(name="launchops-proposal-agent")

# Define the Modal Image with necessary packages and font installation
# We need reportlab for PDF generation
image = (
    modal.Image.debian_slim()
    .apt_install("git") # Assuming we might need git later, or for other skills
    .pip_install("reportlab", "python-dotenv") # python-dotenv for .env files if needed later
)

# Mount the fonts directory
# Assuming fonts are in the root directory 'fonts/Montserrat'
FONT_DIR_LOCAL = os.path.join(os.path.dirname(__file__), "fonts", "Montserrat")
FONT_DIR_REMOTE = "/fonts/Montserrat" # Remote path inside the Modal container
mounts = [
    modal.Mount.from_local_dir(FONT_DIR_LOCAL, remote_path=FONT_DIR_REMOTE)
]

# --------------------------------------------------------------------------
# Font registration (moved from build_proposal.py)
# --------------------------------------------------------------------------
def register_fonts():
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
        pdfmetrics.registerFont(TTFont(_name, os.path.join(FONT_DIR_REMOTE, _fn)))
    pdfmetrics.registerFontFamily(
        "Montserrat",
        normal="Montserrat",
        bold="Montserrat-Bold",
        italic="Montserrat-Italic",
        boldItalic="Montserrat-BoldItalic",
    )

# --------------------------------------------------------------------------
# Placeholder for refactored proposal generation logic from build_proposal.py
# This function will take client_name and proposal_facts as input.
# --------------------------------------------------------------------------
def generate_client_proposal_pdf(client_name: str, proposal_facts: dict, output_filepath: str):
    register_fonts() # Register fonts when this function is called

    # --- Colours (from build_proposal.py) ---
    NAVY = colors.Color(0.121569, 0.219608, 0.392157)
    DARK = colors.Color(0.133333, 0.133333, 0.133333)
    GRAY = colors.Color(0.603922, 0.603922, 0.603922)
    LIGHT = colors.Color(0.956863, 0.960784, 0.968627)
    SLATE = colors.Color(0.290196, 0.372549, 0.454902)
    GRID = colors.Color(0.784314, 0.784314, 0.784314)

    PAGE_W, PAGE_H = letter

    # --- Styles (from build_proposal.py) ---
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
    CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

    # --- Helper functions (from build_proposal.py) ---
    def esc(text):
        return (
            text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )

    def bullets(items):
        return [Paragraph(esc("•  " + it), BULLET) for it in items]

    def plain(paras):
        return [Paragraph(esc(p), BODY) for p in paras]

    def h1_element(text):
        return Paragraph(esc(text), H1)

    def h2_element(text):
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

    # --- Canvas for page numbering and chrome (from build_proposal.py) ---
    class NumberedCanvas(pdfcanvas.Canvas):
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

    def draw_cover(c, total_pages, proposal_facts):
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
        placed = []
        
        # Dynamically populate COVER_ROWS from proposal_facts
        cover_rows_data = [
            ("Proposal No", proposal_facts.get("proposal_no", "")),
            ("Date", proposal_facts.get("date", "")),
            ("Valid Until", proposal_facts.get("valid_until", "")),
            ("Prepared For", proposal_facts.get("client_company_name", "")),
            ("Client Contact", proposal_facts.get("client_contact_details", "")),
            ("Client Address", proposal_facts.get("client_address", "")),
            ("Service Provider", proposal_facts.get("service_provider_details", "LaunchOps AI<br/>27 Baker Court, London, EC1A 1BB, United Kingdom")),
            ("Provider Contact", proposal_facts.get("provider_contact_details", "Raymon (Abdulrahman Suleiman) — Founder<br/>abdul123rahmanj@gmail.com<br/>+44 7700 900456")),
        ]

        for label, value in cover_rows_data:
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
        for label, value in cover_rows_data:
            p = Paragraph(value, vstyle)
            w, h = p.wrap(283.4, 300)
            p.drawOn(c, 256.6, y - h)
            y -= h + 18

        # Confidential footer
        c.setFillColor(GRAY)
        c.setFont("Montserrat", 8)
        c.drawString(70.8, 50,
                     "This document is confidential and intended solely for the named parties.")
        c.drawString(70.8, 40,
                     "Distribution outside the intended recipients is not authorized.")

    def draw_chrome(c, page_no, total_pages, proposal_facts):
        if page_no == 1:
            draw_cover(c, total_pages, proposal_facts)
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

    # Define a new canvasmaker that passes proposal_facts to draw_chrome
    class ClientSpecificNumberedCanvas(NumberedCanvas):
        def __init__(self, *args, **kwargs):
            self.proposal_facts = kwargs.pop('proposal_facts')
            super().__init__(*args, **kwargs)

        def save(self):
            total = len(self._saved_page_states)
            for state in self._saved_page_states:
                self.__dict__.update(state)
                draw_chrome(self, self._pageNumber, total, self.proposal_facts)
            super().save()


    # --- Story — sections 1–9, dynamically populated from proposal_facts ---
    story = []
    story.append(PageBreak())

    # 1. Executive Summary
    story.append(h1_element("1. Executive Summary"))
    story.extend(plain([
        proposal_facts.get("executive_summary_para1", ""),
        proposal_facts.get("executive_summary_para2", ""),
    ]))
    story.append(h2_element("Key Highlights"))
    story.extend(bullets(proposal_facts.get("key_highlights", [])))

    # 2. Understanding Your Needs
    story.append(h1_element("2. Understanding Your Needs"))
    story.append(h2_element("2.1 Current Situation"))
    story.extend(plain([proposal_facts.get("current_situation", "")]))
    story.append(h2_element("2.2 Goals & Objectives"))
    story.extend(plain([proposal_facts.get("goals_objectives", "")]))
    story.append(h2_element("2.3 Key Requirements"))
    story.extend(bullets(proposal_facts.get("key_requirements", [])))

    # 3. Proposed Solution
    story.append(h1_element("3. Proposed Solution"))
    story.append(h2_element("3.1 Overview"))
    story.extend(plain([proposal_facts.get("solution_overview", "")]))
    story.append(h2_element("3.2 Deliverables"))
    story.append(build_table(
        ["Deliverable", "Description", "Timeline"],
        proposal_facts.get("deliverables_table", []),
        [104, 266, 98],
    ))
    story.append(h2_element("3.3 Approach & Methodology"))
    story.extend(bullets(proposal_facts.get("approach_methodology", [])))
    story.append(h2_element("3.4 Why This Approach"))
    story.extend(plain([proposal_facts.get("why_this_approach", "")]))

    # 4. Investment
    story.append(h1_element("4. Investment"))
    story.append(h2_element("4.1 Pricing Options"))
    story.append(Paragraph(esc(proposal_facts.get("pricing_option_a_name", "Option A — Done-For-You Text AI Agent (Recommended)")),
                           _st("opt", parent=H2, spaceBefore=2, spaceAfter=6, fontSize=10.5)))
    story.append(build_table(
        ["Item", "Price"],
        proposal_facts.get("pricing_option_a_table", []),
        [352, 116],
        extra_style=[
            ("FONTNAME", (0, -1), (-1, -1), "Montserrat-Bold"),
            ("BACKGROUND", (0, -1), (-1, -1), LIGHT),
            ("LINEABOVE", (0, -1), (-1, -1), 0.5, GRID),
        ],
    ))
    story.append(Paragraph(
        esc(proposal_facts.get("pricing_option_a_note", "")),
        NOTE))
    story.append(h2_element("4.2 Payment Terms"))
    story.extend(bullets(proposal_facts.get("payment_terms", [])))
    story.append(h2_element("4.3 What's Included"))
    story.extend(bullets(proposal_facts.get("what_included", [])))
    story.append(h2_element("4.4 What's Not Included"))
    story.extend(bullets(proposal_facts.get("what_not_included", [])))

    # 5. Timeline
    story.append(KeepTogether([
        h1_element("5. Timeline"),
        build_table(
            ["Phase", "Duration", "Start", "End"],
            proposal_facts.get("timeline_table", []),
            [206, 102, 80, 80],
            extra_style=[
                ("FONTNAME", (0, -1), (-1, -1), "Montserrat-Bold"),
                ("BACKGROUND", (0, -1), (-1, -1), LIGHT),
                ("LINEABOVE", (0, -1), (-1, -1), 0.5, GRID),
            ],
        ),
    ]))
    story.extend(plain([proposal_facts.get("timeline_note", "")]))

    # 6. Why LaunchOps AI
    story.append(h1_element("6. Why LaunchOps AI"))
    story.append(h2_element("6.1 Our Experience"))
    story.extend(plain([proposal_facts.get("our_experience", "")]))
    story.append(h2_element("6.2 Case Studies"))
    for case_study in proposal_facts.get("case_studies", []):
        story.append(Paragraph(f"<b>{esc(case_study['title'])}.</b> {esc(case_study['description'])}", BODY))
    story.append(KeepTogether([
        h2_element("6.3 Our Team"),
        build_table(
            ["Name", "Role", "Relevant Experience"],
            proposal_facts.get("team_table", []),
            [104, 74, 290],
        ),
    ]))

    # 7. Next Steps
    story.append(h1_element("7. Next Steps"))
    story.extend(bullets(proposal_facts.get("next_steps", [])))

    # 8. Terms & Conditions
    story.append(h1_element("8. Terms & Conditions"))
    story.extend(bullets(proposal_facts.get("terms_conditions", [])))

    # 9. Acceptance & Signatures
    story.append(h1_element("9. Acceptance & Signatures"))
    story.append(Paragraph(esc(proposal_facts.get("acceptance_text", "")), BODY))
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
        [[sig_block("CLIENT", proposal_facts.get("client_signatory_name", ""), proposal_facts.get("client_signatory_title", "")),
          sig_block("LAUNCHOPS AI", proposal_facts.get("provider_signatory_name", "Abdulrahman Suleiman"), proposal_facts.get("provider_signatory_title", "Founder, LaunchOps AI"))]],
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


    # Ensure the output directory exists
    os.makedirs(os.path.dirname(output_filepath), exist_ok=True)

    doc = BaseDocTemplate(
        output_filepath,
        pagesize=letter,
        leftMargin=MARGIN_L,
        rightMargin=MARGIN_R,
        topMargin=MARGIN_T,
        bottomMargin=MARGIN_B,
        title=f"Proposal — {client_name}",
        author="LaunchOps AI",
        subject="AI Agent Implementation & Optimization Services",
        creator="LaunchOps AI",
    )
    frame = Frame(MARGIN_L, MARGIN_B, CONTENT_W,
                  PAGE_H - MARGIN_T - MARGIN_B, id="main",
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="page", frames=[frame])])
    doc.build(story, canvasmaker=lambda *args, **kwargs: ClientSpecificNumberedCanvas(*args, proposal_facts=proposal_facts, **kwargs))
    print(f"Generated proposal for {client_name} at {output_filepath}")


@stub.function(image=image, mounts=mounts)
def remote_generate_proposal(client_name: str, proposal_facts: dict, output_filename: str = "proposal.pdf") -> str:
    # Modal will create client-specific folders in its temporary storage, which we'll then retrieve.
    remote_output_dir = os.path.join("/tmp/clients", client_name.lower().replace(" ", "-"), "pdfs")
    remote_output_filepath = os.path.join(remote_output_dir, output_filename)

    generate_client_proposal_pdf(client_name, proposal_facts, remote_output_filepath)

    # In a real scenario, you'd want to transfer this file out of the Modal container.
    # For now, we'll just confirm its creation.
    print(f"Proposal PDF generated at: {remote_output_filepath}")
    return remote_output_filepath

# Optional: A local entrypoint to test the Modal function directly
@stub.local_entrypoint()
def main():
    client_name = "Bloomline Apparel"
    # Example proposal facts (this would come from facts.json and transcript analysis)
    # This is a minimal set for testing.
    example_proposal_facts = {
        "proposal_no": "PRO-2026-001",
        "date": "August 5, 2026",
        "valid_until": "September 4, 2026",
        "client_company_name": client_name,
        "client_contact_details": "Mike Johnson — Owner<br/>raymon4d.scales@gmail.com<br/>+44 7700 900123",
        "client_address": "14 Marlowe Street, Manchester, M1 4BT, United Kingdom",
        "service_provider_details": "LaunchOps AI<br/>27 Baker Court, London, EC1A 1BB, United Kingdom",
        "provider_contact_details": "Raymon (Abdulrahman Suleiman) — Founder<br/>abdul123rahmanj@gmail.com<br/>+44 7700 900456",
        "executive_summary_para1": "LaunchOps AI is pleased to present this proposal to Bloomline Apparel. We will design, build, and deploy a done-for-you text AI agent for your ecommerce business that handles every inbound customer conversation — order status lookups, product and sizing questions, and abandoned cart follow-up — automatically and around the clock, without adding headcount. The agent will also qualify wholesale and bulk-order leads and hand them directly to you, so no bulk order is ever missed and no bulk pricing is ever negotiated by a bot.",
        "executive_summary_para2": "Bloomline Apparel currently receives 40-50 inbound messages per day across Instagram DM and website chat, and a single support person is maxed out. This solution answers customers instantly, recovers revenue from abandoned carts, and surfaces every bulk-order opportunity — with full visibility through a real-time dashboard.",
        "key_highlights": [
            "24/7 automated handling of Instagram DMs and website chat",
            "Abandoned cart recovery — every cart followed up automatically",
            "Bulk and wholesale order leads qualified and flagged to Mike — human handoff on your terms",
        ],
        "current_situation": "Bloomline Apparel is an ecommerce brand selling women's activewear. Today, every customer message lands on one support person. Between Instagram DM and the website chat widget, the store receives roughly 40-50 inbound messages per day — about half are 'where is my order' queries and half are pre-purchase sizing and product questions. Abandoned carts are not followed up on at all, and the existing support capacity is maxed out — which is why hiring a second support person is being considered.",
        "goals_objectives": "Bloomline Apparel wants measurable, visible outcomes: never miss a customer query on any channel; answer order-status and pre-purchase sizing questions faster than manual support allows; recover revenue from abandoned carts automatically; qualify wholesale and bulk-order leads before any human handoff; and keep full visibility into every conversation through a dashboard.",
        "key_requirements": [
            "Order status lookups — instant 'where is my order' answers pulled from Shopify",
            "Product and sizing answers for pre-purchase questions",
            "Abandoned cart follow-up via email, without duplicating Klaviyo sends",
            "Wholesale and bulk-order lead qualification with direct human handoff to Mike",
        ],
        "solution_overview": "LaunchOps AI will build a done-for-you text AI agent for Bloomline Apparel, deployed on GoHighLevel (GHL), n8n, and Supabase, trained on your product catalog and brand voice, and wired into the channels your customers already use.",
        "deliverables_table": [
            ["AI Agent Build & Training", "Text AI agent trained on Bloomline Apparel's product catalog and brand voice — order status lookups, product and sizing questions, abandoned cart follow-up, and bulk-order qualification with human handoff", "7-10 business days"],
            ["Integrations", "Shopify (order status), Instagram DM, website chat widget, and email (abandoned cart follow-up), plus read-only Klaviyo so the agent never duplicates an email already going out", "Within 7-10 business days"],
            ["Dashboard Setup", "Real-time KPI dashboard: conversations by channel, AI-resolved vs. human handoff, bulk-order leads flagged, response times, and outstanding follow-ups, filterable by last week or last month", "At launch, within 7-10 business days"],
        ],
        "approach_methodology": [
            "Phase 1 — Discovery & Intake: requirements confirmed, onboarding intake form completed with product catalog and brand voice guidelines, and build kicked off once the setup fee and signed Service Agreement are in place",
            "Phase 2 — Build & Train: agent built and trained; workflows configured across Shopify, Instagram DM, website chat, and email; read-only Klaviyo wired in; GoHighLevel CRM layer, n8n automation, and Supabase data storage stood up",
            "Phase 3 — Review & Launch: end-to-end testing, one round of revisions included, then go-live across all channels",
            "Phase 4 — Optimize & Support: ongoing refinement from real conversations — monitoring, response and objection-handling tweaks, and integration maintenance",
        ],
        "why_this_approach": "This approach is done-for-you: LaunchOps AI builds, deploys, and manages everything, so Bloomline Apparel needs no infrastructure to run and no technical staff to hire. It is fast — a working agent is typically live within 7-10 business days of receiving the intake form. It fits your stack — GoHighLevel as the CRM layer, n8n for automation and orchestration, and Supabase for a clean record of every conversation. And it keeps improving — refined from real conversations, with full dashboard visibility throughout.",
        "pricing_option_a_name": "Option A — Done-For-You Text AI Agent (Recommended)",
        "pricing_option_a_table": [
            ["One-time setup fee — build, testing, and deployment across all four integrations", "$3,000"],
            ["Monthly optimization & maintenance — ongoing monitoring, refinement from real conversations, and integration upkeep", "$750 per month"],
            ["Total — initial investment due before build", "$3,000"],
        ],
        "pricing_option_a_note": "The setup fee covers everything through go-live and is billed in USD as invoice INV-2026-001, currently AWAITING PAYMENT. The monthly optimization & maintenance retainer of $750 per month is billed on the 1st of each month after go-live; a payment receipt (RCP-2026-001) is issued via Stripe once the setup fee is paid.",
        "payment_terms": [
            "One-time setup fee of $3,000 USD due before the build begins",
            "Monthly optimization & maintenance fee of $750 per month billed on the 1st of each month",
            "A 5% late fee applies to any invoice more than 5 days past due",
            "Payments processed via Stripe",
        ],
        "what_included": [
            "Done-for-you build, testing, and deployment across all four integrations (Shopify, Instagram DM, website chat, email), plus read-only Klaviyo",
            "GoHighLevel CRM layer, n8n automation and orchestration, and Supabase data storage with a clean record of every conversation",
            "Real-time dashboard: conversations by channel, AI-resolved vs. human handoff, bulk-order leads flagged, response times, and outstanding follow-ups — filterable by last week or last month",
            "Ongoing optimization & maintenance: monitoring, refining responses and objection handling, and keeping integrations maintained",
        ],
        "what_not_included": [
            "Major scope additions — new agents, new integrations, or new verticals — are billed separately",
            "Bulk or wholesale pricing negotiation — the agent qualifies and hands off bulk-order leads but does not negotiate pricing",
        ],
        "timeline_table": [
            ["Phase 1 — Discovery & Intake", "1-2 business days", "August 5, 2026", "August 6, 2026"],
            ["Phase 2 — Build & Train", "4-6 business days", "August 7, 2026", "August 13, 2026"],
            ["Phase 3 — Review & Launch", "2-3 business days", "August 14, 2026", "August 18, 2026"],
            ["Total", "7-10 business days", "—", "—"],
        ],
        "timeline_note": "The build timeline is typically 7-10 business days from receipt of the intake form. Indicative dates assume kickoff on August 5, 2026, pending the signed Service Agreement, setup fee, and completed intake form; all phases complete well before the proposal expires on September 4, 2026.",
        "our_experience": "LaunchOps AI designs, builds, and deploys done-for-you AI agents — voice and text — for businesses across verticals, handling high volumes of inbound customer conversations, qualifying leads before human handoff, and following up automatically. Every deployment is managed end-to-end on GoHighLevel, n8n, and Supabase, with a real-time dashboard so clients keep full visibility.",
        "case_studies": [
            {"title": "Ecommerce Messaging Automation", "description": "LaunchOps AI deploys exactly the pattern proposed here: a text AI agent on Instagram DM and website chat that answers order-status and pre-purchase questions instantly, recovers abandoned carts with automated follow-up, and flags bulk-order leads for human handoff — keeping a busy ecommerce store covered without adding headcount, with full dashboard visibility throughout."},
        ],
        "team_table": [
            ["Abdulrahman Suleiman", "Founder", "Founded LaunchOps AI; builds and deploys done-for-you AI agents (voice and text) on GoHighLevel, n8n, and Supabase for ecommerce and service businesses"],
        ],
        "next_steps": [
            "Review this proposal",
            "Sign the Service Agreement",
            "Complete the onboarding intake form",
            "Kick off the build once the signed Service Agreement and setup fee are received",
        ],
        "terms_conditions": [
            "This proposal is valid until September 4, 2026.",
            "All pricing is in USD and excludes taxes and additional fees unless stated otherwise.",
            "The one-time setup fee of $3,000 is required to begin the build and is non-refundable once work has commenced.",
            "One round of revisions is included; further revision rounds are billed at LaunchOps AI's standard rate.",
            "This proposal is confidential and intended solely for Bloomline Apparel.",
            "The engagement runs month-to-month after go-live; either party may end it with 14 days' written notice.",
            "Upon acceptance, the LaunchOps AI Service Agreement (CON-2026-001) governs the engagement.",
        ],
        "acceptance_text": "By signing below, both parties accept the terms set forth in this proposal.",
        "client_signatory_name": "Mike Johnson",
        "client_signatory_title": "Owner",
        "provider_signatory_name": "Abdulrahman Suleiman",
        "provider_signatory_title": "Founder, LaunchOps AI",
    }
    
    # Define a local output directory that mirrors the remote structure for testing
    local_output_dir = os.path.join(os.getcwd(), "clients", client_name.lower().replace(" ", "-"), "pdfs")
    local_output_filepath = os.path.join(local_output_dir, "proposal.pdf")

    # Call the remote function. In a real scenario, you'd handle the returned path
    # and possibly download the file.
    remote_filepath = remote_generate_proposal.remote(client_name, example_proposal_facts, "proposal.pdf")
    print(f"Remote proposal generated at: {remote_filepath}")

    # To confirm local creation for testing purposes (this part would not be in production)
    print(f"A local dummy file would be created at: {local_output_filepath} if run locally")
