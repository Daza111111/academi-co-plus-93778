-- Add RLS policy to allow teachers to delete their own classes
CREATE POLICY "Teachers can delete own classes"
ON public.classes
FOR DELETE
TO authenticated
USING (teacher_id = auth.uid());