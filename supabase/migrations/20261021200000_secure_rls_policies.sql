/*
# Migration: 20261021200000_secure_rls_policies.sql
# Description: Tighten Row Level Security (RLS) policies
# - Revoke dangerous anonymous DELETE and UPDATE privileges on flashcards
# - Revoke anonymous DELETE privileges on workers and reviews
# - Ensure induction safety deck integrity cannot be modified by anonymous clients
*/

-- 1. Secure flashcards table: Read-only for anonymous users
DROP POLICY IF EXISTS "anon_delete_flashcards" ON flashcards;
DROP POLICY IF EXISTS "anon_update_flashcards" ON flashcards;
DROP POLICY IF EXISTS "anon_insert_flashcards" ON flashcards;

-- Anonymous users can only read flashcards
CREATE POLICY "anon_select_flashcards" ON flashcards FOR SELECT
  TO anon, authenticated USING (true);

-- 2. Secure workers table: Prevent blanket anonymous deletion
DROP POLICY IF EXISTS "anon_delete_workers" ON workers;

-- 3. Secure reviews table: Prevent blanket anonymous deletion
DROP POLICY IF EXISTS "anon_delete_reviews" ON reviews;
