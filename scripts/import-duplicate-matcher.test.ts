#!/usr/bin/env npx tsx
/**
 * Quick self-check for import duplicate matcher (run: npx tsx scripts/import-duplicate-matcher.test.ts)
 */
import assert from "node:assert/strict";
import {
  normalizeEmail,
  normalizeAddress,
  scoreEmailMatch,
  scoreNameMatch,
  scoreAddressMatch,
  scanImportBatch,
} from "../src/lib/import-duplicate-matcher";

assert.equal(normalizeEmail("John.Doe+work@gmail.com"), "johndoe@gmail.com");
assert.equal(normalizeEmail("JOHN@GOOGLEMAIL.COM"), "john@gmail.com");

const emailFuzzy = scoreEmailMatch("john.doe@gmail.com", "johndoe@gmail.com");
assert.ok(emailFuzzy.score >= 0.95, `email fuzzy: ${emailFuzzy.score}`);

const nameFuzzy = scoreNameMatch(
  { firstName: "Jane", lastName: "Smith" },
  { firstName: "Smith", lastName: "Jane" }
);
assert.ok(nameFuzzy.score >= 0.85, `name reversed: ${nameFuzzy.score}`);

const company = scoreNameMatch(
  { companyName: "Acme Fire Protection LLC" },
  { companyName: "Acme Fire Protection, Inc." }
);
assert.ok(company.score >= 0.7, `company: ${company.score}`);

const addr = scoreAddressMatch("123 Main St, Apt 4", "123 Main Street #4");
assert.ok(addr.score >= 0.85, `address: ${addr.score} (${addr.reason})`);

const batch = scanImportBatch(
  [
    { rowIndex: 1, email: "dup@example.com", address: "1 Oak Ave" },
    { rowIndex: 2, email: "new@example.com", address: "99 Pine Road" },
  ],
  {
    profiles: [
      { id: "uuid-1", email: "dup@example.com", firstName: "A", lastName: "B" },
    ],
    projects: [{ id: 10, authorId: "uuid-1", address: "1 Oak Avenue", title: "Job" }],
  }
);

assert.equal(batch[0].action, "skip");
assert.equal(batch[1].action, "create");

console.log("import-duplicate-matcher: all assertions passed");
