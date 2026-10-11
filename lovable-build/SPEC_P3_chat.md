# Screen spec: P3_chat

### Chat (`WebChat`)

The chat hub: one persistent room per driver, department and team rooms, direct messages and the Fleet broadcast, with topic routing, private topics, Needs me, translation and assistant help. Replaces the Telegram groups.

- Driver room: one persistent conversation per driver. Members are the driver, the assigned dispatcher and team leader, plus any department seat pulled in by a topic. The driver sees one plain chat; staff see a topic tag on every message.
- Topics: General, Load (auto-tagged with the driver current load), Maintenance, Pay and accounting, Safety and compliance, Recruiting and HR. Posting in a topic notifies that department seats. Staff filter by topic or Needs me. The assistant tags topics and staff can change the tag.
- Private topics: Pay and accounting is readable only by accounting, management and the assigned dispatcher if the role allows it. Everyone else sees a Private topic placeholder. The View as switch shows what each seat sees.
- Needs me: any message can be assigned to a person. It shows on their queue until Mark done. One-click actions turn a message into a work order, expense, task or dispatch note, and show a created chip on the message.
- Files and voice: photos and documents (BOL, receipt) are read by the assistant and offered as load documents. Voice notes show a transcript. English and Spanish are translated both ways; the original is kept and the translation line can be hidden.
- Delivery and timers: read receipts per message. If the driver has not opened the app within the SMS fallback minutes the message is sent by text (metered credit use, never shown as a price). Unanswered messages go amber after the topic SLA. After-hours coverage rules route to the on-call seat.
- Assistant strip (Ask first): summarize a long thread, draft a reply, auto-tag the topic, detect a breakdown and offer a work order, detect a short-pay claim. Nothing changes until a person clicks.
- Plans: driver rooms and one Dispatch room on every plan. Department rooms, team rooms, topic routing and private topics on Growth. Carrier-wide chat controls on Enterprise.


### Announcements (`WebAnnounce`)

Announcements and the morning roll call: one-way notices to the whole fleet, a team, a driver program or selected drivers, with read receipts, acknowledgement, scheduling and text fallback.

- Audience: everyone, a team, a driver program (company, lease, owner-operator, team drivers) or selected drivers. The reach count updates as you choose. Send now or schedule.
- Delivery: the app first. If a driver has not opened it after the fallback minutes it is sent by text message (metered credit use, never shown as a price). Spanish readers get a translated copy; staff see the original.
- Acknowledge: optional. The driver taps Acknowledge; the table shows delivered, read and acknowledged bars. The drawer lists who has not acknowledged with a Remind button per person and Remind everyone. Reminders go to the driver room.
- Read receipts and acknowledgement are Growth. On Core announcements are plain messages in the Fleet channel without receipts.
- Roll call: a scheduled message in every driver room with Ready, Late and Off buttons. Replies fill the Roll call screen. Escalation ladder: text after N minutes, tell the dispatcher, assistant call (Growth, Ask first, consent required).
- Roles: operations manager, dispatch leaders and the owner can send fleet notices. Team leaders can send to their own team. Every send is in the audit log.

## Customers


### Messages (`WebInbox`)

Shared inbox for email, texts and calls with load links, assignment, internal notes and assistant-drafted replies.

- Three panes: folders (All, Mine, Brokers, Drivers, Customers, Candidates, Unassigned, Starred), thread list with channel icon, linked load and assignee, and the thread.
- The Inbox assistant sorts each thread, writes a one-line summary, links the load, and drafts a reply with the company signature. Ask first: a person always presses Send. Undo send works for 10 seconds.
- Assign to any teammate, star, snooze until Monday 8:00 am, close (a new reply reopens it). Internal notes are visible to staff only, never to the sender.
- Link to load: the assistant proposes loads by sender, route and numbers in the text. Linking puts the thread in the load timeline. Candidate threads link to the candidate record.
- Permissions: dispatch, accounting and safety see threads in their mailboxes; owner and dispatch manager see all. Mailboxes and the text number are connected in Settings, Integrations.
- Texts and emails are credit metered; the balance is in the top bar and no per-message price is shown.


### Calls (`WebCalls`)

Call log with recordings, transcripts, voicemail and the voice assistant (Growth plan).

- Table lists inbound, outbound, missed and voicemail with a call type (inbound broker, driver hotline, check call, broker status, shop call, recruiting), the linked load, duration, outcome, recording, a one-line summary and who handled it (a person or the voice assistant).
- Row drawer shows the transcript lines and the details. Recordings are kept 90 days; transcripts stay with the load. Callers hear a recording notice where required by state law.
- Handled shows Assistant or Person. A link card opens Voice settings, where each use case has its own switch. Voice assistant is a Growth plan feature. Master switch, after-hours, busy-line and check-call options are on this page; greeting, voice and languages are on Assistants, Voice.
- Hand-off rules send the live call to a person (rate talk, accidents, angry caller, money). Voicemails are transcribed and summarized and appear in the Messages inbox as threads.
- Usage is counted against included credits; only the balance shows, never a per-call price. Money is never discussed or moved by the assistant.


### Templates (`WebTemplates`)

Message and document templates plus the signature manager. Assistants draft from these so every reply sounds like the company.

- Table of email, SMS and document templates with variables count, use in the last 30 days, owner and status. Select a row to edit it in the card on the right.
- Variables such as {driver}, {load}, {pickup}, {delivery}, {broker}, {amount} are filled from the linked load, customer or candidate. Tap a chip to insert one; Show sample data previews the resolved text.
- SMS shows character and segment count. Texts and emails are credit metered; the balance is in the top bar.
- Signature manager: several signatures per role, a default, preview, automatic add, MC and DOT numbers and the privacy line required on candidate emails.
- Editing requires the Edit templates permission (owner, dispatch manager, accountant). Every save creates a version in the audit log; Archive keeps old messages intact.
- Rate con, invoice cover and detention form documents use the same variables and feed Load, Invoice and Accounting PDFs.

## Reports
