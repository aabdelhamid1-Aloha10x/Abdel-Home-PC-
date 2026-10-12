# Pay plans, driver programs and teams: design note

Pages: Pay plans (Accounting), Driver programs and Teams (Fleet). Built in `ui_v2/pages/p_pay.py`. The app records pay; it never moves money.

## Driver programs (what a driver may do)
- **Company driver**: drives a company truck and follows the loads dispatch sends. No load board, no booking, sees own pay only.
- **Lease operator**: own truck under the carrier authority. Dispatch offers loads; the driver can also see the board and book with approval. Sees gross rate and own pay.
- **Owner-operator**: owns the truck, picks loads from the board and books instantly inside rules (minimum rate a mile, longest load, equipment, hours of service, home time, customer credit). Sees full rate and own pay.
- **Team drivers**: two drivers on one company truck; dispatch assigns; own pay only.
Each program also sets: how loads arrive (assigned, offered, booked from the board), truck, trailer and fuel rules, default pay plans, escrow on or off, deductions allowed, insurance and documents required, chat topics and notifications. The phone preview shows the Load board tab only when it is allowed. A 1099 or W-2 flag is a plain label; classification is set by the accountant or lawyer.

## Pay methods
Per mile (one rate, or loaded and empty rates; dispatched, practical, GPS or ELD miles; tenure steps; team split), percent of revenue (linehaul only or total revenue with chosen extras), percent after costs (fuel, fuel and maintenance, or a custom list), flat per load, hourly (with stop pay and overtime), per stop, day rate. On top: extra pay (detention share, layover, TONU, stop-off, lumper reimbursement, safety, fuel economy and referral bonuses), weekly deductions, escrow, holdbacks (minimum net pay, deduction cap, carry forward, hold until POD), cycle and pay day, approval chain, and versions with an effective date. Approved statements keep the plan version they were built with.

Sample plans: 7 (see world2). Load 4857 gives: 30% of linehaul $492 gross; 80% after fuel $1,196; 85% after fuel and maintenance $1,220.64; cents per mile $342.02 (before deductions).

## Escrow
Optional per plan. Target balance, weekly contribution, cap, interest, release after separation (days, equipment returned, no open claims, final statement settled), monthly escrow statement. Contributions stop at the target and never take net pay below the minimum.

## Teams
One dispatch group or teams (a Growth feature; Core runs one group). Owner, then Operations manager (Maria Lopez), then team leaders (Kevin Brandt, Leo Park), dispatchers, drivers. Every driver has one team and one dispatcher; coverage rules let a dispatcher help another team without changing membership. Leaders see their team scorecards and approve overrides up to a limit; the Operations manager sees all. Departments serve every team.

## Open decisions
1. Sample data: owner-operators (Luis R.) are on "30% of linehaul". Real owner-operator splits are usually much higher; confirm the numbers or relabel that plan as a company-driver rate.
2. Weekly deductions are shown on one load as one third (3 loads that week). Confirm this is how statements should spread them, or charge them on the first load of the week.
3. Detention under percent plans: counted in revenue or paid as a share, never both (the editor warns). Choose the default per program.
4. Escrow limits and interest rules can vary by state; confirm with the lawyer before shipping defaults.
5. Who may edit plans and programs (suggested: Owner and Accountant; Operations manager views) and the approval limit ($4,000 suggested).
6. Team plan: how a team split is recorded when two drivers share one load (50/50 shown).
7. Instant booking: whether a failed rule check should fall back to "ask for approval" automatically.
