# Chat design (one page)

## The idea
Today each team has its own Telegram chat, and every driver has a Telegram group with their dispatcher, maintenance, accounting, compliance, recruiting and management. We replace all of that with Chat inside the platform. Chat is about the driver, not about the load, because staff check on drivers between loads.

## The model
- **Driver room.** One lasting conversation per driver. Members: the driver, the assigned dispatcher and team leader, and any department person pulled in by a topic. It is made automatically when a driver is added.
- **Topics.** Every message carries one topic: General, Load (tagged with the driver's current load, such as Load 4857), Maintenance, Pay and accounting, Safety and compliance, Recruiting and HR. The driver sees one simple chat. Staff can filter by topic or by Needs me. The assistant tags the topic when it is missing, and a person can change it in one click.
- **Routing.** A message in a topic notifies the seats ticked for that topic in Chat rules (for example Maintenance notifies the shop manager and the dispatcher). Each topic has a timer: an unanswered message turns amber (10 minutes for Load, 60 for Pay).
- **Other rooms.** A Dispatch room, team rooms (only if the carrier uses teams), department rooms (Accounting, Maintenance, Safety, Recruiting, Management), staff direct messages, a Fleet broadcast channel, and Announcements with read receipts, Acknowledge, scheduling and targeting by team, program or driver.
- **Needs me.** Any message can be assigned to a person. It sits in their queue until they mark it done. One click turns a message into a work order, an expense, a task or a dispatch note.
- **Files and voice.** Photos and documents (BOL, receipt) are read by the assistant. Voice notes show a transcript. English and Spanish are translated both ways, and the original is kept.
- **Delivery.** Read receipts on every message. If the driver has not opened the app after N minutes, the message goes by text. Text messages use credits from the plan; no price is shown. After-hours rules decide who covers nights and weekends.
- **Roll call.** A scheduled message in each driver room with Ready, Late and Off buttons. Replies fill the Roll call screen. If a driver does not reply: text, then tell the dispatcher, then an assistant call on Growth (Ask first).
- **Assistant (Ask first).** Summarize a long thread, draft a reply, tag the topic, spot a breakdown and offer a work order, spot a short-pay claim. Nothing changes until a person clicks.

## Privacy
Pay and accounting is private. Accounting and management always read it. The assigned dispatcher and the team leader read it only if the owner turns that on. Everyone else sees a lock with "Private topic" and the time. The driver always sees their own messages. Managers reading a private topic is logged in the audit log. The View as switch in Chat shows what each seat sees.

## Every carrier setup
Company drivers, lease operators and owner-operators all get the same driver room. Carriers with teams get team rooms and a team leader in each driver room; carriers with one dispatch group get a single Dispatch room. The driver app is not needed on day one: drivers can be invited by link and get texts until the app is ready.

## Plans (decided: department rooms on Growth and above)
- **Every plan:** driver rooms, the Dispatch room, photos, voice notes, translation, text fallback, roll call message.
- **Growth:** department rooms, team rooms, topic routing and filters, private topics, Needs me, announcements with read receipts and Acknowledge, escalation call.
- **Enterprise:** carrier-wide controls (one policy across several carriers, legal hold, retention by carrier, audit export).

## Moving from Telegram
Import from Telegram: upload the export, map each Telegram group to a driver or staff room, preview the counts, run a go-live checklist. One-time import only. No Telegram bridge (decided). Invite drivers by link or QR code. History is kept; imported messages get the topic General.

## Open decisions
1. Are department rooms Growth only (the proposal), or on every plan?
2. Should the assigned dispatcher read Pay and accounting by default? We propose no.
3. Can drivers message staff directly, or only in their driver room? We propose only their room.
4. Default text fallback time (we show 15 minutes) and a daily cap per driver.
5. Default chat retention (we show 3 years) and who may delete messages.
6. Decided: no Telegram bridge, one-time import only.
7. Who may send fleet-wide notices: operations manager and owner only, or also team leaders for their own team?
8. How much of the chat history may the assistant read to answer questions, and does a private topic stay out of it?
