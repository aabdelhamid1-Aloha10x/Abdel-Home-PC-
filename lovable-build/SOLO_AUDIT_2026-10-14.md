# Solo app code audit, 2026-10-14 (commit 8adb33d, read-only, not clicked)
Routes: every /s/ link target exists and search keys survive. New account (Home, Loads, Chat) does not crash. No blockers. Not read: s.terms, s.assistants, s.ai, s.bots, s.design, Documents, lib/solo/data, lib/data.

## Major
1. s.credits.tsx History: each row shows a reason and signed amount = per-action credit price on a customer screen. Show date and "Masar help used" only.
2. s.credits.tsx "Buy a pack" and s.upgrade.tsx "Change plan" open /app/settings/billing (the office shell) inside the phone app. Needs a Solo billing screen.
3. s.loads.$id.tsx Cancel load: one tap, no confirm.
4. s.find.$id.tsx Pass: error toast then "Passed" toast on failure.
5. s.find.$id.tsx book(): five separate writes, broker_messages error unchecked. Failure midway leaves a load with no stops or an offer not marked booked.
6. MasarHome.tsx ?say=: comment says drafts only but it calls submit(say) at once (Running late, I'm late). Put it in the composer for Send, or confirm first.
7. MasarHome.tsx: thread/goal/settings errors never shown, empty chat on failure.
8. v3.tsx RoadHero, s.loads.index MyLoads: loads error shows "Find a load" as if empty. No retry.
9. Touch targets under 44px: FindList (Add offer, Rules, Sources), pretrip Yes/No (32px), rules and cost pills (~26px), prefs Unblock, recap prev/next, PauseSwitch (~28px), factoring Mark funded, dispute buttons, find.new Read the message, ifta Add, docs Scan/Upload, VoiceComposer attachment X, hire pills.

## Minor
10 expense save: fuel log fails, still says saved. 11 hire: goal and message writes unchecked. 12 sources, QuotesInbox, ifta: copy toast says copied even if clipboard blocked. 13 undoFile and activity read_at errors ignored. 14 MyLoadCard busy not in finally; $id status buttons allow double tap. 15 factoring: two writes, second can fail; list includes draft invoices. 16 ifta quarter is free text (NaN). 17 FindList "Pays 30d" chip permanently disabled. 18 duplicate controls (Docs/map/title all same link, Update the broker and Broker chat same chat). 19 dead code in MasarHome (CHIPS, hired, goal calls still fire on every chat open, openQs, pilot...), orphan routes s.hire, s.calc, s.ai, s.bots, s.design, invisible focusable link. 20 Card Open navigates to unchecked server path. 21 RoadHero empty state has no text. 22 pretrip tablist label and object URL leak; rules: non-owners edit but cannot save. 23 Credits screen says "Credits", rest of app says "Masar help".
