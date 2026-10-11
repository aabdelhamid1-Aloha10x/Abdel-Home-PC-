# Masar OS voice agent: how it talks, how it is wired (Vapi)

Goal: calls that sound like a sharp, friendly fleet-office coworker. Short, warm, no robot phrases.
Honesty rule (non-negotiable): the agent does not open with "I'm an AI", but it NEVER denies being one. If asked sincerely ("are you a bot / real person?") it says so plainly and offers a human.

## 1. Wiring
- Telephony: Vapi. Import the approved Twilio number into Vapi (needs Twilio Account SID + Auth Token, stored as secrets, never in chat).
- Number ownership: Masar OS needs its OWN numbers (not A&H / RL DESUE LLC registrations). Voice can pilot on the existing Twilio number. SMS must be registered under Masar AI Inc. before customer use.
- Secrets (Lovable secure form): VAPI_API_KEY, VAPI_WEBHOOK_SECRET, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN.
- Lovable builds: Settings > Voice (per company: persona name, voice, number, use-case switches, calling hours, spend caps); server function creating/updating the Vapi assistant per use case; webhook route (/api/public/vapi) verifying the secret, handling tool calls and the end-of-call report; call log table (company_id, use case, work_order/load/driver id, number, recording url, transcript, outcome, cost, duration); credits charged per minute; every action audit logged.
- Verify every setting name against the CURRENT Vapi docs before use (names below may differ by version).

## 2. Voice and delivery settings (starting values, tune by ear)
- Voice provider: ElevenLabs (flash/turbo model) or Cartesia Sonic, a natural US adult voice; test 5 candidates, pick by blind listening. Stability ~0.4-0.5, similarity ~0.75, style low, speed 1.0-1.05.
- Transcriber: Deepgram Nova-3, language en-US, smart endpointing on; keywords: trucking terms (reefer, dry van, PM, DOT, lumper, detention, BOL, ELD, DVIR, tire rotation, brake, DEF).
- LLM: fast model, temperature ~0.6, max ~90 tokens per turn, streaming.
- Turn-taking: wait ~0.4s before speaking, stop speaking after 2 words of interruption, back off ~1s; silence timeout 20s with one gentle "you still there?"; max call 8 min (shops) / 3 min (check calls).
- Realism: backchanneling on ("yeah", "mhm", "got it"), light filler/disfluency on, soft office background sound at low volume, voicemail detection on, no pause longer than ~1s before answering.
- Numbers and names: say prices as people do ("twelve fifty", "about nine hundred"), unit numbers digit by digit, always read back date/time/price once.

## 3. Style rules (put in every system prompt)
- One question at a time. Sentences under ~15 words. Contractions always. Mirror the other person's pace and vocabulary.
- Open like a coworker: "Hey, this is {persona} with {company}, maintenance. Got a quick minute?" Use their name once or twice, not constantly.
- Small human reactions: "Gotcha." "Okay, perfect." "Hm, let me check." Never "Certainly!", "I understand your concern", "As an AI".
- If the audio is unclear: "Sorry, say that one more time?" Never guess prices or dates.
- If asked something outside scope: "Let me have {manager} call you right back on that." then transfer or create a "Needs you" item.
- If asked if it is an AI: "Yeah, I'm an AI assistant for {company}'s fleet team. Happy to get a person on the line if you'd rather." Then continue or transfer.
- Hard stops: no promises above the spend cap; no price agreed without read-back; never discuss other customers; end the call politely when the goal is done.

## 4. Use-case prompts (each is a separate assistant)
### A. Shop quote and booking (outbound, business hours only)
Goal: get a written quote and a slot for {work_order}. Info given by tool: truck year/make/model, unit number, issue, photos link by text, preferred window.
Flow: greet > ask for the service writer > describe the job in one breath > ask price range and parts availability > ask earliest slot inside the window > confirm drop-off time and who to ask for > say the quote will be texted/emailed to {sms_or_email} > read back price, slot and PO/reference > end.
Rules: never accept above {auto_limit}; above it say "let me run that by my manager and call you back" and create a Needs-you item; never agree to teardown/extra work without approval; record the quote through tool record_quote.

### B. Driver check call (outbound, only after app + text got no reply, or late to a pickup; default OFF)
Goal: find out if the driver is OK and the ETA.
Flow: "Hey {first_name}, it's {persona} from {company} dispatch. Just checking on you, everything good with load {load_ref}?" > ETA/location/issue > if problem: create issue and alert dispatcher > if all good: log ETA, end in under 90 seconds.
Rules: calling hours and driver consent respected; never lecture; never call during recorded rest/sleeper status unless urgent.

### C. Inbound hotline (drivers, and the company number)
Goal: answer fast, identify caller by caller ID, open a work order / chat thread / issue, alert the right department, or transfer to a human.
Flow: "{company}, this is {persona}." > who and what truck > one clarifying question > confirm what will happen next and who calls back > end.
Rules: breakdown or accident = collect location + injuries first, alert the on-duty manager immediately, offer transfer.

### D. Broker/receiver status calls (outbound)
Goal: confirm appointment, ETA, detention start. Short, polite, read the reference number twice, log the result to the load.

## 5. Tools the assistants may call
get_work_order, get_truck, get_load, get_driver_status, check_shop_availability, record_quote, book_slot (only within limits), create_needs_you_item, create_issue, send_sms(text), transfer_to_human(department), end_call(outcome). All tool calls are audit logged with the call id.

## 6. Test plan before any customer sees it (Lovable + owner)
20 scripted calls: normal quote; shop says price is high; shop asks "who is this / are you a robot"; interruption mid-sentence; background noise; voicemail; IVR menu; "call me back later"; wrong number; angry person; driver in an accident; driver says all good; unclear audio; request above the spend cap; request for another customer's info.
Pass = outcome logged, no invented prices, honest about being AI when asked, under 1s response gaps, no overlap/talk-over loops. Review recordings, tune the prompt, repeat. Measure: completion rate, average duration, cost per call, % needing a human.

## 7. Compliance guardrails
- Calls/texts to drivers: recorded consent in the app; opt-out honored immediately.
- Recording notice where the state requires it (shop and broker calls: say "this call may be recorded" only where required; configurable per state).
- AI-voiced calls to consumers need prior express consent (TCPA); the use cases above are business and employee calls only. No cold calling.
- Calling hours 8am-8pm in the recipient's local time; shop calls during shop hours.

## 8. Breakdown call to a shop or mobile mechanic (extends use case A)
### 8.1 Case file the agent receives BEFORE dialing (built from the driver's Issue report + Phase 4 + ELD)
- Who/where: company name, driver first name and callback number, exact location (address, highway and mile marker, GPS link), nearest city, "can the truck move?" (drivable / limp / not drivable).
- Truck: unit number, year, make, model, engine, last 6 of VIN, trailer type and whether loaded (reefer/dry), fault codes (from ELD when connected), symptoms in the driver's words, when it started, recent related work orders.
- Urgency: load delivery deadline, detention exposure, safety/out-of-service flag.
- Money: auto-approval limit, target price, walk-away price, payment method (company card / PO / invoice), who can authorize above the limit.
- Evidence: photos/videos the driver uploaded (links).
The agent describes the problem exactly, in plain words, in this order: where the truck is and whether it moves > what it is (year/make/engine) > what it is doing > fault codes > deadline.

### 8.2 Photos and texts while on the phone
- Tool send_media(to, text, media_urls): sends MMS (or a link) from the company number while the call continues. The agent asks "What's the best number to text pictures to?" and says "Sending them now, let me know when they come through." It waits for confirmation and takes the shop's answer ("looks like X").
- Landline or no-MMS shops: fall back to email or a short link page with the photos.
- Requirement: texting must run through a Twilio-style number registered for Masar AI Inc. Vapi itself is voice; if the number is a Vapi-provided number it cannot text. Verify which number type is used.

### 8.3 Quote capture (structured, so quotes compare fairly)
Record per shop: type (shop / mobile / tow+shop), availability and ETA to truck, diagnostic or service-call (road call) fee and whether it is waived when they do the repair, travel/mileage charge, after-hours or weekend surcharge, labor (FLAT RATE for the job or HOURLY rate + estimated hours + "not to exceed" cap), parts estimate and markup, shop supplies/environmental/disposal fees, tax, tow or storage if needed, payment terms accepted, warranty, the person's name, and quote reference. The system computes an ALL-IN total and a comparison across shops.

### 8.4 Negotiation playbook (honest, firm, friendly)
1. Ask for a flat rate "out the door" for the whole job first. If none, take hourly rate + estimated hours + a not-to-exceed cap.
2. Ask about every fee up front: "Is there a service call or diagnostic fee? Does it come off if you do the repair?" "Any travel, after-hours or shop supplies charges?"
3. Anchor with history and facts: "We're a repeat fleet, we pay on time, and we have more trucks that run through here" (only if true). Mention that other quotes are being collected only when that is true.
4. Concession ladder: ask to waive the service/diagnostic fee > ask for fleet or repeat-customer labor discount > ask for a lower travel charge > ask for a not-to-exceed cap > ask for a faster slot at the same price. Move one lever at a time and trade for something (payment speed, repeat business, a quick yes).
5. Never invent a competing price, never claim authority it does not have, never accept above the auto-limit. If the final all-in price is above the limit: "Let me run it by my manager and call you right back" and create a Needs-you item with the comparison.
6. Close: read back all-in price, slot, location, contact, authorization method; send the written quote request by text/email.
Targets come from the company's own work-order history by service type, with a safe walk-away ceiling. The agent logs everything it offered and what was agreed.

### 8.5 After the call
Quote(s) saved to the work order; if within limits and a single best option exists, Autopilot books it and texts the driver ETA and shop address; otherwise a Needs-you item shows the 2-3 all-in comparisons with a recommendation. Driver is told what is happening by text at each step.

## 9. SMS through Vapi
Vapi is a voice platform. Texting is done by the app through Twilio (same number if it is a Twilio number imported into Vapi). A Vapi-provided number cannot send texts. Inbound texts from shops/drivers land in the Shared inbox and attach to the work order. Keep opt-in/opt-out records per recipient.

## 8.6 REVISION: two-stage negotiation (replaces the pushy parts of 8.4)
Principle: the shop must never feel the caller is cheap. The agent is warm, appreciative and quick to say yes. Total pushback on the phone is ONE gentle ask, not a ladder.
### Stage 1: on the call (light touch, at most 1-2 soft asks)
- Get the facts first: flat rate or hourly + cap, service-call/diagnostic fee, travel, after-hours, parts, supplies/environmental fees, tax, ETA, warranty.
- Then ONE easy ask, phrased as a favor, only if the price is above target: "Is there any room on the service call fee if we do the repair with you?" or "Best you can do on the labor?" Accept the first reasonable answer.
- Never haggle twice on the same item, never mention being cheap, never threaten to go elsewhere, never go silent or stall. If the shop sounds reluctant, the agent stops pushing, thanks them and moves on.
- Priority on a breakdown is SPEED and a yes. When the truck is down and the deadline is tight, the agent skips Stage 1 negotiation entirely and books.
- Over the auto-limit: "Let me confirm with my manager and I'll call you right back."
### Stage 2: at payment (after the work is done, friendly and professional)
- Handled by the Accounting/Autopilot flow with a short call, text or email from the persona once the invoice arrives: thank them for the quick turnaround, check the invoice against the quote, and ask for small reasonable adjustments in this order: (1) remove or reduce sales tax if the company has a resale/exempt certificate on file (only when legally valid, never invent an exemption), (2) remove duplicate or unquoted fees (shop supplies, environmental, admin), (3) a small prompt-payment or fleet courtesy discount in exchange for paying quickly (e.g., "we can pay today by ACH if you can take off the shop fees").
- Offer something real in return: fast payment (the app only records money; the owner pays), repeat business, a good review/rating in the preferred-shop list.
- Never dispute work quality as a tactic. If the invoice is above the not-to-exceed quote, ask for the quote reference and a corrected invoice.
- Outcome logged on the work order: quoted vs invoiced vs paid, savings achieved, shop reaction notes. A shop that pushed back gets a "keep happy" flag so the assistant protects that relationship.
Targets: Stage 1 aims at 0-5% off (mostly fees), Stage 2 at 5-10% off the invoice (tax, fees, courtesy discount). Never at the cost of the shop's willingness to take the next call.

## 8.7 PAYMENT HANDOFF (money stays record-only; the owner pays)
Decision: Masar OS never moves money and never stores card numbers or bank logins. The AI collects HOW to pay and hands it to the owner; the owner pays outside the app and marks it paid.
### What the AI collects from the shop (call, text or email)
Preferred payment method and details: pay link / invoice portal URL, Zelle (phone or email + registered name), ACH (remit-to name, routing and account, only if the shop volunteers it), check (payee name + mailing address), card over the phone (the owner calls, the AI does NOT take or read card numbers), cash/other. Also: exact invoice number and amount, due date, any prompt-pay discount, W-9 request, who to contact about payment.
### Where it goes
- A Needs-you item "Pay shop" (also on the work order > Payment tab) shows: shop, work order, quoted vs invoiced amount, savings achieved, payment method + details, due date, invoice file. Buttons: Approve and Share (sends the details to the owner by in-app notification/text/email), Ask shop to correct invoice, Mark paid, Dispute.
- Who approves: Owner or Operations manager at any amount; Shop manager up to the company limit (default $1,500). Above the limit needs a second approver. Nobody approves their own created item. Everything audit logged.
- Mark paid captures: date, method, amount, reference/confirmation number, optional receipt upload. The AI can then send the shop a short "paid, thank you" text with the reference.
### Safety (vendor payment fraud is the main risk)
- Payment details (Zelle, bank, remit-to) are stored encrypted per company and visible only to Owner, Operations manager and Accounting roles; masked elsewhere.
- Any change to a shop's saved payment details is flagged and requires a verification call-back to the number already on file before it can be used (the AI never trusts a "new bank details" text or email on its own).
- The AI never pays, never promises a payment date it was not given, and never reads out card numbers.
- Saved vendor profile: shop name, contacts, preferred method, W-9 on file, tax-exempt status, payment history, "keep happy" flag.
