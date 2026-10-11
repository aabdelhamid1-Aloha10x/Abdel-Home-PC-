PHASE 3: CHAT (replaces Telegram) + INBOX. Attached: SPEC_P3_chat.md and the design notes below. Telegram bridge is NOT wanted; one-time import only.

DESIGN: one persistent room per driver (driver + assigned dispatcher + team leader + others pulled in by topic), department rooms (Dispatch, Accounting, Maintenance, Safety, Recruiting, Management), team rooms, DMs, Fleet broadcast. Messages carry a topic tag: General, Load (auto-tagged with the driver's current load), Maintenance, Pay (private: only accounting + management + the driver), Safety, Recruiting. Topic routing decides which departments are notified. Plans: driver rooms and one Dispatch room on all plans; department rooms, team rooms, topic routing and private topics on Growth and above.

TABLES: rooms(type driver/dept/team/dm/broadcast, name, driver_id null, team_id null), room_members, messages(room_id, sender_id, body, topic, load_id null, kind text/photo/voice/system/file, attachments jsonb, translated jsonb, reply_to, created_at, edited_at), message_reads, message_tasks(message_id, action created work order/task/expense/dispatch note/detention), announcements(audience, body, require_ack, send_at), announcement_acks, chat_rules(company_id, topic routing matrix, sla minutes, coverage hours, quiet hours, sms fallback minutes, retention).

BEHAVIOR:
- Supabase Realtime for live messages; optimistic send; unread counts; "Needs me" filter by seat/topic; SLA timers; topic filter chips with counts; View-as for admins; private topic hidden (shows "Private topic") for non-eligible staff, enforced in RLS.
- Composer: topic menu, @mention, photo (Storage), voice note (MediaRecorder, with transcription via edge function if key present else stored as audio only), file.
- One-click actions on a message: create work order (phase 4 table, if absent create a task), add detention to the load, create expense, add dispatch note. Each shows a created chip linking to the record.
- Translation: per-user language; edge function translates with the Lovable AI gateway and stores both versions.
- SMS fallback: if a driver has not opened the app within N minutes, an edge function sends an SMS via Telnyx (key entered in Integrations, server side). Without a key, the setting is disabled with the reason.
- Announcements: audience (everyone/team/program/selected), require acknowledge, schedule, reach count, ack tracking with "Remind" buttons.
- Roll call becomes a chat message with Ready / Late / Off quick-reply buttons posted to each driver room at the scheduled time (pg_cron or scheduled edge function); replies write roll_calls; escalation ladder (reminder, SMS, optional call in phase 9, dispatcher alert) configurable in Chat rules.
- Chat rules page (all tabs per spec; Telegram tab = one-time import wizard: upload Telegram export JSON, map groups to rooms, preview counts, import with topic General).
- Inbox: shared email inbox (Growth): connect Gmail/Outlook via OAuth (client ids entered by me later; until then disabled with reason), threads tied to loads/customers/drivers, templates with variables, send from the company's address.

ACCEPTANCE (verify each, report results; say plainly what is NOT done):
[ ] Every route listed renders with real data and no console errors, at 390px and desktop, light and dark.
[ ] Every button, tab, toggle, filter, bulk action, menu item and row click on these pages performs its real action and persists after reload. List any you did not wire.
[ ] Every create/edit/delete/status change writes audit_log and respects role permissions (UI and RLS). Test with two companies and two roles.
[ ] Plan limits enforced (UI and database) where mentioned.
[ ] Sample data extended: seed function adds the demo rows for this phase (is_demo=true) and removal works.
Reply with: routes added, tables and policies added, edge functions added, checklist results, gaps.
