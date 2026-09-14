# Aloha Capital — Social Content System

An AI-run content team for Aloha Capital: ideation → trend research → script →
avatar-generated footage → edited short-form video, aimed at branding Aloha
Capital as the fund people go to when they want real estate exposure with a
defined, fund-appropriate return.

## What's here

- `knowledge-base.md` — sourced facts on Aloha Capital's actual investment
  programs (Aloha LTD Income Fund, Passive Note Platform, bridge/construction
  lending). **Read the caveats at the top before quoting any number.**
- `brand-brief.md` — positioning, voice, visual identity direction, content
  pillars, and the compliance guardrails that apply to every script.
- `trend-research.md` — what's currently working in real-estate-investing
  short-form content, pulled live from vidIQ (Instagram Reels + TikTok
  outliers), with the patterns extracted for reuse.
- `production-pipeline.md` — the end-to-end workflow and tool chain
  (vidIQ → HeyGen avatar → Higgsfield/Premiere Pro edit → publish), plus
  which tools are live vs. still need you to authorize them.
- `video-concepts/` — full scene-by-scene, shot-ready scripts. Each one
  specifies avatar lines, B-roll, on-screen typography, music/SFX cues, and
  cut points, so it can go straight into HeyGen and then Premiere/Higgsfield
  once you authorize those connections.

## Status right now

Research and scripting are done and grounded in real data (Aloha Capital's
public site + live vidIQ trend data). Actual video generation is **blocked**
until you authorize two things — see `production-pipeline.md` for exactly
what to do:

1. **HeyGen (HyperFrames)** — needed to render your avatar delivering the
   scripted lines.
2. **Aloha Capital OS** — an MCP server literally named for this company;
   almost certainly the source of truth for current fund terms, brand
   assets, and maybe a real content/asset library. This should replace the
   scraped-web-search numbers in `knowledge-base.md` once connected.

Everything in `video-concepts/` is written so it can be produced the moment
those are connected — no re-ideation needed.
