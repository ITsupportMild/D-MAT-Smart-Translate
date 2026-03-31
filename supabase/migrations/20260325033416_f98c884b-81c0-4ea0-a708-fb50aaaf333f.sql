CREATE TABLE public.translation_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine text NOT NULL,
  source_text text NOT NULL,
  target_lang text NOT NULL,
  tone text DEFAULT 'neutral',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.translation_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert votes" ON public.translation_votes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read votes" ON public.translation_votes FOR SELECT TO anon, authenticated USING (true);