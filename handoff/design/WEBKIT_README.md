# Office web mockup kit (read this first)

The office web app is a multi-tenant TMS for fleets (Core and Growth plans). The mockup you build is the exact spec a developer (Lovable) will build from, so **every screen must be detailed, consistent and fully clickable**. Look: "Night Shift" (dark cockpit, lime accent, Space Grotesk + IBM Plex Mono, light/dark/auto theme, AI orb).

## Files (all in this folder: `scratchpad/ui_v2/`)
- `webkit.py`  shared kit. **Do not edit.** If you need a new helper, define it inside your own page file.
- `world.py`   shared sample data (company, users, 18 drivers, 18 trucks, 14 trailers, 12 customers, 38 loads). **Do not edit.** Use these entities so every page agrees. You may add your own data lists inside your page file (invoices, work orders, candidates...) but build them from the world entities (same driver, truck, customer and load names and ids).
- `plan_engine.py` dispatch rules (hours of service, home time, equipment, timing). Read-only.
- `pages/p_ref.py`  **reference page** (All loads table). Copy its pattern.
- `pages/p_planner.py` planner, board and load detail (example of rich custom pages: planner, tabs, panels).
- `build_all.py`, `lint.py`, `preview.sh`  tools (below).
- Your output: **one file `pages/p_<yourname>.py`** with a `def build():` that creates your pages.

## How a page is written
```python
def build():
    cols = [('Load', 0.7, 'id', 'l'), ('Customer', 1.5, 'two', 'l'), ('Rate', 0.8, 'money', 'r'), ('Status', 1.1, 'chip', 'l')]
    rows = [dict(cells=[...], tabs=['open'], title='Load 4871', sub='Memphis to Dallas', chip=st('Booked'), href='WebLoad',
                 kv=[('Customer', 'X'), ...up to 8], tl=[('Oct 8', 'Rate con read'), ...up to 4]) for ...]
    t, ts, tv = table('a', cols, rows, tabs=[('all','All'),('open','Open')], bulk=['Assign','Export'], actions=[('New load','WebNewLoad',True)], search='Search loads', open_href=True)
    content = wh('Title', 'subtitle', wbtn('Secondary') + wbtn('Primary', 'WebNewLoad', primary=True)) + kpis(('LABEL','28','sub text','var(--gd)'), ...) + t
    wpage('WebLoads', 'Office - All loads', content, state_js(ts), vals_body(tv), 1000)
    spec('WebLoads', 'Purpose in one sentence', ['behavior or rule 1', 'rule 2', ...])
```
`wpage(stem, title, content, state_js, vals_body, height)` registers the page. The stem must be one of the names in `SECT` in `webkit.py` (or a detail page: WebLoad, WebCustomer, WebInvoice, WebSettlement, WebDriver, WebTruck, WebTrailer, WebWorkOrder, WebCandidate, WebBot). The section tab bar, sidebar, top bar (Ask my company, credit meter, approvals bell, Light/Dark/Auto) are added automatically.

### Page state and values (how interaction works)
- `state_js(dict1, dict2, ...)` merges initial state dicts into JSON. `table()` returns its own state dict.
- `vals_body(js_piece1, js_piece2, extra='...')` builds the function that returns the values for the `{{holes}}` in your HTML. JS pieces see `s` (state) and `o` (the output object). Add values with `o.name = ...` and handlers with `o.go = () => this.setState({...})`.
- In HTML, a hole is `h('name')` which prints `{{name}}`. Show/hide with `<sc-if value="{h('flag')}" hint-placeholder-val="{h('false')}">...</sc-if>`. Event: `onClick="{h('go')}"`. No other templating exists: **no loops in the template**. Generate repeated HTML in Python; repeat items with their own hole names (`h('x_' + str(i))`), as `table()` does.
- Toggle switches: `toggle('key','Label','sub')` + `toggles_js(['key',...], 'state_field')` + state `{t: {key: True}}`.
- Tabs inside a page: `tabs_state('p', [('a','One'),('b','Two')])` returns (html, js). Put `p'tab': 'a'` in state, wrap content with `when('p','a', html)`.
- Every state-field used in `vals_body` must exist in the state dict.

### Table component (use it for EVERY list; never hand-draw a different table)
Column kinds: `id` (mono, accent), `text`, `strong`, `muted`, `money` (right), `num`, `chip` (value is `st('Status')` or `('text','g|w|r|a|n')`), `person` (avatar + name), `bar` (value `(pct,'label','var(--gd)')`), `two` (value `('main','sub')`). Align `'l'` or `'r'`. Provides: status tabs with counts, live search, Filters row, Columns, Export, bulk bar, select-all, row select, side drawer (kv + timeline + "Open the full record"), footer paging. One `table()` per page (use the tab filters for variants). `st()` maps common words to chip colors.

### Other helpers
`wh` (page header), `wbtn(label, href|oc, primary, small, danger)`, `ibtn`, `wcard`, `ctitle`, `kpis`/`kpi`, `kv`/`kvs`, `fld`, `grid`, `avatar`, `chip`, `mono`, `input_`/`select_`/`textarea_` (form look), `toggle`, `tline` (timeline), `hbar`, `vbars`, `spark`, `kanban`/`kcard`, `crumbs`, `stepper`, `aibox` (assistant suggestion strip), `listrows`, `mbub` (chat bubble), `two(left,right)` (two-column layout), `tabs_state`/`when`. Colors are CSS variables: `var(--tx) --mu --bd --s1 --s2 --ac --at --gd --wn --rd`. Money: `money(n)`, `money(n, True)` adds +. Dates: today is Saturday Oct 10, 2026.

## Quality bar (a checklist, every page)
1. **Detail.** Looks like a real, mature TMS: 8 to 18 realistic rows, all the columns a dispatcher/accountant/etc. would expect, KPI strip, drawer data, status tabs. Detail pages have a stage stepper or summary header, tabs, side cards, and action buttons. No lorem ipsum, no "TBD". Short, plain English labels (owner-operators and dispatchers read this).
2. **Symmetry.** Same layout rhythm on every page: breadcrumbs (detail pages) > header (`wh`) > KPI strip (`kpis`, 3 to 5 cards) > table or cards. Same buttons, same chips, same drawer. Do not invent new table styles.
3. **Everything clickable.** Each button either links to another real page (`href='WebXxx'` or a stem in `SECT`), changes state (tabs, toggles, approve/decline, assign, send, undo), or is a visible no-op action that is obviously a real button (kept for the spec). Prefer making important ones work (approve, send, assign, mark paid, resolve, change status). Row `href` should open a real detail page where one exists.
4. **Rules shown, not hidden.** Warnings, blocked states, approvals, roles ("Managers only"), audit-log notes, empty states, error states where relevant. AI assistants appear as `aibox` suggestions with Ask-first / Auto modes. **Never show a per-action credit price** anywhere (only balances, plan and credit-pack prices).
5. **Data consistency.** Use `world.py` names/ids. Dispatcher is Maria Lopez, owner Dan Whitfield. Load 4857 Nashville to Columbus (T14 Luis R., $1,771 incl. $131 detention) is the hero load. Costs: $2.31 a mile operating cost (excludes fuel), fuel at $4.85 a gallon and 6.9 mpg. Use fictional customer names from `world.py` (use real broker names only on the Load hub sources page, never with invented negative claims).
6. **Money.** The app records money only (it never moves money). Say "record" or "mark as paid", never "pay now" through the app.
7. **Spec.** Call `spec(stem, purpose, [bullets])` for every page: 4 to 8 bullets with behavior, rules, permissions (which roles), what assistants do, what integrations feed it. This becomes the build spec.
8. **Height.** Pass a page height that shows the content (typically 1000 to 1500). The main area scrolls inside the page if taller.

## Tools (run from this folder)
- `python3 build_all.py <yourname>`   builds only your module (`pages/p_<yourname>.py`) into `project/`. (Never run it without arguments; the owner does that.)
- `python3 lint.py Stem1 Stem2 ...`   checks script runs, every hole has a value, tags balance. Must print ALL OK.
- `./preview.sh Stem [light|dark] [height]`   renders to `../preview/Stem.png`. **Open the PNG with the Read tool and look at it.** Check dark and light, text overflow, alignment, empty gaps. Fix what you see. (The 404 error line about a missing file is harmless.)
- To test interaction there is `../preview/act.mjs` as an example (Playwright clicking). Optional.
- Do not run `python3 -m http.server` yourself; `preview.sh` starts it.

Do not change `webkit.py`, `world.py`, `plan_engine.py`, `build_all.py`. Do not publish anything. When finished, reply with the list of page stems you built and any problem you could not fix.
