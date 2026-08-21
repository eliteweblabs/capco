/**
 * Static snapshot scraped the cookie banner in its open state and
 * dropped the consent script, so it comes back on every refresh.
 * Start hidden and persist Accept/Decline in localStorage.
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "static-html");
const SCRIPT_ID = "cookie-consent-persist";

const SCRIPT = `<script id="${SCRIPT_ID}">
(function () {
  var KEY = "cookie-consent";
  var banner = document.getElementById("cookie-banner");
  if (!banner) return;
  function hide() {
    banner.classList.add("hidden", "translate-y-full");
  }
  function show() {
    banner.classList.remove("hidden", "translate-y-full");
  }
  function save(consent) {
    try { localStorage.setItem(KEY, JSON.stringify(consent)); } catch (e) {}
    hide();
  }
  function choose(allOn) {
    save({
      essential: true,
      analytics: allOn,
      marketing: allOn,
      functional: allOn,
      timestamp: new Date().toISOString()
    });
  }
  var existing = null;
  try { existing = localStorage.getItem(KEY); } catch (e) {}
  if (existing) hide();
  else setTimeout(show, 1000);
  function bind(id, allOn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("click", function () { choose(allOn); });
  }
  bind("accept-all-btn", true);
  bind("accept-all-preferences-btn", true);
  bind("decline-all-btn", false);
  bind("reject-all-btn", false);
})();
</script>`;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "compare") continue;
      out.push(...(await walk(full)));
    } else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function patchBannerClass(html) {
  return html.replace(
    /(<div id="cookie-banner" class=")([^"]*)(")/g,
    (full, open, classes, close) => {
      let next = classes;
      if (!/\bhidden\b/.test(next)) next += " hidden";
      if (!/\btranslate-y-full\b/.test(next)) next += " translate-y-full";
      return open + next + close;
    }
  );
}

async function main() {
  for (const file of await walk(ROOT)) {
    let html = await readFile(file, "utf8");
    if (!html.includes('id="cookie-banner"')) continue;
    html = patchBannerClass(html);
    if (!html.includes(`id="${SCRIPT_ID}"`)) {
      html = html.replace("</body>", `${SCRIPT}</body>`);
    }
    await writeFile(file, html);
    console.log("patched", path.relative(ROOT, file));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
