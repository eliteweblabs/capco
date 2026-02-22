-- Inspect and optionally revert CMS/globalSettings content that can break layout or scripts.
-- Run in Supabase SQL Editor (or psql). Use when rolling back code at Railway didn't fix the issue.

-- =============================================================================
-- 1. RECENT EDITS: globalSettings rows updated recently (likely culprits)
-- =============================================================================
SELECT key, "updatedAt", "updatedBy", LEFT(value, 120) AS value_preview
FROM "globalSettings"
ORDER BY "updatedAt" DESC
LIMIT 20;

-- =============================================================================
-- 2. RISKY FIELDS: Full value for customCss and customFooterHtml
-- =============================================================================
SELECT key, LENGTH(value) AS len, value
FROM "globalSettings"
WHERE key IN ('customCss', 'customFooterHtml', 'plausibleTrackingScript');

-- =============================================================================
-- 3. DANGEROUS PATTERNS: Rows whose value contains </style> or <script
-- =============================================================================
SELECT key, "updatedAt", CASE WHEN value LIKE '%</style>%' THEN 'contains </style>' WHEN value LIKE '%<script%' THEN 'contains <script' ELSE 'other' END AS risk
FROM "globalSettings"
WHERE value IS NOT NULL
  AND (value LIKE '%</style>%' OR value LIKE '%<script%');

-- =============================================================================
-- 4. OPTIONAL: Temporarily clear customCss to test (uncomment to run)
-- =============================================================================
-- UPDATE "globalSettings" SET value = '', "updatedAt" = NOW() WHERE key = 'customCss';

-- =============================================================================
-- 5. OPTIONAL: Temporarily clear customFooterHtml to test (uncomment to run)
-- =============================================================================
-- UPDATE "globalSettings" SET value = '', "updatedAt" = NOW() WHERE key = 'customFooterHtml';
