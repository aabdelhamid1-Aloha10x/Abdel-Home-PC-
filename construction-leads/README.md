# Construction lead-gen system

Goal: sell the **free estimate**. Get homeowners and businesses to request it, book it, show
up for it, then win the job from a written quote.

## Funnel

```
Ads / SEO / referrals
        │
        ▼
 Landing page (index.html) ──► lead form ──► webhook (Make / n8n)
        │                                        │
        │                          ┌─────────────┼───────────────┐
        ▼                          ▼             ▼               ▼
  Booking calendar          CRM + Sheet     SMS/email        wait 5 min
  (Calendly / Cal.com)      (lead record)   confirmation         │
        │                                                        ▼
        ▼                                          booked? ─ yes ─► done
  Appointment booked                                   │ no
        │                                              ▼
        ▼                                     Voice agent calls lead
  Reminders (24h / 2h)                        (voice-agent/prompt.md)
        │                                              │
        ▼                                              ▼
  On-site estimate  ◄────────────── books appointment ◄┘
        │
        ▼
  Written quote ► follow-up ► signed job
```

## What's here
- `index.html`, `styles.css`, `app.js`: static landing page, no build step. Open the file or host it anywhere (Netlify, Vercel, Cloudflare Pages, GitHub Pages).
- `config.js`: company name, phone, service area, webhook URL, booking URL.
- `voice-agent/prompt.md`: outbound call script, rules and tool list.

## Launch checklist
1. Fill in `config.js` (name, phone, area) and the license # in the footer.
2. Create the booking page (Calendly / Cal.com) and paste into `bookingUrl`.
3. Build the webhook scenario in Make or n8n: receive lead → save to CRM/Sheet → send SMS/email → wait 5 min → check calendar → if not booked, trigger the voice agent.
4. Create the voice agent (ElevenLabs Agents + a Twilio number) from `voice-agent/prompt.md`, with `check_availability` / `book_appointment` tools pointing at the calendar.
5. Add real photos of finished work, reviews, license and insurance badges (biggest conversion lever).
6. Add Google Ads / Meta pixel + conversion event on form submit (`showBooking` in `app.js`).

## Compliance (do not skip)
- Calling a lead with an automated/AI voice requires **prior express written consent**. The form has an explicit consent checkbox and we send the exact consent text with every lead. Keep those records.
- Disclose the AI on the call, call only 8am–8pm local time, honor opt-outs immediately, scrub against the National DNC list where required, and check state rules (e.g. FL, OK, WA).
- Confirm contractor licensing/advertising rules for your state. License number must usually appear in ads.

## Lead payload (POST JSON to `leadWebhookUrl`)
`name, phone, email, zip, service, propertyType, timeline, details, consent, consentText, page, submittedAt, utm{}`
