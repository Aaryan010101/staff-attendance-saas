-- ============================================================
-- Staff Attendance & Salary Calculator — Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Table: businesses ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id   TEXT NOT NULL UNIQUE,  -- Clerk user ID
  name       TEXT NOT NULL,
  logo_url   TEXT,
  plan       TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: staff ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL DEFAULT '',
  role            TEXT NOT NULL DEFAULT 'Staff',
  salary_type     TEXT NOT NULL DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'daily')),
  monthly_salary  NUMERIC,
  daily_wage      NUMERIC,
  joining_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: attendance ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id   UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  status     TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'holiday')),
  note       TEXT,
  UNIQUE (staff_id, date)
);

-- ─── Table: advances ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS advances (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id        UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  amount          NUMERIC NOT NULL,
  given_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  month_to_deduct TEXT NOT NULL,  -- YYYY-MM
  is_deducted     BOOLEAN NOT NULL DEFAULT FALSE
);

-- ─── Table: salary_records ────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_records (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id           UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  month              TEXT NOT NULL,  -- YYYY-MM
  total_days         INTEGER NOT NULL DEFAULT 0,
  present_days       NUMERIC NOT NULL DEFAULT 0,
  base_salary        NUMERIC NOT NULL DEFAULT 0,
  advance_deduction  NUMERIC NOT NULL DEFAULT 0,
  overtime_amount    NUMERIC NOT NULL DEFAULT 0,
  bonus              NUMERIC NOT NULL DEFAULT 0,
  final_salary       NUMERIC NOT NULL DEFAULT 0,
  is_paid            BOOLEAN NOT NULL DEFAULT FALSE,
  paid_date          DATE,
  slip_url           TEXT,
  UNIQUE (staff_id, month)
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE businesses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff         ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance    ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances      ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;

-- ─── businesses policies ──────────────────────────────────────
-- Owners can only see and modify their own business
CREATE POLICY "businesses_select" ON businesses
  FOR SELECT USING (owner_id = current_setting('app.clerk_user_id', TRUE));

CREATE POLICY "businesses_insert" ON businesses
  FOR INSERT WITH CHECK (owner_id = current_setting('app.clerk_user_id', TRUE));

CREATE POLICY "businesses_update" ON businesses
  FOR UPDATE USING (owner_id = current_setting('app.clerk_user_id', TRUE));

-- ─── staff policies ───────────────────────────────────────────
-- Staff belongs to a business; check via JOIN
CREATE POLICY "staff_select" ON staff
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

CREATE POLICY "staff_insert" ON staff
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

CREATE POLICY "staff_update" ON staff
  FOR UPDATE USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

-- ─── attendance policies ──────────────────────────────────────
CREATE POLICY "attendance_select" ON attendance
  FOR SELECT USING (
    staff_id IN (
      SELECT s.id FROM staff s
      JOIN businesses b ON s.business_id = b.id
      WHERE b.owner_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

CREATE POLICY "attendance_insert" ON attendance
  FOR INSERT WITH CHECK (
    staff_id IN (
      SELECT s.id FROM staff s
      JOIN businesses b ON s.business_id = b.id
      WHERE b.owner_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

CREATE POLICY "attendance_update" ON attendance
  FOR UPDATE USING (
    staff_id IN (
      SELECT s.id FROM staff s
      JOIN businesses b ON s.business_id = b.id
      WHERE b.owner_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

-- ─── advances policies ────────────────────────────────────────
CREATE POLICY "advances_select" ON advances
  FOR SELECT USING (
    staff_id IN (
      SELECT s.id FROM staff s
      JOIN businesses b ON s.business_id = b.id
      WHERE b.owner_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

CREATE POLICY "advances_insert" ON advances
  FOR INSERT WITH CHECK (
    staff_id IN (
      SELECT s.id FROM staff s
      JOIN businesses b ON s.business_id = b.id
      WHERE b.owner_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

CREATE POLICY "advances_update" ON advances
  FOR UPDATE USING (
    staff_id IN (
      SELECT s.id FROM staff s
      JOIN businesses b ON s.business_id = b.id
      WHERE b.owner_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

-- ─── salary_records policies ──────────────────────────────────
CREATE POLICY "salary_records_select" ON salary_records
  FOR SELECT USING (
    staff_id IN (
      SELECT s.id FROM staff s
      JOIN businesses b ON s.business_id = b.id
      WHERE b.owner_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

CREATE POLICY "salary_records_insert" ON salary_records
  FOR INSERT WITH CHECK (
    staff_id IN (
      SELECT s.id FROM staff s
      JOIN businesses b ON s.business_id = b.id
      WHERE b.owner_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

CREATE POLICY "salary_records_update" ON salary_records
  FOR UPDATE USING (
    staff_id IN (
      SELECT s.id FROM staff s
      JOIN businesses b ON s.business_id = b.id
      WHERE b.owner_id = current_setting('app.clerk_user_id', TRUE)
    )
  );

-- ============================================================
-- Storage Bucket (run separately in Supabase Storage settings)
-- ============================================================
-- Create bucket named: "business-assets"
-- Set to public (for logo + PDF slip URLs)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('business-assets', 'business-assets', TRUE)