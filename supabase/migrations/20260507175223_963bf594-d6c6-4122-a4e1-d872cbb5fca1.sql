-- Migrate faculty_type enum: remove Commerce, add new majors
-- Step 1: rename old enum
ALTER TYPE public.faculty_type RENAME TO faculty_type_old;

-- Step 2: create new enum with cleaned, expanded list
CREATE TYPE public.faculty_type AS ENUM (
  'Engineering',
  'Business',
  'Medicine',
  'Pharmacy',
  'Computer Science',
  'Artificial Intelligence',
  'Arts',
  'Law',
  'Media',
  'Education',
  'Architecture',
  'Dentistry',
  'Nursing',
  'Science',
  'Agriculture',
  'Economics',
  'Other'
);

-- Step 3: drop default before column type change
ALTER TABLE public.profiles ALTER COLUMN faculty DROP DEFAULT;
ALTER TABLE public.product_clicks ALTER COLUMN faculty DROP DEFAULT;

-- Step 4: convert columns, mapping Commerce -> Business
ALTER TABLE public.profiles
  ALTER COLUMN faculty TYPE public.faculty_type
  USING (
    CASE faculty::text
      WHEN 'Commerce' THEN 'Business'
      ELSE faculty::text
    END
  )::public.faculty_type;

ALTER TABLE public.product_clicks
  ALTER COLUMN faculty TYPE public.faculty_type
  USING (
    CASE faculty::text
      WHEN 'Commerce' THEN 'Business'
      ELSE faculty::text
    END
  )::public.faculty_type;

-- Step 5: restore defaults
ALTER TABLE public.profiles ALTER COLUMN faculty SET DEFAULT 'Other'::public.faculty_type;

-- Step 6: drop old enum
DROP TYPE public.faculty_type_old;