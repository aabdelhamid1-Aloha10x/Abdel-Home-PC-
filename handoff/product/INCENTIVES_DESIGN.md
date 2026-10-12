# Driver incentives (bonus programs): design

Name in product: "Incentives". Not the same as "Driver programs" (company / lease / owner-operator). To avoid confusion, the UI says "Incentive programs" and "Employment programs" for the other one.

## What management can do (office: Fleet > Incentives, Growth+; Core gets 1 simple program)
Design a program from building blocks. No code. A program = Who + What is measured + Rules + Reward + When + Approval.

**Who (eligibility):** all drivers, or filter by employment program (company/lease/owner-operator), team, truck, tenure (e.g. 90+ days), home-time group. Preview shows the exact driver list and count.

**Metrics (library, each computed from real data):**
Miles (loaded/total), loads delivered, on-time pickup %, on-time delivery %, safety score (events per 1,000 mi), incident-free days, clean inspection rate (DVIRs with no defects), pre-trip completed %, fuel efficiency (mpg vs fleet or own baseline), idle time %, detention minutes reduced, paperwork on time (BOL/POD within X hours), roll-call replied on time %, customer rating/compliments, referral hired and stays 90 days, tenure milestone, revenue per truck, profit per truck, utilization %, HOS violations count. Custom metric = formula over two metrics (e.g. revenue / miles).

**Rules:** threshold (>= 95% on-time), tiers (Bronze/Silver/Gold with different payouts), ranking (top 3 of the team each week), improvement vs own last period, streaks (4 clean weeks in a row), gates (must also have zero HOS violations), caps (max $ per driver per period, max budget per program), proration for part-time periods, exclusions (days on home time or out of service don't count against).

**Reward:** flat $, $ per mile, % of revenue/profit, tier table, points that convert to $ or perks, gift/time off (non-cash, tracked as a task). Cash rewards become a "Bonus" line on the driver's settlement.

**When:** period (weekly, monthly, quarterly, one-off campaign with start/end), evaluation time, payout timing (with the next settlement).

**Approval:** auto-add to settlement as Draft line, or require approval by Accounting/leader (default: approval for any single payout over $X).

**Status and activation:** Draft, Scheduled, Active, Paused, Ended. Activate/pause/end anytime; schedule start/end dates; per-driver enroll/exclude override with a reason; changing rules mid-period creates a new version effective from a date (past results keep the old version). Activating shows a driver preview and a "what it will cost at current numbers" estimate. Deactivating stops accrual immediately; earned amounts so far follow the program's "on pause/end" rule (pay earned, forfeit, or pay prorated).

## Automatic calculation
A nightly job + on-demand "Recalculate" evaluates each active program for each eligible driver, writes incentive_progress rows (current value, target, tier, earned so far, projected) and at period close writes incentive_awards (amount, status pending/approved/added_to_settlement/paid(record)/void) and a settlement line. Every number is explainable: "Why this amount" lists the source loads/events. Disputes go to the private Pay topic in chat.

## Driver side (driver app: Today card + More > Bonuses)
Drivers see only ACTIVE programs they are eligible for (inactive/paused ones disappear; ended ones show in history). Each shows: name, how it works in one plain sentence, progress bar to target, current tier, earned so far, projected, days left, what counts and what doesn't, history of past awards. Optional opt-in programs have a Join button; auto-enrolled ones just appear. Notifications: new program, near a tier, earned, paid on settlement. Drivers cannot see other drivers' dollars; ranking programs show only their own rank and top-3 initials if management allows.

## Data model
incentive_programs(id, company_id, name, description, status, starts_on, ends_on, period, eligibility jsonb, metric jsonb, rules jsonb, reward jsonb, approval jsonb, budget_cap, enroll_mode auto|opt_in, on_end_rule, version, created_by)
incentive_versions(program_id, version, snapshot jsonb, effective_from)
incentive_enrollments(program_id, driver_id, status enrolled|excluded|opted_out, reason, by)
incentive_progress(program_id, driver_id, period_start, period_end, value, target, tier, earned, projected, updated_at, explain jsonb)
incentive_awards(program_id, driver_id, period, amount, status, settlement_id null, approved_by, approved_at, explain jsonb)
metric_definitions(key, label, source table/query fn, unit, direction higher_better|lower_better) - SQL functions per metric, scoped by company.

## Rules for the build
Calculation lives in SQL/edge function (server side), pure and unit-tested; the client only displays. Awards are idempotent per (program, driver, period). Money is record-only. Roles: Owner, Accountant, leaders approve; dispatchers view only. Plans: Core 1 program with flat-reward metrics; Growth unlimited with tiers, ranking, custom metrics; all audited.
