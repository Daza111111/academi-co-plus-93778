-- Drop existing problematic policies
DROP POLICY IF EXISTS "Teachers can view own classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view enrollments for their classes" ON public.enrollments;

-- Create security definer function to check if user is teacher of a class
CREATE OR REPLACE FUNCTION public.is_class_teacher(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes
    WHERE id = _class_id
      AND teacher_id = _user_id
  )
$$;

-- Create security definer function to check if user is enrolled in a class
CREATE OR REPLACE FUNCTION public.is_enrolled_in_class(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE class_id = _class_id
      AND student_id = _user_id
  )
$$;

-- Recreate classes policies using security definer functions
CREATE POLICY "Teachers can view own classes"
  ON public.classes FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can view classes they're enrolled in"
  ON public.classes FOR SELECT
  USING (public.is_enrolled_in_class(auth.uid(), id));

-- Recreate enrollments policy using security definer function
CREATE POLICY "Teachers can view enrollments for their classes"
  ON public.enrollments FOR SELECT
  USING (public.is_class_teacher(auth.uid(), class_id));