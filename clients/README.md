# clients/

Per-client workspace for the LaunchOps Onboarding Agent System. One folder per client — **never mix clients.**

`<client-name>` is a lowercase hyphenated slug of the client/company name
(e.g. `acme-corp`). The Leader Agent creates the structure automatically the
first time a client is named; it is reused for that client's later phases.

```
clients/<client-name>/
  transcripts/   # meeting/call transcripts and notes (input)
  pdfs/          # QA'd proposal, contract, invoice, receipt PDFs (output)
  emails/        # sent drafts (.eml) or send logs (output)
  build-spec/    # Infrastructure spec + roadmap for the dashboard build
```

Workflows reference this layout:
- Proposal agent saves PDFs to `pdfs/`.
- Email agent writes draft `.eml` files to `emails/` in draft mode.
- Infrastructure agent saves its build spec to `build-spec/`.
- Dashboard reference images live in `.opencode/dashboard IMG/`.
