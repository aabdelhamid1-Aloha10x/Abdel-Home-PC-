# Load screen (/s/loads/$id): compact rebuild, matches mockups/solo_v3.html screens 5 and 6

Owner feedback on the current build: too much on screen, too many buttons, documents not visible, two upload buttons, rate con check not needed, broker updates should be automatic.

## Layout, top to bottom (one phone screen, no long scroll)
1. Map, short (about 132px). Under it ONE line of three small numbers: Loaded / Empty / Total miles.
2. Header row: #1008, status chip, broker name. Right side: Pays $2,850 and You keep $1,554 (with keep ring). "Why this number" stays a one-tap sheet, not text on the page.
3. Stops as TWO compact rows, not cards: pickup (city, time, Done check) and delivery (city, appointment, ETA). Tap a row to expand the address.
4. Status steps as ONE thin strip (Booked > Pickup > Loaded > Rolling > Delivered > Paid). Remove the big LoadTimeline card and the row of status buttons.
5. ONE big button for the next step (Arrived at pickup, Loaded, Arrived at delivery, Delivered, Send invoice). Booked load: countdown to pickup plus Head to pickup.
6. Documents: ONE row of three tiles, Rate con / BOL / POD. A tile with a file shows a check and opens the file on tap. An empty tile shows +; tap it opens ONE sheet: Take photo, Choose file. Remove the separate Documents list and the two upload buttons.
7. One "More" menu (three dots) for: Navigate, Email broker, Dispute, Cancel load. No other buttons.

## Remove
- Rate con check card (RateConCheck) from this screen.
- "Get rate confirmation from my email" button.
- "Update the broker" button, "Broker chat" button, "Add POD" button, status button grid, "Rate con asks for updates every N hours" line (keep it as a small badge on the broker row only if the rate con set it).

## Rate con comes from email by itself
When a broker email with a rate con attachment arrives for this load (inbound email / connected mailbox), attach it as kind rate_con and show the Rate con tile with a check. If the PDF is ambiguous, show the tile with a dot and let the owner confirm with one tap. No manual "get it from email" step.

## Broker status updates (needs owner decision, see below)
When the load status changes (arrived at pickup, loaded, arrived at delivery, delivered), Masar prepares the fixed-template update email to the broker on the load, with ETA from HERE.
