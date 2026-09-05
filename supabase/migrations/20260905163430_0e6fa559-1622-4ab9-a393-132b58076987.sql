CREATE TABLE public.demo_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  work_email TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('operations', 'portfolio', 'other')),
  fleet_size_mw NUMERIC,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT INSERT ON public.demo_requests TO anon;
GRANT INSERT ON public.demo_requests TO authenticated;
GRANT ALL ON public.demo_requests TO service_role;
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a demo request" ON public.demo_requests FOR INSERT TO anon, authenticated WITH CHECK (true);