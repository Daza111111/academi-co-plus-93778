-- Add policy to allow all authenticated users to view basic profile information (for teacher names in class listings)
CREATE POLICY "Authenticated users can view basic profile info"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);