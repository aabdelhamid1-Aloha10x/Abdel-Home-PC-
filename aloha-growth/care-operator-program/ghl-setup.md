# GHL Setup: Care Operator Program Funnel

The qualifying questionnaire lives on the landing page, because it branches into two paths and filters people out. Every application is sent into GHL with tags and the answers. Only qualified applicants see your GHL calendar.

It takes about 15 minutes in GHL. Send me the two items marked **SEND ME**.

---

## 1. Calendar (5 min)

Calendars → Create Calendar → **Round Robin** or **Personal** (whoever takes the calls).

- **Name:** Care Operator Strategy Call
- **Duration:** 30 min. **Buffer:** 15 min. **Minimum notice:** 4 hours. **Booking window:** 14 days.
- **Form on the calendar:** keep the default (name, email, phone). The page prefills these, so the applicant only picks a time.
- **Confirmation:** SMS + email confirmation, plus a reminder 24 h and 1 h before.
- **Location:** Zoom or Google Meet link.

**SEND ME:** the calendar ID. Open the calendar → Share → Embed code. It's the code after `/widget/booking/`.

---

## 2. Inbound webhook workflow (5 min)

Automation → Workflows → Create → Start from scratch.

1. **Trigger:** "Inbound Webhook". Copy the webhook URL it shows.
2. **Action: Create/Update Contact.** Map first_name, last_name, email, phone from the webhook.
3. **Action: Add Tags.** Map the `tags` field (it arrives as care-operator-program, path-launch or path-scale, qualified or disqualified, dq-reason).
4. **Action: Update custom fields** (create these under Settings → Custom Fields, all single-line text):
   - Path, Qualified, DQ Reason, Score
   - Care Type, Years Experience, Current Role, Ready Clients, Capital, Timeline
   - Locations, Clients Now, Revenue, Challenges, Growth Budget
5. **If/Else on Qualified = true:**
   - **Yes:** add to pipeline **Care Operator Program → Stage "Qualified – Book Call"**. Send SMS: "Thanks {{contact.first_name}}! Grab your strategy call time here: [calendar link]". This catches people who left before booking.
   - **No:** pipeline stage **"Nurture"**, and add them to a free-training email sequence.
6. Save and **Publish**.

**SEND ME:** the inbound webhook URL. I put it into the landing page config and send a test application to confirm the fields map.

---

## 3. Pipeline (2 min)

Opportunities → Pipelines → **Care Operator Program**, with stages:
Applied → Qualified – Book Call → Call Booked → Showed → Enrolled → Nurture.

Add a workflow: **Appointment booked** on the strategy calendar → move to "Call Booked".

---

## What the funnel asks

**Q1 (splits the paths):** run a business with a location / experience but no location / new to the industry (filtered out).

**Launch path (no location yet):** care type, years of experience (under 1 year is filtered out), current role, children/clients ready to come along, capital for the first 90 days (under $10K is filtered out), start date ("just exploring" is filtered out).

**Scale path (has a location):** business type, number of locations, children/clients served, annual revenue, biggest challenges, growth budget (under $10K is filtered out), start date ("just exploring" is filtered out).

The dollar and experience cut-offs are my starting assumptions. Change them anytime in `siteConfig.funnel` in the Lovable project, or tell me the numbers you want.
