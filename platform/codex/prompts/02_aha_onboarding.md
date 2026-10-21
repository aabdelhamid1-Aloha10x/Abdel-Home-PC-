# Prompt 02: The aha moment (Phase 2, weeks 3-6)

Read `docs/00_MASTER_SPEC.md` §3-6, §9, §16. Prompt 01 must be done.

## Goal
A stranger types an idea and, in under 20 minutes, free, gets: research, coach verdict, business plan, name + domain options, brand kit, and a live preview site.

## Tasks
1. **Landing flow** (dashboard `/start`): one input + three paths: "I have an idea" / "I have a business (URL)" / "Import my project (GitHub URL)". Path 3 stores the request for Phase 5 (show honest "we'll import this after launch" message; no fake progress).
2. **Live org chart**: Supabase Realtime on `agent_tasks(id, company_id, agent_key, title, status: queued|running|done|failed, output jsonb, credits, started_at, finished_at)`. Cards animate as tasks change.
3. **Research agents** (Trigger.dev, parallel): market & demand, competitors, niche options (3-5, scored), ICP. Tools: Perplexity (`research_web`), Grok (`trends_x`), web fetch. Every claim keeps its source URL.
4. **Coach verdict**: Go / Pivot / Kill score with reasons; challenges weak points; uses `playbook_cards` (table + pgvector; seed 30 cards from `docs/00_MASTER_SPEC.md` §6 principles, written in our own words with source citation).
5. **Business plan**: offer, pricing (outcome-based), channel-fit selection by business model (§9 table), 90-day roadmap, First Win plan. Store in `business_plans` + `plan_items`.
6. **Names + domains**: generate 20 names -> check availability via **GoDaddy API** (`GODADDY_ENV=ote` in dev) -> show only available ones with price = cost + markup from `packages/config` (no trademark gate). No purchase yet.
7. **Brand kit**: logo (image model), palette, fonts, voice; saved to R2.
8. **Templates**: add `book_a_call_vsl`, `store`, `saas_landing`, `lead_magnet` to the renderer (5 total). Each passes a snapshot test and Lighthouse >= 90 mobile. Agents fill config + copy + images; preview at `<slug>.unstaffd.app`.
9. **Free-stage cost cap**: model-router task types for onboarding use cheap models except the final plan (Claude Opus 5.5 `claude-opus-5-5`); hard cap per signup (config, default $2); abuse limits per user/IP/device.
10. **Paywall screen** "Launch": summary of what happens next; tier picker reads hidden draft plans (feature-flagged; owner sees real buttons, public sees "Join beta").

## Acceptance
- Time from submit to preview < 20 min on 3 different ideas (log timings).
- Cost per onboarding logged and under the cap.
- Every agent task visible live in the org chart; failures show honest error + retry.
- Report per definition of done (include timings and costs).
