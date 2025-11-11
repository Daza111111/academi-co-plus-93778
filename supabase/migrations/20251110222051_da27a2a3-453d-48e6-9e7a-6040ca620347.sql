-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('student', 'teacher');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create enrollments table (before classes policies that reference it)
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- Enable RLS on enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Now create classes policies
CREATE POLICY "Teachers can view own classes"
  ON public.classes FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can view classes they're enrolled in"
  ON public.classes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE class_id = classes.id AND student_id = auth.uid()
  ));

CREATE POLICY "Teachers can create classes"
  ON public.classes FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own classes"
  ON public.classes FOR UPDATE
  USING (teacher_id = auth.uid());

-- Enrollments policies
CREATE POLICY "Students can view own enrollments"
  ON public.enrollments FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view enrollments for their classes"
  ON public.enrollments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = class_id AND teacher_id = auth.uid()
  ));

CREATE POLICY "Students can enroll in classes"
  ON public.enrollments FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Create grade items table (for talleres, trabajos, etc)
CREATE TABLE public.grade_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  corte INTEGER NOT NULL CHECK (corte IN (1, 2, 3)),
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on grade_items
ALTER TABLE public.grade_items ENABLE ROW LEVEL SECURITY;

-- Grade items policies
CREATE POLICY "Teachers can manage grade items for their classes"
  ON public.grade_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = class_id AND teacher_id = auth.uid()
  ));

CREATE POLICY "Students can view grade items for enrolled classes"
  ON public.grade_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE class_id = grade_items.class_id AND student_id = auth.uid()
  ));

-- Create grades table
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  grade_item_id UUID NOT NULL REFERENCES public.grade_items(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, grade_item_id)
);

-- Enable RLS on grades
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Grades policies
CREATE POLICY "Students can view own grades"
  ON public.grades FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage grades for their classes"
  ON public.grades FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.grade_items gi
    JOIN public.classes c ON c.id = gi.class_id
    WHERE gi.id = grade_item_id AND c.teacher_id = auth.uid()
  ));

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  present BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);

-- Enable RLS on attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Attendance policies
CREATE POLICY "Students can view own attendance"
  ON public.attendance FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage attendance for their classes"
  ON public.attendance FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = class_id AND teacher_id = auth.uid()
  ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();