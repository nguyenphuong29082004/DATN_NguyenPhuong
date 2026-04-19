-- ============================================================
-- Migration: Create model_bookings and model_reports tables
-- ============================================================

-- 1. Model Bookings table
CREATE TABLE IF NOT EXISTS model_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL,
    user_id UUID NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME,
    location TEXT,
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
    response_note TEXT,        -- Model's response note when accepting/rejecting
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_model_bookings_model ON model_bookings (model_id, status);
CREATE INDEX IF NOT EXISTS idx_model_bookings_user ON model_bookings (user_id, status);

-- RLS
ALTER TABLE model_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own bookings"
    ON model_bookings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
    ON model_bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 2. Model Reports table
CREATE TABLE IF NOT EXISTS model_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL,
    reporter_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_reports_model ON model_reports (model_id, status);

-- RLS
ALTER TABLE model_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
    ON model_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);
