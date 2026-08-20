# Discovery Call Transcript

**Client:** Mike Johnson
**Company:** Bloomline Apparel (ecommerce — women's activewear)
**Call type:** Discovery / Strategy Call
**Date:** August 5, 2026
**Attendees:** Raymon (LaunchOps AI), Mike Johnson (Bloomline Apparel — Owner)

## Contact Details

**Client — Mike Johnson**
- Company: Bloomline Apparel
- Address: 14 Marlowe Street, Manchester, M1 4BT, United Kingdom
- Email: raymon4d.scales@gmail.com
- Phone: +44 7700 900123

**Provider — Raymon (LaunchOps AI)**
- Address: 27 Baker Court, London, EC1A 1BB, United Kingdom
- Email: abdul123rahmanj@gmail.com
- Phone: +44 7700 900456

---

**Raymon:** Thanks for hopping on, Mike. So from what you filled in on the intake form, you're running an ecom store and want to get a text-based AI agent in place. Walk me through what's going on right now.

**Mike:** Yeah so we're doing decent volume — probably 40-50 DMs and website chat messages a day between Instagram and our site. Half of it is "where's my order," half of it is people asking about sizing before they buy, and then there's a chunk of abandoned carts we're just not following up on at all. My one support person can't keep up and I don't want to hire a second one yet.

**Raymon:** Got it. So we're looking at three main use cases — order status lookups, pre-purchase sizing/product questions, and abandoned cart recovery. Anything else you'd want it handling?

**Mike:** If it could also just qualify people who ask about wholesale or bulk orders and hand those off to me directly, that'd be huge. I don't want the bot trying to negotiate bulk pricing.

**Raymon:** Perfect, that's a clean handoff-to-human case — we'll build that in as a hard trigger. So to summarize the scope: this is a **Text AI Agent for ecommerce**, handling inbound order status, product/sizing questions, abandoned cart follow-up, and bulk-order lead qualification with human handoff.

**Mike:** Exactly.

**Raymon:** On the platform side — what are you running things on right now?

**Mike:** Shopify for the store, and our DMs come through Instagram and a website chat widget. We don't have any CRM really, it's just been me answering things manually in Shopify's inbox and Instagram.

**Raymon:** No problem, we'll wire it up so GoHighLevel is the CRM layer, n8n handles the automation/orchestration between everything, and Supabase stores the data so we have a clean record of every conversation. For the text agent itself we'll build it on our standard stack.

**Mike:** Sure, whatever works best on your end.

**Raymon:** For integrations, we'll need to connect: Shopify (for order status lookups), Instagram DM, your website chat widget, and email for the abandoned cart follow-up sequence. Does that cover everything?

**Mike:** Yeah I think so. Oh — we also use Klaviyo for email marketing, would that need to be touched?

**Raymon:** Good call, we'll loop in a read-only connection to Klaviyo so the agent doesn't duplicate an abandoned cart email that's already going out. I'll add that to integrations.

**Mike:** Perfect.

**Raymon:** Timeline-wise, once we get your intake form back with product catalog info and brand voice guidelines, we're usually looking at about **7-10 business days** to first build, then a review round before it goes fully live.

**Mike:** That works, we're not in a huge rush, just want it done right.

**Raymon:** Awesome. Let's talk numbers. Our one-time setup fee for this scope — the build, testing, and deployment across all four integrations — is **$3,000 USD**. That covers everything through go-live.

**Mike:** Okay, that's in line with what I expected.

**Raymon:** Then after go-live, there's a monthly optimization and maintenance fee of **$750 a month**. That covers ongoing monitoring, refining the agent based on real conversations, minor tweaks to responses and objection handling, and keeping the CRM/workflow integrations maintained. Any bigger stuff — new integrations, a new agent for a different channel — would be quoted separately.

**Mike:** Got it, that's fine.

**Raymon:** For payment — we'll run this through Stripe. The setup fee is due before we start the build. The monthly retainer will bill on the **1st of each month** going forward. If a monthly invoice goes more than **5 days** past due, a **5% late fee** applies.

**Mike:** No issues there, I'll have Stripe set up on my end by end of week.

**Raymon:** Perfect. And on the agreement side — this runs month-to-month after go-live, either of us can end it with **14 days' written notice**.

**Mike:** Sounds fair.

**Raymon:** Last thing — once this is live, you're going to get access to a dashboard so you're not just trusting it blindly. We'll be tracking things like: how many conversations are coming in and from which channel, how many get fully resolved by the AI versus handed off to you as a human, how many of those bulk-order leads specifically get flagged, response times, and how many follow-ups are still outstanding at any given moment. You'll be able to filter all of that by last week, last month, whatever range you want.

**Mike:** That's exactly what I was hoping for, honestly — I have zero visibility right now.

**Raymon:** That's the goal. Okay, I'll get the proposal, contract, and invoice over to you today so we can get the setup fee processed and get the build kicked off.

**Mike:** Sounds great, talk soon.

**Raymon:** Thanks Mike, talk soon.
