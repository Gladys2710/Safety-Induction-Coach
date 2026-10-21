/*
# Flashcard Coach for Construction Safety Induction — schema + seed deck

1. Overview
A single-tenant (no sign-in) induction kiosk app. Workers identify themselves by
name on first use; the app generates a local worker record and stores their study
progress in the database. Content (the flashcard deck) is shared across everyone.

2. New Tables
- `workers`
  - `id` (uuid, primary key) — identifies a worker across sessions/devices
  - `name` (text, not null) — display name the worker types in
  - `created_at` (timestamptz)
  - `last_active_at` (timestamptz) — updated on each session
- `flashcards`
  - `id` (uuid, primary key)
  - `category` (text, not null) — e.g. "PPE", "Fall Protection"
  - `front` (text, not null) — the question prompt
  - `back` (text, not null) — the answer / explanation
  - `difficulty` (smallint, default 1) — 1 easy .. 3 hard
  - `created_at` (timestamptz)
- `reviews`
  - `id` (uuid, primary key)
  - `worker_id` (uuid, references workers, on delete cascade)
  - `card_id` (uuid, references flashcards, on delete cascade)
  - `correct` (boolean, not null) — whether the worker got it right
  - `mode` (text, not null) — 'study' or 'quiz'
  - `reviewed_at` (timestamptz, default now())

3. Indexes
- `reviews` by worker (`worker_id`)
- `reviews` by worker + card (`worker_id`, `card_id`)
- `flashcards` by category

4. Security
- RLS enabled on all tables.
- This is a shared, single-tenant induction kiosk (no auth): the anon-key client
  must read/write all data. Policies use `TO anon, authenticated` with `USING (true)`
  because the data is intentionally public/shared — this is documented here and is
  not an ownership shortcut.

5. Seed data
- Inserts a starter deck of construction safety induction flashcards across ten
  categories (PPE, Fall Protection, Electrical Safety, Excavation, Scaffolding,
  Hazard Communication, Emergency Response, Hand & Power Tools, Manual Handling,
  Fire Safety). Uses ON CONFLICT DO NOTHING so re-running is safe.
*/

CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  difficulty smallint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  correct boolean NOT NULL,
  mode text NOT NULL CHECK (mode IN ('study','quiz')),
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_worker ON reviews(worker_id);
CREATE INDEX IF NOT EXISTS idx_reviews_worker_card ON reviews(worker_id, card_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_category ON flashcards(category);

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_workers" ON workers;
CREATE POLICY "anon_select_workers" ON workers FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_workers" ON workers;
CREATE POLICY "anon_insert_workers" ON workers FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_workers" ON workers;
CREATE POLICY "anon_update_workers" ON workers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_workers" ON workers;
CREATE POLICY "anon_delete_workers" ON workers FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_flashcards" ON flashcards;
CREATE POLICY "anon_select_flashcards" ON flashcards FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_flashcards" ON flashcards;
CREATE POLICY "anon_insert_flashcards" ON flashcards FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_flashcards" ON flashcards;
CREATE POLICY "anon_update_flashcards" ON flashcards FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_flashcards" ON flashcards;
CREATE POLICY "anon_delete_flashcards" ON flashcards FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_reviews" ON reviews;
CREATE POLICY "anon_select_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_reviews" ON reviews;
CREATE POLICY "anon_insert_reviews" ON reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_reviews" ON reviews;
CREATE POLICY "anon_delete_reviews" ON reviews FOR DELETE
  TO anon, authenticated USING (true);

-- Seed deck (ON CONFLICT DO NOTHING; front is unique-ish by content, but no unique
-- constraint exists, so we guard with a NOT EXISTS check per insert to avoid dupes
-- on re-run). Simplest safe approach: only seed when the table is empty.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM flashcards LIMIT 1) THEN
    INSERT INTO flashcards (category, front, back, difficulty) VALUES
    -- PPE
    ('Personal Protective Equipment', 'What four items make up the basic PPE set required on most construction sites?', 'Hard hat, safety glasses, high-visibility vest, and steel-toed safety boots.', 1),
    ('Personal Protective Equipment', 'When must a hard hat be replaced?', 'After any impact, when the suspension or shell is cracked, or every 5 years even without damage.', 2),
    ('Personal Protective Equipment', 'What class of hard hat provides electrical insulation up to 20,000V?', 'Class E (electrical) — rated for 20,000V; Class G for 2,200V; Class C is conductive (no electrical protection).', 2),
    ('Personal Protective Equipment', 'What gloves should you use when handling sharp metal or sheeting?', 'Cut-resistant gloves rated A4 or higher (e.g. Kevlar/HPPE), not standard cotton or leather alone.', 1),
    ('Personal Protective Equipment', 'Why must safety boots have steel or composite toes AND midsoles?', 'Toe caps protect against crush injuries; puncture-resistant midsoles protect against nails and sharp objects stepping through the sole.', 1),

    -- Fall Protection
    ('Fall Protection', 'At what height does OSHA require fall protection on construction sites?', '6 feet (1.8 m) in the general construction industry. Always tie off above this height.', 1),
    ('Fall Protection', 'What is the maximum free-fall distance allowed for a personal fall arrest system?', '6 feet (1.8 m). The system must arrest the fall before that limit and limit deceleration to 3.5 feet.', 2),
    ('Fall Protection', 'What is the minimum breaking strength of a personal fall arrest anchor point?', '5,000 lb (22.2 kN) per worker attached, or designed by a qualified person to a 2:1 safety factor.', 2),
    ('Fall Protection', 'What three components make up a personal fall arrest system?', 'Anchor point, body harness, and connecting device (lanyard or self-retracting lifeline).', 1),
    ('Fall Protection', 'What must you inspect on a harness before each use?', 'Webbing for cuts/abrasions, stitching integrity, D-ring condition, buckle function, and labels. Remove from service if damaged.', 2),

    -- Electrical Safety
    ('Electrical Safety', 'What does LOTO stand for and when is it used?', 'Lockout/Tagout — used to isolate energy sources before servicing equipment so it cannot be accidentally energized.', 1),
    ('Electrical Safety', 'What is the minimum safe approach distance for an unqualified worker near 50kV power lines?', '10 feet (3 m). It increases with voltage — always treat overhead lines as live until verified de-energized.', 2),
    ('Electrical Safety', 'What tool should be used to check a circuit is de-energized before working?', 'A properly rated voltage tester or multimeter, verified on a known live source before and after testing.', 2),
    ('Electrical Safety', 'What type of extension cord is required on a construction site?', 'Three-wire grounded cords rated for hard or extra-hard service (e.g. S, SO, ST, SJT), inspected for damage before use.', 1),

    -- Excavation & Trenching
    ('Excavation & Trenching', 'At what depth does OSHA require a protective system in an excavation?', '5 feet (1.5 m). Below this depth, shoring, shielding, or sloping is mandatory unless in stable rock.', 1),
    ('Excavation & Trenching', 'What must be kept at least 2 feet (0.6 m) from the edge of a trench?', 'Spoil piles, equipment, and stored materials — to prevent them falling into the trench and striking workers.', 1),
    ('Excavation & Trenching', 'What is the most common cause of trench fatalities?', 'Cave-ins / soil collapse. A competent person must inspect daily and after any hazard-increasing event.', 2),
    ('Excavation & Trenching', 'How must a trench 4 feet or deeper be accessed?', ' By means of a stairway, ladder, ramp, or other safe means of egress, located within 25 feet of every worker.', 2),

    -- Scaffolding
    ('Scaffolding', 'Who is permitted to erect, move, dismantle, or inspect scaffolds?', 'Only a qualified, trained Competent Person. Untrained workers must not modify scaffolding.', 1),
    ('Scaffolding', 'What is the maximum height-to-base ratio for an unsupported scaffold?', '4:1. Beyond this, the scaffold must be restrained against tipping by guys, ties, or bracing.', 2),
    ('Scaffolding', 'What fall protection is required on scaffolds above 10 feet?', 'Guardrails (top rail 38–45 in, midrail, and toe board) or a personal fall arrest system.', 1),

    -- Hazard Communication
    ('Hazard Communication', 'What does SDS stand for and where must it be kept?', 'Safety Data Sheet — must be readily accessible to all workers on site at all times.', 1),
    ('Hazard Communication', 'What are the two main signal words on GHS chemical labels?', '"Danger" (severe hazard) and "Warning" (less severe hazard).', 1),
    ('Hazard Communication', 'What four routes can chemicals enter your body?', 'Inhalation, absorption (skin/eyes), ingestion, and injection (puncture).', 2),

    -- Emergency Response
    ('Emergency Response', 'What is the primary number to call for site emergencies in North America?', '911. Know your site-specific emergency number if one is posted, and the site address for responders.', 1),
    ('Emergency Response', 'Where must the assembly point and evacuation route be posted?', 'At every main entrance and in high-traffic areas, with maps and a designated muster point known to all workers.', 1),
    ('Emergency Response', 'What is the correct action if you discover a hazard you cannot immediately control?', 'Stop work, isolate the area, warn others, and report it to your supervisor immediately.', 1),

    -- Hand & Power Tools
    ('Hand & Power Tools', 'What must be checked before using a power tool?', 'Guards in place, cord/plug intact, correct for the job, grounded or double-insulated, and inspected for damage.', 1),
    ('Hand & Power Tools', 'When is a circular saw guard allowed to be removed?', 'Never. The lower guard must retract automatically and return fully when the tool is lifted from the cut.', 2),
    ('Hand & Power Tools', 'Which PPE is required when using a grinder or abrasive saw?', 'Face shield over safety glasses, hearing protection, cut-resistant gloves, and no loose clothing.', 1),

    -- Manual Handling
    ('Manual Handling', 'What is the safe lifting technique for a heavy load?', 'Feet shoulder-width apart, bend knees not back, keep the load close, lift with legs, and do not twist.', 1),
    ('Manual Handling', 'At what point should you ask for help or mechanical aid when lifting?', 'Any load over ~50 lb (23 kg), or any awkward/bulky load that obscures vision or strains posture.', 2),

    -- Fire Safety
    ('Fire Safety', 'What does the PASS acronym mean for using a fire extinguisher?', 'Pull the pin, Aim at the base of the fire, Squeeze the handle, Sweep side to side.', 1),
    ('Fire Safety', 'Which fire extinguisher class is for flammable liquids (petrol, solvents)?', 'Class B. Never use water on a Class B fire — it can spread the burning liquid.', 1),
    ('Fire Safety', 'What is the first action on discovering a fire you cannot control in seconds?', 'Raise the alarm and evacuate. Do not attempt to fight a fire larger than wastebasket-sized.', 1);
  END IF;
END $$;
