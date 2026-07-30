-- ============================================================================
-- ONE-TIME cleanup: renumber all GA1 reports into a tidy sequence.
-- Run this once in the Supabase SQL editor to undo the old "ballooned" numbers.
-- Reports are renumbered GA1-1001, GA1-1002, … in the order they were created.
--
-- NOTE: this changes the reference number on existing GA1 records. Only run it
-- if those numbers are test data (or you're happy to renumber). New GA1s
-- created afterwards continue cleanly from the highest number here.
-- ============================================================================

-- Step 1: park every report on a temporary, guaranteed-unique value so the
-- unique constraint can't clash while we reassign.
update ga1_inspections set report_number = 'TMP-' || id::text;

-- Step 2: assign clean sequential numbers, oldest first.
with ordered as (
  select id, row_number() over (order by created_at, id) as rn
  from ga1_inspections
)
update ga1_inspections g
set report_number = 'GA1-' || (1000 + o.rn)
from ordered o
where g.id = o.id;

-- Check the result:
select report_number, created_at from ga1_inspections order by report_number;
