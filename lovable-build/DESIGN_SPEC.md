# Masar OS design spec (exact values). The attached screenshots are the source of truth; match them.

## Why this exists
The first build used approximated colors and spacing. Use EXACTLY the values below. Define them as CSS variables in src/styles.css (hex or equivalent oklch computed from these hex values, not invented ones). Components use the tokens only.

## Color tokens (hex)
DARK (default)               LIGHT
--bg   #0A0E13 page          #F3F5EE
--nav  #0D1218 sidebar/top   #FFFFFF
--s1   #121821 card/surface  #FFFFFF
--s2   #18202B raised/input  #ECEFE4
--bd   #1E2733 borders       #DEE3D3
--tx   #E8EDF2 text          #10151B
--mu   #8A97A5 muted text    #56616D
--ac   #C8F25C accent (fills, primary button, active underline)   #C8F25C (same)
--at   #C8F25C accent text   #3A7300 (accent used as TEXT in light mode)
--oa   #0A0E13 text on accent fill (both themes)
--wn   #FFB020 warning       #B54708
--gd   #7DDC8A good/success  #0E7A4E
--rd   #FF7A6B danger        #B42318
--glow rgba(200,242,92,.30)  rgba(120,180,20,.35)
--hero rgba(200,242,92,.18)  rgba(200,242,92,.45)
Primary button = background --ac with text --oa. Secondary button = background --s2, 1px --bd border, text --tx. Danger = text --rd.
Status chips: g = good (green tint, --gd text), a = accent (lime tint, --at text), w = warning (--wn), r = danger (--rd), n = neutral (--s2 bg, --mu text). Chip: height 24px, radius 999px, padding 0 10px, font 12px/700, tint = the color at 14% over the surface, 1px border of the color at 30%.

## Typography
Space Grotesk for all UI; IBM Plex Mono for ids, numbers in tables, labels in KPI cards (UPPERCASE, 11px, letter-spacing 1.2px, color --mu).
Page title h1: 28px / 600 / letter-spacing -0.7px. Card title h2: 17px / 600 / -0.2px. Body 14px. Secondary 13px. KPI value 28px / 700 / -0.8px. Field label 11px uppercase 700 letter-spacing .6px --mu. Button text 14px/700 (small buttons 13px).

## Shape and spacing
Card: background --s1, 1px solid --bd, radius 18px, padding 18px, internal gap 10px. KPI card: padding 14px 16px, gap 3px. Button: height 40px (small 34px), radius 11px, padding 0 16px (small 0 14px). Input: height 40px, radius 11px, background --s1, 1px --bd. Pills/tab group: container radius 12px, background --s2, 1px --bd, padding 3px; tab button height 34px radius 9px; active tab background --s1 (dark) with --tx text. Avatar circle with initials, --s2 bg, 1px --bd. Account avatar: --ac fill, --oa text.
Page layout: sidebar 232px wide (sticky, background --nav, right border 1px --bd, padding 18px 14px, items gap 3px); top bar 68px high (bottom border 1px --bd, padding 0 24px, gap 14px); main padding 20px 24px 28px, vertical gap 16px.
Order inside every page: section tab bar (40px high tabs, active text --at with 2px --ac underline, inactive --mu) > page header (title + subtitle left, action buttons right) > KPI strip (3 to 5 cards, 12px gap) > main content card(s) or the DataTable.

## Shell
Sidebar: logo orb (34px, soft lime glow, conic/radial pastel gradient) + product name 16px/700 + company name 11px --mu. Nav items with a 20px line icon + label, active item has --s1 background and --at text. Bottom: user card (avatar 36px, name 13px/700, "Plan - trucks" 11px --mu) that opens the account menu upward.
Top bar: "Ask my company..." pill input 44px high, radius 22px, with a small orb at the left, max-width 560px; right side: credit meter (label "Credits", mono lime number "3,120 left", 5px progress bar), approvals bell button 40px with a lime count badge, Light/Dark/Auto segmented control.

## DataTable (identical everywhere; see the screenshots of Loads, Invoices, Pay plans, Incentives)
Toolbar: segmented status tabs with counts on the left; right: search (230px, radius 11px, icon inside), Filters, Columns, Export (small secondary buttons) and the page's primary small button. Header row: 11px uppercase mono labels --mu on --s2. Rows 52px, 1px --bd separators, hover --s2, first column mono lime id when it is an id. Money right aligned in mono. Row click opens a right-side drawer 340px wide (details key-value list, mini timeline, "Open the full record"). Footer: "Showing 1 to N of M" and pager.

## Rules for the match pass
1. Do not use shadcn default grays or default radii. Override the shadcn theme so every shadcn component (Button, Input, Card, Dialog, Tabs, Table, Badge, DropdownMenu, Sheet) uses these tokens and radii.
2. No box-shadows except the glow on the orb and the toast/menu shadow (0 20px 50px rgba(0,0,0,.4)).
3. Compare each page to its screenshot at 1360px width in dark and light, list every difference you find, fix them all, and re-compare. Report the list of differences you fixed per page.
