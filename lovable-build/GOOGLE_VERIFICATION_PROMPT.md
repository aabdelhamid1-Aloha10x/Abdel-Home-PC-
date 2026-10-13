# Prompt for Codex: Google OAuth verification for Masar OS

Copy everything below the line into Codex.

---

You are helping the owner of Masar OS get Google OAuth verification (and, for the sensitive and restricted Gmail scopes, the security assessment). Work step by step, prepare everything, and stop for the owner wherever a human action is required. Be accurate and honest in every answer you give Google: reviewers reject exaggerated or inaccurate descriptions.

## Hard rules
1. Never ask for, type or store the owner's Google password, 2-step codes or any secret. When a login, 2-step prompt, CAPTCHA or payment screen appears, stop and ask the owner to complete it, then continue.
2. Do NOT click the final "Submit for verification" button, pay anyone, or sign anything until the owner has read your summary of exactly what will be submitted and replied "submit".
3. Do not change anything in the Masar app code or its Supabase project. This task is Google Cloud Console, Search Console, YouTube (unlisted demo video), and documents only.
4. Do not invent facts. Anything you cannot confirm, put in a "Questions for the owner" list and ask.
5. Do not use ANH, A&H, or any other company's project or data. Masar OS only.

## What Masar OS is (use these facts)
- Product: Masar OS, "your back office on autopilot" for trucking companies (dispatch, maintenance, safety, accounting, recruiting handled by AI staff; the owner approves anything outward).
- Operated by: Masar AI Inc. Support email: support@masar10x.io. Domain: masar10x.io (marketing site), app: https://app.masar10x.io.
- Legal pages on the marketing site: https://masar10x.io/privacy (contains a "Google user data" section with Limited Use wording) and https://masar10x.io/terms. Verify these are publicly reachable and the privacy page links back correctly. If the website is not published yet, tell the owner it must be published before submitting.
- Why we want Gmail access: a truck driver or small fleet owner connects their Gmail so Masar can (a) send load-negotiation emails to freight brokers from the driver's own address after the driver approves each one, with the Masar address quotes@masar10x.io in BCC, and (b) read ONLY broker and load-board emails and the replies to emails Masar sent, so Masar can show the offer, track the negotiation, and update the load. Masar ignores personal email. Nothing is sent without the user's approval. Masar never deletes or modifies mail.
- Scopes we expect to request (confirm the minimum set with the owner and the app's code before filing; keep it as small as possible):
  - openid, email, profile (sign-in identity, non-sensitive)
  - https://www.googleapis.com/auth/gmail.send (sensitive)
  - https://www.googleapis.com/auth/gmail.readonly (restricted) — only if we cannot do the job with a narrower scope; check whether gmail.metadata or a narrower option is enough and tell the owner.
- Google user data handling to describe truthfully: encrypted token storage server-side, per-company isolation, owner-only connect, audit log of every connect/read/send, user can disconnect and the token is revoked, no sale or advertising use, no human reading of mail except with the user's explicit permission or for security/legal reasons, no use to train generalized AI models. Confirm these against the Masar privacy page and the app's actual behaviour (ask the owner or inspect docs in the repo `docs/` folder if you have access) before stating them.
- Masar's AI provider (Anthropic) processes text to perform the task and does not train on it; this is stated in the privacy page. Mention it accurately in the data-handling section.

## Tasks

### A. Audit and prepare (do all of this first, report back)
1. Open Google Cloud Console (owner logs in) and identify the Google Cloud project used by the Masar app's OAuth client. Report the project ID, OAuth client ID, publishing status (Testing or In production), configured scopes, authorized redirect URIs, and branding fields. If no project exists, propose creating one under the owner's account and ask first.
2. Check the OAuth consent screen / Google Auth Platform pages: Branding (app name "Masar OS", logo 120x120, support email, app home page, privacy policy link, terms link, authorized domains), Audience (External), Data Access (scopes), and the Verification Center. List everything missing.
3. Domain ownership: confirm masar10x.io (and app.masar10x.io if needed) is verified in Google Search Console under the same Google account that owns the Cloud project. If not, give the owner the exact TXT record to add at the domain's DNS host (Hostinger) and wait for them.
4. Compare the privacy policy and homepage against Google's API Services User Data Policy and Limited Use requirements. List any gaps with exact wording to fix. Fixes to the website are done by the owner in another tool; give the exact text.

### B. Write the submission materials
5. For each scope, write a justification (2 to 5 sentences) explaining why Masar needs it, what exact feature uses it, and why a narrower scope is not enough. Keep it factual.
6. Write the "how users interact with the app" description and a data-handling summary.
7. Write a demo video script and shot list (English, 2 to 4 minutes, narrated), to be recorded by the owner and uploaded to YouTube as unlisted. It must show: the OAuth consent screen with the browser address bar visible and the client_id in the URL; the app name and logo; granting each requested scope; and, for each scope, the exact feature that uses it (sending an approved email with quotes@ in BCC; the reading of broker/load mail only; disconnecting and revoking access). Include the on-screen narration lines.
8. Prepare a "test account" note for Google reviewers if they request one: describe a safe way to demo the app without exposing real customer data (the owner decides; do not create accounts yourself).

### C. Restricted scope security assessment (if gmail.readonly is requested)
9. Explain Google's current process for restricted scopes: the third-party security assessment (CASA, Tier 2, through the App Defense Alliance) and the Letter of Assessment, and that it is renewed yearly. Look up Google's current official list of approved assessors and the current price ranges from their sites. Give the owner a comparison of at least three assessors with cost, timeline, what they need from us, and a recommendation. Do not contact or pay any vendor without the owner's approval.
10. Prepare the self-scan and evidence list we will need (for example: dependency scan, authentication and authorization controls, encryption at rest and in transit, logging, vulnerability disclosure contact). Ask the owner for anything you cannot see.

### D. Submission
11. When A to C are complete, give the owner a single review package: the final field values, scope justifications, video link, policy links, and the list of what remains. Wait for "submit". Then fill in the Verification Center form and submit only what was approved. Afterwards, record the submission date and reference, and what to expect next (Google usually replies by email to the Cloud project owner and support contact; answer reviewers' questions promptly and honestly).
12. Also note, separately, what Microsoft needs for the Outlook/Microsoft 365 connection (app registration and optional publisher verification) so the owner can plan it. Do not act on it.

## While waiting for Google
- Do not move the OAuth app out of its current status unless the owner confirms. The product plan is to run as an unverified app (about 100 users, warning screen) until verification completes; check and tell the owner the exact current limits from Google's documentation and whether the app should be "In production" while unverified.
- Tell the owner every date and deadline you find.

## Output format
Reply in plain English, short sections, a checklist at the top showing done, blocked by owner, and not started. List "Questions for the owner" at the bottom. Put all drafted text (justifications, video script, privacy fixes) in clearly labelled blocks the owner can copy.
