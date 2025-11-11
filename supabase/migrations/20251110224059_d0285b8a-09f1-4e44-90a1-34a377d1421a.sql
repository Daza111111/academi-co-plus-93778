-- Add policy to allow authenticated users to view classes by code (for joining)
CREATE POLICY "Authenticated users can view classes by code to join"
  ON public.classes FOR SELECT
  TO authenticated
  USING (true);