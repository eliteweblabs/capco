#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const defaultManifestPath = path.join(rootDir, "fixtures/drawing-analyzer/manifest.json");

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { manifest: defaultManifestPath };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--manifest" && args[i + 1]) {
      out.manifest = path.resolve(rootDir, args[i + 1]);
      i += 1;
    }
  }
  return out;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toActualAnalysisShape(raw) {
  if (raw && typeof raw === "object" && raw.analysis?.parsed) return raw.analysis.parsed;
  if (raw && typeof raw === "object" && raw.parsed) return raw.parsed;
  return raw;
}

function normalizeLength(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function buildPipeLengthMap(pipeSegments) {
  const map = {};
  if (!Array.isArray(pipeSegments)) return map;
  for (const segment of pipeSegments) {
    const diameter = String(segment?.diameter ?? "").trim();
    const length = segment?.length;
    if (!diameter || length == null) continue;
    map[diameter] = normalizeLength(length);
  }
  return map;
}

function buildEquipmentCountMap(otherEquipment) {
  const map = {};
  if (!Array.isArray(otherEquipment)) return map;
  for (const item of otherEquipment) {
    const type = String(item?.type ?? "").trim().toLowerCase();
    if (!type) continue;
    const count = Number(item?.count ?? 0) || 0;
    map[type] = count;
  }
  return map;
}

function findFloor(actualFloors, expectedFloor, index) {
  const expectedName = String(expectedFloor?.name ?? "").trim().toLowerCase();
  if (!Array.isArray(actualFloors)) return null;
  if (expectedName) {
    return (
      actualFloors.find(
        (f) => String(f?.name ?? "").trim().toLowerCase() === expectedName
      ) ?? null
    );
  }
  return actualFloors[index] ?? null;
}

function validateFixture(expected, actual) {
  const failures = [];
  const expectedFloors = Array.isArray(expected?.floors) ? expected.floors : [];
  const actualFloors = Array.isArray(actual?.floors) ? actual.floors : [];

  if (actualFloors.length !== expectedFloors.length) {
    failures.push(
      `floors length mismatch (expected ${expectedFloors.length}, got ${actualFloors.length})`
    );
  }

  expectedFloors.forEach((expectedFloor, index) => {
    const label = expectedFloor?.name
      ? `floor "${expectedFloor.name}"`
      : `floor index ${index}`;
    const actualFloor = findFloor(actualFloors, expectedFloor, index);
    if (!actualFloor) {
      failures.push(`${label} missing in actual output`);
      return;
    }

    const expectedSprinklers = Number(expectedFloor?.sprinklerHeads?.count ?? 0);
    const actualSprinklers = Number(actualFloor?.sprinklerHeads?.count ?? 0);
    if (actualSprinklers !== expectedSprinklers) {
      failures.push(
        `${label} sprinklerHeads.count mismatch (expected ${expectedSprinklers}, got ${actualSprinklers})`
      );
    }

    const expectedSmoke = Number(expectedFloor?.smokeAlarms?.count ?? 0);
    const actualSmoke = Number(actualFloor?.smokeAlarms?.count ?? 0);
    if (actualSmoke !== expectedSmoke) {
      failures.push(
        `${label} smokeAlarms.count mismatch (expected ${expectedSmoke}, got ${actualSmoke})`
      );
    }

    const expectedPipeMap = expectedFloor?.pipeLengthByDiameter ?? {};
    const actualPipeMap = buildPipeLengthMap(actualFloor?.pipeSegments);
    for (const [diameter, expectedLength] of Object.entries(expectedPipeMap)) {
      const actualLength = actualPipeMap[diameter];
      if (!actualLength) {
        failures.push(`${label} missing pipe length for diameter "${diameter}"`);
        continue;
      }
      if (actualLength !== normalizeLength(expectedLength)) {
        failures.push(
          `${label} pipe length mismatch for "${diameter}" (expected "${expectedLength}", got "${actualLength}")`
        );
      }
    }

    const expectedEquipmentMap = expectedFloor?.otherEquipmentCounts ?? {};
    const actualEquipmentMap = buildEquipmentCountMap(actualFloor?.otherEquipment);
    for (const [rawType, expectedCount] of Object.entries(expectedEquipmentMap)) {
      const type = String(rawType).trim().toLowerCase();
      const actualCount = Number(actualEquipmentMap[type] ?? 0);
      if (actualCount !== Number(expectedCount)) {
        failures.push(
          `${label} equipment count mismatch for "${rawType}" (expected ${expectedCount}, got ${actualCount})`
        );
      }
    }
  });

  return failures;
}

function ensureOutputDir(outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function runProcessorCommand(commandTemplate, vars) {
  if (!commandTemplate || !commandTemplate.trim()) return;
  const command = commandTemplate
    .replaceAll("{plan}", vars.plan)
    .replaceAll("{output}", vars.output)
    .replaceAll("{fixtureId}", vars.fixtureId);
  execSync(command, { stdio: "inherit", cwd: rootDir });
}

function main() {
  const args = parseArgs();
  if (!fs.existsSync(args.manifest)) {
    console.error(`Manifest not found: ${args.manifest}`);
    process.exit(1);
  }

  const manifestDir = path.dirname(args.manifest);
  const manifest = readJson(args.manifest);
  const fixtures = Array.isArray(manifest.fixtures) ? manifest.fixtures : [];

  if (fixtures.length === 0) {
    console.error("No fixtures found in manifest.");
    process.exit(1);
  }

  const allFailures = [];

  for (const fixture of fixtures) {
    const fixtureId = String(fixture.id ?? "").trim();
    if (!fixtureId) {
      allFailures.push("[unknown] fixture id is required");
      continue;
    }

    const planPath = path.resolve(manifestDir, String(fixture.planPath ?? ""));
    const expectedPath = path.resolve(manifestDir, String(fixture.expectedPath ?? ""));
    const outputPath = path.resolve(manifestDir, String(fixture.outputPath ?? ""));

    if (!fs.existsSync(expectedPath)) {
      allFailures.push(`[${fixtureId}] expected file not found: ${expectedPath}`);
      continue;
    }
    if (!fs.existsSync(planPath)) {
      allFailures.push(`[${fixtureId}] plan file not found: ${planPath}`);
      continue;
    }

    ensureOutputDir(outputPath);
    try {
      runProcessorCommand(String(fixture.processorCommand ?? ""), {
        fixtureId,
        plan: planPath,
        output: outputPath,
      });
    } catch (error) {
      allFailures.push(
        `[${fixtureId}] processor command failed: ${error instanceof Error ? error.message : String(error)}`
      );
      continue;
    }

    if (!fs.existsSync(outputPath)) {
      allFailures.push(`[${fixtureId}] output file not found: ${outputPath}`);
      continue;
    }

    let expected;
    let actual;
    try {
      expected = readJson(expectedPath);
    } catch (error) {
      allFailures.push(
        `[${fixtureId}] failed to parse expected JSON: ${error instanceof Error ? error.message : String(error)}`
      );
      continue;
    }
    try {
      actual = toActualAnalysisShape(readJson(outputPath));
    } catch (error) {
      allFailures.push(
        `[${fixtureId}] failed to parse output JSON: ${error instanceof Error ? error.message : String(error)}`
      );
      continue;
    }

    const failures = validateFixture(expected, actual);
    if (failures.length > 0) {
      for (const failure of failures) {
        allFailures.push(`[${fixtureId}] ${failure}`);
      }
    } else {
      console.log(`PASS ${fixtureId}`);
    }
  }

  if (allFailures.length > 0) {
    console.error("\nDrawing fixture validation FAILED:");
    for (const failure of allFailures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log("\nAll drawing fixtures passed.");
}

main();
