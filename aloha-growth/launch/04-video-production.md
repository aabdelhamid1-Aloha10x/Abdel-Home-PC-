# Video Production Pack: HeyGen Base Video and World-Class Edit Brief

Two videos: the **main VSL** ("One Rented Truck", about 8-9 min, 16:9) and the **ad videos** (7 ads, 9:16 with 1:1 and 16:9 cuts). Scripts are in `02-vsl-script.md` and `03-ad-scripts.md`.

**Workflow:** HeyGen produces the avatar base video, then the edit layer (b-roll, motion graphics, captions, sound) is applied in your editor. I can't render or export video from this environment, so I've written the edit as an exact shot-by-shot spec you or an editor can follow, or hand to HeyGen HyperFrames if you use it from a Claude chat client.

---

## Part 1: HeyGen setup

| Setting | Recommendation |
|---|---|
| Avatar | Your own digital twin (Avatar IV or the latest available) from a fresh, well-lit training clip. Use the same avatar for VSL and ads so the brand feels consistent. |
| Voice | Clone your own voice. Tone: warm, calm authority. |
| Resolution | 1080p minimum (4K if your plan allows) |
| Aspect ratios | 16:9 for the VSL. 9:16 for the ads. Export 1:1 for feed variants. |
| Background | Use a neutral or blurred office. Or use a green/transparent background so the editor can place the avatar over motion graphics. |
| Captions | Turn off in HeyGen. Burn in custom captions during the edit. |
| Gestures | Enable natural gestures. Keep one camera framing per scene block for easy cutting. |
| Legal | Confirm you own the likeness and voice rights. Disclose AI-generated video where the platform or law requires it. |

---

## Part 2: HeyGen prompts

### Master prompt (VSL avatar base)
```
Create a talking-head video of my digital avatar delivering the attached script.

STYLE: warm, confident, calm founder. A trusted operator explaining something important to a peer, not a hyped sales pitch. Speak at about 150 words per minute with short natural pauses at the ends of sentences and one full beat after each number. Slight smile on the truck story and the daycare story; slower and lower on the problem section; direct and inviting on the call to action.

FRAMING: medium close-up (chest up), eye-level camera, subject slightly right of center to leave room for on-screen graphics on the left. Shallow depth of field. Soft key light from camera left, gentle rim light, warm color temperature. Background: a modern, tidy office with warm wood and greenery, out of focus. No text overlays, no captions, no music.

PERFORMANCE: natural hand gestures and eyebrow movement, blinking and micro-expressions. No robotic head bobbing. Maintain eye contact with the lens.

DELIVERY: generate the script in 11 segments matching the numbered sections so I can cut between them. Keep identical lighting, framing and wardrobe across all segments.

OUTPUT: 16:9, 1080p or higher, one file per segment plus one combined file.
```

### Per-segment notes to add to the prompt
| Segment | Extra direction |
|---|---|
| 1 Hook | Start already mid-thought, lean in slightly, serious tone |
| 2 Truck | Warm, reflective. Slight smile on "one truck" |
| 3 Numbers | Pause one beat after every dollar figure. Emphasize "three point four million." |
| 4 Problem | Slower, lower, empathetic. Count on fingers for "one, two, three". |
| 5 Why daycares | Open, friendly, conversational |
| 6 Method | Clear and structured. Small gestures for each step |
| 7 Packages | Brisk and confident |
| 8 Who it's for | Direct, honest, slightly firmer on "not for you" |
| 9 Proof | Sincere. (Skip if no approved proof exists.) |
| 10 CTA | Warm, inviting, unhurried |

### Ad avatar prompt (9:16)
```
Create a vertical 9:16 talking-head video of my digital avatar delivering the attached short ad script.

STYLE: energetic but grounded, like a founder recording a direct message for a peer. Faster pace than the VSL (about 165 words per minute), with a strong hook in the first 3 seconds: start speaking immediately on frame one, no intro.

FRAMING: tight medium close-up, face and shoulders, eye-level, centered slightly above the middle of the frame so captions fit below and headline graphics fit above. Bright, clean, natural light. Blurred modern office background. No captions and no music in the render.

PERFORMANCE: expressive, natural gestures, direct eye contact. End every ad with a warm, clear call to action and hold the last frame for half a second.

OUTPUT: 9:16, 1080x1920, one file per ad.
```

---

## Part 3: B-roll and asset shot list (generate or source)

Use real footage of your trucks, office and daycare wherever possible. It's more credible than stock. Use AI-generated b-roll for abstract or missing shots, and label generated footage internally.

| # | Shot | Used in | Source | Generation prompt (if AI) |
|---|---|---|---|---|
| 1 | Single rented box truck at dawn | VSL 2, Ad 4 | Real footage or generate | "A single white box truck parked on an empty lot at sunrise, warm golden light, cinematic, shallow depth of field, slow push-in, photorealistic" |
| 2 | Revenue chart animation | VSL 3, Ad 2/4/5 | Motion graphic | See Part 4 |
| 3 | Busy daycare lobby, parent drop-off | VSL 4, Ads 1/7 | Real footage (with releases) | "Bright daycare entrance in the morning, parents dropping off children, warm natural light, handheld, photorealistic, no identifiable faces" |
| 4 | Director looking stressed with phone | VSL 4, Ad 2 | Generate | "A daycare director at a desk looking at a buzzing phone, tired but composed, soft window light, cinematic, photorealistic" |
| 5 | Phone ringing / text notifications | Ad 1 | Motion graphic or generate | "Close-up of a phone screen with unanswered message notifications stacking up, shallow depth of field" |
| 6 | Empty classroom cots/desks | Ad 1, VSL 4 | Real or generate | "An empty, bright preschool classroom with small tables and colorful shelves, morning light, gentle dolly shot" |
| 7 | Tour walk-through | Ad 1, Fill Sprint | Real | Real footage of a walk-through with a director |
| 8 | Building exteriors / site plans | Ad 5, VSL 6 | Real or generate | "A modern single-story child care center exterior at golden hour, landscaped entrance, architectural photography" |
| 9 | Map of South Jersey / Philadelphia | Ads 5 | Motion graphic | Stylized map with the service area highlighted |
| 10 | Aloha Capital / real estate | VSL 5, Ad 5 | Real | Photos of properties from the portfolio |
| 11 | Calculator/cost-per-child graphic | Ad 3 | Motion graphic | See Part 4 |

Higgsfield prompt template (if used): `[Subject and action], [setting], [lighting], [camera move], [lens/film look], photorealistic, 4K`

---

## Part 4: Motion graphics specs

**Style:** clean, editorial, premium. Navy #0B1F3A, teal #0F8B8D, coral #F26A4B (accent only), sand #F7F2EA. Fraunces for numbers and titles, Inter for labels. Eased motion (cubic-bezier 0.22, 1, 0.36, 1), 400-600ms.

1. **Revenue chart (VSL 3, Ad 4):** dark navy background. Five bars rise one by one, each with the year and figure counting up (0 to value in 700ms). 2021 $220K, 2022 $340K, 2023 $3.4M, 2024 $11.5M, 2025 $16.7M. The 2023 bar pulses coral. Add a tiny disclaimer line: "A&H Logistics. Founder-reported revenue. Results vary."
2. **Kinetic key phrases:** large type snapping in on the beat, e.g., "Empty seats", "Every question comes back to you", "Revenue is not profit". Max 4 words on screen at once.
3. **Three-step graphic (VSL 6):** Diagnose, Blueprint, Build with icons drawing in, connected by a line that fills.
4. **Package cards (VSL 7):** four cards slide up in sequence, each with name and duration.
5. **Qualification checklist (VSL 8):** items tick off with a soft click.
6. **Spot counter (VSL 10, Ads):** "3" large with three dots that pulse.
7. **Lower thirds:** name, title and "A&H Logistics | Aloha Capital | Aloha Growth" on first appearance only.

---

## Part 5: The edit brief (this is what makes it world-class)

### Principles
1. **Never hold the same frame longer than 4-6 seconds** in the VSL, or 1.5-2.5 seconds in ads. Change something: a cut, a punch-in, a graphic, a caption emphasis.
2. **Cut to meaning, not the clock.** Every b-roll shot must illustrate the exact word being spoken.
3. **Use the avatar as the anchor.** Return to the face for emotional lines (truck story, "you have a job", CTA).
4. **Sound is half the video.** Music, subtle whooshes and risers, clean voice.

### VSL pacing map
| Section | Time | Cut rhythm | Visual approach |
|---|---|---|---|
| 1 Hook | 0:00-0:25 | Cut every 2-3s | Face, punch-in 105-110% on key words, kinetic text |
| 2 Truck | 0:25-1:10 | 3-4s | Truck b-roll under voice (J-cuts), warm grade, film grain |
| 3 Numbers | 1:10-2:10 | Chart-driven | Full-screen chart, avatar in a small circle then back to full frame for "I didn't work ten times harder" |
| 4 Problem | 2:10-3:20 | 3-5s | Muted, cooler grade, three text cards, subtle vignette |
| 5 Why daycares | 3:20-4:10 | 4s | Brighter grade, logos, daycare photos |
| 6 Method | 4:10-5:45 | Graphic-led | Step graphics, avatar returns each step |
| 7 Packages | 5:45-6:50 | Fast, 3-4s | Cards sliding in on the beat |
| 8 Who it's for | 6:50-7:30 | 4s | Checklist, calm |
| 9 Proof | 7:30-8:00 | 4-5s | Testimonial clips or chart replay |
| 10 CTA | 8:00-8:40 | Slow, 5-6s | Avatar full frame, warm light, slow push-in, button graphic |
| End card | 8:40-8:50 | Hold | Logo, URL |

### Ad pacing (9:16)
- **0-3s:** the hook. Text and face in frame 1. No logo intro.
- **Cut every 1.5-2.5s.** Alternate between avatar, b-roll and text graphics.
- **Captions:** word-by-word, bold, 2 lines max, safe zone (keep 250px clear at the top and 340px at the bottom for platform UI). Highlight key words in coral.
- **Final 3-5s:** CTA text and button graphic. Hold the last frame 0.5s.

### Color grade
- **Look:** warm, natural skin tones, soft contrast, slightly lifted shadows. Teal-navy shadows, warm highlights.
- **VSL problem section:** desaturate 15% and cool down. **Method and CTA sections:** warmer and brighter, so the mood lifts.
- Consistent look across every shot. Use one LUT plus small per-shot corrections.

### Sound design
- **Music:** cinematic, uplifting, minimal. Bed at -22 to -26 LUFS under voice, rising at the chart reveal and the CTA. No lyrics. License it properly.
- **Voice:** high-pass at 80Hz, gentle compression, de-ess, target -16 LUFS for online delivery (VSL) and -14 LUFS for ads.
- **SFX:** soft whoosh on text and card moves, low "hit" on the 2023 bar, subtle click on checklist ticks, a riser into the CTA. Keep SFX at least 10 dB under voice.

### Transitions
Prefer hard cuts, J-cuts and L-cuts. Use a few motion-matched wipes (e.g., truck moving across frame into the chart). Avoid cheesy spins, glitch or flash transitions.

### Captions and accessibility
Burn in captions on all ads. Provide an .srt for the VSL and closed-captions in the player. Check contrast and legibility on a phone.

### Export specs
| Asset | Ratio | Res | Codec | Notes |
|---|---|---|---|---|
| VSL | 16:9 | 1080p or 4K | H.264, 12-20 Mbps | AAC 256kbps, host on Wistia/Vimeo/Mux for the landing page |
| Ads | 9:16 | 1080x1920 | H.264, 8-12 Mbps | Under 60s for Reels/Stories |
| Feed cuts | 1:1 and 4:5 | 1080x1080 / 1080x1350 | H.264 | |
| Thumbnails | 16:9 | 1920x1080 | JPG | Face, 3-4 word headline |

### QA checklist
- [ ] Every number matches the founder's figures: 2021 $220K, 2022 $340K, 2023 $3.4M, 2024 $11.5M, 2025 $16.7M; Aloha Capital $25M+ AUM
- [ ] No fabricated testimonials, results or guarantees
- [ ] Disclaimers on screen wherever numbers appear
- [ ] Avatar lip-sync and eyes look natural on a phone screen
- [ ] Audio levels balanced, no clipping, music never masks voice
- [ ] Captions accurate and inside safe zones
- [ ] Music and stock licenses on file
- [ ] Releases signed for anyone visible in real footage (staff, children, parents)
- [ ] Watched on phone with sound off and on

---

## Part 6: Delivery order
1. Record HeyGen VSL segments and the 7 ad avatar files.
2. Gather real footage (truck, office, daycare, properties).
3. Generate missing b-roll.
4. Build motion graphics (chart first).
5. Assemble the VSL rough cut, then polish per the pacing map.
6. Cut the 7 ads and export all ratios.
7. Upload the VSL to the host, embed it on `/watch`, and QA the full funnel on mobile.
