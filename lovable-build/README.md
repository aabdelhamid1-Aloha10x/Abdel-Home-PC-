# Lovable build pack

New Lovable project (abdel's Lovable): https://lovable.dev/projects/91b7f59c-fc37-4c05-932d-7d99f2c8167b
Its own new database (Lovable Cloud / Supabase). Nothing here touches ANH or kldiqwkjrhpkcfjlbolw.

## How to run it
1. 00_PROJECT_KNOWLEDGE.md is already saved as the project knowledge (rules every prompt follows).
2. Send the phases IN ORDER, one at a time: P0 (sent) then P1 ... P10. Attach the matching SPEC_*.md file to each.
3. After each phase: open the preview, run the ACCEPTANCE list at the bottom of the prompt, then send "Fix all unchecked items" before moving on. Do not start the next phase while any button is dead.
4. Test mode first for Stripe, SMS, email. Add secrets only when a phase says so.

## Phases
P0 Foundation, auth, roles, settings | P1 Core TMS + planner | P2 Money | P3 Chat + inbox | P4 Maintenance + safety | P5 Driver app | P6 Solo app + load hub | P7 Recruiting | P8 Reports, assistants, credits, Stripe | P9 Integrations, voice, enterprise | P10 Capacitor native apps

## Mobile apps (Capacitor)
Yes. Driver app (/d) and Solo app (/s) are built in the same React codebase as responsive mobile-first routes with device features behind src/lib/native/ wrappers. P10 adds Capacitor. Lovable edits the web code; you (or a developer) run the native build on a Mac (Xcode) / Android Studio from the GitHub-synced repo. Needs: Apple Developer ($99/yr), Google Play ($25 once), push keys (APNs/FCM). Background GPS, call handling and some push features need native plugins and store review.
