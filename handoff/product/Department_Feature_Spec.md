# Department Feature Spec — what every team needs in the TMS
Date 2026-10-10. Built from: ANH's component inventory (what exists in the Lovable project), the earlier audits (what is broken or unused), your descriptions of how ANH's teams work, and the TMS research. UI concepts: https://claude.ai/artifact/635DAuPCpRwGFseWwFobo4 (sample data).
Legend — ANH today: ✅ exists and in daily use · 🔧 exists but buggy, partial, or unused · ❌ missing. Priority: **MVP** = needed to sell to small carriers · **V2** = fleet/mid-size · **Later** = enterprise or optional add-on. "Not verified" = taken from file names/audit, not clicked through live.

## 0. Principles
1. **One shell, one pattern** — same sidebar, same list + detail panel everywhere; every screen starts with "what needs me".
2. **Zero-input data** — loads, costs, documents and miles arrive from email, ELD, fuel card, QuickBooks, and scanned documents; people confirm, not type.
3. **Every number explains itself** — click any figure to see the loads, bills and rules behind it.
4. **Roles see their department first** — dispatcher lands on loads, accountant on money, shop on tickets — but the owner can see all of it.
5. **Insights need clean data** — tips and comparisons below only work if costs are linked to loads, trucks and drivers (several ANH tables are not today; see "Data foundations").

---
## 1. Company command center and analytics (new — owner/manager)
| Feature | Detail | ANH today | Pri |
|---|---|---|---|
| Company overview | One page: revenue, cost, profit, profit per mile, cost per mile, revenue per truck, days to get paid, on-time %, with sparklines and change vs prior period | ❌ (analytics tabs exist but math is unreliable) | MVP |
| Trends | Revenue vs cost and profit by week/month/year; compare to previous period or same period last year | 🔧 | MVP |
| Department scorecards | Dispatch, Accounting, Shop, Safety/Compliance, Recruiting, each with 4 KPIs, change, and status (On track / Watch / Act now) | ❌ | MVP |
| Compare | Rank and compare trucks, drivers, brokers/customers, lanes, dispatchers, by profit per mile, revenue, loads, on-time, cost; sort and filter; per-row trend | ❌ | MVP |
| Benchmarks | Your cost per mile and each cost line vs industry averages (ATRI 2026: $2.336/mi total; fuel ~$0.48, driver ~$0.82, truck+trailer ~$0.40, insurance ~$0.11; trade-press figures, fleet averages) | ❌ | V2 |
| "What to do next" | Ranked recommendations with money at stake and a one-tap action, e.g. invoice delivered loads, re-price losing lanes, slow-paying brokers, high-cost trucks, expiring documents | ❌ | MVP (5–8 rules), V2 (more) |
| Goals and targets | Per department/KPI targets (e.g., 25 days to get paid); progress and alerts when off track | 🔧 (department goals exist) | V2 |
| Report builder | User-built tables/charts, saved views, filters by any field, export CSV/PDF, scheduled email reports | ❌ (fixed templates only — the Alvys complaint) | V2 |
| Drill-down | Click any KPI/bar/row → underlying loads, bills, invoices | ❌ | MVP |
| Break-even and pricing helper | "What rate do I need on this lane?" from real cost per mile; warns when a load is under break-even before accepting | ❌ | MVP |
| Insight rules (examples) | Delivered-not-invoiced >24h · invoice older than terms · broker pays slower than average · lane below break-even · truck cost per mile >1.5× fleet · deadhead rising · document expiring · PM overdue · driver on-time drop · fuel purchases outside route | ❌ | MVP/V2 |

## 2. Dispatch and operations
| Feature | Detail | ANH today | Pri |
|---|---|---|---|
| Load creation | From rate-con (email/scan/upload parsed by AI), manual form, duplicate, drafts; multi-stop, segments, references, commodity, equipment, notes | ✅ (create/edit, drafts, stops, segments) | MVP |
| Rate-con inbox | Email address/Gmail connection; each rate-con becomes a draft load with a "check" step; duplicates detected | 🔧 (document parser exists; email-to-load flow not complete) | MVP |
| Dispatch board | Loads by status with filters, saved views, bulk status change, column settings, drag/assign driver+truck | ✅ (LoadBoard, filters, bulk) | MVP |
| Status workflow | Enforced transitions with timestamps (booked → dispatched → at pickup → loaded → in transit → delivered → invoiced → paid), cancel, TONU | ✅ (DB-enforced) / 🔧 timestamp bug on BOL/POD | MVP |
| Driver suggestions & feasibility | Rank drivers/trucks by position, hours, current load, deadhead, equipment; warn if the load is infeasible | 🔧 (GPS-only, no HOS/current drop-off) | V2 |
| Delay risk | Predict late loads; auto-notify broker and driver | 🔧 (broker link bug) | V2 |
| Tracking & geofence | Live position from ELD or phone; arrival/departure events; ETA; shareable tracking link for brokers | ❌ geofence never worked; map exists | MVP (link + phone GPS), V2 (ELD vendors) |
| Documents per load | Rate-con, BOL, POD, lumper, scale tickets; auto-sorted from driver photos and email; missing-doc reminders | ✅ (load documents) | MVP |
| Broker & customer book | Contacts, notes, credit/payment history, preferred lanes, rate history, NOA/remit-to, do-not-use list | ✅ (brokerages, brokers) / 🔧 (broker_id empty) | MVP |
| Broker updates | Automatic check-call emails/status messages at milestones | 🔧 (dead because of broker_id) | MVP |
| Detention & layover | Timers at facilities, evidence from geofence, detention requests to broker | ❌ | V2 |
| Override and approvals | Rules (e.g., rate below break-even needs approval); request/approve flow | ✅ (load overrides) | V2 |
| Follow-ups & notes | Per-load notes, reminders, tasks | ✅ (notes) / 🔧 (follow-ups unused) | MVP |
| Load board links | Open DAT/Truckstop/123Loadboard searches pre-filled for a truck's position and equipment (official APIs later) | ❌ | MVP (links), Later (APIs) |
| Truck/driver map | Live fleet map with status colors, parked/idle alerts, driver proximity | ✅ (fleet map, truck mapping) / 🔧 data | V2 |
| Dispatcher performance | Loads, revenue, profit per mile, on-time per dispatcher | ❌ | V2 |

## 3. Driver and owner-operator app (single app, role-based)
| Feature | Detail | ANH today | Pri |
|---|---|---|---|
| Role-based home | Driver sees only their portal; owner/manager sees management; owner-operator switches between | 🔧 (driver portal separate) | MVP |
| My loads | Offered/assigned loads with accept/decline, details, stops, contacts; one-tap Navigate (hand-off to Google/Apple Maps, Waze, truck apps) | ✅ (workflow, load sheet) | MVP |
| Status updates | One-tap milestones with location stamp; automatic arrival prompts | ✅ / 🔧 (timestamps bug) | MVP |
| Scan documents | Camera scanner with auto-crop; BOL/POD/receipts classified and attached to the load | ✅ (DocumentScanner) | MVP |
| DVIR | Pre-/post-trip checklist with photos and defect reporting, auto-ticket to shop | ✅ pre-trip / 🔧 no post-trip, resubmit deletes | MVP |
| Pay & statements | Weekly statements, per-load pay, deductions, advances | ✅ (statements) | MVP |
| Trips & earnings | History, miles, earnings to date | ✅ | V2 |
| Messages | Thread per load plus direct and company channels; photos, voice, location share | 🔧 (chat built but hidden/unreliable) | MVP |
| Notifications | Reliable push (installed app), SMS fallback | 🔧 (push broken; 6 of 48 sessions have a token) | MVP |
| Breakdown / emergency | Report breakdown, share location, find shops, auto ticket | ✅ (maintenance emergency) | MVP |
| Bonuses & contests | Timed programs (weekly/monthly/quarterly), targets, leaderboard, automatic payout into settlements | 🔧 (tables empty, programs inactive; to be restructured as timed programs) | V2 |
| Profile & documents | CDL, medical card, uploaded docs, expiry reminders, e-sign | ✅ | MVP |
| Offline & background GPS | Works with weak signal; location with consent only | 🔧 | V2 |
| Store apps | iOS and Android listings via wrapper with native push, camera, background location (store review rules apply) | ❌ (PWA today) | MVP |
| Onboarding by text link | New driver activates via SMS link, completes profile/e-sign | ✅ (activation, e-sign) | MVP |

## 4. Accounting and back office
| Feature | Detail | ANH today | Pri |
|---|---|---|---|
| Invoicing | Numbered invoice PDF with BOL/POD attached; email to broker; terms; payment status | 🔧 (emails uploaded documents; no generated invoice/numbering) | MVP |
| Factoring | Choose factor per customer; submission packet builder (email, portal upload, CSV/PDF bundle); track advance, reserve, fee, payment reconciliation; works with any factor | ✅ (1,845 submissions) / 🔧 (fee math ignores settings, emails before saving) | MVP |
| Escrow/reserves | Holds, releases, balances per broker/factor | ✅ (holds) / 🔧 (no releases) | V2 |
| Collections | AR aging, reminders, NOA batches, escalation templates | ✅ (collections dialog, NOA) / 🔧 (status bug) | MVP |
| Driver settlements | Weekly pay from loads: % / per mile / flat / hourly / salary / per diem; deductions, advances, escrow; **locked statements linked to loads**; PDFs; approval | ✅ (statements, approval) / 🔧 (no lock, 3 copies of the math, some types $0) | MVP |
| Payroll payout | ACH/check marking; later ACH rails | 🔧 (status flip only) | V2 |
| Fuel | Card import (EFS, WEX, Comdata), receipt scan, matching to trucks/loads, fuel analysis and anomalies, IFTA data | ✅ (6,015 imported) / 🔧 (duplicates on re-import) | MVP |
| Expenses | Receipt photo → categorized expense linked to truck/load; tolls, scales, lumper | 🔧 (ticket receipts, fuel only) | MVP |
| Cost profile | Fixed costs per truck (payment, insurance, permits, overhead) feeding cost per mile | ❌ hard-coded constants | MVP |
| Load/truck/lane profitability | Per-load P&L, truck P&L, lane and customer margin | ✅ / 🔧 (math errors) | MVP |
| Accounting sync | QuickBooks Online (two-way), category rules | 🔧 (disconnected since May) | V2 |
| IFTA & IRP | Quarterly mileage/fuel by state, tax calculation, filing-ready report; odometer baselines | 🔧 (baseline importer only) | MVP (IFTA) |
| Tolls | Toll transponder statements matched to loads | ❌ | V2 |
| Cash view | Cash in/out, forecast from open invoices and upcoming bills | ❌ | V2 |
| Multi-carrier/entities | Several MC/DOT entities with separate books | ✅ (carriers) | V2 |
| Investor/owner statements | Statements for truck owners/investors | ✅ (investor statements) | Decide separately |

## 5. Fleet (trucks, trailers, drivers records)
| Feature | Detail | ANH today | Pri |
|---|---|---|---|
| Truck and trailer records | VIN, plate, registration, inspection dates, ELD id, status, assigned driver, documents, notes, files | ✅ (trucks, trailers, profiles) | MVP |
| Driver records | Personal info, license, endorsements, banking (secured), contacts, pay rates, tax info, documents, history | ✅ (add-driver wizard) | MVP |
| Assignments | Driver↔truck↔trailer history, team drivers | ✅ | MVP |
| Status and availability | Active/in shop/out of service/parked, reasons, return dates | ✅ | MVP |
| Bulk import | Spreadsheet/CSV/PDF import with AI column mapping, preview, undo | 🔧 (import dialogs exist) | MVP |
| Odometer & miles | From ELD or manual; miles per truck | ✅ (readings, import) | MVP |
| Costs per truck | Fixed and variable cost per truck, per mile | 🔧 | MVP |
| Disposal/lease tracking | Purchase/lease terms, payments, depreciation | ❌ | Later |

## 6. Maintenance and shop (in-house shop and remote/online maintenance team)
| Feature | Detail | ANH today | Pri |
|---|---|---|---|
| Tickets | Create from driver report, DVIR defect, or manual; priority, status, assignment, notes, photos, linked load, costs | ✅ (1,000+ tickets) / 🔧 (priority not used) | MVP |
| Road/online maintenance | Remote team triages, finds shops, gets quotes, calls shops, tracks roadside repairs, approves spend | ✅ (road-team suite) / 🔧 (shop-calling unused) | V2 |
| Repair decision | Repair vs replace wizard with cost, age, history | ✅ (repair decision wizard) | V2 |
| Parts | Catalog, inventory, orders, usage, price history, parts-ready queue, required parts per ticket | ✅ components exist / 🔧 (parts catalog empty; AI part search invents prices) | V2 |
| Vendors | Preferred vendors, history, quotes, ratings | ✅ (preferred vendors, vendor history) / 🔧 empty | MVP |
| Technician portal | Assigned work, time sessions, notes, voice notes, photos | ✅ components / 🔧 (0 work sessions) | V2 (shop fleets) |
| Preventive maintenance | Intervals by miles/days/engine hours; due and overdue lists; auto-ticket | ❌ | MVP |
| Yard inspection | Inspection queue for incoming/outgoing equipment | ✅ components | V2 |
| Costs and analytics | Cost per truck/mile, downtime, repair time, repeat repairs, vendor comparison | 🔧 (ticket cost field missing) | MVP |
| Camera feed | Shop cameras | ❌ mock only | Later/drop |
| Approvals | Spend limits; manager review queue | ✅ (manager review queue) | V2 |

## 7. Safety and compliance
| Feature | Detail | ANH today | Pri |
|---|---|---|---|
| Driver qualification file | Application, initial MVR, road test certificate, annual MVR, annual review, medical certificate and National Registry verification, variances; retention employment + 3 years (49 CFR 391.51 [V]) | ❌ (never fully functional) | MVP |
| Expiry tracking | CDL, medical card, insurance, registration, inspections, permits; server-side alerts by email/SMS/push at 60/30/7 days; owner dashboard | 🔧 (browser-only) | MVP |
| Document vault | Upload, categorize, search, bulk upload, e-sign; per driver/truck/company | ✅ (compliance documents upload) / 🔧 (0 documents) | MVP |
| Drug & alcohol | Pre-employment, random pool selection, results, Clearinghouse queries | 🔧 (tables, pool empty) | V2 |
| MVR/background | Request, track, annual review, FCRA adverse-action steps | 🔧 (manual tracking) | V2 |
| DVIR review | Defect review, redo requests, reviewer sign-off | ✅ (reviews, redo, AI analysis) | MVP |
| Incidents & claims | Accident/incident reports, photos, claim status, DataQs | 🔧 (empty) | V2 |
| Insurance | Policies, certificates, renewals, COI sharing with brokers | 🔧 (empty) | MVP |
| Scores | Driver safety scores, behavior reports, CSA-style summary | 🔧 (empty) | V2 |
| Regulatory calendar | MCS-150, UCR, IFTA/IRP, annual inspections reminders (sources not yet verified) | ❌ | V2 |
| Audit packet | One-click export for audits | ❌ | V2 |

## 8. Recruiting and onboarding (add-on)
| Feature | Detail | ANH today | Pri |
|---|---|---|---|
| Public application | Branded multi-step form, screening questions, consent, document upload | ✅ / 🔧 (open insert hole) | Add-on |
| Lead intake | Meta/GHL/webhooks/manual; source tracking | 🔧 (replies dropped; 231 rejected) | Add-on |
| SMS cadence | Sequences, quiet hours, caps, STOP handling, two-way inbox | 🔧 (STOP not honored in tests; dead jobs) | Add-on |
| AI calls | Scripted screening calls, outcomes, transcripts, callbacks | 🔧 (webhook dead since 9/30) | Add-on |
| Pipeline & workspace | Candidate list, stages, owner, notes, take-over, hand-offs, travel/arrival | ✅ (workspace built) / 🔧 (stages fixed) | Add-on |
| Onboarding | E-sign agreements, document checklist, orientation, truck assignment | ✅ (unified onboarding, checklist) | Add-on |
| Reporting | Funnel by source, cost per hire | 🔧 (no ad spend) | Add-on |

## 9. Messages and collaboration
| Feature | Detail | ANH today | Pri |
|---|---|---|---|
| Object threads | Chat on each load, truck, ticket, driver; auto-includes the right people | ❌ | MVP |
| Direct and group channels | Company, department, driver groups; mentions, files, voice notes, location | 🔧 (built, unreliable, hidden) | MVP |
| Reliable delivery | Push + SMS fallback; read receipts | 🔧 | MVP |
| Shared inbox | Company email (Gmail/Outlook) tied to loads and brokers; rate-con auto-capture | ✅ (shared inbox) / 🔧 (N+1 calls) | V2 |
| Telegram/SMS bridge (migration aid) | Let drivers reply from Telegram or SMS into the load thread during switchover | ❌ | V2 |
| Meetings & scheduling | Quick meetings, reminders | 🔧 (0 meetings) | Later |
| Community | Cross-company community, contests | ❌ | Later add-on |

## 10. Administration and platform
| Feature | Detail | ANH today | Pri |
|---|---|---|---|
| Users, roles, permissions | Simple roles (Owner, Dispatcher, Accounting, Shop, Safety, Recruiter, Driver) + custom; per-department visibility | ✅ (23 roles; too many, open policies) | MVP |
| Onboarding & connections | Connect email, ELD, fuel card, QuickBooks, factor; AI import of old data with preview/undo | ❌ | MVP |
| Company settings | Branding, templates (invoice, emails), numbering, time zone, units, thresholds | 🔧 hard-coded A&H values | MVP |
| Integrations hub | ELD vendors, fuel cards, QuickBooks, factors, load boards, EDI (later) | 🔧 (single global keys) | MVP/V2 |
| Audit log | Who changed what | ✅ (audit logs) | MVP |
| Notifications center | Rules by role/channel | ✅ (bell) | MVP |
| Billing & plan | Active trucks, modules, usage, invoices | ❌ | MVP (SaaS) |
| Security | Auth on every endpoint, tenant isolation, storage rules, rate limits, secrets vault | ❌/🔧 (see audit) | MVP |
| Data export | Full export for customers | ❌ | MVP |
| EDI / API | Per-partner EDI (204/990/214/210), public API/webhooks | ❌ | Later |

## 11. Data foundations (needed for analytics and tips to be trustworthy)
1. **Cost linkage:** every cost row (fuel, maintenance bill, toll, driver pay, expense, insurance share) must link to truck and, where possible, load. ANH gaps: maintenance cost field missing, driver pay calculated in three places, toll table empty.
2. **One definition per metric** (profit per mile, cost per mile, on-time, days to get paid) stored in one place, versioned.
3. **Load facts:** miles (practical + loaded + empty), pickup/delivery actual times, broker id, invoice date/paid date.
4. **Cost profile per truck** (fixed monthly costs) and per company (overhead).
5. **Event history** (status changes, document arrivals, invoice sent/paid) for trends and "days to X".
6. **Segmentation:** tenant, carrier entity, department, lane, customer.

## 12. Build order suggestion (TMS only)
1. Foundations: tenant model, security fixes, metric definitions, cost linkage.
2. Core operations + driver app + documents + tracking link + messages.
3. Back office: invoicing, factoring packets, settlements (locked), fuel/expenses, IFTA, cost profile.
4. Company overview + compare + first insight rules (5–8) — so owners see value early.
5. Shop/maintenance + preventive maintenance, compliance (DQ file, expiry alerts, vault).
6. Report builder, goals, benchmarks, more insight rules, ELD vendors, QuickBooks, EDI pilot.
7. Add-ons: Recruiting, Community & Rewards (timed bonuses), AI Dispatcher.

---

## Update: decisions from the UI review (Oct 2026)

**Home screen:** "Command Cockpit" (company pulse, compare, what-if, department gauges, All carriers switch, Export).

**Maintenance (default department for every company)**
- Overnight handoff for the 24-hour team: breakdowns, tickets opened and closed, items needing approval.
- Open vs closed tickets: backlog, opened-vs-closed 14-day chart, average time to close, repeat repairs, downtime days.
- Truck health: PM due by miles and days, fleet service status, Schedule service (notifies dispatch).
- Shop floor (bay board, approvals) is an optional module, not part of default setup.

**Cross-department signals**
- PM due or scheduled -> Dispatch is told, routes the truck to the shop slot.
- Maintenance ticket or driver complaint -> Dispatch is told, with a broker email draft (ETA impact), Send/Undo.
- Safety expirations and Maintenance holds appear in the Dispatch roll call as heads-ups.

**Dispatch**
- Tabs: Control tower, Morning roll call, New load, All loads.
- Roll call: live location, miles left, ETA vs appointment per delivery, auto broker-update draft. Replaces manual texting.
- New load: email inbox reads rate confirmations (PDF beside extracted fields with confidence), checks vs break-even and vs verbal rate, duplicate and broker-standing checks, best-truck suggestions, Create load and offer to driver. Check calls, detention approvals, remittances auto-filed. Other entries: forward, drop file, phone scan, copy repeat load, load board, manual.

**Multi-carrier (tier-gated)**
- Per carrier: sender email, branding, invoice template and numbering, bank (masked, second approval to change), factoring, ELD/fuel connections, documents, reports.
- Starter = 1 carrier (switcher hidden). Fleet = up to 3. Enterprise = up to 10, custom domains.

**Reports:** library by department, filters, PDF / Excel / CSV / print, scheduled email, read-only share link (bank masked).

**Recruiting:** tabs Driver supply, Candidates, Forms and sources.
- Sources: Facebook lead ads, Indeed, website form, referrals, inbound calls/texts, job fairs/QR.
- Forms: driver application, quick interest, owner-operator, referral; builder with required toggles and knock-outs; share by link, QR, embed, ad lead form, text-to-apply; Spanish copy.
- Candidates: funnel stages, text and AI-call thread, take over / hand back, cadence with STOP and quiet hours, documents and checks.
- Adding a driver: from a lead, invite by text, import, manual, then onboarding checklist that notifies Dispatch when ready.

**Open questions:** auto-hire vs manager approval; auto-book on high confidence (assumed: always review); Starter carrier limit.
