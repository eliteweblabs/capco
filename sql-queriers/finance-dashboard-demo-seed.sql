-- =============================================================================
-- Full DEV suite: demo auth users + profiles + projects + invoices + payments
-- =============================================================================
-- Scale: 25 accounts — 1 Admin, 1 superAdmin, 5 Staff, 18 Clients — plus ~40
-- projects, many invoices, and mixed payment states (unpaid / partial / paid).
-- Demo invoices use invoiceDate spread across ~11 months (and matching createdAt)
-- so /admin/finance “Monthly revenue” charts are multi-month without re-running.
-- Monthly revenue is gated by site config: set features.invoicing to true when invoicing ships.
-- All profiles include "hourlyRate" between $35 and $55 for payroll / costing UI.
--
-- Column naming (verified against live Supabase / information_schema):
--   • public.*  → camelCase (quote identifiers: "projectId", "createdAt", …).
--   • auth.*    → GoTrue schema is snake_case. Do not INSERT generated columns:
--     auth.users.confirmed_at, auth.identities.email (use identity_data.email).
--
-- IMPORTANT — Each DO $$ … $$ block is its own transaction. If a block errors,
-- only that block rolls back. With a normal “run whole script” execution, Part 1
-- finishes and COMMITs before Part 2 starts — so one file / one run is enough.
--
-- How to run (SQL Editor):
--   • Recommended: select ALL (⌘A / Ctrl+A) and run once. Both parts execute in
--     order; you do not need to copy half the file.
--   • Only if your client runs a single statement at a time: run the first
--     DO $$ … $$ block, then the second.
--   • Afterward you can spot-check Authentication → Users for demo-seed-* rows.
--
-- Login — all accounts: password DemoSeed123!
--   demo-seed-admin@demo-seed.local           → Admin
--   demo-seed-superadmin@demo-seed.local      → superAdmin
--   demo-seed-staff-sam@demo-seed.local (etc.) → Staff (5)
--   demo-seed-client-08@ … client-25@         → Clients (18)
--
-- Non-demo orphans: backfill-profiles-from-auth-users.sql
--
-- Teardown: users/emails match demo-seed-*@demo-seed.local; projects/invoices
-- tagged [DEMO SEED]. Part 2 loops every Client profile with that email pattern
-- so projects/invoices/payments always match whatever Part 1 inserted.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1 — Auth + profiles (first DO block when running the full file)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_instance uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  pwd text := 'DemoSeed123!';
BEGIN
  SELECT i.id INTO v_instance FROM auth.instances i LIMIT 1;
  IF v_instance IS NULL THEN
    v_instance := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- Tear down prior seed (FK-safe order)
  DELETE FROM public.payments
  WHERE "invoiceId" IN (
      SELECT inv.id FROM public.invoices inv WHERE inv.subject LIKE '[DEMO SEED]%'
    );

  DELETE FROM public.invoices WHERE subject LIKE '[DEMO SEED]%';

  DELETE FROM public.files
  WHERE "projectId" IN (SELECT pr.id FROM public.projects pr WHERE pr.title LIKE '[DEMO SEED]%');

  DELETE FROM public.projects WHERE title LIKE '[DEMO SEED]%';

  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'demo-seed-%@demo-seed.local');
  DELETE FROM auth.users WHERE email LIKE 'demo-seed-%@demo-seed.local';

  CREATE TEMP TABLE _finance_demo_seed (
    n int PRIMARY KEY,
    slug text NOT NULL,
    app_role text NOT NULL,
    fn text NOT NULL,
    ln text NOT NULL,
    co text NOT NULL,
    hourly numeric(12, 2) NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO _finance_demo_seed (n, slug, app_role, fn, ln, co, hourly)
  VALUES
    (1, 'admin', 'Admin', 'Dana', 'Operations', 'Demo Admin Collective', 54.50),
    (2, 'superadmin', 'superAdmin', 'Morgan', 'Reeves', 'Demo Executive HQ', 55.00),
    (3, 'staff-sam', 'Staff', 'Sam', 'Chen', 'Demo Field Services', 48.00),
    (4, 'staff-jordan', 'Staff', 'Jordan', 'Malik', 'Demo Field Services', 42.00),
    (5, 'staff-riley', 'Staff', 'Riley', 'Okafor', 'Demo Field Services', 51.25),
    (6, 'staff-casey', 'Staff', 'Casey', 'Nguyen', 'Demo Field Services', 39.00),
    (7, 'staff-taylor', 'Staff', 'Taylor', 'Brooks', 'Demo Field Services', 46.75),
    (8, 'client-08', 'Client', 'Alex', 'Rivera', 'Rivera Properties Demo', 35.00),
    (9, 'client-09', 'Client', 'Blake', 'Nguyen', 'Nguyen Retail Demo', 37.25),
    (10, 'client-10', 'Client', 'Carmen', 'Díaz', 'Díaz Hospitality Demo', 41.00),
    (11, 'client-11', 'Client', 'Diego', 'Patel', 'Patel Logistics Demo', 44.50),
    (12, 'client-12', 'Client', 'Elena', 'Kowalski', 'Kowalski Industrial Demo', 38.00),
    (13, 'client-13', 'Client', 'Frank', 'Okonkwo', 'Okonkwo Medical Demo', 52.00),
    (14, 'client-14', 'Client', 'Gina', 'Sato', 'Sato Data Centers Demo', 47.25),
    (15, 'client-15', 'Client', 'Hassan', 'Bishop', 'Bishop Education Demo', 40.00),
    (16, 'client-16', 'Client', 'Iris', 'Lombardi', 'Lombardi Development Demo', 49.50),
    (17, 'client-17', 'Client', 'Jamal', 'Vance', 'Vance Mixed-Use Demo', 43.00),
    (18, 'client-18', 'Client', 'Kim', 'Andersson', 'Andersson Cold Storage Demo', 36.00),
    (19, 'client-19', 'Client', 'Leah', 'Washington', 'Washington Civic Demo', 45.75),
    (20, 'client-20', 'Client', 'Marco', 'Hughes', 'Hughes Labs Demo', 50.00),
    (21, 'client-21', 'Client', 'Nina', 'Petrov', 'Petrov Residential Demo', 39.50),
    (22, 'client-22', 'Client', 'Owen', 'Foster', 'Foster Auto Row Demo', 48.25),
    (23, 'client-23', 'Client', 'Priya', 'Ahmed', 'Ahmed Worship Demo', 42.75),
    (24, 'client-24', 'Client', 'Quinn', 'Murphy', 'Murphy Athletics Demo', 53.50),
    (25, 'client-25', 'Client', 'Rosa', 'Kim', 'Kim Senior Living Demo', 46.00);

  -- 25 deterministic UUIDs: a0000000-0000-4000-8000-000000000001 … 000025
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  SELECT
    v_instance,
    ('a0000000-0000-4000-8000-' || lpad(s.n::text, 12, '0'))::uuid,
    'authenticated',
    'authenticated',
    'demo-seed-' || s.slug || '@demo-seed.local',
    crypt(pwd, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'firstName',
      s.fn,
      'lastName',
      s.ln,
      'companyName',
      s.co
    ),
    now(),
    now()
  FROM _finance_demo_seed AS s;

  INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT
    ('a0000000-0000-4000-8000-' || lpad(s.n::text, 12, '0'))::uuid::text,
    ('a0000000-0000-4000-8000-' || lpad(s.n::text, 12, '0'))::uuid,
    jsonb_build_object(
      'sub',
      ('a0000000-0000-4000-8000-' || lpad(s.n::text, 12, '0'))::uuid::text,
      'email',
      'demo-seed-' || s.slug || '@demo-seed.local'
    ),
    'email',
    now(),
    now(),
    now()
  FROM _finance_demo_seed AS s;

  INSERT INTO public.profiles (
    id,
    email,
    role,
    "firstName",
    "lastName",
    "companyName",
    "hourlyRate",
    "jobTitle",
    "createdAt",
    "updatedAt"
  )
  SELECT
    ('a0000000-0000-4000-8000-' || lpad(s.n::text, 12, '0'))::uuid,
    'demo-seed-' || s.slug || '@demo-seed.local',
    s.app_role,
    s.fn,
    s.ln,
    s.co,
    s.hourly,
    CASE s.app_role
      WHEN 'Admin' THEN 'Operations Manager'
      WHEN 'superAdmin' THEN 'Principal'
      WHEN 'Staff' THEN
        (ARRAY['Lead Technician', 'Estimator', 'Inspector', 'CAD Specialist', 'Field Supervisor'])[
          1 + ((s.n - 1) % 5)
        ]
      ELSE 'Account Owner'
    END,
    now(),
    now()
  FROM _finance_demo_seed AS s
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    "companyName" = EXCLUDED."companyName",
    "hourlyRate" = EXCLUDED."hourlyRate",
    "jobTitle" = EXCLUDED."jobTitle",
    "updatedAt" = EXCLUDED."updatedAt";

  RAISE NOTICE 'PART 1 done: 25 demo users (Admin, superAdmin, 5 Staff, 18 Clients). Password: %', pwd;
END $$;

-- -----------------------------------------------------------------------------
-- PART 2 — Projects / invoices / payments (second DO block; needs Part 1 users)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  id_admin uuid := ('a0000000-0000-4000-8000-' || lpad(1::text, 12, '0'))::uuid;
  v_client uuid;
  v_company text;
  v_person text;
  num_proj int;
  proj_i int;
  num_inv int;
  inv_k int;
  v_proj_id int;
  v_inv_id bigint;
  v_subtotal numeric(12, 2);
  v_total numeric(12, 2);
  pay_roll int;
  v_pay1 numeric(12, 2);
  inv_age_days int;
  v_inv_date date;
  v_site text;
  v_title text;
  proj_names text[] := ARRAY[
    'Fire alarm redesign',
    'Sprinkler hydraulics review',
    'Kitchen suppression',
    'High-rise standpipe',
    'Warehouse ESFR study',
    'Retail TI life safety',
    'Data hall clean-agent',
    'Hospital smoke control',
    'School egress package',
    'Cold storage ammonia alarm',
    'Parking garage foam',
    'Tenant improvement permit set',
    'Generator room CO detection',
    'Atrium smoke exhaust',
    'Battery storage thermal',
    'Hotel kitchen hood interlock',
    'Manufacturing dust collection',
    'Historic assembly upgrade'
  ];
  name_i int;
  st int;
  sq int;
  v_created timestamp with time zone;
  v_assigned uuid;
  v_description text;
  v_subject text;
  v_building jsonb;
  v_project_types jsonb;
  v_service jsonb;
  v_requested jsonb;
  v_tier jsonb;
  v_fire_service jsonb;
  v_contract jsonb;
  v_log jsonb;
  v_architect text;
  u int;
  disc int;
  pcomp smallint;
  ptotal smallint;
  seed_client_count int;
  r RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = id_admin) THEN
    RAISE EXCEPTION 'Seed Part 2: demo admin user missing. Run this file from the top (Part 1 DO block) first, or run the full finance-dashboard-demo-seed.sql script.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.email LIKE 'demo-seed-%@demo-seed.local'
      AND p.role = 'Client'
  ) THEN
    RAISE EXCEPTION 'Seed Part 2: no demo Client profiles (demo-seed-*@demo-seed.local). Run Part 1 first.';
  END IF;

  SELECT COUNT(*)::int
  INTO seed_client_count
  FROM public.profiles p
  WHERE p.email LIKE 'demo-seed-%@demo-seed.local'
    AND p.role = 'Client';

  DELETE FROM public.payments
  WHERE "invoiceId" IN (SELECT i.id FROM public.invoices i WHERE i.subject LIKE '[DEMO SEED]%');

  DELETE FROM public.invoices WHERE subject LIKE '[DEMO SEED]%';

  DELETE FROM public.files
  WHERE "projectId" IN (SELECT p.id FROM public.projects p WHERE p.title LIKE '[DEMO SEED]%');

  DELETE FROM public.projects WHERE title LIKE '[DEMO SEED]%';

  FOR r IN
    SELECT
      p.id AS pid,
      p."companyName" AS co,
      p."firstName" AS fn,
      p."lastName" AS ln,
      p.email AS em,
      row_number() OVER (ORDER BY p.email)::int AS rn
    FROM public.profiles p
    WHERE p.email LIKE 'demo-seed-%@demo-seed.local'
      AND p.role = 'Client'
  LOOP
    v_client := r.pid;
    v_company := COALESCE(NULLIF(trim(r.co), ''), r.em);
    v_person := NULLIF(trim(both FROM concat_ws(' ', NULLIF(trim(r.fn), ''), NULLIF(trim(r.ln), ''))), '');
    IF v_person IS NULL THEN
      v_person := 'Primary contact (seed)';
    END IF;

    num_proj := 1 + ((r.rn * 5) % 3);

    FOR proj_i IN 1..num_proj LOOP
      name_i := 1 + ((r.rn * 7 + proj_i * 11) % array_length(proj_names, 1));
      v_title := '[DEMO SEED] ' || proj_names[name_i] || format(' — %s · P%s', v_company, proj_i);
      v_site :=
        format(
          '%s Industrial Way Unit %s, Test City TC %s',
          (200 + r.rn * 13 + proj_i)::text,
          (10 + proj_i)::text,
          lpad((r.rn * 10 + proj_i)::text, 5, '0')
        );
      st := (ARRAY[18, 20, 22, 25, 28, 30, 32, 35])[1 + ((r.rn + proj_i) % 8)];
      sq := 4000 + (r.rn * 991 + proj_i * 1777) % 62000;
      v_created := now() - ((r.rn * 2 + proj_i * 4)::text || ' days')::interval;
      -- Fake field tech / coordinator — always a seeded Staff profile (n = 3..7)
      v_assigned := (
        'a0000000-0000-4000-8000-' || lpad((3 + ((r.rn * 2 + proj_i * 3) % 5))::text, 12, '0')
      )::uuid;

      v_subject := format(
        'Demo proposal — %s · %s · %s',
        proj_names[name_i],
        v_company,
        split_part(v_site, ',', 1)
      );

      v_description := format(
        '%s [%s]. Account: %s · %s (%s). '
        'Lorem ipsum demo narrative: shop drawings, hydrant flow, inspector walkthrough. '
        'AHJ: Test City FD. GC contact (fake): (555) 010-%s. '
        'Job box code %s-%s. Not real — seed data only.',
        proj_names[name_i],
        v_site,
        v_company,
        v_person,
        r.em,
        lpad((9000 + r.rn * 11 + proj_i)::text, 4, '0'),
        r.rn,
        proj_i
      );

      v_architect := (ARRAY[
        'Fakename Architects LLC',
        'Demo Design Collective',
        'Blueprint Partners (seed)',
        'Structure & Form Studio',
        'Metro Drafting Co.'
      ])[1 + ((r.rn + proj_i * 2) % 5)];

      v_building := (
        ARRAY[
          '["Business","Mercantile"]'::jsonb,
          '["Assembly","Storage"]'::jsonb,
          '["Industrial","Factory"]'::jsonb,
          '["Residential","Mixed use"]'::jsonb,
          '["Educational","Institutional"]'::jsonb,
          '["High hazard","Mercantile"]'::jsonb
        ]
      )[1 + ((name_i + r.rn) % 6)];

      v_fire_service := (
        ARRAY[
          '["Wet sprinkler","Fire alarm"]'::jsonb,
          '["Dry sprinkler","Standpipe"]'::jsonb,
          '["Preaction","VESDA"]'::jsonb,
          '["Clean agent","Emergency comms"]'::jsonb,
          '["Kitchen hood","Foam"]'::jsonb
        ]
      )[1 + ((proj_i + r.rn) % 5)];

      v_project_types := (
        ARRAY[
          '["Sprinkler","Plan review"]'::jsonb,
          '["Alarm","Testing"]'::jsonb,
          '["Special hazards","Hydraulic calc"]'::jsonb,
          '["Commissioning","Inspection"]'::jsonb
        ]
      )[1 + ((name_i + proj_i) % 4)];

      v_service := (
        ARRAY[
          '["Pump & tank","Flow test"]'::jsonb,
          '["Backflow","Exit signs"]'::jsonb,
          '["Smoke control","Damper inspection"]'::jsonb,
          '["Kitchen hood interlock","Fire watch"]'::jsonb
        ]
      )[1 + ((r.rn + name_i) % 4)];

      v_requested := (
        ARRAY[
          '["Sprinkler shop","Alarm as-builts"]'::jsonb,
          '["NFPA 241","Hydrant photos"]'::jsonb,
          '["UL listings","C of O checklist"]'::jsonb,
          '["Insurance cert","Preaction matrix"]'::jsonb
        ]
      )[1 + ((proj_i * 5 + r.rn) % 4)];

      v_tier := (
        ARRAY[
          '["Standard","Expedited"]'::jsonb,
          '["Basic"]'::jsonb,
          '["Premium","After hours"]'::jsonb,
          '["Standard"]'::jsonb
        ]
      )[1 + ((r.rn + proj_i) % 4)];

      v_contract := jsonb_build_object(
        'seedTag',
        '[DEMO SEED]',
        'fakePo',
        format('PO-TC-%s-%s', left(replace(v_client::text, '-', ''), 8), proj_i),
        'fakeVendor',
        'Demo Vendor Supply Inc.',
        'notReal',
        true,
        'clientProfileId',
        v_client,
        'clientCompany',
        v_company,
        'clientEmail',
        r.em,
        'clientContact',
        v_person
      );

      v_log := jsonb_build_array(
        jsonb_build_object(
          'at',
          to_char(v_created, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'kind',
          'seed',
          'message',
          format('Project created for %s (%s).', v_company, r.em)
        ),
        jsonb_build_object(
          'at',
          to_char(v_created + interval '6 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'kind',
          'seed',
          'message',
          format('Assigned to staff uuid suffix %s.', 3 + ((r.rn * 2 + proj_i * 3) % 5))
        )
      );

      u := 1 + ((r.rn + proj_i * 2) % 12);
      disc := (r.rn + proj_i * 2) % 6;
      ptotal := (1 + ((r.rn * 3 + proj_i) % 8))::smallint;
      pcomp := (LEAST(((r.rn + proj_i) % (ptotal + 1))::int, ptotal))::smallint;

      INSERT INTO public.projects (
        "authorId",
        description,
        address,
        "createdAt",
        "sqFt",
        "newConstruction",
        status,
        title,
        building,
        project,
        service,
        "requestedDocs",
        "assignedToId",
        "updatedAt",
        units,
        architect,
        featured,
        log,
        subject,
        "featuredImageId",
        "featuredImageData",
        "incompleteDiscussions",
        tier,
        "elapsedTime",
        "dueDate",
        "punchlistCount",
        "nfpaVersion",
        "exteriorBeacon",
        "siteAccess",
        "fireSprinklerInstallation",
        "fireServiceType",
        "hazardousMaterial",
        "commencementOfConstruction",
        "suppressionDetectionSystems",
        "buildingHeight",
        "floorsBelowGrade",
        "hpsCommodities",
        "contractData",
        "contractPdfUrl",
        "punchlistComplete"
      )
      VALUES (
        v_client,
        v_description,
        v_site,
        v_created,
        sq,
        ((r.rn + proj_i) % 5 = 0),
        st,
        v_title,
        v_building,
        v_project_types,
        v_service,
        v_requested,
        v_assigned,
        v_created + interval '90 minutes',
        u,
        v_architect,
        ((r.rn + proj_i) % 7 = 0),
        v_log,
        v_subject,
        NULL,
        jsonb_build_object(
          'seed',
          true,
          'placeholderKey',
          format('demo-seed-featured-%s-%s', r.rn, proj_i),
          'caption',
          format('Placeholder art — %s', proj_names[name_i]),
          'url',
          'https://demo-seed.invalid/images/placeholder.svg'
        ),
        disc,
        v_tier,
        (2 + ((r.rn + proj_i) % 6)) * interval '1 hour' + (15 * (proj_i % 4)) * interval '1 minute',
        v_created + interval '48 days',
        ptotal,
        (ARRAY['NFPA 13 (2019)', 'NFPA 72 (2022)', 'NFPA 20', 'NFPA 14', 'NFPA 25'])[
          1 + ((name_i + r.rn) % 5)
        ],
        format('North lot · demo beacon ref NB-%s', r.rn + proj_i * 10),
        format(
          'Gate code (fake) #%s · Contact demo super %s · Loading dock B',
          1000 + r.rn * 3 + proj_i,
          200 + r.rn
        ),
        (ARRAY[
          'Wet pipe throughout; demo seed.',
          'Partial dry — dock unheated (fake).',
          'Existing system — TI only (seed).'
        ])[1 + ((r.rn + proj_i) % 3)],
        v_fire_service,
        (ARRAY[
          'None declared — seed row.',
          'Limited aerosols in stockroom (fake).',
          'Battery storage — Class K kitchen (seed).'
        ])[1 + ((r.rn) % 3)],
        format('%s (fake start)', to_char(v_created + interval '120 days', 'Mon YYYY')),
        (ARRAY[
          'Wet + alarm; demo narrative only.',
          'Preaction in data zone; rest wet.',
          'Double-interlock + VESDA (seed).'
        ])[1 + ((proj_i + name_i) % 3)],
        format('%s ft (fake)', 18 + (r.rn % 22) + proj_i * 3),
        to_char((r.rn + proj_i) % 4, 'FM9'),
        (ARRAY[
          'General storage; Class I-IV (seed).',
          'Group A occupancy — assembly demo.',
          'Mercantile retail; no high-pile (fake).'
        ])[1 + ((r.rn * proj_i) % 3)],
        v_contract,
        format(
          'https://demo-seed.invalid/contracts/%s-project-%s.pdf',
          left(replace(v_client::text, '-', ''), 12),
          proj_i
        ),
        pcomp
      )
      RETURNING id INTO v_proj_id;

      num_inv := 1 + ((r.rn * 3 + proj_i * 2) % 3);

      FOR inv_k IN 1..num_inv LOOP
        v_subtotal := round((850 + (r.rn * 127 + proj_i * 293 + inv_k * 401) % 12400)::numeric + 0.37, 2);
        v_total := v_subtotal;
        pay_roll := (r.rn * 7 + proj_i * 5 + inv_k * 13) % 10;
        inv_age_days := 1 + ((r.rn * 47 + proj_i * 61 + inv_k * 73 + inv_k * r.rn * 3) % 335);
        v_inv_date := (CURRENT_TIMESTAMP AT TIME ZONE 'utc')::date - inv_age_days;

        INSERT INTO public.invoices (
          "projectId",
          "createdBy",
          subject,
          status,
          "invoiceDate",
          "dueDate",
          "createdAt",
          "updatedAt",
          subtotal,
          "taxRate",
          "taxAmount",
          "discountAmount",
          "totalAmount",
          "paidAmount",
          "outstandingBalance",
          "paymentTerms",
          notes
        )
        VALUES (
          v_proj_id,
          id_admin,
          format('[DEMO SEED] %s · P%s #%s — %s', v_company, proj_i, inv_k, proj_names[name_i]),
          'sent',
          v_inv_date,
          v_inv_date + (7 + ((proj_i + inv_k) % 30)),
          now() - (inv_age_days || ' days')::interval,
          now() - (inv_age_days || ' days')::interval,
          v_subtotal,
          0,
          0,
          0,
          v_total,
          0,
          v_total,
          CASE WHEN inv_k % 2 = 0 THEN 'Net 30' ELSE 'Net 15' END,
          format(
            'Bill to: %s (%s). Demo seed — pay class %s (none / partial / full).',
            v_company,
            r.em,
            pay_roll::text
          )
        )
        RETURNING id INTO v_inv_id;

        IF pay_roll IN (3, 4, 5) THEN
          v_pay1 := round(v_total * 0.42, 2);
          INSERT INTO public.payments (
            "invoiceId",
            amount,
            "paymentMethod",
            "paymentReference",
            "paymentDate",
            notes,
            "createdBy"
          )
          VALUES (
            v_inv_id,
            v_pay1,
            'Stripe',
            format(
              'ch_%s_p%si%s_p1',
              left(replace(v_client::text, '-', ''), 11),
              proj_i::text,
              inv_k::text
            ),
            v_inv_date + (1 + (inv_k % 18)),
            'Partial demo payment',
            v_client
          );
        ELSIF pay_roll IN (6, 7) THEN
          INSERT INTO public.payments (
            "invoiceId",
            amount,
            "paymentMethod",
            "paymentReference",
            "paymentDate",
            notes,
            "createdBy"
          )
          VALUES (
            v_inv_id,
            v_total,
            'Stripe',
            format(
              'ch_%s_p%si%s_full',
              left(replace(v_client::text, '-', ''), 11),
              proj_i::text,
              inv_k::text
            ),
            v_inv_date + (2 + (inv_k % 20)),
            'Paid in full — demo seed',
            v_client
          );
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  UPDATE public.invoices AS i
  SET
    "paidAmount" = COALESCE(s.paid, 0),
    "outstandingBalance" = GREATEST(i."totalAmount" - COALESCE(s.paid, 0), 0),
    status = CASE
      WHEN i."totalAmount" <= COALESCE(s.paid, 0) + 0.001 THEN 'paid'
      ELSE i.status
    END,
    "paidAt" = CASE
      WHEN i."totalAmount" <= COALESCE(s.paid, 0) + 0.001 THEN now() - ((i.id % 30)::text || ' days')::interval
      ELSE NULL
    END
  FROM (
    SELECT p."invoiceId" AS id, SUM(p.amount) AS paid
    FROM public.payments p
    GROUP BY p."invoiceId"
  ) AS s
  WHERE i.id = s.id AND i.subject LIKE '[DEMO SEED]%';

  UPDATE public.invoices
  SET
    status = 'sent',
    "paidAt" = NULL
  WHERE subject LIKE '[DEMO SEED]%'
    AND "paidAmount" > 0
    AND "outstandingBalance" > 0.001;

  RAISE NOTICE 'PART 2 done: demo projects + invoices + payments for % demo client profile(s).', seed_client_count;
END $$;

-- Verification (run after the script — or after Part 2 if you ran blocks separately)
SELECT 'auth.users' AS src, count(*)::text AS n FROM auth.users WHERE email LIKE 'demo-seed-%@demo-seed.local'
UNION ALL
SELECT 'profiles', count(*)::text FROM public.profiles WHERE email LIKE 'demo-seed-%@demo-seed.local'
UNION ALL
SELECT 'projects [DEMO SEED]', count(*)::text FROM public.projects WHERE title LIKE '[DEMO SEED]%'
UNION ALL
SELECT 'invoices [DEMO SEED]', count(*)::text FROM public.invoices WHERE subject LIKE '[DEMO SEED]%'
UNION ALL
SELECT 'payments (seed inv)', count(*)::text
FROM public.payments p
JOIN public.invoices i ON i.id = p."invoiceId"
WHERE i.subject LIKE '[DEMO SEED]%';

SELECT id::text, email, role, "hourlyRate", "jobTitle"
FROM public.profiles
WHERE email LIKE 'demo-seed-%@demo-seed.local'
ORDER BY email;
