-- =============================================================================
-- Demo seed: timeEntries for /admin/time-entries — HIGH VOLUME, STAFF ONLY
-- =============================================================================
-- Payroll / invoicing model:
--   • ONLY profiles with role = 'Staff' receive seeded time (no Admin, superAdmin,
--     or Client rows).
--   • Rows are realistic sessions: startedAt + endedAt, projectId set for billing.
--
-- Volume (approximate, randomness varies per run):
--   • ~320 calendar days lookback (~10 months).
--   • Weekdays: ~92% get ≥1 session; 2–5 sessions per working day (weighted).
--   • Saturdays: ~22% get light work; 1–2 shorter sessions.
--   • Sundays: skipped.
--   • Project bias: ~78% on projects where worker is assignedToId or authorId;
--     remainder random active project (crew assist / overflow).
--   • hourlyRateSnapshot from profiles.hourlyRate (default 52.50).
--   • Notes: '[demo-seed] …' for safe teardown.
--
-- Expect on the order of several thousand rows when you have multiple Staff users
-- (e.g. ~600–900+ sessions per staff over the window).
--
-- Prerequisites:
--   • public.timeEntries + hourlyRateSnapshot (migrations applied).
--   • At least one project id <> 0 and at least one Staff profile.
--   • Recommended: finance-dashboard-demo-seed.sql (5 Staff + many projects).
--
-- Run in Supabase SQL Editor as postgres (or role that bypasses RLS).
--
-- Reset demo rows only:
-- DELETE FROM "public"."timeEntries" WHERE notes LIKE '[demo-seed]%';
-- =============================================================================

DO $$
DECLARE
  r_staff RECORD;
  day_offset integer;
  sessions_today integer;
  sess integer;
  day_base timestamptz;
  cur_start timestamptz;
  cur_end timestamptz;
  dur_mins integer;
  chosen_pid integer;
  staff_hr numeric(12, 2);
  gap_mins integer;
  note_pick text;
  project_count integer;
  staff_profile_count integer;
  inserted_total integer := 0;
  v_dow integer;
  is_sat boolean;
BEGIN
  SELECT count(*) INTO project_count FROM "public"."projects" WHERE id <> 0;
  IF project_count IS NULL OR project_count = 0 THEN
    RAISE EXCEPTION 'time-entries-demo-seed: no projects with id <> 0; create projects first.';
  END IF;

  SELECT count(*) INTO staff_profile_count
  FROM "public"."profiles" p
  WHERE p.role = 'Staff';

  IF staff_profile_count IS NULL OR staff_profile_count = 0 THEN
    RAISE EXCEPTION 'time-entries-demo-seed: need at least one profile with role Staff (Admin/superAdmin are excluded).';
  END IF;

  FOR r_staff IN
    SELECT
      p.id AS uid,
      COALESCE(p."hourlyRate", 52.50)::numeric(12, 2) AS hr
    FROM "public"."profiles" p
    WHERE p.role = 'Staff'
  LOOP
    staff_hr := r_staff.hr;

    FOR day_offset IN 1..320 LOOP
      v_dow :=
        EXTRACT(
          ISODOW
          FROM
            ((timezone('utc', now()))::date - day_offset)
        )::integer;

      IF v_dow = 7 THEN
        CONTINUE;
      END IF;

      is_sat := (v_dow = 6);

      IF is_sat THEN
        IF random() > 0.22 THEN
          CONTINUE;
        END IF;
        sessions_today := 1 + CASE WHEN random() < 0.42 THEN 1 ELSE 0 END;
        day_base :=
          (date_trunc('day', timezone('utc', now())) - (day_offset || ' days')::interval)
          + interval '11 hours'
          + (random() * interval '6 hours');
      ELSE
        IF random() > 0.08 THEN
          CONTINUE;
        END IF;
        sessions_today :=
          2 + (
            CASE
              WHEN random() < 0.20 THEN 0
              WHEN random() < 0.48 THEN 1
              WHEN random() < 0.76 THEN 2
              ELSE 3
            END
          );
        day_base :=
          (date_trunc('day', timezone('utc', now())) - (day_offset || ' days')::interval)
          + interval '12 hours 30 minutes'
          + (random() * interval '8 hours 30 minutes');
      END IF;

      cur_start := day_base;

      FOR sess IN 1..sessions_today LOOP
        IF sess > 1 THEN
          gap_mins := 35 + floor(random() * 140)::int;
          cur_start := cur_end + make_interval(mins => gap_mins);
        END IF;

        IF is_sat THEN
          dur_mins := 22 + floor(random() * 178)::int;
        ELSE
          dur_mins := 35 + floor(random() * 405)::int;
        END IF;

        cur_end := cur_start + make_interval(mins => dur_mins);

        chosen_pid := NULL;

        IF random() < 0.78 THEN
          SELECT pr.id INTO chosen_pid
          FROM "public"."projects" pr
          WHERE pr.id <> 0
            AND (pr."assignedToId" = r_staff.uid OR pr."authorId" = r_staff.uid)
          ORDER BY random()
          LIMIT 1;
        END IF;

        IF chosen_pid IS NULL THEN
          SELECT pr.id INTO chosen_pid
          FROM "public"."projects" pr
          WHERE pr.id <> 0
          ORDER BY random()
          LIMIT 1;
        END IF;

        IF chosen_pid IS NULL THEN
          CONTINUE;
        END IF;

        note_pick :=
          (
            ARRAY[
              '[demo-seed] Site survey / walkthrough',
              '[demo-seed] Drawing review & redlines',
              '[demo-seed] AHJ coordination',
              '[demo-seed] Field verification',
              '[demo-seed] Hydraulic calc support',
              '[demo-seed] Shop drawing QA',
              '[demo-seed] Inspection prep',
              '[demo-seed] Submittal package',
              '[demo-seed] Onsite corrections',
              '[demo-seed] BIM coordination',
              '[demo-seed] Permit revision support',
              '[demo-seed] Testing & commissioning assist'
            ]
          )[1 + floor(random() * 12)::int];

        INSERT INTO "public"."timeEntries" (
          "userId",
          "projectId",
          "startedAt",
          "endedAt",
          "notes",
          "hourlyRateSnapshot",
          "updatedAt"
        )
        VALUES (
          r_staff.uid,
          chosen_pid,
          cur_start,
          cur_end,
          note_pick,
          staff_hr,
          cur_end
        );

        inserted_total := inserted_total + 1;
      END LOOP;
    END LOOP;
  END LOOP;

  IF inserted_total = 0 THEN
    RAISE WARNING 'time-entries-demo-seed: inserted 0 rows (unexpected — check projects and Staff profiles).';
  ELSE
    RAISE NOTICE 'time-entries-demo-seed: inserted % rows tagged [demo-seed] (Staff only)', inserted_total;
  END IF;
END $$;

SELECT count(*) AS "demoSeedTimeEntries"
FROM "public"."timeEntries"
WHERE notes LIKE '[demo-seed]%';
