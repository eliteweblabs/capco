-- Replace 'documents' with 'files' in projectStatuses table
-- This script handles multiple case formats:
-- - documents -> files
-- - Documents -> Files  
-- - DOCUMENTS -> FILES
-- - Document -> File (singular forms)

-- Begin transaction
BEGIN;

-- Update clientEmailContent (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "clientEmailContent" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("clientEmailContent", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "clientEmailContent" IS NOT NULL 
    AND ("clientEmailContent" ILIKE '%document%');

-- Update buttonText (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "buttonText" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("buttonText", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "buttonText" IS NOT NULL 
    AND ("buttonText" ILIKE '%document%');

-- Update clientEmailSubject (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "clientEmailSubject" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("clientEmailSubject", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "clientEmailSubject" IS NOT NULL 
    AND ("clientEmailSubject" ILIKE '%document%');

-- Update modalAdmin (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "modalAdmin" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("modalAdmin", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "modalAdmin" IS NOT NULL 
    AND ("modalAdmin" ILIKE '%document%');

-- Update modalClient (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "modalClient" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("modalClient", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "modalClient" IS NOT NULL 
    AND ("modalClient" ILIKE '%document%');

-- Update buttonLink (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "buttonLink" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("buttonLink", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "buttonLink" IS NOT NULL 
    AND ("buttonLink" ILIKE '%document%');

-- Update clientStatusAction (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "clientStatusAction" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("clientStatusAction", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "clientStatusAction" IS NOT NULL 
    AND ("clientStatusAction" ILIKE '%document%');

-- Update modalAutoRedirectClient (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "modalAutoRedirectClient" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("modalAutoRedirectClient", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "modalAutoRedirectClient" IS NOT NULL 
    AND ("modalAutoRedirectClient" ILIKE '%document%');

-- Update adminEmailContent (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "adminEmailContent" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("adminEmailContent", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "adminEmailContent" IS NOT NULL 
    AND ("adminEmailContent" ILIKE '%document%');

-- Update adminEmailSubject (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "adminEmailSubject" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("adminEmailSubject", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "adminEmailSubject" IS NOT NULL 
    AND ("adminEmailSubject" ILIKE '%document%');

-- Update modalAutoRedirectAdmin (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "modalAutoRedirectAdmin" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("modalAutoRedirectAdmin", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "modalAutoRedirectAdmin" IS NOT NULL 
    AND ("modalAutoRedirectAdmin" ILIKE '%document%');

-- Update adminStatusName (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "adminStatusName" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("adminStatusName", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "adminStatusName" IS NOT NULL 
    AND ("adminStatusName" ILIKE '%document%');

-- Update clientStatusName (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "clientStatusName" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("clientStatusName", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "clientStatusName" IS NOT NULL 
    AND ("clientStatusName" ILIKE '%document%');

-- Update adminStatusAction (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "adminStatusAction" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("adminStatusAction", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "adminStatusAction" IS NOT NULL 
    AND ("adminStatusAction" ILIKE '%document%');

-- Update status (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "status" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("status", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "status" IS NOT NULL 
    AND ("status" ILIKE '%document%');

-- Update nagEmailClient (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "nagEmailClient" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("nagEmailClient", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "nagEmailClient" IS NOT NULL 
    AND ("nagEmailClient" ILIKE '%document%');

-- Update adminStatusTab (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "adminStatusTab" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("adminStatusTab", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "adminStatusTab" IS NOT NULL 
    AND ("adminStatusTab" ILIKE '%document%');

-- Update clientStatusTab (order matters: UPPER -> Title -> lower)
UPDATE "projectStatuses"
SET "clientStatusTab" = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE("clientStatusTab", 
                        'DOCUMENTS', 'FILES', 'g'),
                    'DOCUMENT', 'FILE', 'g'),
                'Documents', 'Files', 'g'),
            'Document', 'File', 'g'),
        'documents', 'files', 'g'),
    'document', 'file', 'g')
WHERE "clientStatusTab" IS NOT NULL 
    AND ("clientStatusTab" ILIKE '%document%');

-- Update updatedAt timestamp for changed rows
UPDATE "projectStatuses"
SET "updatedAt" = NOW()
WHERE "clientEmailContent" ILIKE '%file%'
    OR "buttonText" ILIKE '%file%'
    OR "clientEmailSubject" ILIKE '%file%'
    OR "modalAdmin" ILIKE '%file%'
    OR "modalClient" ILIKE '%file%'
    OR "buttonLink" ILIKE '%file%'
    OR "clientStatusAction" ILIKE '%file%'
    OR "modalAutoRedirectClient" ILIKE '%file%'
    OR "adminEmailContent" ILIKE '%file%'
    OR "adminEmailSubject" ILIKE '%file%'
    OR "modalAutoRedirectAdmin" ILIKE '%file%'
    OR "adminStatusName" ILIKE '%file%'
    OR "clientStatusName" ILIKE '%file%'
    OR "adminStatusAction" ILIKE '%file%'
    OR "status" ILIKE '%file%'
    OR "nagEmailClient" ILIKE '%file%'
    OR "adminStatusTab" ILIKE '%file%'
    OR "clientStatusTab" ILIKE '%file%';

-- Commit transaction
COMMIT;

-- Display summary of changes
SELECT 
    COUNT(*) as total_rows_checked,
    SUM(CASE WHEN "clientEmailContent" ILIKE '%file%' THEN 1 ELSE 0 END) as rows_with_files
FROM "projectStatuses";

-- Show affected rows (for verification)
SELECT 
    "statusCode",
    "adminStatusName",
    "clientStatusName",
    "adminStatusTab",
    "clientStatusTab",
    "status"
FROM "projectStatuses"
WHERE "clientEmailContent" ILIKE '%file%'
    OR "buttonText" ILIKE '%file%'
    OR "clientEmailSubject" ILIKE '%file%'
    OR "modalAdmin" ILIKE '%file%'
    OR "modalClient" ILIKE '%file%'
    OR "buttonLink" ILIKE '%file%'
    OR "clientStatusAction" ILIKE '%file%'
    OR "modalAutoRedirectClient" ILIKE '%file%'
    OR "adminEmailContent" ILIKE '%file%'
    OR "adminEmailSubject" ILIKE '%file%'
    OR "modalAutoRedirectAdmin" ILIKE '%file%'
    OR "adminStatusName" ILIKE '%file%'
    OR "clientStatusName" ILIKE '%file%'
    OR "adminStatusAction" ILIKE '%file%'
    OR "status" ILIKE '%file%'
    OR "nagEmailClient" ILIKE '%file%'
    OR "adminStatusTab" ILIKE '%file%'
    OR "clientStatusTab" ILIKE '%file%'
ORDER BY "statusCode";
