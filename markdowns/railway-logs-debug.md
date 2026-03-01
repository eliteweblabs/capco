# Railway logs for debugging

To use Cursor’s Railway MCP to fetch live deploy logs:

1. **Log in to Railway CLI** (once per machine / session):
   ```bash
   railway login --browserless
   ```
   (`--browserless` required for headless/terminal contexts; interactive browser login may fail.)

2. **Link the project** (if not already):
   ```bash
   cd /Users/4rgd/Astro/rothcobuilt
   railway link
   ```
   Pick the correct project (e.g. rothco/capco) and environment.

3. After that, you can ask the agent to “MCP Railway logs” and it can run `railway logs` (deploy or build) for you.

**Without CLI login:** open [Railway Dashboard](https://railway.app/dashboard) → your project → **Deployments** → select a deployment → **View Logs** (or **Build Logs**). Copy/paste any router or 404 errors into the chat.

**Useful commands (run in project root):**
- `railway logs -t deploy` – stream deploy logs
- `railway logs -t build` – build logs
- `railway status` – check link and login
