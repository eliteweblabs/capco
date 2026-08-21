/**
 * Static snapshot scraped the cookie banner in its open state and
 * dropped the consent script, so it comes back on every refresh.
 * Start hidden and persist Accept/Decline in localStorage.
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOTS = [
  path.join(__dirname, "..", "static-html"),
  path.join(__dirname, "..", "..", "rothcollc-static"),
];
const SCRIPT_SRC = "/scripts/cookie-consent.js";
const HEAD_MARK = "cookie-consent-early-hide";

const HEAD = `<script id="${HEAD_MARK}">
(function(){try{if(localStorage.getItem("cookie-consent"))document.documentElement.setAttribute("data-cookie-consent","1")}catch(e){}})();
</script><style id="cookie-consent-early-hide-style">html[data-cookie-consent="1"] #cookie-banner{display:none!important}</style>`;

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
  for (const root of ROOTS) {
    for (const file of await walk(root)) {
      let html = await readFile(file, "utf8");
      if (!html.includes('id="cookie-banner"')) continue;
      html = patchBannerClass(html);
      html = html.replace(
        /<script id="cookie-consent-persist">[\s\S]*?<\/script>/,
        ""
      );
      if (!html.includes(`id="${HEAD_MARK}"`)) {
        html = html.replace("<head>", `<head>\n${HEAD}`);
      }
      if (!html.includes(SCRIPT_SRC)) {
        html = html.replace("</body>", `<script src="${SCRIPT_SRC}"></script></body>`);
      }
      await writeFile(file, html);
      console.log("patched", path.relative(root, file));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
