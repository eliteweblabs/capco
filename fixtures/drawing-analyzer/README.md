# Drawing Analyzer Validation Fixtures

Use this folder to enforce pass/fail quality across many plans.

## Goal

For each plan fixture, define expected counts and lengths. If processing output differs, validation fails.

## Folder Layout

- `manifest.json` - list of fixture entries and optional processor command
- `plans/` - source plans (PDF/image files)
- `expected/` - expected results JSON per fixture
- `outputs/` - generated analyzer outputs per fixture

## Quick Start

1. Put plan files in `fixtures/drawing-analyzer/plans/`.
2. Add expected files in `fixtures/drawing-analyzer/expected/`.
3. Update `fixtures/drawing-analyzer/manifest.json`.
4. Run:

```bash
npm run validate:drawing-fixtures
```

## Optional: Auto-run processing command

Each fixture can include `processorCommand`. The validator replaces:

- `{plan}` -> absolute path to plan file
- `{output}` -> absolute path where output JSON should be written
- `{fixtureId}` -> fixture id

Example:

```json
{
  "id": "plan-a",
  "planPath": "plans/plan-a.pdf",
  "expectedPath": "expected/plan-a.expected.json",
  "outputPath": "outputs/plan-a.actual.json",
  "processorCommand": "node scripts/run-drawing-analysis.mjs --input \"{plan}\" --output \"{output}\""
}
```

## Expected JSON Shape

Keep expected files strict and minimal:

```json
{
  "floors": [
    {
      "name": "Plan",
      "sprinklerHeads": { "count": 5 },
      "smokeAlarms": { "count": 2 },
      "pipeLengthByDiameter": {
        "2\"": "45 ft",
        "1\"": "18 ft"
      },
      "otherEquipmentCounts": {
        "pull station": 2
      }
    }
  ]
}
```

Validation fails on:

- floor count mismatch
- missing floor name match (if provided)
- count mismatch for sprinkler/smoke/equipment
- missing or mismatched pipe lengths by diameter
