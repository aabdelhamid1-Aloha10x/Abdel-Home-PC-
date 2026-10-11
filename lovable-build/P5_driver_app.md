PHASE 5: DRIVER APP (mobile web, Capacitor-ready). Mobile layout, 390px, bottom tab bar: Today, Loads, Chat, Pay, More. Routes under /d (driver) so they are separate from /app. A driver signs in by company invite link or phone code (phone OTP) and lands on /d/today; a user with role driver is never shown the office app.
SCREENS (match the mockups: DriverSignIn, DriverToday, DriverLoad, DriverChatList, DriverChat, DriverPay, DriverBoard, DriverDocs, DriverIssue, DriverMore):
- Today: roll call card (Ready/Late/Off posts to the driver room and writes roll_calls), current load card with next stop, HOS clock (from hos_logs or manual duty status buttons now), next pay date.
- Load: stops, buttons Arrived, Loaded, Delivered that set real timestamps and event rows, detention clock start/stop, scan BOL/POD with the camera (wrapper src/lib/native/camera.ts, web fallback to file input) uploaded to the load documents, "Message dispatcher" opens the chat with the load tagged; "Call dispatcher" is a tel: link.
- Chat: the same rooms/messages as phase 3, driver view (topic menu, photo, voice note, Spanish/English translation toggle, Pay topic visible only to the driver).
- Pay: settlements for this driver from phase 2 with the plan name and how it was calculated, escrow balance, history, "Dispute" creates a message in the private Pay topic.
- Board: ONLY for programs where programs.rules.board_allowed. Lease: "Request to book" creates an approval for the dispatcher; Owner-operator: "Book now" creates the load assigned to them (when a load source is connected in phase 9; until then the board lists loads the dispatcher published to drivers). Company drivers see the locked "Your company books loads for you" card.
- Docs (scan BOL/POD, fuel receipt, DVIR pre-trip with defect photos creating a work order), Issue (breakdown/accident/lumper/late with photo, posts to the Maintenance/Dispatch rooms), More (profile, program label, language en/es, notifications, help, sign out).
- Push: web push via service worker now behind src/lib/native/push.ts; native push via Capacitor later. In-app notification centre works now.
- Offline: queue arrived/loaded/delivered taps and messages when offline and sync later (IndexedDB), show a "queued" badge.

ACCEPTANCE (verify each, report results; say plainly what is NOT done):
[ ] Every route listed renders with real data and no console errors, at 390px and desktop, light and dark.
[ ] Every button, tab, toggle, filter, bulk action, menu item and row click on these pages performs its real action and persists after reload. List any you did not wire.
[ ] Every create/edit/delete/status change writes audit_log and respects role permissions (UI and RLS). Test with two companies and two roles.
[ ] Plan limits enforced (UI and database) where mentioned.
[ ] Sample data extended: seed function adds the demo rows for this phase (is_demo=true) and removal works.
Reply with: routes added, tables and policies added, edge functions added, checklist results, gaps.
