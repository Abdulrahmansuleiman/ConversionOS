#!/usr/bin/env python3
"""
check_quote_content.py - the check that actually catches wrong-business content.

WHY THIS EXISTS
    scripts/verify_document.py is necessary and NOT sufficient. QA proved it: a PDF rebuilt
    from the old marketing copy PASSES that guard, because it only knows must_appear and
    must_not_contain from facts.json and has no idea what business the document is for, or
    whether a number came from the catalog. This script is derived FROM the catalog and the
    workflow export, so it catches wrong-business content and unbound numbers structurally
    rather than from a hand-written blocklist.

    Run BOTH. A stage is blocked unless both exit 0.

CHECKS (see quote-integration-spec.md section 12.3)
    A  Catalog subset      every service name printed must be a customer_facing catalog row
                           AND must appear in the price ledger. Catches foreign content.
    A1 Business readiness  WARNS (never fails) when no row is customer_facing, so that a
                           correctly-aborting quote is not mistaken for a broken build.
    B  Price binding       every money token printed must be in the ledger, and every ledger
                           figure must be recomputable from a catalog unit_price.
    C  Token scan          no placeholder, no retired business string, no TBD, no null.
    D  Self-test isolation the self-test row can never be printed.
    E  Export grep         no foreign node type, no Merge, no assigned secret, node count.
    F  Prompt binding      the grounding block and the tool wiring are both present.

ALSO
    --print-catalog-checksum   computes the catalog checksum exactly as spec 7.1.1 defines it,
                               reports the value to paste into the Load Catalog node, and proves
                               the round trip is idempotent. Run in place of the other checks.

EXIT CODES
    0  all checks passed
    1  at least one check FAILED
    2  invoked wrongly (missing file, bad JSON, missing argument) - nothing was checked

STDLIB ONLY. No third-party import, so it runs anywhere python does.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from typing import Any

EXIT_OK, EXIT_FAIL, EXIT_USAGE = 0, 1, 2

# --- patterns, all structural, none of them a business number ---------------------

MONEY_RE = re.compile(r"(?:£|GBP)\s?(\d{1,9}(?:,\d{3})*(?:\.\d{2})?)", re.IGNORECASE)
# The pricing node's own money regex. "TBD" fails it. That failure is the abort trigger.
MONEY_STRICT_RE = re.compile(r"^\d{1,9}(\.\d{1,2})?$")
# unit_size is NOT money. Integer watts only, no decimal point, no unit suffix.
WATTS_RE = re.compile(r"^[1-9][0-9]{1,4}$")
CONTACT_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
SHA256_HEX_RE = re.compile(r"^[0-9a-f]{64}$")

# Structural tokens that are wrong in any delivered document. Not business values.
STRUCTURAL_TOKENS = ["{{", "}}", "=US", "TBD"]
# Foreign node types / credentials that must not exist in a built workflow.
RETIRED_NODE_TOKENS = [
    "hubspot", "stripe", "googleSheets", "ollama", "highLevel", "htmlcsstopdf",
    "n8n-nodes-base.merge", "presentationscheduled", "llama3.1",
]
# An ASSIGNMENT of a secret, never a bare env var NAME. A bare name is documentation.
SECRET_ASSIGNMENT_RES = [
    r"GMAIL_CLIENT_SECRET\s*=\s*\S",
    r"GMAIL_REFRESH_TOKEN\s*=\s*\S",
    r"GMAIL_ACCESS_TOKEN\s*=\s*\S",
    r"SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*[\"']?\S",
    r"N8N_API_KEY\s*[:=]\s*[\"']?\S",
    r"NOTION_TOKEN\s*[:=]\s*[\"']?\S",
    r"\"GMAIL_(CLIENT_SECRET|REFRESH_TOKEN|ACCESS_TOKEN)\"\s*:\s*\"[^\"]+",
]

# Anchors that make the systemMessage binding check F deterministic.
PROMPT_ANCHORS = ["# Quotes and Pricing", "GROUNDING RULE", "DO NOT INVENT DATA"]

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")


# --- catalog checksum (spec 7.1.1) ------------------------------------------------
#
# Two exclusions, both load-bearing:
#   1. `catalog_checksum` itself is set to the empty string. A digest computed over a
#      document that CONTAINS the digest cannot be written back into that document -
#      writing it changes what is hashed, so every attempt fails its own verification.
#   2. Documentation keys (`_`-prefixed, `*_note`-suffixed) are dropped, so editing an
#      explanation in the templates cannot break a live quote.
#
# This function MUST stay byte-for-byte equivalent to the normalisation in the
# `Load Catalog` Code node. If one side changes, both change in the same commit.


def canonical_catalog_payload(catalog: dict[str, Any]) -> str:
    bare = {k: v for k, v in catalog.items() if k != "catalog_checksum"}
    payload = {
        k: v
        for k, v in bare.items()
        if not k.startswith("_") and not k.endswith("_note")
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def catalog_checksum(catalog: dict[str, Any]) -> str:
    import hashlib

    return hashlib.sha256(
        canonical_catalog_payload(catalog).encode("utf-8")
    ).hexdigest()


def print_catalog_checksum(path: str) -> int:
    """Compute the checksum, compare it to what the file declares, and report idempotently."""
    catalog = load_json(path, "--catalog")
    if not isinstance(catalog, dict):
        die("--catalog must be a JSON object")
    actual = catalog_checksum(catalog)
    declared = catalog.get("catalog_checksum")
    print("catalog checksum (spec 7.1.1)")
    print(f"  computed        : {actual}")
    print(f"  file declares   : {declared}")
    if declared == actual:
        print("  status          : MATCH - the file is self-consistent")
    elif declared in (None, "", "TBD"):
        print("  status          : not yet written (expected before S1)")
    else:
        print("  status          : STALE - recompute and write this value into the field")
    # Idempotence: hashing the file again with the computed value written in must return
    # the same digest. That round trip is the proof the self-reference is broken.
    probe = dict(catalog, catalog_checksum=actual)
    again = catalog_checksum(probe)
    print(f"  after writing it : {again}")
    print(f"  idempotent       : {'YES' if again == actual else 'NO - SPEC 7.1.1 IS WRONG'}")
    if again != actual:
        return EXIT_FAIL
    print("")
    print("Paste BOTH into the Load Catalog Code node:")
    print(f"  const EXPECTED_CHECKSUM = '{actual}';")
    print("  const CATALOG = { ...the payload, with catalog_checksum set to '' ... };")
    return EXIT_OK


class Fail(Exception):
    """A usage problem. Exit 2 - nothing was checked, which is not a pass."""


class Report:
    def __init__(self) -> None:
        self.rows: list[tuple[str, str, list[str]]] = []

    def add(self, check: str, ok: bool, failures: list[str]) -> None:
        self.rows.append((check, "PASS" if ok else "FAIL", failures))

    def warn(self, check: str, warnings: list[str]) -> None:
        self.rows.append((check, "WARN", warnings))

    def failed(self) -> bool:
        return any(v == "FAIL" for _, v, _ in self.rows)

    def render(self) -> str:
        out = []
        for check, verdict, failures in self.rows:
            out.append(f"{verdict}  {check}")
            for f in failures:
                out.append(f"        - {f}")
        if self.failed():
            out.append("")
            out.append("CONTENT CHECK FAILED - stage blocked. Fix the source, not the check.")
        else:
            warned = any(v == "WARN" for _, v, _ in self.rows)
            out.append("")
            out.append(
                "ALL PASS" + (" (with the warnings above - read them, do not skim them)"
                              if warned else "")
            )
        return "\n".join(out)


# --- helpers ---------------------------------------------------------------------


def die(msg: str) -> None:
    print(f"check_quote_content: {msg}", file=sys.stderr)
    raise SystemExit(EXIT_USAGE)


def load_json(path: str, label: str) -> Any:
    try:
        # utf-8-sig, not utf-8: PowerShell 5.1's `Set-Content -Encoding utf8` writes a BOM, and the
        # Builder will be creating scratch files from PowerShell. json.loads rejects a BOM, which
        # would surface as a confusing "not valid JSON" on a file that is plainly valid.
        with open(path, encoding="utf-8-sig") as fh:
            return json.load(fh)
    except FileNotFoundError:
        die(f"{label} not found: {path}")
    except json.JSONDecodeError as exc:
        die(f"{label} is not valid JSON ({path}): {exc}")
    return None  # unreachable, keeps type checkers calm


def load_text(path: str, label: str) -> str:
    try:
        with open(path, encoding="utf-8-sig") as fh:
            return fh.read()
    except FileNotFoundError:
        die(f"{label} not found: {path}")
    return ""  # unreachable


def to_minor(amount: str) -> int:
    """'1,234.56' -> 123456. Integer pence. Never a float."""
    whole, _, frac = amount.replace(",", "").partition(".")
    frac = (frac + "00")[:2]
    return int(whole) * 100 + int(frac)


def visible_text(raw: str) -> str:
    """Strip markup so tokens are checked in what a human would actually see."""
    text = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", raw)
    text = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</tr>|</h[1-6]>", "\n", text)
    text = TAG_RE.sub(" ", text)
    for ent, ch in (("&pound;", "£"), ("&nbsp;", " "), ("&amp;", "&"),
                    ("&lt;", "<"), ("&gt;", ">"), ("&quot;", '"'), ("&#39;", "'")):
        text = text.replace(ent, ch)
    return WS_RE.sub(" ", text).strip()


def parse_money_strict(value: Any) -> int | None:
    """The pricing node's parser. Returns minor units, or None for anything unresolved."""
    if not isinstance(value, str):
        return None
    value = value.strip()
    if not MONEY_STRICT_RE.match(value):
        return None
    return to_minor(value)


def ledger_lines(ledger: Any) -> list[dict[str, Any]]:
    if isinstance(ledger, list):
        return ledger
    if isinstance(ledger, dict):
        for key in ("lines", "price_ledger", "rows"):
            if isinstance(ledger.get(key), list):
                return ledger[key]
    die("--ledger must be a JSON array of lines, or an object with a 'lines' array")
    return []  # unreachable


def system_message_of(export: dict[str, Any], node_name: str) -> str:
    for node in export.get("nodes", []):
        if node.get("name") == node_name:
            params = node.get("parameters", {}) or {}
            options = params.get("options", {}) or {}
            sm = options.get("systemMessage", "")
            if isinstance(sm, str):
                return sm
            return json.dumps(sm)
    return ""


def ai_tool_target(export: dict[str, Any], node_name: str) -> list[str]:
    conns = export.get("connections", {}) or {}
    for source, outputs in conns.items():
        if source != node_name:
            continue
        ai = outputs.get("ai_tool") or []
        targets: list[str] = []
        for branch in ai:
            for link in branch or []:
                if isinstance(link, dict) and link.get("node"):
                    targets.append(link["node"])
        return targets
    return []


# --- the checks ------------------------------------------------------------------


def check_a_catalog_subset(
    catalog: dict, ledger: list[dict], quote_text: str, raw_quote: str
) -> tuple[bool, list[str]]:
    """
    Catalog subset, stated as a POSITIVE structural rule.

    A positive "must be in the catalog" rule over the ledger is only as good as the assumption
    that the document's service set equals the ledger's. So this check closes that assumption
    rather than trusting it: it also scans the rendered text for ANY catalog display_name or
    forbidden service, so a service printed on the document but missing from the ledger is a
    failure, not an invisible unbound line.

    What this cannot do: parse free prose into service names. The document is built
    deterministically, which is what makes the set comparison valid; a hand-written marketing
    sentence naming a foreign service is caught by the vocabulary scan and by check C.
    """
    services = catalog.get("services", []) or []
    failures: list[str] = []

    by_name = {r.get("display_name"): r for r in services if r.get("display_name")}
    printable = {
        r.get("display_name")
        for r in services
        if r.get("customer_facing") is True and r.get("display_name")
    }
    non_printable = {
        r.get("display_name")
        for r in services
        if r.get("customer_facing") is not True and r.get("display_name")
    }
    forbidden = [s for s in (catalog.get("forbidden_services") or []) if s]

    haystack = quote_text
    for name in sorted(non_printable):
        if name and name in haystack:
            failures.append(
                f"check A: non-customer_facing row printed: {name!r} "
                f"(customer_facing is not true)"
            )
    for name in forbidden:
        if name in haystack:
            failures.append(f"check A: forbidden service printed: {name!r}")

    ledger_names = [l.get("display_name") for l in ledger if l.get("display_name")]
    for name in ledger_names:
        if name not in printable:
            row = by_name.get(name)
            key = row.get("key") if row else "<not a catalog row>"
            failures.append(
                f"check A: ledger line {name!r} (key {key!r}) is not a customer_facing "
                f"catalog row"
            )

    # Every catalog name that appears in the document must be accounted for in the ledger.
    for name in sorted(by_name):
        if name in haystack and name not in ledger_names:
            failures.append(
                f"check A: {name!r} is printed on the document but is absent from the "
                f"price ledger - an unbound line"
            )

    return (not failures), failures


def a1_business_readiness(catalog: dict) -> list[str]:
    """
    A WARN, not a FAIL, and the distinction is deliberate.

    "No row is customer_facing" means no Solar London *service* can be quoted yet. That is the
    correct state today, because confirming a real service is Raymon's to answer (spec Q11), and
    asserting one here would be inventing scope. So it is reported loudly but does not block.

    It must not be silently swallowed, though: a catalog that can never quote is a real
    condition, and someone has to see it. The day a row does become customer_facing, this returns
    nothing and the check is green for the right reason.

    What still hard-FAILS regardless: a ledger line naming a non-customer-facing row (a line
    that reached a customer), and a catalog with no active row at all (machinery that can never
    run) - see check D.
    """
    services = catalog.get("services", []) or []
    printable = [r.get("key") for r in services if r.get("customer_facing") is True]
    if printable:
        return []
    return [
        "BUSINESS READINESS (warn, not a failure): no catalog row has customer_facing true, so "
        "no Solar London service can be legitimately quoted yet. The machinery is still fully "
        "exercisable via the active self-test row, and the correct behaviour for a real price "
        "request today is the abort. This clears the moment Raymon confirms a service (spec "
        "Q10-Q13). It is reported rather than hidden because a catalog that can never quote is a "
        "real condition someone must see."
    ]


def check_b_price_binding(
    catalog: dict, ledger_raw: Any, quote_text: str
) -> tuple[bool, list[str]]:
    """
    Recompute the ledger from the catalog, then bind every printed figure to it.

    Direction 1: every money token in the rendered document must be a figure the ledger
    produced. Direction 2: every ledger figure must be recomputable from a catalog unit_price
    using the row's own pricing_model. A ledger that only stored line totals would prove the
    arithmetic was right but not that the inputs were real, which is the whole point.
    """
    services = catalog.get("services", []) or []
    by_key = {r.get("key"): r for r in services}
    lines = ledger_lines(ledger_raw)
    failures: list[str] = []

    ledger_minor: set[int] = set()
    for line in lines:
        key = line.get("key")
        qty_raw = line.get("qty", line.get("quantity", 1))
        try:
            qty = int(qty_raw)
        except (TypeError, ValueError):
            failures.append(f"check B: ledger line {key!r} has a non-integer qty {qty_raw!r}")
            continue
        if qty < 1:
            failures.append(f"check B: ledger line {key!r} has qty {qty}, which is not >= 1")
            continue

        row = by_key.get(key)
        if row is None:
            failures.append(
                f"check B: ledger line {key!r} does not correspond to any catalog row - the "
                f"figure is not catalog-derived"
            )
            continue

        price = parse_money_strict(row.get("unit_price"))
        if price is None:
            failures.append(
                f"check B: catalog row {key!r} has an unresolved unit_price "
                f"({row.get('unit_price')!r}) yet a ledger line exists for it. With an "
                f"unresolved price the run must have ABORTED and produced no line."
            )
            continue

        model = row.get("pricing_model")
        if model == "flat":
            expected = price
        elif model == "per_unit":
            expected = price * qty
        elif model == "per_watt":
            unit = row.get("unit_size")
            if row.get("unit_size_unit") != "W" or not WATTS_RE.match(str(unit)):
                failures.append(
                    f"check B: per_watt row {key!r} has unit_size_unit "
                    f"{row.get('unit_size_unit')!r} / unit_size {unit!r}; only integer watts "
                    f"are supported, so this run must have ABORTED rather than priced"
                )
                continue
            expected = round(price * int(unit) * qty)
        else:
            failures.append(
                f"check B: catalog row {key!r} has pricing_model {model!r}, which the pricing "
                f"code cannot compute, so no ledger line may exist for it"
            )
            continue

        claimed = line.get("line_total_minor")
        if claimed is None:
            failures.append(f"check B: ledger line {key!r} has no line_total_minor")
            continue
        try:
            claimed_i = int(claimed)
        except (TypeError, ValueError):
            failures.append(
                f"check B: ledger line {key!r} line_total_minor is not an integer: {claimed!r}"
            )
            continue
        if claimed_i != expected:
            failures.append(
                f"check B: ledger line {key!r} claims {claimed_i} minor units but the catalog "
                f"unit_price {row.get('unit_price')!r} x {model} x qty {qty} computes to "
                f"{expected}. The figure does not come from the catalog."
            )
        ledger_minor.add(claimed_i)
        ledger_minor.add(price)

        display = line.get("line_total_display")
        if isinstance(display, str):
            for token in MONEY_RE.findall(display):
                if to_minor(token) != claimed_i:
                    failures.append(
                        f"check B: ledger line {key!r} line_total_display {display!r} does not "
                        f"equal its line_total_minor {claimed_i}"
                    )

    if isinstance(ledger_raw, dict):
        computed_sum = 0
        for line in lines:
            raw = line.get("line_total_minor", 0)
            if str(raw).lstrip("-").isdigit():
                computed_sum += int(raw)
        for container in ("subtotal_minor", "total_minor"):
            if container in ledger_raw:
                if int(ledger_raw[container]) != computed_sum:
                    failures.append(
                        f"check B: {container} is {ledger_raw[container]} but the lines sum to "
                        f"{computed_sum}"
                    )
                ledger_minor.add(int(ledger_raw[container]))

    printed = [to_minor(t) for t in MONEY_RE.findall(quote_text)]
    for value in sorted(set(printed)):
        if value not in ledger_minor:
            failures.append(
                f"check B: the document prints {value / 100:.2f} but no ledger figure equals "
                f"it. A number reached the customer that is not in the price ledger."
            )

    # The TBD shipping state: unresolved prices mean the run aborted, so there can be no
    # ledger lines and no printed figure at all. This is the check that proves the abort is
    # total. It tests the LINES, not the container: an empty ledger object is a valid,
    # expected artifact of an aborted run.
    unresolved = [r.get("key") for r in services
                  if parse_money_strict(r.get("unit_price")) is None]
    if unresolved and lines:
        failures.append(
            f"check B: catalog still has unresolved prices on {unresolved} yet the ledger has "
            f"lines. With an unresolved price the quote must ABORT with no figure at all."
        )
    if unresolved and printed:
        failures.append(
            f"check B: catalog still has unresolved prices on {unresolved} yet the document "
            f"prints money. The abort did not hold."
        )
    return (not failures), failures


def check_c_tokens(catalog: dict, facts: dict, quote_text: str, raw_quote: str) -> tuple[bool, list[str]]:
    """Every placeholder class that has actually occurred in this project."""
    failures: list[str] = []
    tokens: list[str] = list(STRUCTURAL_TOKENS)
    tokens += [t for t in (facts.get("must_not_contain") or []) if isinstance(t, str)]
    content = catalog.get("forbidden_business_content") or {}
    for group in ("from_live_email_node", "from_live_html_payload_node",
                  "from_live_find_services_node", "placeholders", "dead_values"):
        tokens += [t for t in (content.get(group) or []) if isinstance(t, str)]
    for bad in ("null", "undefined", "NaN"):
        if bad not in tokens:
            tokens.append(bad)
    # De-duplicate while preserving order: a string can legitimately appear in both
    # facts.must_not_contain and catalog.forbidden_business_content, and reporting it twice
    # makes one defect look like two.
    tokens = list(dict.fromkeys(tokens))

    for tok in tokens:
        if tok in quote_text:
            failures.append(f"check C: forbidden token present: {tok!r}")
    # Markup-level scan on the raw file catches an expression hidden in an attribute.
    for tok in ("{{", "}}"):
        if tok in raw_quote:
            failures.append(f"check C: unresolved expression marker in the raw document: {tok!r}")
    return (not failures), failures


def check_d_self_test(catalog: dict, quote_text: str) -> tuple[bool, list[str]]:
    """The self-test probe must never reach a document. Explicit, even though A covers it."""
    failures: list[str] = []
    for row in catalog.get("services", []) or []:
        key = str(row.get("key") or "")
        if not key.startswith("_"):
            continue
        if row.get("customer_facing") is not False:
            failures.append(
                f"check D: reserved-namespace row {key!r} must have customer_facing false"
            )
        name = row.get("display_name")
        if name and name in quote_text:
            failures.append(f"check D: self-test row {key!r} was printed: {name!r}")
    if not any(str(r.get("key") or "").startswith("_") for r in catalog.get("services", []) or []):
        failures.append(
            "check D: no reserved-namespace self-test row exists. Spec section 4.5 requires one "
            "so the machinery past Match + Price Quote is demonstrable while prices are TBD."
        )
    active = [r.get("key") for r in catalog.get("services", []) or [] if r.get("active") is True]
    if not active:
        failures.append(
            "check D: no catalog row has active true, so no branch past Match + Price Quote "
            "can ever be exercised."
        )
    return (not failures), failures


def check_e_export(export_text: str, export: dict, expect_nodes: int | None) -> tuple[bool, list[str]]:
    """The whole regression class of this pass."""
    failures: list[str] = []
    for tok in RETIRED_NODE_TOKENS:
        if tok.lower() in export_text.lower():
            failures.append(
                f"check E: retired token {tok!r} is still in the workflow export - a pasted "
                f"node was never removed"
            )
    for pattern in SECRET_ASSIGNMENT_RES:
        hit = re.search(pattern, export_text)
        if hit:
            failures.append(
                f"check E: an env var is ASSIGNED a value in the export ({hit.group(0)[:24]}...) "
                f"- a secret reached a file. A bare NAME is fine; an assignment is not."
            )
    nodes = export.get("nodes")
    if not isinstance(nodes, list):
        failures.append("check E: the export has no 'nodes' array - is this an n8n export?")
    elif expect_nodes is not None and len(nodes) != expect_nodes:
        failures.append(
            f"check E: node count is {len(nodes)}, expected {expect_nodes} "
            f"({len(nodes) - expect_nodes:+d} against target)."
        )
    return (not failures), failures



def check_f_prompt_binding(
    export: dict, facts: dict, quote_workflow_text: str | None
) -> tuple[bool, list[str]]:
    """
    The tool exists, it is wired to the agent's ai_tool input, and the grounding block is
    actually in the prompt. A tool with no grounding rules is the failure mode where the
    agent "remembers" a price instead of reading the tool result.
    """
    failures: list[str] = []
    names = [n.get("name") for n in export.get("nodes", []) or []]
    tool = [n for n in export.get("nodes", []) or [] if n.get("name") == "solar_london_quote"]
    if not tool:
        failures.append(
            "check F: no node named 'solar_london_quote' in the text agent. The quote tool was "
            "never added, or was added under a different name."
        )
    else:
        ttype = str(tool[0].get("type", ""))
        if "toolWorkflow" not in ttype:
            failures.append(
                f"check F: 'solar_london_quote' has type {ttype!r}; it must be a toolWorkflow "
                f"node pointing at the separate quote sub-workflow, not a pasted graph."
            )
        targets = ai_tool_target(export, "AI Conversation Agent")
        if "solar_london_quote" not in targets:
            failures.append(
                f"check F: 'solar_london_quote' is not wired to the AI Conversation Agent's "
                f"ai_tool input (found: {targets or 'nothing'}). The agent can never call it."
            )
        wf_id = tool[0].get("parameters", {}).get("workflowId")
        if not wf_id:
            failures.append(
                "check F: 'solar_london_quote' has no workflowId - it points at nothing."
            )

    sm = system_message_of(export, "AI Conversation Agent")
    if not sm:
        failures.append("check F: could not read the AI Conversation Agent systemMessage")
    else:
        for anchor in PROMPT_ANCHORS:
            if anchor not in sm:
                failures.append(
                    f"check F: the systemMessage is missing the required anchor {anchor!r}. "
                    f"The grounding block was not appended."
                )
        literal = (facts.get("persona") or {}).get("handoff_line_literal") or ""
        if literal and literal not in sm:
            failures.append(
                f"check F: the persona handoff literal {literal!r} is not in the systemMessage. "
                f"It is quoted from this file, so its absence means the persona changed."
            )

    if quote_workflow_text is not None:
        literal = (facts.get("persona") or {}).get("handoff_line_literal") or ""
        if literal and literal not in quote_workflow_text:
            failures.append(
                f"check F: the persona handoff literal {literal!r} is not present in the quote "
                f"workflow export. The fixed lead_line must match the persona verbatim."
            )
    return (not failures), failures


# --- main -------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        description="Catalog-derived content and price check for a Solar London quote document."
    )
    ap.add_argument("--catalog", required=True, help="catalog.json (authoritative catalog)")
    ap.add_argument("--facts", help="facts.json (fact sheet)")
    ap.add_argument("--quote", help="rendered quote, text or html")
    ap.add_argument("--ledger", help="price-ledger.json emitted by the workflow")
    ap.add_argument("--export", dest="export", help="text-agent n8n export to grep and count")
    ap.add_argument("--quote-workflow", dest="quote_workflow", default=None,
                    help="optional quote sub-workflow export, for the handoff-literal binding")
    ap.add_argument("--expect-nodes", dest="expect_nodes", type=int, default=None,
                    help="expected node count in the text agent export (44 after the change)")
    ap.add_argument("--print-catalog-checksum", dest="print_checksum", action="store_true",
                    help="compute the catalog checksum per spec 7.1.1 and exit; "
                         "--quote/--ledger/--export/--facts are not required in this mode")
    args = ap.parse_args(argv)

    if args.print_checksum:
        return print_catalog_checksum(args.catalog)

    for flag, value in (("--facts", args.facts), ("--quote", args.quote),
                        ("--ledger", args.ledger), ("--export", args.export)):
        if not value:
            die(f"{flag} is required (or use --print-catalog-checksum)")

    catalog = load_json(args.catalog, "--catalog")
    facts = load_json(args.facts, "--facts")
    ledger = load_json(args.ledger, "--ledger")
    export = load_json(args.export, "--export")
    raw_quote = load_text(args.quote, "--quote")
    export_text = load_text(args.export, "--export (raw text)")
    quote_workflow_text = (
        load_text(args.quote_workflow, "--quote-workflow") if args.quote_workflow else None
    )

    if not isinstance(catalog, dict) or not isinstance(facts, dict):
        die("--catalog and --facts must both be JSON objects")
    lines = ledger_lines(ledger)
    quote_text = visible_text(raw_quote)

    rep = Report()
    rep.add("A  catalog subset  (right business, right services)",
            *check_a_catalog_subset(catalog, lines, quote_text, raw_quote))
    readiness = a1_business_readiness(catalog)
    if readiness:
        rep.warn("A1 business readiness (is any real service quotable yet?)", readiness)
    rep.add("B  price binding   (every figure traces to a catalog unit_price)",
            *check_b_price_binding(catalog, ledger, quote_text))
    rep.add("C  token scan      (no placeholder, no retired business string)",
            *check_c_tokens(catalog, facts, quote_text, raw_quote))
    rep.add("D  self-test isolation (the probe can never be printed)",
            *check_d_self_test(catalog, quote_text))
    rep.add("E  export grep     (no foreign node, no Merge, no assigned secret)",
            *check_e_export(export_text, export, args.expect_nodes))
    rep.add("F  prompt binding  (grounding block present, tool wired to ai_tool)",
            *check_f_prompt_binding(export, facts, quote_workflow_text))

    print(rep.render())
    print("")
    print("Reminder: this does NOT replace scripts/verify_document.py on a rendered PDF.")
    print("It is the half that guard cannot do - it does not know the catalog.")
    return EXIT_FAIL if rep.failed() else EXIT_OK


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Fail as exc:
        print(f"check_quote_content: {exc}", file=sys.stderr)
        raise SystemExit(EXIT_USAGE)
