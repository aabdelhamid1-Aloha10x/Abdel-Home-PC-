# Production Pipeline

End-to-end flow from idea to published video, and exactly which tools this
session can and can't drive right now.

## Pipeline

1. **Ideation + trend check** — vidIQ (`vidiq_instagram_tiktok_outlier_search`,
   `vidiq_trending_videos`, `vidiq_keyword_research`) to find current hook
   patterns and validate a topic before scripting. Done for the first three
   concepts; repeat before every future video.
2. **Script + scene breakdown** — a scene-by-scene doc (see
   `video-concepts/`) covering: avatar line, B-roll, on-screen typography,
   music/SFX cue, and cut point for every scene, so nothing is decided
   ad hoc during editing.
3. **Avatar generation (HeyGen / HyperFrames MCP)** — render Abdel's avatar
   delivering the scripted lines. **Blocked**: `HyperFrames_by_HeyGen`
   needs authorization (see below).
4. **B-roll / motion graphics generation (Higgsfield)** — this session
   already has a live Higgsfield connection (`generate_video`,
   `generate_image`, `motion_control`, `shorts_studio_create`, etc.) and
   can generate stock-style property b-roll, document close-ups, and
   animated typography/lower-thirds directly once a concept is approved.
5. **Edit assembly (Adobe Premiere Pro)** — this session has no direct
   Premiere Pro control (it's local desktop software, not an API/MCP
   target). What this pipeline *can* hand you is edit-ready: every concept
   doc below is written as a literal timeline (scene #, duration, cut
   point, layer notes) so it drops into a Premiere sequence with minimal
   interpretation — you (or an editor) assemble avatar clips + generated
   b-roll + captions/typography/music per the scene sheet. If useful later,
   Higgsfield's `shorts_studio_create` can also assemble/caption/score a
   rough cut automatically as a starting point before Premiere finishing.
6. **Compliance pass** — required before publish on any script with a
   specific number (return, minimum, track record). See the guardrail in
   `knowledge-base.md` / `brand-brief.md`.
7. **Publish/distribute** — `blotato` MCP tools are live in this session
   for scheduling/publishing to connected social accounts once a final cut
   exists; `Facebook_Ads_MCP` is available but not yet authorized for
   paid boosting.

## What's live right now vs. what needs your action

| Tool | Status | Needed for |
|---|---|---|
| vidIQ | ✅ live | trend research, keyword/outlier research |
| Higgsfield | ✅ live | B-roll, motion graphics, rough-cut assembly |
| blotato | ✅ live | scheduling/publishing finished videos |
| GitHub | ✅ live | this repo, storing scripts/briefs |
| **HyperFrames (HeyGen)** | ⛔ needs auth | rendering your avatar on the scripted lines |
| **Aloha Capital OS** | ⛔ needs auth | almost certainly the source of truth for current fund terms/brand assets — should replace the web-sourced numbers in `knowledge-base.md` |
| Facebook Ads MCP | ⛔ needs auth | paid boosting/targeting once organic content is proven |
| Stripe | ⛔ needs auth | not relevant to this content workflow |

**To unblock**: these are MCP server connections, not something this
session can authorize itself. Authorize them via `claude mcp` or `/mcp` in
an interactive session (or, for claude.ai connectors, your connector
settings). Once HeyGen and Aloha Capital OS are connected, say so and this
pipeline continues straight to rendering — no re-planning needed.

## Adobe Premiere Pro note

There's no MCP/API bridge to your local Premiere Pro install in this
environment (it's a remote/cloud session, not your machine). Two ways to
proceed once footage exists:
- **You edit** using the scene sheets in `video-concepts/` as the cut list.
- **Or** ask for this to run as a local Claude Code session on your actual
  machine (where Premiere's scripting/panel integrations, or a
  file-watching handoff, become possible) — worth doing once you're ready
  to move from scripts to finished cuts regularly.
