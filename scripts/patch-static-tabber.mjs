/**
 * Services tabber: drop active-tab stroke, white inactive labels,
 * slightly larger/heavier type, and collapse long inactive titles.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "..", "static-html", "services", "index.html");
const STYLE_ID = "tabber-label-collapse";

const STYLE = `<style id="${STYLE_ID}">
.tabber-block nav { align-items: stretch; }
.tabber-block [data-sliding-tabs-indicator] {
  top: 0; bottom: -1px; height: auto;
  border: none !important; outline: none !important; box-shadow: none !important;
  background-color: #fff;
}
.tabber-block .tab-button {
  flex: 0 0 auto;
  border: none !important; box-shadow: none !important; outline: none !important;
  font-size: 1rem; font-weight: 600; line-height: 1.25; color: #fff !important;
}
.tabber-block .tab-button:hover,
.tabber-block .tab-button:focus-visible { color: #fff !important; }
.tabber-block .tab-button[data-active="true"] { color: rgb(55 65 81) !important; }
.tabber-block .tab-label { display: inline-flex; align-items: baseline; min-width: 0; }
.tabber-block .tab-label-rest-wrap {
  display: inline-block; overflow: hidden; max-width: 0; vertical-align: baseline;
  transition: max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.tabber-block .tab-label-rest { display: inline-block; white-space: nowrap; }
.tabber-block .tab-button[data-active="true"] .tab-label-rest-wrap { max-width: 28rem; }
.tabber-block .tab-label-ellipsis {
  display: inline-block; overflow: hidden; max-width: 1em; opacity: 1;
  transition: max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}
.tabber-block .tab-button[data-active="true"] .tab-label-ellipsis { max-width: 0; opacity: 0; }
.tabber-block .tabber-panels { padding: 2rem 1.25rem 2.75rem; }
@media (min-width: 768px) {
  .tabber-block .tabber-panels { padding: 2.5rem 2.25rem 3.25rem; }
  .tabber-block .tabber-panel.hidden { display: none !important; }
  .tabber-block .tabber-panel:has(> ul):not(.hidden) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    column-gap: 2rem;
    row-gap: 1.25rem;
    align-items: start;
  }
  .tabber-block .tabber-panel:has(> ul) > ul { grid-column: 1; grid-row: 1 / -1; margin-top: 0 !important; }
  .tabber-block .tabber-panel:has(> ul) > p { grid-column: 2; grid-row: 1; margin-top: 0; }
  .tabber-block .tabber-panel:has(> ul) > :not(ul):not(p) { grid-column: 2; grid-row: 2; }
}
@media (prefers-reduced-motion: reduce) {
  .tabber-block .tab-label-rest-wrap,
  .tabber-block .tab-label-ellipsis { transition: none; }
}
</style>`;

const SCRIPT = `<script id="${STYLE_ID}-js">
(function () {
  function place(nav, button, indicator) {
    if (!nav || !button || !indicator) return;
    const navRect = nav.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    indicator.style.left = buttonRect.left - navRect.left + nav.scrollLeft + "px";
    indicator.style.width = buttonRect.width + "px";
  }
  function track(nav) {
    const indicator = nav.querySelector("[data-sliding-tabs-indicator]");
    const active = nav.querySelector('[data-active="true"]');
    if (!active) return;
    place(nav, active, indicator);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    function frame(now) {
      place(nav, nav.querySelector('[data-active="true"]'), indicator);
      if (now - start < 420) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  document.querySelectorAll(".tabber-block nav").forEach(function (nav) {
    nav.setAttribute("data-collapse-labels", "true");
    nav.addEventListener("sliding-tabs:change", function () { track(nav); });
    track(nav);
  });
})();
</script>`;

function splitTabLabel(label, wordLimit = 2) {
  const tokens = label.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (tokens.length <= wordLimit) {
    return { stem: label, rest: "", truncated: false };
  }
  let cut = wordLimit;
  if (tokens[cut - 1] === "&" || tokens[cut - 1] === "&amp;") {
    cut -= 1;
  }
  if (cut < 1) cut = wordLimit;
  return {
    stem: tokens.slice(0, cut).join(" "),
    rest: tokens.slice(cut).join(" "),
    truncated: true,
  };
}

function wrapLabel(label) {
  const { stem, rest, truncated } = splitTabLabel(label);
  if (!truncated) return `<span>${label}</span>`;
  return `<span class="tab-label"><span class="tab-label-stem">${stem}</span><span class="tab-label-ellipsis" aria-hidden="true">…</span><span class="tab-label-rest-wrap"><span class="tab-label-rest">&nbsp;${rest}</span></span></span>`;
}

function patchTabber(html) {
  const marker = 'data-component-name="TabberBlock"';
  const start = html.indexOf(marker);
  if (start === -1) return html;

  let end = html.indexOf('data-component-name="', start + marker.length);
  if (end === -1) end = html.length;
  let chunk = html.slice(start, end);

  chunk = chunk.replace(
    /(<div data-sliding-tabs-indicator="" class="color-background pointer-events-none absolute bottom-0 left-0 z-0 )shadow-lg /,
    "$1"
  );

  chunk = chunk.replace(
    'class="tabber-panels mt-6 px-4"',
    'class="tabber-panels"'
  );

  chunk = chunk.replace(
    /(<nav [^>]*id="tabber-[^"]+-nav"[^>]*)(>)/,
    (full, open, close) =>
      open.includes("data-collapse-labels") ? full : `${open} data-collapse-labels="true"${close}`
  );

  chunk = chunk.replace(
    /<span class="tab-label"><span class="tab-label-stem">([^<]*)<\/span><span class="tab-label-ellipsis"[^>]*>[^<]*<\/span><span class="tab-label-rest-wrap"><span class="tab-label-rest">\s*([^<]*)<\/span><\/span><\/span>/g,
    "<span>$1 $2</span>"
  );

  chunk = chunk.replace(
    /(<button[^>]*tab-button[^>]*>)\s*<span>([^<]+)<\/span>\s*(<\/button>)/g,
    (_, open, label, close) => {
      const wrapped = wrapLabel(label);
      let nextOpen = open;
      if (wrapped.includes("tab-label") && !nextOpen.includes("data-full-label")) {
        const plain = label.replace(/&amp;/g, "&");
        nextOpen = nextOpen.replace(/>$/, ` title="${plain}" aria-label="${plain}" data-full-label="${plain}">`);
      }
      return `${nextOpen} ${wrapped} ${close}`;
    }
  );

  return html.slice(0, start) + chunk + html.slice(end);
}

async function main() {
  let html = await readFile(FILE, "utf8");
  html = patchTabber(html);
  if (html.includes(`id="${STYLE_ID}"`)) {
    html = html.replace(
      new RegExp(`<style id="${STYLE_ID}">[\\s\\S]*?</style>`),
      STYLE
    );
  } else {
    html = html.replace("</head>", `${STYLE}</head>`);
  }
  if (!html.includes(`id="${STYLE_ID}-js"`)) {
    html = html.replace("</body>", `${SCRIPT}</body>`);
  }
  await writeFile(FILE, html);
  console.log("patched", path.relative(path.join(__dirname, ".."), FILE));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
