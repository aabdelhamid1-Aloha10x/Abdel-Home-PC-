# Screen spec: P6_loadhub

### Find loads (`WebLoadHub`)

One ranked list of load offers from boards, brokers, email and text for the whole fleet, showing what the fleet keeps and which truck should take each one.

- Offers come from connected sources (see Sources): load boards, broker APIs, forwarded emails and text messages. Each offer is read, matched to a lane and checked against the broker authority list daily.
- Ranking: offers with a verified broker and at least one truck that passes the planner come first, then by the profit the fleet keeps (rate minus fuel and operating cost for loaded plus empty miles). Empty miles are measured from the best truck.
- The planner runs the same 6 checks as the dispatch planner (equipment, timing, hours of service, home time, truck and trailer, profit) for the three best trucks. Changing rate or weight recalculates them live.
- Verdict: Book it (all checks pass, keep of $300 or more and $1.00 a mile or more), Counter at a rate that reaches $1.35 a mile, Try another truck, or Pass (broker not verified or no truck fits). Unverified brokers cannot be booked.
- Buttons: Book sends a booking request or reply and starts a load; Reply sends the suggested reply; Counter sends a counter; Pass sends a polite no. All are Ask first by default. Auto-reply and auto-book are controlled in Preferences and rules.
- Replies use the company signature. Everything that is sent is written to the load thread and the audit log. Offer data from boards is shown only as the provider allows (see Sources).
- Roles: Dispatchers and the Dispatch manager can reply, counter and book; Accountants and Recruiters cannot see the Load hub.


### Sources (`WebSources`)

Where load offers come from: status, connection method, what each source allows and how to connect it safely.

- Statuses: Connected, Waiting for approval, Email only (offers arrive by email or EDI, no live search), Not available (provider offers no carrier access yet). Methods: API, EDI, Email, Share.
- What it can do shows search, book and rates per source. Booking is shown only where the provider allows booking by third-party apps; otherwise the app helps reply to the broker.
- The row drawer shows the connect steps, the exact permissions asked for and the last errors. Reconnect appears when a token expires; missed offers are loaded after reconnecting.
- Rules: passwords are never stored or asked for. Only OAuth or an official API or partner key is used, stored encrypted per company. No scraping of provider websites.
- Request access sends a pre-written request (MC, DOT, insurance, use case) to the provider and tracks the answer. The status moves to Waiting for approval and the company is emailed on any change.
- Roles: Owner and Dispatch manager can connect, reconnect and disconnect. Dispatchers can see status and errors. Every change is written to the audit log.


### Preferences and rules (`WebHubRules`)

Company preferences and rules for the Load hub: what to show, which brokers to trust, when to reply and when the assistant may book.

- Search preferences: lowest rate a mile, farthest empty miles, heaviest load, equipment, states to avoid, preferred lanes. Offers that break a rule are hidden or ranked lower; the test panel shows exactly what is hidden and why.
- Home-time rules reuse the planner checks. Require verified authority hides brokers whose FMCSA authority or bond is not active; it is re-checked every morning.
- Blocked brokers are never shown, replied to or booked. A broker is added by a manager with a reason (late pay, double brokering) and can be unblocked here. Changes are audit logged.
- Auto-reply rules send short templated replies with the company signature inside quiet hours. Counters are calculated, never above the posted rate plus a cap, and never include promises about detention or accessorials.
- Auto-book defaults to Ask first. Auto within my rules books only when all 6 planner checks pass with no warnings, the broker is verified and known, rate and profit meet the limits, and the daily cap is not reached. Reefer, hazmat and team loads are never auto-booked.
- Only the Owner and Dispatch manager can change auto-reply and auto-book rules. Save writes one audit log entry listing each change.

## Chat
