#!/usr/bin/env node
/**
 * Capture console errors from a page load.
 * Usage: node scripts/capture-console-errors.js [url]
 * Default URL: https://rothco-firstbranch.up.railway.app/
 */

import puppeteer from "puppeteer";

const args = process.argv.slice(2);
const showAll = args.includes("--all");
const url = args.filter((a) => !a.startsWith("--"))[0] || "https://rothco-firstbranch.up.railway.app/";

const messages = [];

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Capture all console output
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();
    messages.push({
      type,
      text,
      url: location?.url,
      line: location?.lineNumber,
      col: location?.columnNumber,
    });
  });

  // Capture page errors (uncaught exceptions, failed resources)
  page.on("pageerror", (err) => {
    messages.push({ type: "pageerror", text: err.message, stack: err.stack });
  });

  await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 3000)); // Let hydration and scripts finish

  await browser.close();

  const errors = messages.filter((m) => m.type === "error");
  const warns = messages.filter((m) => m.type === "warning");
  const pageErrors = messages.filter((m) => m.type === "pageerror");

  console.log("\n=== CONSOLE ERRORS ===\n");
  if (errors.length === 0) {
    console.log("(none)");
  } else {
    errors.forEach((e, i) => {
      console.log(`[${i + 1}] ${e.text}`);
      if (e.url) console.log(`    at ${e.url}:${e.line || "?"}:${e.col || "?"}`);
    });
  }

  console.log("\n=== PAGE ERRORS (uncaught) ===\n");
  if (pageErrors.length === 0) {
    console.log("(none)");
  } else {
    pageErrors.forEach((e, i) => {
      console.log(`[${i + 1}] ${e.text}`);
      if (e.stack) console.log(e.stack.split("\n").slice(0, 8).join("\n"));
    });
  }

  console.log("\n=== CONSOLE WARNINGS ===\n");
  if (warns.length === 0) {
    console.log("(none)");
  } else {
    warns.forEach((w, i) => {
      console.log(`[${i + 1}] ${w.text}`);
    });
  }

  if (showAll && messages.length > 0) {
    console.log("\n=== ALL MESSAGES ===\n");
    messages.forEach((m, i) => {
      console.log(`[${i + 1}] [${m.type}] ${m.text?.slice(0, 200)}`);
    });
  }

  console.log("\n--- Summary ---");
  console.log(`Errors: ${errors.length}, Page errors: ${pageErrors.length}, Warnings: ${warns.length}, Total: ${messages.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
