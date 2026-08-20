#!/usr/bin/env python3
"""Verify that a generated document preserved every required client fact.

This is the bulletproof check for the "$10k/mo became /mo" class of bug: no
number, currency, name, or date may be omitted or altered in any client-facing
output (proposal, contract, invoice, receipt, email).

Usage:
  python scripts/verify_document.py <facts.json> <document.pdf>
  python scripts/verify_document.py <facts.json> <email.txt> --plain
  python scripts/verify_document.py <facts.json> <email.txt> --plain --subject "line 1"

facts.json shape (see scripts/facts.example.json):
{
  "client": "acme-corp",
  "must_appear": ["$1,500", "$500", "$10k/mo", "Acme Corp", "01/08/2026"],
  "must_not_contain": ["{{", "}}", "[Date]", "[X,XXX]"]
}

Exit code 0 = PASS (every fact present, no leftover placeholders).
Exit code 1 = FAIL (missing facts and/or leftover placeholders). Fail loud.
"""

import argparse
import json
import re
import sys

DEFAULT_MUST_NOT_CONTAIN = [
    "{{", "}}",
    "[Date]", "[Proposal No]", "[Amount]",
    "[Client Company Name]", "[Client Contact", "[Client Address", "[Client Signatory",
    "[Provider Signatory", "[Your Name", "[Setup Fee", "[Payment Method",
    "[Requirement", "[Deliverable", "[Inclusion", "[Exclusion",
    "[Phase 1]", "[Phase 2]", "[Phase 3]", "[Phase 4]",
    "[Item]", "[Name]", "[Role]", "[Duration]", "[When]", "[X", "[e.g",
]


def normalize(s):
    return re.sub(r"\s+", "", s)


def load_facts(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def extract_pdf_text(path):
    from pypdf import PdfReader

    reader = PdfReader(path)
    text = "\n".join((page.extract_text() or "") for page in reader.pages)
    if not text.strip():
        raise SystemExit("FAIL: no extractable text in document — cannot verify. This is a FAIL, not a pass.")
    return text


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("facts", help="path to facts.json")
    ap.add_argument("document", help="path to the PDF or text file to verify")
    ap.add_argument("--plain", action="store_true", help="document is a plain-text file (email)")
    ap.add_argument("--subject", default=None, help="email subject line to verify as a separate line")
    args = ap.parse_args()

    facts = load_facts(args.facts)
    if args.plain:
        with open(args.document, encoding="utf-8") as f:
            text = f.read()
    else:
        text = extract_pdf_text(args.document)
    if args.subject:
        text = args.subject + "\n" + text
    norm_text = normalize(text)

    missing = [tok for tok in facts.get("must_appear", []) if normalize(tok) not in norm_text]

    must_not = list(DEFAULT_MUST_NOT_CONTAIN)
    must_not.extend(facts.get("must_not_contain", []) or [])
    leftovers = [p for p in dict.fromkeys(must_not) if p in text]
    leftovers.extend(re.findall(r"\{\{[^}]*\}\}", text))

    ok = True
    if missing:
        ok = False
        print("FAIL — MISSING OR ALTERED FACTS:")
        for m in missing:
            print(f"  - {m}")
    if leftovers:
        ok = False
        print("FAIL — LEFTOVER PLACEHOLDERS:")
        for l in leftovers:
            print(f"  - {l}")
    if ok:
        n = len(facts.get("must_appear", []))
        print(f"PASS: {n} facts verified present, no leftover placeholders in {args.document}")
        sys.exit(0)
    else:
        print(f"Document: {args.document}")
        sys.exit(1)


if __name__ == "__main__":
    main()
