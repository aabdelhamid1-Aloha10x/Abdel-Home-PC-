# Proposal: charts, motion and Capacitor-safe polish for Masar OS
Date: 2026-10-12. Goal: the app feels alive and trustworthy (goal rings, charts, success feedback, smooth transitions) and still runs well when wrapped as an iOS/Android app with Capacitor.

## 1. What is missing today
- No charts anywhere (goals, profit, costs, pace, aging, trucks). Numbers are shown as text tiles only.
- No feedback animation: no success check, no progress while Masar works, no count-up, no swipe on Needs-you cards, no recording waveform, no haptics.
- Page changes and list updates are abrupt. Only the startup splash is animated.

## 2. Capacitor rules every screen must follow (the app runs in a WebView)
1. Animate only `transform` and `opacity`. No animated blur, backdrop-filter, large box-shadow or layout properties.
2. Performance budget: 60 fps on a mid-range Android; test with 4x CPU throttling. No WebGL/three.js. Charts are SVG (small data) and code-split so the first screen stays light.
3. Respect `prefers-reduced-motion` (replace motion with fades or static states) and a user setting "Reduce motion".
4. Safe areas (`env(safe-area-inset-*)`), 44px minimum tap targets, no hover-only interactions, keyboard-aware composer (does not jump behind the keyboard).
5. Native feel: haptics, status-bar color per theme, native splash handed off to the animated logo, bottom sheets and swipe gestures, pull to refresh.
6. All native calls go through wrappers in `src/lib/native/*` with a web fallback (camera wrapper already exists): haptics.ts, statusbar.ts, keyboard.ts, share.ts, network.ts, splash.ts.
7. Offline-friendly visuals: skeletons and cached last values, "queued" badges (already used in the driver app).

## 3. Tool stack (all open source, WebView-safe)
| Need | Tool | Notes |
|---|---|---|
| UI motion | Motion (Framer Motion) | transforms/opacity, springs, shared-element and list transitions |
| Charts | shadcn/ui charts (built on Recharts) | already matches our stack; SVG; theme-aware (light/dark tokens) |
| Micro-animations | CSS keyframes + Lottie (lottie-react) | success check, empty states, "Masar is working"; keep each file under ~30 KB |
| Interactive illustrations (optional later) | Rive | goal ring, pause switch states; WASM runtime, small |
| Bottom sheets | Vaul | drag, snap points; mobile-native feel |
| Toasts | sonner (already in app) | add Undo countdown ring |
| Confetti for goal reached | canvas-confetti (tiny, subtle, once) | disabled when reduced motion |
| Native bridge | @capacitor/haptics, status-bar, keyboard, splash-screen, app, network, preferences, push-notifications, camera | wrappers in src/lib/native |
| Design system | Lovable design system built from DESIGN_SPEC.md | one source for tokens, components, motion presets |
| Quality | Playwright screenshots (390px light/dark), Lighthouse, axe-core, 4x CPU-throttle run | run each release |
| Real-user data (after launch) | PostHog (Lovable connector) | funnels, session replay, where users stall |
| Optional | Figma (local MCP), Rive editor | only if hand-tuning is wanted |

## 4. Motion tokens (put in the design system)
- Durations: instant 90 ms, fast 140 ms, base 220 ms, slow 360 ms, celebratory 700 ms (once).
- Easings: standard cubic-bezier(0.2, 0, 0, 1); enter (0, 0, 0, 1); exit (0.3, 0, 1, 1); spring (stiffness 420, damping 34, mass 1) for cards and sheets.
- Rules: one hero motion per screen; stagger lists by 30 ms (max 6 items); never block input during an animation; every animation has a reduced-motion version.
- Haptics: success (light), warning (medium), error (heavy double), selection tick, confirm on Pause switch.

## 5. Animation catalog
Feedback and trust
1. Success check: ring draws, check strokes in (320 ms) + light haptic. Used on saved expense, sent invoice, approved item.
2. Undo toast with a shrinking countdown ring (matches the undo window).
3. "Masar is working": a step chip line ("Reading receipt, Categorizing, Saved") with a small pulsing mark. Replaces a plain spinner.
4. Error shake (6 px, 2 cycles) + heavy haptic with the reason text.
5. Count-up on stat tiles and the goal strip (600 ms, only on first view).
6. Goal reached: ring completes, one gentle confetti burst, haptic success.
Navigation and structure
7. Needs-you cards: swipe right = approve, left = skip, with spring and color reveal; button fallback for accessibility.
8. Thread: new messages slide + fade (140 ms); result cards expand from the message; attachments show a progress ring.
9. Page transitions: horizontal slide for drill-down, fade for tab switches, shared-element from list row to detail.
10. Bottom sheet drag for Rules, offers and filters.
11. Skeleton shimmer (CSS only) instead of blank screens; pull-to-refresh with the route-line mark.
Voice
12. Hold-to-record: ripple + live waveform + timer; slide to cancel; transcript appears as it is read.
13. Live call state chip (pulsing dot) in breakdown cases: dialing, connected, on hold.
Brand
14. Startup splash: native static logo then the animated route-line "M" (already built). Add the same loader to first-route loading states.
15. Pause everything: switch animates the whole header tint to amber; haptic confirm.

## 6. Chart catalog (what each screen gets)
Solo
- Masar home: goal ring (week/month, animated), pace line "where you should be vs where you are" with the remaining gap labelled.
- Money: weekly net profit bars (last 8 weeks) with goal line; revenue vs expenses; invoice aging bars (current, 1-7, 8-14, 15-21, 21+); expense by category donut; cash owed to you tile with sparkline.
- Offers and calculator: "you keep" breakdown (stacked bar: rate minus fuel, variable, fixed, fees = keep) and a $/day gauge with the confidence badge (Estimated, Learning, Based on your data); compare two offers side by side.
- Truck: MPG trend sparkline, fuel price you pay vs regional average, cost per mile trend, uptime streak (days since last defect), document expiry timeline.
- Pre-trip history: inspection streak and defect trend.
Fleet (office app)
- Manager home: company goal ring, revenue and profit by truck (ranked bars), cost per mile trend, on-time %, uptime %.
- Staff pages: each department KPI sparklines (dispatch response time, invoices drafted, collections, case time to first provider contact, downtime hours, savings).
- Autopilot results: automation rate over time, hours saved, savings, Needs-you queue age.
- Maintenance: cost by truck, PM compliance donut, breakdown downtime timeline per case.
- Safety: readiness score by driver (bars), document expiry heatmap calendar.
- Accounting: AR aging, settlements by week, margin by customer.
- Driver app: weekly pay trend, bonus program progress bars, HOS clock ring.
Chart rules: max 2 colors per chart plus the semantic palette (money in green, expenses coral, warning amber, info blue, compliance violet, maintenance teal); direct labels not legends where possible; touch tooltips (tap), accessible text summaries ("Net profit this week: $1,988, 66% of goal"); every chart has an empty/learning state ("Add 3 more fuel receipts to see your MPG").

## 7. Build plan (Lovable rounds, each browser-tested at 390px light and dark, 4x CPU throttle, reduced-motion on)
- U1 Design system + tokens: motion presets, chart theme, component library (cards, chips, sheets, toasts, skeletons), native wrappers (haptics, statusbar, keyboard, network, splash).
- U2 Solo charts: home goal ring and pace line, Money charts, offers breakdown, truck trends.
- U3 Feedback animations: success check, working steps, undo ring, swipe cards, thread motion, voice waveform, count-ups, goal-reached.
- U4 Fleet charts: manager home, staff page KPIs, Autopilot results, maintenance, safety, accounting.
- U5 Capacitor readiness pass: safe areas, keyboard, status bar, performance budget, offline visuals, reduced motion, accessibility (axe), contrast AA.
- U6 Regression kit: Playwright screenshot set (15 key screens, 390px, light/dark), Lighthouse budget, run on every release.
Order recommendation: U1, U2, U3 first (Solo feels alive), then U4 with Phase S2, then U5 and U6 before the Capacitor build.
Acceptance for every round: no console errors, nothing off the edge, animations hit 60 fps under 4x throttle, reduced-motion version works, every chart has a learning/empty state and a text summary, numbers match the database.

## 8. Risks and mitigations
- Performance on low-end Android: keep chart data small, lazy-load, cap simultaneous animations, test on a real mid-range device.
- Library weight: budget +120 KB gzipped for motion + charts + lottie; lazy-load charts and Lottie files.
- Over-animation: one hero motion per screen; reduced motion; no decorative loops.
- Data trust: charts must show learning/estimated states instead of fake precision.
- Lovable drift from the look: the design system plus screenshot tests make it repeatable.

## 9. What Claude needs to do this better (connect or provide)
1. A published URL and a QA login on a demo tenant with sample data (read-only role if possible) so Claude can screenshot and audit real screens. Throwaway credentials only, entered via a secure channel, never the owner's real account.
2. Device testing: BrowserStack (App Live) or Firebase Test Lab for real iOS/Android WebView performance, or the owner's own phone for first round.
3. PostHog (Lovable connector) after launch for session replay and funnels.
4. Optional: Figma Desktop + Figma MCP if hand-tuned frames are wanted; a LottieFiles or Rive account if custom animations are wanted (open-licensed assets are used otherwise).
5. For the Capacitor build later: a Mac with Xcode (or a cloud CI with macOS runners such as Codemagic or GitHub Actions), Apple Developer and Google Play accounts.
