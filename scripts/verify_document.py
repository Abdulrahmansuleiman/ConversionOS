#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fact-check every client PDF against that client's facts.json.

This implements the check AGENTS.md mandates (scripts/verify_document.py) so a
dropped number or leftover placeholder fails loudly instead of shipping.

Usage:
    python scripts/verify_document.py clients/<client>/facts.json clients/<client>/pdfs/*.pdf

Exit code 0 = all pass, 1 = at least one failure.
"""
import json
import os
import sys

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover
    sys.exit("BUILD-TIME FAIL - pypdf is required (pip install pypdf)")


def extract_text(path):
    reader = PdfReader(path)
    parts = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    return "\n".join(parts)


def main(argv):
    if len(argv) < 3:
        print(__doc__)
        return 2
    facts_path = argv[1]
    pdfs = argv[2:]
    with open(facts_path, encoding="utf-8") as fh:
        facts = json.load(fh)
    must_appear = facts.get("must_appear", [])
    must_not = facts.get("must_not_contain", [])

    failed = False
    for pdf in pdfs:
        if not os.path.exists(pdf):
            print(f"FAIL {pdf} - file not found")
            failed = True
            continue
        text = extract_text(pdf)
        norm = " ".join(text.split())
        missing = [f for f in must_appear if f not in norm]
        forbidden = [f for f in must_not if f in norm]
        name = os.path.basename(pdf)
        if missing or forbidden:
            failed = True
            print(f"FAIL {name}")
            for m in missing:
                print(f"   missing fact: {m!r}")
            for b in forbidden:
                print(f"   forbidden placeholder: {b!r}")
        else:
            print(f"PASS {name} ({len(must_appear)} facts present, {len(must_not)} placeholders absent)")
    print("ALL PASS" if not failed else "VERIFICATION FAILED")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))