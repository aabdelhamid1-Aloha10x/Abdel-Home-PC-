# AI Model Comparison for Trucking TMS Bots
Research date: 2026-10-10. All prices USD per 1M tokens unless noted, fetched from vendor pages on 2026-10-10.
Model names below are exactly as the vendor pages listed them today (they differ a lot from 2025 names).

## 0. Honest caveats first
- **Accuracy evidence is thin.** I found no independent 2026 head-to-head benchmark of current Gemini / GPT / Claude / Qwen on rate-con/BOL/invoice extraction. Scores below that are not from a cited source are my judgement and are labelled "judgement". **Run a 50-100 document bake-off on your own rate cons before locking anything in.**
- Pages that could not be fully read: Groq pricing (page had no model/price table), Fireworks pricing (serverless inference table not on the page; docs.fireworks.ai/serverless/pricing not opened), Together batch-price column (not extracted), Anthropic's own Haiku 5.5 announcement (404), Kimi page does not state vision support, z.ai page has no privacy/residency terms, OpenRouter pricing pages gave only a partial list (no fee table read). Artificial Analysis page showed no date.
- Vendor "latency" numbers are mostly vendor-linked or affiliate blogs; treat as relative.

## 1. Price table (sources)
| Provider / model | Input | Cached in | Output | Batch | Source (fetched 2026-10-10) |
|---|---|---|---|---|---|
| Anthropic Claude Haiku 5.5 (<=100k prompt) | 0.10 | 0.01 | 0.50 | 50% off | platform.claude.com/docs/en/about-claude/pricing |
| Anthropic Claude Sonnet 5.5 | 2.00 | 0.10 | 10.00 | 50% off | same |
| Anthropic Claude Opus 5.5 | 4.00 | 0.20 | 20.00 | 50% off | same |
| Anthropic Claude Fable 5.1 | 10.00 | 0.25 | 50.00 | 50% off | same |
| OpenAI gpt-6-luna | 0.10 | 0.01 | 0.50 | 50% off | developers.openai.com/api/docs/pricing |
| OpenAI gpt-5.6-luna | 0.20 | 0.02 | 1.20 | 50% | same |
| OpenAI gpt-5-nano / gpt-5-mini | 0.05 / 0.25 | 0.005 / 0.025 | 0.40 / 2.00 | 50% | same |
| OpenAI gpt-5.4-mini | 0.75 | 0.075 | 4.50 | 50% | same |
| OpenAI gpt-6.1-sol | 2.00 | 0.10 | 10.00 | 50% | same |
| OpenAI gpt-6-astra | 10.00 | 1.00 | 50.00 | 50% | same |
| Google Gemini 2.5 Flash-Lite | 0.10 (audio 0.30) | 0.01 | 0.40 | 50% | ai.google.dev/gemini-api/docs/pricing |
| Google Gemini 3.1 Flash-Lite | 0.25 | 0.025 | 1.50 | 50% | same |
| Google Gemini 3.5 Flash-Lite | 0.30 | 0.03 | 2.50 | 50% | same |
| Google Gemini 3 Flash Preview | 0.50 | 0.05 | 3.00 | 50% | same |
| Google Gemini 3.6 / 3.8 Flash | 0.75 | 0.075 | 3.75 | 50% | same (page notes 3.8 Flash rises to $1.50/$7.50 on 2027-01-01) |
| Google Gemini 3.1 Pro Preview | 2.00 (<=200k) | 0.20 | 12.00 | 50% | same |
| xAI grok-4.3 | 1.25 | 0.20 | 2.50 | not listed | docs.x.ai/docs/models |
| xAI grok-4.7 | 2.00 | 0.50 | 6.00 | not listed | same |
| DeepSeek deepseek-flash (V4.1-Flash, vision supported) | 0.30 peak / 0.15 off-peak | 0.006 / 0.003 | 1.20 / 0.60 | n/a (off-peak = half) | api-docs.deepseek.com/quick_start/pricing |
| DeepSeek deepseek-v4-pro (no vision) | 1.32 / 0.66 | 0.044 / 0.022 | 3.96 / 1.98 | n/a | same |
| Alibaba qwen3-vl-flash (Singapore intl.) | 0.05 | ~10% on hit | 0.40 | 50% (some models) | alibabacloud.com/help/en/model-studio/model-pricing |
| Alibaba qwen3-vl-plus | 0.20 | ~10% on hit | 1.60 | | same |
| Alibaba qwen3.7-flash | 0.03 | | 0.13 | 50% | same |
| Alibaba qwen3.8-max | 2.00 | | 6.00 | mainland only | same |
| Moonshot kimi-k2.6 | 0.95 | 0.16 | 4.00 | | platform.kimi.ai/docs/pricing/chat |
| Moonshot kimi-k3 | 3.00 | 0.30 | 15.00 | | same |
| Zhipu GLM-5.3-Flash | 0.15 | 0.03 | 0.50 | | docs.z.ai/guides/overview/pricing |
| Zhipu GLM-5.3 | 1.40 | 0.26 | 4.40 | | same |
| Zhipu GLM-4.6V (vision) / GLM-4.6V-FlashX / GLM-OCR | 0.30 / 0.04 / 0.03 | | 0.90 / 0.40 / 0.03 | | same (GLM-4.6V-Flash is free) |
| Together AI (US-hosted open weights): DeepSeek V4.1 Flash, V4 Pro, GLM-5.3, Qwen3.7-Max, Kimi K3 | 0.30, 1.32, 1.40, 1.50, 3.00 | | 1.20, 3.96, 4.40, 4.50, 15.00 | batch column exists, values unread | together.ai/pricing |

Aggregators: OpenRouter lists most of the above (page showed Claude Haiku 5.5 at 0.10/0.50, batch 0.05/0.25, and ElevenLabs TTS/STT) at provider pass-through prices; I did not read its fee schedule, so verify (historically a ~5% credit-purchase fee).

## 2. Per-job scoring
Assumed token counts are stated per job. Cost per run = in x price + out x price.

### Job 1: Rate-con / BOL / invoice PDF and photo to JSON
Assumption: 3-page rate con = ~4.5k image tokens + 1.5k prompt/schema = **6k in, 1k out**.
Evidence: only indirect. OmniDocBench (document parsing) aggregators (codesota.com/ocr/benchmark/omnidocbench, updated 2026-04-20; model-card figures relayed by fourweekmba.com) show Gemini 3 Pro/Flash ~92.6-92.9 and Qwen3-VL-235B ~89.8 versus GPT-5.2 ~86.5 (self-reported, versions conflict), and open specialists such as GLM-OCR (94.6) top the board. A live aggregator listing put Kimi K3 and MiniMax M3 near 91 (benchlm.ai). No Claude figure found. So: Gemini and Qwen-VL families are the best-evidenced for document vision, and they are also cheapest.
| Model | Cost per doc | Notes |
|---|---|---|
| Gemini 3.6 Flash | $0.0083 | Best balanced pick (judgement + OmniDocBench evidence for Gemini Flash line) |
| Gemini 3.1 Pro Preview | $0.024 | Fallback on low-confidence docs |
| Claude Sonnet 5.5 | $0.022 | Strong JSON/instruction following (judgement); vision accepted |
| Gemini 3.1 Flash-Lite | $0.003 | Cheapest acceptable candidate |
| Gemini 2.5 Flash-Lite | $0.001 | Cheapest, test accuracy on scans |
| Claude Haiku 5.5 / gpt-6-luna | $0.0011 | Vision support assumed, not verified on pages |
| Qwen3-VL-flash / plus (China-hosted) | $0.0007 / $0.0028 | Cheap, but data goes to Alibaba cloud; see section 4 |
| GLM-4.6V | $0.0027 | Same residency caveat |
**Latency:** Flash-class 2-6 s per 3-page doc (judgement). **Pick:** 1) Gemini 3.6 Flash, 2) Claude Sonnet 5.5, 3) Gemini 3.1 Pro as escalation. **Cheapest acceptable:** Gemini 3.1 Flash-Lite, with schema validation (totals, MC#, dates) and auto-escalation. Use Batch (50%) for back-office backfills.

### Job 2: High-volume email/text triage
Assumption: **500 in, 50 out** per message; cost per 1,000 messages.
| Model | $/1,000 msgs | Speed evidence |
|---|---|---|
| Qwen3.7-flash (China) | $0.02 | n/a |
| gpt-5-nano | $0.045 | n/a |
| Gemini 2.5 Flash-Lite | $0.07 | |
| Claude Haiku 5.5 | $0.075 | Artificial Analysis: 166-188 tok/s (leaderboard, undated) |
| gpt-6-luna | $0.075 | AA: 116 tok/s |
| DeepSeek V4.1 Flash | $0.21 (peak) | AA: 217 tok/s, 1.16 s latency |
Batch halves all of these. **Pick:** 1) Gemini 2.5 Flash-Lite or 3.1 Flash-Lite, 2) gpt-6-luna, 3) Haiku 5.5. **Cheapest acceptable:** gpt-5-nano / Flash-Lite. Note Haiku 5.5 showed 13 s latency at "medium" reasoning on AA, so disable thinking for triage. Cost is negligible at any choice.

### Job 3: Dispute / collections / broker email drafting
Assumption: **1.5k in (load context + tone guide), 400 out**.
| Model | Cost/draft |
|---|---|
| Claude Opus 5.5 | $0.014 |
| Claude Sonnet 5.5 | $0.007 |
| gpt-6.1-sol | $0.007 |
| Grok 4.7 | $0.0054 |
| Gemini 3.6 Flash | $0.0026 |
| Claude Haiku 5.5 | $0.00035 |
No reliable public benchmark for business-writing tone; Anthropic and OpenAI mid-tier models are my judgement picks (judgement). **Pick:** 1) Sonnet 5.5, 2) gpt-6.1-sol, 3) Gemini 3.6 Flash. **Cheapest acceptable:** Haiku 5.5 with a human-review step. At pennies per draft, quality should win here.

### Job 4: Tool-using "ask your company" analytics chat
Assumption: 5 tool-call rounds, system prompt + schema 4k re-sent each round: **~40k cumulative in, 2k out** (caching cuts input 70-90%).
| Model | Cost/question (no cache) |
|---|---|
| Claude Haiku 5.5 | $0.005 |
| Gemini 3.6 Flash | $0.0375 |
| DeepSeek V4 Pro (China API) | $0.061 |
| GLM-5.3 | $0.065 |
| Claude Sonnet 5.5 | $0.10 (about $0.04 with cache) |
| gpt-6.1-sol | $0.10 (about $0.03 with cache) |
| Kimi K3 | $0.15 |
Evidence: Artificial Analysis Intelligence Index (undated page): Opus 5.5 58, Sonnet 5.5 56, GPT-6 Astra 53, Haiku 5.5 (xhigh) 41, DeepSeek V4.1 Flash 39, GPT-6 Luna 35. BFCL v4 (benchlm.ai, snapshot 2026-07-29, only 9 models): Qwen3.7 Max 75.0, Qwen3.7 Plus 72.9. I found no current tau2-bench leaderboard. Sonnet-class (56 index) at roughly 1/2 the price of Opus is the value sweet spot. **Pick:** 1) Claude Sonnet 5.5, 2) gpt-6.1-sol, 3) Gemini 3.6 Flash. **Cheapest acceptable:** Haiku 5.5 for simple lookups, router escalates multi-join questions. Always read-only DB role + tenant-scoped SQL regardless of model.

### Job 5: Real-time voice agent (recruiting / check calls)
Typical call: 5 min. Prices from vendor pages 2026-10-10.
| Option | Price | What LLM | Latency evidence |
|---|---|---|---|
| Bland | $0.14/min Start ($0 fee), $0.12/min Build ($299/mo) (bland.ai/pricing) | Page does not name LLM/TTS | Techsy (May 2026, affiliate-interest) ~700-900 ms median; Tested Media (Mar 2026, via telnyx.com) Bland slower than Retell |
| Vapi | $0.05/min hosting + STT ~$0.01 + LLM $0.008-0.045 + TTS $0.015-0.024 + telephony ~$0.01 = ~$0.09-0.13/min (vapi.ai/pricing) | Bring your own (OpenAI GPT-4o-mini class, Claude, Gemini, etc.) | tuned ~500-700 ms median (Techsy) |
| ElevenLabs Agents | $0.08/min additional, $0.16 burst (elevenlabs.io/pricing/api); LLM cost handling not stated on page; Flash TTS ~75 ms, $0.04/1K chars | Pick among Claude / GPT / Gemini | benchmarklist ranking ~2.1 s (units unclear) |
| OpenAI gpt-realtime-2.1 | audio $32 in / $64 out per 1M tokens; mini $10/$20 (developers.openai.com pricing) | speech-to-speech | ~1.35 s median in benchmarklist (units unclear). Per-minute cost not published; my estimate $0.10-0.25/min for full model, ~$0.04-0.08 mini (estimate). Also "gpt-live-1" $0.05/min + backend usage |
| Gemini Live (3.1 Flash Live / 3.8 Live) | audio ~$0.005/min in + $0.018/min out = ~$0.023/min (ai.google.dev pricing) | native audio | no independent figure found |
| xAI grok-voice-think-fast-2.0 | $0.08/min flat (docs.x.ai) | speech-to-speech | none found |
**Cost per 5-minute call:** Gemini Live ~$0.12; xAI $0.40; ElevenLabs $0.40 + LLM; Vapi $0.45-0.65; Bland $0.60-0.70 (plus telephony). Cascaded stacks (Vapi/Retell/ElevenLabs) give the best control, transcripts and tool use; native speech-to-speech gives the cheapest and fastest turn-taking but weaker tool reliability (judgement). **Pick:** 1) Vapi or Retell with Deepgram STT + Haiku 5.5 / gpt-6-luna-class LLM + ElevenLabs Flash voice, 2) Gemini Live (cheapest), 3) gpt-realtime-2.1-mini. **Cheapest acceptable:** Gemini Live. Bland is the most turnkey (outbound campaigns) but pricier and slower. Real-time calls cannot be batched. Recording/consent laws (two-party states) and TCPA for outbound calls apply.

### Job 6: Maintenance / breakdown triage with images
Assumption: 2 photos + description + fault codes: **4k in, 800 out**.
| Model | Cost |
|---|---|
| Gemini 3.6 Flash | $0.006 |
| Claude Sonnet 5.5 | $0.016 |
| gpt-6.1-sol | $0.016 |
| Haiku 5.5 / gpt-6-luna | $0.0008 |
No relevant public benchmark; photo understanding of dashboards/warning lights/tire damage is judgement. **Pick:** 1) Gemini 3.6 Flash, 2) Sonnet 5.5, 3) gpt-6.1-sol. **Cheapest acceptable:** Gemini 3.1 Flash-Lite, always with a "call a mechanic / unsafe to drive" safety rule and no autonomous repair decisions.

### Job 7: Multi-step dispatch planning
Assumption: **15k in (loads, drivers, HOS, locations), 4k out incl. reasoning**.
| Model | Cost/plan |
|---|---|
| Claude Opus 5.5 | $0.14 |
| Gemini 3.1 Pro Preview | $0.078 |
| Claude Sonnet 5.5 | $0.07 |
| gpt-6.1-sol | $0.07 |
| Grok 4.7 | $0.054 |
| DeepSeek V4 Pro (China API) | $0.036 |
| Haiku 5.5 | $0.0035 |
Evidence: Artificial Analysis Intelligence Index (above): Opus 5.5 high 54, Sonnet 5.5 max 56 (but cost/task $5.46 and very long latency at max effort, so cap reasoning), Gemini 4 Argon 53 at $1.99 per task, GPT-6 Astra 53. Note the index "latency" column in max-effort modes was hundreds of seconds, so use medium/high effort for interactive dispatch. **Pick:** 1) Sonnet 5.5 (high effort), 2) Opus 5.5 for hard multi-load optimisation, 3) Gemini 3.1 Pro. **Cheapest acceptable:** DeepSeek V4 Pro via a US host or Haiku 5.5 with a deterministic validator (HOS, equipment, time windows). Better: let an LLM propose, let code check constraints.

## 3. Prompt caching, batch, and Flex
- Anthropic: cache reads 10% of input (Haiku 5.5 $0.01, Sonnet 5.5 $0.10), 5-min write 1.25x, 1-hour write 2x; Batch 50% off; stacks with caching (pricing page).
- OpenAI: cached input 10% (gpt-6.1-sol $0.10 vs $2.00) and Batch 50%.
- Gemini: context cache about 10% of input plus a storage fee (about $1.00/1M tokens/hour for most models, $4.50 for Pro); Batch 50%.
- DeepSeek: cache hit about 2% of miss price; off-peak (outside 01-04 and 06-10 UTC Mon-Fri) is half price. Alibaba: cache hit 10%, explicit cache write 125%, batch 50% for supported models, not combinable with cache.
- Put the schema, tool definitions and tenant policy at the front of every prompt so they cache. Run nightly reconciliation, backfills and bulk triage in Batch.

## 4. Data residency and privacy
- **China-hosted APIs (DeepSeek, Alibaba mainland, Moonshot, Zhipu):** DeepSeek's pricing page states no data-location terms; compliance guides (sonomos.ai, deepseekai.guide, 2026, secondary sources) say prompts go to China infrastructure under Chinese law with no DPA/BAA or US/EU residency; I could not verify against a primary policy. Alibaba offers an International (Singapore) deployment and a separate mainland one, which helps but is not US residency. z.ai and Kimi pages state nothing about residency. A trucking TMS holds driver PII (SSN on onboarding, CDL, medical cards, drug test results), customer rates and bank details, so I recommend **no China-hosted API for tenant data** and, at most, use for synthetic or anonymised benchmarking.
- **Open weights on US hosts (Together, Fireworks, Groq, etc.):** the same DeepSeek / Qwen / GLM / Kimi weights are served in US data centres (Together lists DeepSeek V4.1 Flash $0.30/$1.20, GLM-5.3-Flash $0.15/$0.50, GLM-5.3 $1.40/$4.40, Qwen3.7-Max $1.50/$4.50). This removes the China-transfer issue; still confirm each host's zero-retention setting, SOC 2 and DPA. Prices are about equal to the China APIs, so there is little reason to use the China API.
- **Self-hosting** (GPU you control) only pays off at very high volume; at 20-truck scale it is not worth it.
- **US frontier vendors:** use zero-data-retention / no-training API terms; Anthropic and Google also sell regional processing (Anthropic pricing page mentions a data-residency modifier that stacks with other multipliers).
- PII hygiene: mask SSNs/bank numbers before the LLM call where possible; per-tenant keys in logs; never put one tenant's data in another's cached prefix.

## 5. Routing and fallback strategy
1. Single gateway in your backend (or OpenRouter/LiteLLM) with a model-per-bot-tier config; do not hardcode model IDs.
2. Cascade: cheap model first, validate output (JSON schema, arithmetic checks, confidence), escalate to the next tier on failure. Expect 5-15% escalation on doc extraction (estimate).
3. Fallback across vendors on 429/5xx/timeouts: Gemini <-> OpenAI <-> Anthropic, same prompt format, same tool schema; keep one US-hosted open-weight model as third fallback.
4. Pin dated model versions; vendors retire models (Anthropic lists retired models; Gemini 3.8 Flash price rises in 2027). Keep a regression set of ~100 real docs and ~50 chat questions per tenant type and re-run on any model swap.
5. Cap tokens and reasoning effort per tier; per-tenant monthly budget alarms.

## 6. Recommended default model per tier
| Tier | Default | Escalation / fallback | Used for |
|---|---|---|---|
| Fast | Gemini 3.1 Flash-Lite (or Claude Haiku 5.5 with thinking off) | gpt-6-luna | Job 2 triage, simple lookups, classification |
| Balanced | Gemini 3.6 Flash | Claude Sonnet 5.5 | Job 1 doc extraction, Job 6 maintenance photos, Job 3 simple drafts |
| Smart | Claude Sonnet 5.5 (high effort) | Opus 5.5 / gpt-6.1-sol / Gemini 3.1 Pro | Jobs 3 (disputes), 4, 7 |
| Voice | Vapi (or Retell) cascade: Deepgram STT + Haiku 5.5/gpt-6-luna-class LLM + ElevenLabs Flash TTS; cost-saver: Gemini Live | gpt-realtime-2.1-mini | Job 5 |

## 7. Monthly cost estimate: 20 trucks, ~400 loads/month
Volume assumptions: 4 docs per load = 1,600 docs; 25 messages per load = 10,000 messages; 600 collections/dispute drafts; 600 analytics-chat questions; 100 maintenance cases; 800 dispatch-plan runs; 400 voice minutes (about 80 five-minute calls).
| Job | Recommended | Lean option |
|---|---|---|
| 1 Docs: 1,600 x $0.0083 (+15% escalation) | ~$15 | ~$4 (Flash-Lite) |
| 2 Triage: 10,000 msgs | ~$1 | ~$0.5 |
| 3 Drafts: 600 x $0.007 | ~$4 | ~$0.3 |
| 4 Analytics chat: 600 x ~$0.04 cached | ~$24 | ~$3 |
| 6 Maintenance: 100 x $0.016 | ~$2 | ~$0.1 |
| 7 Dispatch: 800 x $0.07 | ~$56 | ~$3 |
| 5 Voice: 400 min x ~$0.11 | ~$44 | ~$10 (Gemini Live ~$0.025/min) |
| Total LLM/voice | **~$145/month (about $0.36 per load)** | **~$20-25/month** |
Add telephony carrier fees (~$0.01/min), roughly 20-30% headroom for retries and prompt growth, and the Vapi/Bland platform fee if applicable ($299/mo for Bland Build). Realistic budget: **$100-200/month recommended stack; under $50 lean; $300+ if everything runs on Opus-class**. Costs scale roughly with load count, so unit economics are about $0.25-0.50 per load, small relative to the subscription price.

## 8. Next steps
1. Build a gold set of 100 real rate cons/BOLs (crumpled phone photos included) and score Gemini 3.6 Flash vs 3.1 Flash-Lite vs Sonnet 5.5 vs Haiku 5.5 for field-level accuracy.
2. Run 20 live test calls on Vapi vs Gemini Live to measure your own latency and driver acceptance.
3. Confirm OpenAI Realtime per-minute effective cost on a real call, since only per-token prices were published.
