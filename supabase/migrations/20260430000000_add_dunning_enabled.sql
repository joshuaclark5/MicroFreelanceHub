-- Add dunning_enabled column to invoices table to track pause state
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS dunning_enabled BOOLEAN DEFAULT true;

-- Create index for dunning status queries
CREATE INDEX IF NOT EXISTS idx_invoices_dunning_enabled ON public.invoices(dunning_enabled);
