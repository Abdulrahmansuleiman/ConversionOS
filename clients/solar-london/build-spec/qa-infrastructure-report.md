QA REPORT - INFRASTRUCTURE AGENT

Client: solar-london
Date: 2026-09-26
Commit under review: 4852360
Reviewed in full:
 - build-spec/quote-integration-spec.md (1003 lines)
 - build-spec/catalog-template.json (254 lines)
 - build-spec/facts-template.json (154 lines)
 - scripts/verify_document.py
Baselines used:
 - AGENTS.md
 - docs/n8n-quote-integration-audit.md (c525d3f)
 - docs/performance/infrastructure.md
 - docs/playbooks/client-dashboard-build.md

VERDICT: FAIL - 13 blocking findings.
The build must not be released to the Builder Agent.

The design direction is correct. Deterministic pricing, a no-Merge
graph, an LLM confined to prose, a real anti-regression guard on the
business decision, and a hard gate on the stale 43-node export.
All seven of Raymon's decisions are honoured and none is relitigated.
What fails the spec is precision in the pricing arithmetic and in the
idempotency mechanism - the two places where an error stays invisible
until a real lead gets a wrong number or a duplicate email.
Ten of the thirteen blockers are one-to-three-line spec fixes.

PART 1 - VERIFICATION METHOD

Read-only verification against the real artifacts, with no live n8n
call and no credential read, written or echoed:

 - review export has 43 nodes: CONFIRMED
 - quote export has 19 nodes: CONFIRMED
 - both JSONs clean UTF-8, no BOM, no U+FFFD: CONFIRMED
 - Merge node has 3 inputs: CONFIRMED (matches audit F5)
 - Create Follow-up task dueDate 2025-12-07: CONFIRMED (audit F6)
 - If node compared propertyValue to presentationscheduled:
   CONFIRMED (audit F7)
 - Launchops_chat_memory mixed case: CONFIRMED verbatim
 - GHL location id Led6m5lQlg4mLFp0cFdg: CONFIRMED
 - Using Parameters matches the 3 nodes: CONFIRMED
 - classifier prompt quoted at line 44: CONFIRMED verbatim
 - Amy's handoff line called verbatim at line 414: PARTIAL, see M9
 - 500+ 5 star Trustpilot claim: GENUINE
 - www.bookhere.com claim: GENUINE
 - new Date().toLocaleDateString(): GENUINE
 - only 3 credentials: matches Raymon's ground truth

PART 2 - REAL OUTPUT OF scripts/verify_document.py

Environment: Python 3.13.3, pypdf 6.14.2.
Test 1 - no output argument supplied (exactly as the spec invokes it):
the script prints its usage docstring and exits 2. It never reaches a
check. See B10.
Test 2 - a PDF with all facts present and no placeholders:

  PASS good.pdf (1 facts present, 18 placeholders absent)
  ALL PASS
  EXIT=0

Test 3 - a PDF with the defects the guard is meant to catch, all
detected, none missed: [YOUR_NAME], CRO, SEO, TBD, GBP 0, GBP 0.00.
EXIT=1.
Test 4 - the literal PowerShell glob the spec recommends, verbatim:

  FAIL ...\pdfs/*.pdf - file not found
  EXIT=1

PowerShell does not expand the wildcard for a native exe, so the
guard fails on a correct file. See B10.
Test 5 - the same glob resolved by the shell first (Get-ChildItem):

  PASS sample.pdf (1 facts present, 18 placeholders absent)
  ALL PASS
  EXIT=0

So the guard itself is sound; only the documented invocation is wrong.
Test 6 - the old marketing copy from the review export, rebuilt as a
PDF: it PASSES the guard.

  PASS regression.pdf (1 facts present, 18 placeholders absent)
  ALL PASS
  EXIT=0

Confirmed anti-regression, and the reason for finding B9.

PART 3 - BLOCKING FINDINGS (13)

B1 - Set terminals do not require "Keep Only Set Field".
The catalog rows and the checksum can survive into the LLM input, so
the model can echo a price or the checksum back in the reply.
Spec lines 277, 280, 282, 288, 293, 297, 299, 373-398.

B2 - quantity is model-supplied and unbounded. "?? 1" silently permits
zero, and nothing caps the value, so a hallucinated quantity silently
re-prices the quote. Spec lines 319, 348, 577, 863.
Fix: validate as an integer in a stated range before any arithmetic,
and refuse rather than default.

B3 - wattage is validated with a money regex, so "3" and "3.5" pass for
a 3 kW system. The system price is per watt, so a 3 kW array priced as
3 W under-prices by a factor of 1000, silently.
Spec lines 160, 176, 344, 349, 354.

B4 - attempt is part of the idempotency key but is not a column in the
stated DDL, so the retry cap has nothing to count and cannot work.
Spec lines 190-210 (DDL), 678-683 (key), 701 (cap).
Fix: add the column, or drop attempt from the key and say so.

B5 - the write-ahead insert has no pending or in-flight status. Two
bookings in one turn can both pass the dedupe check and both insert,
so the same lead can be emailed twice. The spec calls this out as known
and defers it. Spec lines 205, 221, 695-703, 715.

B6 - n8n Postgres Query Parameters do not implement positional $1
binding. The SQL as written cannot run, and the fallback offered is
string interpolation into SQL, which is an injection path.
Spec lines 218-220 (SQL), 692 (claim).
Fix: use a named-parameter form that actually works in n8n.

B7 - the node inventory contradicts itself: the text says 19 then 8,
the list holds 26 entries, the count says 18. Appendix A is truncated
and omits nodes the checklist requires, so it cannot be diffed.
Spec lines 255, 270-299, 898, 900-906.
Also: S2 at line 858 does not force regeneration and a diff against
the live 64-node export.

B8 - the recommended B1 / no-PDF route has no graph. It keeps the PDF
nodes and their parameters in the spec while removing the path that
uses them, so the builder has to invent the shape.
Spec lines 289-294, 476-477, 495, 529-531.
Fix: give the no-PDF route its own complete node list.

B9 - the old marketing copy escapes the guard. The regression PDF built
from it passes, and the leaked phrase is still in the spec at line 787
and in both templates. Spec line 787, catalog-template.json 241-251,
facts-template.json 37-56.
Fix: strip the phrase from all three files, or forbid it explicitly.

B10 - the verification gate as written cannot pass. The recommended
invocation exits 2, the PowerShell glob exits 1 on a correct file, the
recommended output is HTML email which the PDF-only script never
checks, and the Notion rules required by AGENTS.md are absent.
Spec lines 857, 859, 867; facts-template.json 9, 152.

B11 - no service can actually quote. Every catalog row is active:false
and requires_quote_id:true, so S1 can pass while the system refuses
every price. catalog-template.json 83-84, 101-102, 120-121, 140-141,
159-160, 178-179, 197-198, 216-217, 235-236; spec 169, 333, 857.

B12 - a checksum mismatch has no defined terminal. The spec does not
say whether the run aborts, who is told, or whether the lead gets a
reply. Spec lines 140, 148, 276, 337, 405-412.
Fix: state the abort behaviour and the event emitted.

B13 - two nodes are missing from the required list. "Return: Internal
Error" is absent, and "Quote Summary AI" has no error branch, so an
AI failure ends in silence rather than a logged, visible failure.
Spec lines 270-299 (list), 283, 412, 701, 785, 801.

PART 4 - MAJOR FINDINGS (9, fix before build but not blocking alone)

M1 - the spec says the quote is verbatim, then adds a clause outside
the verbatim quote. Spec 54, 75, 917 against 63 and its own rule;
catalog-template.json 85.
M2 - example values are stated as defaults: 30 days at line 926, max 4
lines at 973, quantity 8 at 320 and 386. Each is also in the fact
sheet or catalog, so the two can disagree.
M3 - Guard Summary only checks that digits appear somewhere. It does
not bind the values forward to the later LLM hops. Spec 428, 431.
M4 - GBP cites decision 4, which is not the currency decision.
Spec 162, catalog-template.json 35.
M5 - email is required, then validated, then tolerated when absent.
Three rules, one field. Spec 315, 484-486, 863.
M6 - subtotal_minor is required by the DDL and asserted in the checks,
but no node produces it. Spec 200, 330-366, 370.
M7 - quote_id generation is unspecified, yet it is the idempotency key
and the Supabase lookup. Spec 237, 384.
M8 - section 12 says the pipeline is complete after Mark Emailed, but
a blocked or failed quote emits no dashboard event at all, so a lost
quote is invisible.
M9 - the handoff is called verbatim and is not. Spec 414 against
facts-template.json 91.

PART 5 - WHAT PASSED

 - all seven of Raymon's decisions honoured, none relitigated
 - no HubSpot, Stripe, Google Sheets or Ollama anywhere
 - OpenAI model pinned to gpt-4.1 in every place it appears
 - deterministic catalog, no price computed by an LLM
 - no Merge node; graph is a clean chain plus an abort path
 - email recipient taken from body.email, per decision 5
 - using-parameters and using-json trap called out explicitly
 - stale 43-node export is hard-blocked, not just warned about
 - the three GHL URL blocks are labelled n8n to GHL, correctly, and
   are not treated as dashboard event sources
 - abort ordering is correct; insert precedes send
 - htmlcsstopdf handling is present
 - every event carries event_type, client_id, timestamp, payload
 - the classifier prompt is quoted verbatim and its safety rules match
   the real node
 - the three-credential limit matches Raymon's ground truth
 - no secret appears in the spec, templates or this report
 - only solar-london files are touched; no other client appears
 - the 28 build questions are all decision-relevant
 - explicit grounding rules and a do-not-invent clause are present and
   specific, not boilerplate
 - the verification script is genuinely effective once invoked with a
   resolved file path (tests 2, 3, 5, 6 above)

PART 6 - STILL BLOCKED, NEEDS RAYMON

Q1-Q10  pricing: system price per watt, panel wattage and count,
        inverter price, battery price and kWh, install labour,
        scaffolding, monitoring, discount, VAT treatment
Q11-Q14 catalog: the 20 approved services, which need a quote_id,
         which may use a default, and the tax-inclusive rule
Q15-Q20 business facts: company legal name, phone, email, address,
         ABN or VAT number, licence number
Q21  the GHL email-sending webhook URL and its locId
Q22  the real Postgres DDL already in n8n, since the spec's SQL does
     not run (B6) and the DDL is the idempotency contract (B4, B5)
Q23  whether the Supabase credential actually exists, read-only
Q24  permission to edit the 19-node quote workflow
Q25  Storage policy for generated PDFs, if B2 is resolved toward PDFs
Q26  the dashboard deployment URL for the event POST
Also:  confirm GBP is the currency; decision 4 is cited wrongly (M4)

PART 7 - SAFE TO START WITHOUT RAYMON

 - S2 fresh live export, then regenerate Appendix A and diff it
   against the live 64-node export (fixes B7)
 - S3 read-only audit of the existing n8n nodes
 - verifying the Postgres node parameter style against a real node
 - drafting the prompt-engineer changes as text, not applying them
 - skeleton and copy-only work, provided TBDs are preserved verbatim
 - copying the templates to a TBD-preserving draft

MUST NOT START: S4, S5, S6, S7. Pricing (B2, B3), idempotency
(B4, B5, B6), the catalog (B11) and the verification gate (B10) are
all unresolved, and each one produces a wrong number or a lost lead
silently.

PART 8 - RECOMMENDATION

Return to the Infrastructure Agent with B1-B13 and M1-M9. Most are
one-to-three-line fixes. After the fix, the only true external
blockers are the 26 questions in Part 6, all of which are Raymon's
to answer, not the Builder's to guess.
