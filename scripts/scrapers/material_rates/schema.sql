-- =============================================================================
-- Sukoon Construction OS - Daily Material Rates Schema
-- Compatible with: PostgreSQL 14+, Supabase, Neon (Free Tier), AWS RDS
-- =============================================================================

-- Ensure UUID generation extension is active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Main Material Rates Table
CREATE TABLE IF NOT EXISTS material_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city VARCHAR(100) NOT NULL,
    material_type VARCHAR(50) NOT NULL,              -- e.g. 'Steel', 'Cement', 'Sand', 'Aggregates', 'Bricks'
    sub_category_or_brand VARCHAR(150) NOT NULL,     -- e.g. 'TMT 500D', 'OPC 53 Grade', 'River Sand', '20mm Metal'
    unit VARCHAR(50) NOT NULL,                      -- e.g. 'per Metric Ton', 'per 50kg Bag', 'per CFT'
    price NUMERIC(12, 2) NOT NULL,                  -- e.g. 54500.00
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    source_url TEXT NULL,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Unique composite constraint: Prevents duplicate rows for the same item on the same calendar day
    -- Enables atomic PostgreSQL UPSERT (ON CONFLICT ... DO UPDATE)
    CONSTRAINT uq_material_rates_city_type_brand_date 
        UNIQUE (city, material_type, sub_category_or_brand, recorded_date)
);

-- =============================================================================
-- 2. Performance Indexes (Optimized for Sub-millisecond Client Queries)
-- =============================================================================

-- Index for consumer queries fetching all materials for a specific city on a given day
CREATE INDEX IF NOT EXISTS idx_material_rates_city_date 
    ON material_rates (city, recorded_date DESC);

-- Index for cross-city comparison queries (e.g., comparing TMT Steel prices across India)
CREATE INDEX IF NOT EXISTS idx_material_rates_type_date 
    ON material_rates (material_type, recorded_date DESC);

-- Index for timeseries queries and trend charts (e.g. 30-day price trend of Cement)
CREATE INDEX IF NOT EXISTS idx_material_rates_date 
    ON material_rates (recorded_date DESC);

-- =============================================================================
-- 3. Automatic Timestamp Trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION update_material_rates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_material_rates_updated_at ON material_rates;
CREATE TRIGGER trg_material_rates_updated_at
    BEFORE UPDATE ON material_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_material_rates_timestamp();

-- =============================================================================
-- 4. Analytical View: Latest Rates Per City & Material
-- =============================================================================
CREATE OR REPLACE VIEW v_latest_material_rates AS
SELECT DISTINCT ON (city, material_type, sub_category_or_brand)
    id,
    city,
    material_type,
    sub_category_or_brand,
    unit,
    price,
    currency,
    source_url,
    recorded_date,
    updated_at
FROM material_rates
ORDER BY city, material_type, sub_category_or_brand, recorded_date DESC;
