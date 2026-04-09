-- model_bookings: store half_day / full_day instead of a time slot

ALTER TABLE public.model_bookings
  ADD COLUMN IF NOT EXISTS booking_type TEXT;

UPDATE public.model_bookings
SET booking_type = 'full_day'
WHERE booking_type IS NULL;

ALTER TABLE public.model_bookings
  ALTER COLUMN booking_type SET DEFAULT 'full_day';

ALTER TABLE public.model_bookings
  ALTER COLUMN booking_type SET NOT NULL;

ALTER TABLE public.model_bookings
  DROP CONSTRAINT IF EXISTS model_bookings_booking_type_check;

ALTER TABLE public.model_bookings
  ADD CONSTRAINT model_bookings_booking_type_check
  CHECK (booking_type IN ('half_day', 'full_day'));
