# Screen spec: P7_recruiting

### Pipeline (`WebPipeline`)

Kanban view of every driver candidate by hiring stage, with filters and assistant suggestions.

- Stages: New, Contacted, Interview, Road test, Offer, Hired / Orientation. Cards show name, CDL class, years, source, next step and days in stage (amber at 5 days, red at 7).
- Cards are draggable on desktop to change stage. Moving to Hired creates the onboarding checklist and a driver draft; moving to Rejected asks for a reason and offers a polite text.
- Filters: source, owner, experience, endorsements, waiting 5 days or more. Source chips update counts live. Click a card to open the candidate page.
- Assistant suggestions cover first replies, interview rescheduling, and re-ordering checks. Ask first by default. In Auto the assistant may send first replies and reminders only, never offers or rejections.
- Plan: Recruiting is included on Growth. Roles: Recruiter, Safety manager and Owner can edit; dispatchers cannot see it.
- Fed by the public application form, job board imports, referral links and manual entry.


### Candidates (`WebCandidates`)

Searchable list of all driver candidates with bulk text and stage changes.

- Table columns: candidate and phone, CDL class and endorsements, experience, home city, source, stage, applied date, last contact, score, recruiter. Tabs by stage.
- Score (0 to 100) blends years of experience, equipment match, MVR, qualifying answers and response speed. It ranks, it never auto-rejects without the recruiter confirming.
- Drawer shows key facts and a timeline. Open the full record goes to the candidate page.
- Bulk actions: send a text to selected candidates (opt-out and quiet hours enforced, message check by the assistant), move stage, assign recruiter, reject with reason.
- Texts use the company number. A STOP reply marks the candidate Do not text across all stages.
- Export includes only fields the user role may see. Roles: Recruiter, Safety manager, Owner.


### Jobs and forms (`WebJobs`)

Create driver job posts, publish them to boards, and manage the public application form, link, QR code and website embed.

- Posts table: title, route type, pay, status (Live, Paused, Draft, Closed), boards posted to, applicants, cost. Status tabs filter. The assistant writes the post text and refreshes it weekly.
- Form builder: name, phone, CDL class and years are always asked. Other fields toggle on or off. Qualifying questions can auto-decline (polite text, moved to Rejected, recruiter can restore) or flag for review.
- Public link, QR code and embed snippet (iframe) share one form. Each source adds a tracking tag (for example src=jobfair) so Sources can count applicants and hires.
- Boards connected in Integrations (Indeed, Facebook, TruckersReport in this mockup). Cost per post is recorded by hand or imported.
- Applications land in Candidates at the New stage and trigger the assistant first reply within 2 minutes (inside quiet hours rules).
- Plan: Recruiting is included on Growth. Roles: Recruiter, Owner.


### Sources (`WebRecSources`)

Shows which recruiting sources produce hires and what each hire costs, so the owner can move money to what works.

- Table: source, spend, applicants, qualified, hires, cost per hire, cost per applicant, quality score, call (Best value, Keep, Review, Pause). Last 90 days by default, date range filter.
- Source comes from the tracking tag on the apply link, QR, board or referral link. Candidates with no tag show as Unknown and the recruiter can set the source by hand.
- Spend is entered by hand (the app only records money) or imported from a board. Referral bonuses are added automatically when a referred driver passes 90 days.
- Quality is the average candidate score plus 90-day retention of hires from that source.
- Charts: cost per hire, applicants per week and the hiring funnel. The assistant suggests moving budget and always asks first.
- Roles: Recruiter and Owner. Cost columns are hidden from the Recruiter role if the Owner turns on Hide costs.


### Onboarding (`WebOnboard`)

Track every new hire through the five onboarding task sets until they are ready for their first load.

- Table: new hire, start date, status of Paperwork, Drug test, Orientation, ELD training and Truck assignment, overall progress bar, e-sign status. Tabs: In progress, Stuck, Complete.
- Checklist template is editable (tasks, owner, order). Templates per hire type (Company driver, Owner-operator, Local). Starting a checklist happens automatically when a candidate is moved to Hired.
- E-sign sends the offer letter, FCRA consent, PSP and Clearinghouse consent, W-4 and I-9, direct deposit and handbook acknowledgment. Signed copies are filed in Driver files.
- When all tasks are done the driver profile is created and the driver app login is sent. Truck assignment is confirmed in the Planner.
- Assistant reminds new hires by text every 2 days (max 3), warns about stuck tasks, and suggests second-seat plans. Ask first by default.
- Roles: Recruiter edits paperwork, Safety manager edits drug test and orientation, Dispatch manager edits ELD training and truck.


### Candidate (`WebCandidate`)

Everything about one candidate: application, documents, conversation, checks, notes and onboarding tasks, with the actions a recruiter takes.

- Header shows name, key facts and a stage stepper (New to Hired). Actions: Text, Call, Schedule interview, Send offer, Reject with reason. Each opens a panel and logs to the timeline.
- Texts and calls shows the SMS thread and the voice call log in one place. The assistant drafts replies. The recruiter approves in Ask first mode. Quiet hours (8 am to 8 pm candidate time) and STOP opt-outs are enforced.
- Checks tab: MVR, PSP, background, drug test, Clearinghouse and previous employers, each with status and next step. All need the signed FCRA consent first.
- Offer rule: needs a clean MVR, PSP report and passed road test. Owner or Dispatch manager can send early with a reason that is audit logged.
- Reject asks for a reason (saved for recruiting reports, never sent to the candidate) and offers a polite text. Adverse action letters are generated when a check causes the rejection.
- Moving to Hired creates the onboarding checklist and a draft driver profile, copies the checks and documents into the driver qualification file.

## Inbox
