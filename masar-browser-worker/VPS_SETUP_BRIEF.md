# Brief for a LOCAL Claude Code session that has the Hostinger MCP connected (owner's computer)
Goal: prepare the Hostinger VPS to run the Masar browser worker (masar-browser-worker/ in this repo, branch claude/options-trading-alerts-scanner-5lgr30). The cloud session cannot see your Hostinger connection; do this locally.

## Step 1: read-only check (report back, change nothing yet)
Using the Hostinger tools list the VPS: plan, vCPU, RAM, disk, OS image, public IP, state (running?), firewall rules, existing Docker/containers. Need: >= 2 GB RAM (4 GB better), Ubuntu 22.04/24.04, >= 10 GB free disk. Write the facts (no passwords/keys) into masar-browser-worker/VPS_REPORT.md and push to the branch (no PR).

## Step 2: only after the owner says "go": install and deploy
1. Install Docker (apt), enable on boot. Open outbound HTTPS only; no inbound ports needed (the worker calls the Masar app; nothing calls it). Keep SSH key-only if possible.
2. Clone the repo branch to /opt/masar-worker (use read access; do not store GitHub tokens on the box beyond what is needed).
3. Create /opt/masar-worker/masar-browser-worker/.env from .env.example. The OWNER types the secrets directly on the server (APP_URL, BROWSER_WORKER_SECRET, ACCOUNTS, DATEXPERT_1_USERNAME, DATEXPERT_1_PASSWORD). The assistant must NEVER see, echo, log or commit these values. chmod 600 .env.
4. docker build -t masar-worker . && docker run -d --restart=always --name masar-worker --env-file .env -v masar-state:/app/state masar-worker
5. Run the inspector once, interactively by the owner: `docker run --rm -it --env-file .env masar-worker node src/inspect.js` and paste only the non-secret output (selectors present, table headers, date format) into masar-browser-worker/INSPECT_RESULT.md. Screenshots may show account data: keep them on the server.
6. Confirm `docker logs masar-worker` shows "worker ... up" and lease polling with no errors; never print env.

## Rules
Read-only first. No real searches, calls, emails or bookings. No credentials in chat, files, logs or commits. Stop and ask if a step would expose a secret or open an inbound port.
