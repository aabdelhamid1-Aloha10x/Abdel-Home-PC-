# Masar Solo visual smoke test: brief for a LOCAL Claude Code session with a desktop browser
Use this when a session can drive a real, logged-in browser (the cloud session cannot). Project: Masar OS, Lovable 91b7f59c-fc37-4c05-932d-7d99f2c8167b. URL: https://app.masar10x.io. Do not modify any other project.

## Rules (read-only)
- Log in ONCE yourself as the test account (owner does the login; never type or store the password anywhere in chat, files or commits). Use a phone-size viewport about 390 x 844.
- No real calls, emails, bookings, payments, publishing, record deletion, or sending of anything. Do not tap Send, Pay, Book, Delete, Approve, Publish. Open screens, scroll, tap tabs and non-destructive controls only. If a tap could send or change data, stop and describe it instead.
- No use of ANH/A&H real data in outputs: describe screens by structure, redact names, phone numbers, emails and amounts that look real.
- Report actual tool names and the connection result. Never claim a source read is a visual test.

## Screens to capture (light, then dark where noted)
1. Home: greeting with name, road hero, next up, ELD rings, needs-you chips, money card, goal strip, "Done for you today" strip (S2).
2. Bottom bar: Home, Loads, Masar ball, Earnings, Truck; gear and bell top right.
3. Loads: My loads, Find a load tabs; a load screen (compact: map, miles line, step strip, one big button, 3 document tiles, More menu).
4. Find a load: "What the system knows" block, suggestion block (marked "not a guarantee"), question box with mic and chips, no links leaving the screen.
5. Masar chat: send nothing; check layout, voice composer button, task/attach row.
6. Earnings, Truck, Hours, Rules for Masar, Credits (balance only, no per-action prices), Profile, More.
7. Dark mode of Home and Loads. No horizontal scroll, 44 px targets, nothing clipped.

## For each screen report
Screen, viewport, light/dark, what is visible, anything broken (overlap, clipping, wrong label, English-only check: no Spanish), console errors, screenshot filename. One observed interaction (e.g., switch tab, open More menu).

## Output
Save screenshots and a short report to lovable-build/smoke/ in the repo branch claude/options-trading-alerts-scanner-5lgr30, commit and push (no PR).
