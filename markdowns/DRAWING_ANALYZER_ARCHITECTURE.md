# Fire Protection Drawing Analyzer

## Overview

A component that reads PDF, image, or (optionally) AutoCAD exports and recognizes fire protection elements from technical drawings based on:
- **Line width** → pipe diameter (e.g., thicker line = 2" pipe)
- **Color** → fire line conventions (often red for sprinkler/fire lines)
- **Iconography** → standard NFPA/fire protection symbols (sprinkler heads, smoke alarms, etc.)

## Architecture

### Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  DrawingAnalyzer │────▶│  Upload images   │────▶│  /api/agent/         │
│  (Astro component)    │  (ai-chat-images)│     │  analyze-drawing     │
└─────────────────┘     └──────────────────┘     └──────────┬──────────┘
        │                                                         │
        │  PDF ──▶ pdf.js render ──▶ PNG per page ──▶ upload       │
        │  Image ──▶ upload directly                              │
        │                                                         ▼
        │                                               ┌─────────────────────┐
        │                                               │ UnifiedFireProtection│
        │                                               │ Agent (Claude Vision)│
        └───────────────────────────────────────────────┴─────────────────────┘
```

### File Format Support

| Format | Approach | Notes |
|--------|----------|-------|
| **Image** (PNG, JPG, etc.) | Direct upload to storage → Vision API | Works immediately |
| **PDF** | Client-side pdf.js render each page to canvas → export PNG → upload | Reuses existing PDFSystem pattern |
| **AutoCAD DWG** | User exports to PDF/PNG first, or future: cloud conversion (Aspose) | No native DWG parsing in stack; export workflow for now |

### API: `POST /api/agent/analyze-drawing`

**Request body:**
```json
{
  "imageUrls": ["https://...", "..."],
  "projectId": 123  // optional
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "summary": "...",
    "items": [
      { "type": "pipe", "diameter": "2\"", "length": "45 ft", "confidence": "high" },
      { "type": "sprinkler_head", "count": 12, "confidence": "medium" },
      { "type": "smoke_alarm", "count": 4, "confidence": "high" }
    ],
    "rawResponse": "..."
  }
}
```

### Vision Prompt Strategy

Claude receives images with a specialized prompt that:
1. References NFPA symbol conventions
2. Instructs analysis of line width (pipe size), color, and symbols
3. Requests structured JSON output
4. Handles multi-page drawings

## Components

- **DrawingAnalyzer.astro** – Upload dropzone, PDF→image conversion (client-side pdf.js), results display
- **API** – Auth, validate URLs, call UnifiedFireProtectionAgent with vision

## Dependencies

- Existing: `UnifiedFireProtectionAgent`, `ai-chat-images` bucket, `ANTHROPIC_API_KEY`
- pdf.js: already used in PDFSystem for client-side PDF rendering
- No new packages for MVP

## Future Enhancements

- DWG support via Aspose Cloud or similar (paid)
- Save analysis results to project/database
- Overlay detected items on drawing preview
- Batch multiple drawings
