-- Update project status colors using scroll percentage algorithm
-- Based on: r = (255 * percentage), g = (255 - 255 * percentage), b = 255
-- Creates smooth gradient from cyan (0%) to magenta (100%)

-- Calculate percentage for each status (10-220 range maps to 0-1)
-- percentage = (status_code - 10) / (220 - 10) = (status_code - 10) / 210

-- Status 10: percentage = 0/210 = 0.0 → r=0, g=255, b=255 (Cyan)
UPDATE project_statuses SET status_color = 'rgb(0, 255, 255)' WHERE status_code = 10;   -- Upload Documents

-- Status 20: percentage = 10/210 = 0.048 → r=12, g=243, b=255
UPDATE project_statuses SET status_color = 'rgb(12, 243, 255)' WHERE status_code = 20;   -- Generate Proposal

-- Status 30: percentage = 20/210 = 0.095 → r=24, g=231, b=255
UPDATE project_statuses SET status_color = 'rgb(24, 231, 255)' WHERE status_code = 30;   -- Proposal Sent

-- Status 35: percentage = 25/210 = 0.119 → r=30, g=225, b=255
UPDATE project_statuses SET status_color = 'rgb(30, 225, 255)' WHERE status_code = 35;   -- Proposal Opened

-- Status 40: percentage = 30/210 = 0.143 → r=36, g=219, b=255
UPDATE project_statuses SET status_color = 'rgb(36, 219, 255)' WHERE status_code = 40;   -- Proposal Viewed

-- Status 45: percentage = 35/210 = 0.167 → r=42, g=213, b=255
UPDATE project_statuses SET status_color = 'rgb(42, 213, 255)' WHERE status_code = 45;   -- Contract Hold

-- Status 50: percentage = 40/210 = 0.190 → r=48, g=207, b=255
UPDATE project_statuses SET status_color = 'rgb(48, 207, 255)' WHERE status_code = 50;   -- Contract Signed

-- Status 55: percentage = 45/210 = 0.214 → r=54, g=201, b=255
UPDATE project_statuses SET status_color = 'rgb(54, 201, 255)' WHERE status_code = 55;   -- Deposit Sent

-- Status 60: percentage = 50/210 = 0.238 → r=61, g=195, b=255
UPDATE project_statuses SET status_color = 'rgb(61, 195, 255)' WHERE status_code = 60;   -- Deposit Opened

-- Status 65: percentage = 55/210 = 0.262 → r=67, g=189, b=255
UPDATE project_statuses SET status_color = 'rgb(67, 189, 255)' WHERE status_code = 65;   -- Deposit Viewed

-- Status 70: percentage = 60/210 = 0.286 → r=73, g=183, b=255
UPDATE project_statuses SET status_color = 'rgb(73, 183, 255)' WHERE status_code = 70;   -- Deposit Paid

-- Status 100: percentage = 90/210 = 0.429 → r=109, g=147, b=255
UPDATE project_statuses SET status_color = 'rgb(109, 147, 255)' WHERE status_code = 100;  -- Generate Documents

-- Status 110: percentage = 100/210 = 0.476 → r=121, g=135, b=255
UPDATE project_statuses SET status_color = 'rgb(121, 135, 255)' WHERE status_code = 110;  -- Submittals Sent

-- Status 115: percentage = 105/210 = 0.500 → r=127, g=128, b=255
UPDATE project_statuses SET status_color = 'rgb(127, 128, 255)' WHERE status_code = 115;  -- Submittals Opened

-- Status 120: percentage = 110/210 = 0.524 → r=134, g=123, b=255
UPDATE project_statuses SET status_color = 'rgb(134, 123, 255)' WHERE status_code = 120;  -- Submittals Viewed

-- Status 130: percentage = 120/210 = 0.571 → r=146, g=111, b=255
UPDATE project_statuses SET status_color = 'rgb(146, 111, 255)' WHERE status_code = 130;  -- Submittals Approved

-- Status 140: percentage = 130/210 = 0.619 → r=158, g=99, b=255
UPDATE project_statuses SET status_color = 'rgb(158, 99, 255)' WHERE status_code = 140;   -- Generating Final Invoice

-- Status 150: percentage = 140/210 = 0.667 → r=170, g=87, b=255
UPDATE project_statuses SET status_color = 'rgb(170, 87, 255)' WHERE status_code = 150;   -- Final Invoice Sent

-- Status 155: percentage = 145/210 = 0.690 → r=176, g=80, b=255
UPDATE project_statuses SET status_color = 'rgb(176, 80, 255)' WHERE status_code = 155;   -- Final Invoice Opened

-- Status 160: percentage = 150/210 = 0.714 → r=182, g=75, b=255
UPDATE project_statuses SET status_color = 'rgb(182, 75, 255)' WHERE status_code = 160;   -- Final Invoice Viewed

-- Status 170: percentage = 160/210 = 0.762 → r=194, g=63, b=255
UPDATE project_statuses SET status_color = 'rgb(194, 63, 255)' WHERE status_code = 170;   -- Final Invoice Paid

-- Status 180: percentage = 170/210 = 0.810 → r=206, g=51, b=255
UPDATE project_statuses SET status_color = 'rgb(206, 51, 255)' WHERE status_code = 180;   -- Generating Final Deliverables

-- Status 190: percentage = 180/210 = 0.857 → r=218, g=39, b=255
UPDATE project_statuses SET status_color = 'rgb(218, 39, 255)' WHERE status_code = 190;   -- Stamping Final Deliverables

-- Status 200: percentage = 190/210 = 0.905 → r=231, g=27, b=255
UPDATE project_statuses SET status_color = 'rgb(231, 27, 255)' WHERE status_code = 200;   -- Final Deliverables Sent

-- Status 210: percentage = 200/210 = 0.952 → r=243, g=15, b=255
UPDATE project_statuses SET status_color = 'rgb(243, 15, 255)' WHERE status_code = 210;   -- Deliverables Viewed

-- Status 220: percentage = 210/210 = 1.0 → r=255, g=0, b=255 (Magenta)
UPDATE project_statuses SET status_color = 'rgb(255, 0, 255)' WHERE status_code = 220;    -- Project Complete

-- Verify the updates with calculated percentages and RGB values
SELECT 
    status_code,
    admin_status_name,
    status_color,
    ROUND((status_code - 10) * 100.0 / 210, 1) as progress_percentage,
    ROUND((status_code - 10) / 210.0, 3) as decimal_percentage,
    CASE 
        WHEN status_code BETWEEN 10 AND 50 THEN '🌊 Early Stages (Cyan to Light Purple)'
        WHEN status_code BETWEEN 60 AND 120 THEN '🌤️ Mid Progress (Light Purple to Medium Purple)'
        WHEN status_code BETWEEN 130 AND 180 THEN '🌩️ Advanced (Medium Purple to Dark Purple)'
        WHEN status_code BETWEEN 190 AND 220 THEN '⚡ Final Stages (Dark Purple to Magenta)'
        ELSE '❓ Unknown'
    END as color_zone
FROM project_statuses 
WHERE status_code >= 10 
ORDER BY status_code;
