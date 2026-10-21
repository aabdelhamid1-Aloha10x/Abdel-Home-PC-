# Unstaffd Codex package

Everything Codex needs to build Unstaffd in its own repo.

## One-time setup (owner)
1. Create an empty **private** GitHub repo `unstaffd` (GitHub -> New repository -> Private).
2. Copy into the new repo root:
   - `platform/codex/AGENTS.md` -> `AGENTS.md` (Codex reads this automatically)
   - `platform/codex/.env.example` -> `.env.example`
   - `platform/codex/prompts/` -> `prompts/`
   - `platform/00_*.md` ... `platform/05_*.md` -> `docs/`
   (Or give Claude/Codex access to the new repo and ask it to copy them.)
3. Connect the repo in Codex (cloud) or open it with Codex CLI locally.
4. Put real secrets only in `.env.local` (local) and the Cloudflare / Supabase / Trigger.dev secret stores. Never in chat.

## How to run the build
Give Codex one prompt at a time, in order:
| Order | Prompt | Phase |
|---|---|---|
| 1 | `prompts/00a_infrastructure_setup.md` | Week 0: Codex buys domains on Hostinger, sets up Cloudflare, Supabase, SES, AI Gateway |
| 1b | `prompts/00b_repo_setup_and_waitlist.md` | Week 0: monorepo + waitlist |
| 2 | `prompts/01_foundation.md` | Phase 1 |
| 3 | `prompts/02_aha_onboarding.md` | Phase 2 |
| 3b | `prompts/02b_knowledge_base.md` | Phase 2: expert knowledge base + smart intake |
| 4 | `prompts/03_launch_and_money.md` | Phase 3 |
| 5 | `prompts/04_autopilot_core.md` | Phase 4 |
| 5b | `prompts/04f_tool_hub_and_capital_engine.md` | Phase 4: tool hub + capital-raising engine |
| 6 | `prompts/05_onward.md` | Phases 5-8 (expanded later) |

Message to Codex for each step:
> Read AGENTS.md and docs/. Do prompts/0X_....md only. Follow the definition of done. Run and verify; tell me what you could not verify.

After each step: review the report, click through what it says it verified, then move on.

## Notes
- Codex builds the product. The product's own agents still call Claude, OpenAI, Grok, Gemini and Perplexity through the API (pay per use) — separate from any Claude or ChatGPT subscription.
- Keep a second model reviewing: ask Codex to review its own diff in a fresh session before you accept each phase.
