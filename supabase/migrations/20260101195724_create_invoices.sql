-- Create invoices table to store payment history
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents (e.g., 14900 = £149.00)
  currency TEXT NOT NULL DEFAULT 'gbp',
  status TEXT NOT NULL, -- paid, open, void, uncollectible, etc.
  paid_at TIMESTAMP WITH TIME ZONE,
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_stripe_invoice_id ON public.invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_stripe_subscription_id ON public.invoices(stripe_subscription_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_paid_at ON public.invoices(paid_at);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own invoices"
ON public.invoices
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert invoices"
ON public.invoices
FOR INSERT
WITH CHECK (true); -- Webhook handler uses service role, so this allows inserts

CREATE POLICY "Service role can update invoices"
ON public.invoices
FOR UPDATE
USING (true); -- Webhook handler uses service role, so this allows updates

-- Add trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
