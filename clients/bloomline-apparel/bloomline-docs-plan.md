# Bloomline Apparel — Document Build Plan (Parallel)

> Plan for the parallel-task workflow. One sub-agent per document, all independent
> tasks launched in the same wave, QA only after every task reports done.

## Overview

- **Client:** Bloomline Apparel (`clients/bloomline-apparel`)
- **Output:** 4 PDFs — invoice, receipt, proposal, contract
- **Single source of truth:** `clients/bloomline-apparel/facts.json` (every fact verbatim)
- **Transcript (context only):** `clients/bloomline-apparel/transcripts/discovery-call-2026-08-05.md`
- **Font:** Montserrat from `fonts/Montserrat/` — used for ALL text in every document
- **Hard rules:** template structure is canonical — nothing outside scope (especially
  invoice + receipt). Never invent a value not in `facts.json`.

## Tasks

### T1: Invoice
- **depends_on:** []
- **Location:** `clients/bloomline-apparel/pdfs/invoice.pdf` (build script: `clients/bloomline-apparel/build_invoice.py`)
- **Template:** `templates/Invoice Template.pdf`
- **Description:** Build `invoice.pdf` matching the Invoice Template structure EXACTLY —
  INVOICE header; Invoice No.; Date; USD/total; TOTAL DUE; INVOICE TO block (incl.
  provider "Abdulrahman Suleiman" / "Founder"); Description/Amount items table with
  Sub-Total and Total; payment note "Please send payment within 1-2 days of receiving
  this invoice."; Terms and Conditions. Real values: Invoice No INV-2026-001, Date
  August 5, 2026, USD $3,000 (setup fee), status AWAITING PAYMENT. Every
  `facts.json` must_appear token verbatim. Montserrat only.
- **Acceptance criteria:** matches template structure (no extra/missing sections), all
  must_appear facts present, zero leftover placeholders / must_not_contain tokens,
  Montserrat used, total = $3,000.
- **Validation:** `python scripts/verify_document.py clients/bloomline-apparel/facts.json clients/bloomline-apparel/pdfs/invoice.pdf` → PASS, plus pypdf placeholder scan.

### T2: Receipt
- **depends_on:** []
- **Location:** `clients/bloomline-apparel/pdfs/receipt.pdf` (build script: `clients/bloomline-apparel/build_receipt.py`)
- **Template:** `templates/Receipt Template.pdf`
- **Description:** Build `receipt.pdf` matching the Receipt Template structure EXACTLY —
  Payment Receipt title; RECEIPT NO.; BILLED TO; ADDRESS; PAYMENT METHOD; TRANSACTION
  ID; DESCRIPTION / QTY / UNIT PRICE / TOTAL items table; SUB-TOTAL / DISCOUNT /
  TOTAL; notes footer; SIGNATURE / FOUNDER / ABDULRAHMAN. Replace template example
  values with facts: Receipt No RCP-2026-001; Billed to Mike Johnson / Bloomline
  Apparel; Address 14 Marlowe Street, Manchester, M1 4BT, United Kingdom; Payment
  method Stripe; total $3,000 (AWAITING PAYMENT). Transaction ID: no fact exists —
  reuse RCP-2026-001 and flag it. Non-applicable template fields (ARRIVE/DEPART
  travel dates) — omit and flag. Every must_appear token verbatim. Montserrat only.
- **Acceptance criteria:** matches template structure, all facts verbatim, no
  placeholders, Montserrat used, total = $3,000.
- **Validation:** verify_document.py → PASS, plus pypdf placeholder scan.

### T3: Proposal
- **depends_on:** []
- **Location:** `clients/bloomline-apparel/pdfs/proposal.pdf` (build script: `clients/bloomline-apparel/build_proposal.py`)
- **Template:** `templates/Proposal Template.pdf`
- **Description:** Build `proposal.pdf` matching the Proposal Template structure EXACTLY —
  cover (LAUNCHOPS / PROPOSAL / AI Agent Implementation & Optimization Services;
  Proposal No PRO-2026-001; Date August 5, 2026; Valid Until September 4, 2026;
  Prepared For Bloomline Apparel; Client Contact Mike Johnson — Owner; Client Address
  14 Marlowe Street...; Service Provider LaunchOps AI; Provider Contact Raymon /
  Abdulrahman Suleiman — Founder) then Sections 1–9 (Executive Summary; Understanding
  Your Needs; Proposed Solution; Investment — $3,000 setup + $750/mo; Timeline —
  7–10 business days; Why LaunchOps AI; Next Steps; Terms & Conditions; Acceptance &
  Signatures). Content from the transcript: text AI agent for ecommerce / women's
  activewear; 40–50 messages/day; order status, sizing, abandoned cart follow-up,
  bulk-order lead qualification with human handoff; platforms GoHighLevel, n8n,
  Supabase, Shopify, Instagram, Klaviyo, Stripe; dashboard KPI visibility. Every
  must_appear token verbatim. Montserrat only.
- **Acceptance criteria:** matches template structure, all facts verbatim, no
  placeholders, Montserrat used.
- **Validation:** verify_document.py → PASS, plus pypdf placeholder scan.

### T4: Contract
- **depends_on:** []
- **Location:** `clients/bloomline-apparel/pdfs/contract.pdf` (build script: `clients/bloomline-apparel/build_contract.py`)
- **Template:** `templates/Contract Template.pdf`
- **Description:** Build `contract.pdf` matching the Contract Template structure EXACTLY —
  cover (LAUNCHOPS / SERVICE AGREEMENT / AI Agent Implementation & Optimization
  Services; Effective Date August 5, 2026; Client Bloomline Apparel; Client Contact
  Mike Johnson, Owner; Client Address 14 Marlowe Street...; Service Provider LaunchOps
  AI; Provider Contact Abdulrahman Suleiman, Founder) then Sections 1–11 (Parties &
  Purpose; Scope of Services — agent types, vertical, platforms GoHighLevel/n8n/
  Supabase, deliverables, integrations Shopify/Instagram/Klaviyo/Stripe, build
  timeline 7–10 business days; Fees & Payment Terms — $3,000 setup due before build,
  $750/mo, Stripe, 1st of each month, 5% late fee past 5 days; Term & Termination —
  month-to-month, 14 days notice; Intellectual Property; Confidentiality; Warranties;
  Limitation of Liability; Independent Contractor; General Provisions; Acceptance &
  Signatures). Contract No CON-2026-001. Every must_appear token verbatim. Montserrat
  only.
- **Acceptance criteria:** matches template structure, all facts verbatim, no
  placeholders, Montserrat used, setup fee $3,000 / monthly $750.
- **Validation:** verify_document.py → PASS, plus pypdf placeholder scan.

### T5: QA — full set validation (after T1–T4)
- **depends_on:** [T1, T2, T3, T4]
- **Description:** Run the qa-proposal agent over all 4 PDFs. Verify template fidelity
  against the reference templates (ESPECIALLY invoice + receipt), facts preserved
  verbatim (verify_document.py on each), cross-document consistency (totals match:
  $3,000), zero placeholders, Montserrat in use.
- **Validation:** verify_document.py PASS on all 4 + QA pass report.

## Execution notes

- Tasks T1–T4 have no dependencies → launch ALL in one parallel wave.
- Each task agent writes ONLY its own output PDF + its own build script; never touches
  another task's files or another client's folder.
- T5 launches only after all four report done.
- Errors fail loud: any task that cannot pass self-test reports the failure instead of
  shipping a bad PDF.
