# Owner decisions log
## 2026-10-13
- Test sign-in approved for masarai2025+void1@gmail.com (Void Test Haul) only; no service-role session minting ever.
- Sign-up and sign-in use one field: email or mobile number. Code sign-in is the default, password optional. Phone sign-up requires an email later. Mobile number is optional when starting with email.
- A&H test company (ahlogisticscorp@gmail.com) goes to the Solo plan. Credits rule: on downgrade the user keeps the current balance until the next billing cycle, then it resets to the plan's included amount (Solo 300). Packs never expire; included credits expire monthly. This must be clear in the Terms (legal pages only, never marketing pages).
- Recruiting is shown as available everywhere.
- Growth is the "Most popular" plan.
- Legal wording was approved earlier; no new lawyer review needed.
- Calendly holds the demo questions; Book a demo goes straight to Calendly.
- Google: do the Limited Use wording and start the Gmail verification. Support email is support@masar10x.io (not billing@).
- VAPI and Twilio keys are in Lovable Secrets. Stripe verification is complete.
- Models: Anthropic stays default. Run an OpenAI cost/quality comparison; switch only if same quality (same pass rate and answers) and cheaper.

## 2026-10-13 (later)
- Sign-up mockup: removed the gray "Sign in" link from the top right; phone numbers auto-format to +1 (555) 123-4567 as typed. Renewal price on the card step stays.
- Email plan approved: Masar inbox address quotes@ (per-company token, quotes+token@masar10x.io). Masar AI reads it. Every outgoing broker email BCCs it so the broker never sees it; replies tracked by thread. Sent to the app project.
- Accessibility target: better than 95 (aim 100); performance, best practices, SEO at least 95 after publish.
- Cancellation and refunds: cancel stops future charges, no refund for the current month; refunds case by case by management; approved refunds are net of card processing fees (not returned). Card fees are paid by Masar. Goes into Terms and cancel flow copy.
- Models: Anthropic default, Lovable AI gateway as automatic fallback; OpenAI comparison only if the owner adds a key and quality is identical and cheaper.

## 2026-10-13 (evening)
- quotes@masar10x.io: Hostinger forwarder created to quotes@miefenieg.resend.app; Resend webhook and RESEND_WEBHOOK_SECRET added by the owner. Needs a publish, then a two-email test.
- Mailbox connection: build official Google and Microsoft OAuth now; run Google as an unverified app (about 100 users, warning screen) until verification completes. No password capture or lookalike login pages. Password path stays on hold. Sending from the user's own address with quotes@ in BCC, replies read from the mailbox.
- Google cap guard: counter with warning at 80 and stop at 95 users, fall back to forwarding. Lovable to verify Google's unverified-app rules from Google's docs before building.
