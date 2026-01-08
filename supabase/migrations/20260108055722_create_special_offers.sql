-- Create special_offers table for the Special Offers feature
-- Allows creators to promote specific time slots with optional discounts

-- Create enum for special offer status
CREATE TYPE special_offer_status AS ENUM ('active', 'booked', 'expired');

-- Create the special_offers table
CREATE TABLE special_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beauty_page_id UUID NOT NULL REFERENCES beauty_pages(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  discount_percentage INTEGER NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  original_price_cents INTEGER NOT NULL,
  discounted_price_cents INTEGER NOT NULL,
  status special_offer_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate offers for same service/date/time
  UNIQUE(beauty_page_id, service_id, date, start_time)
);

-- Index for efficient queries on active offers
CREATE INDEX idx_special_offers_beauty_page_active
  ON special_offers(beauty_page_id, status, date)
  WHERE status = 'active';

-- Add comments for documentation
COMMENT ON TABLE special_offers IS 'Promoted time slots that creators want to highlight on their beauty page';
COMMENT ON COLUMN special_offers.discount_percentage IS 'Optional discount (0-100%). 0 means no discount, just featured visibility';
COMMENT ON COLUMN special_offers.status IS 'active: visible to clients, booked: appointment created, expired: time has passed';

-- Enable Row Level Security
ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active special offers (for beauty page display)
CREATE POLICY "Anyone can read active special offers"
  ON special_offers FOR SELECT
  USING (status = 'active' AND date >= CURRENT_DATE);

-- Policy: Beauty page owner can read all their offers (for settings)
CREATE POLICY "Owner can read all their special offers"
  ON special_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM beauty_pages
      WHERE id = special_offers.beauty_page_id
      AND owner_id = auth.uid()
    )
  );

-- Policy: Only owner can insert special offers
CREATE POLICY "Owner can create special offers"
  ON special_offers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM beauty_pages
      WHERE id = special_offers.beauty_page_id
      AND owner_id = auth.uid()
    )
  );

-- Policy: Only owner can update special offers
CREATE POLICY "Owner can update special offers"
  ON special_offers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM beauty_pages
      WHERE id = special_offers.beauty_page_id
      AND owner_id = auth.uid()
    )
  );

-- Policy: Only owner can delete special offers
CREATE POLICY "Owner can delete special offers"
  ON special_offers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM beauty_pages
      WHERE id = special_offers.beauty_page_id
      AND owner_id = auth.uid()
    )
  );

-- Trigger to update updated_at on changes
CREATE TRIGGER update_special_offers_updated_at
  BEFORE UPDATE ON special_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
