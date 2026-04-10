-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff_admin', 'translator', 'reviewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'standard' CHECK (urgency IN ('standard', 'express', 'urgent')),
  certification_type TEXT NOT NULL DEFAULT 'none' CHECK (certification_type IN ('none', 'certified', 'notarized', 'apostille')),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'ocr_reviewed', 'in_translation', 'in_review', 'ready', 'delivered')),
  assigned_translator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  price DECIMAL(10, 2),
  notes TEXT,
  ocr_text TEXT,
  ocr_confidence DECIMAL(5, 4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job files table
CREATE TABLE IF NOT EXISTS public.job_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_role TEXT NOT NULL DEFAULT 'source' CHECK (file_role IN ('source', 'translation', 'delivery', 'certificate')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job status history
CREATE TABLE IF NOT EXISTS public.job_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  from_status TEXT CHECK (from_status IN ('received', 'ocr_reviewed', 'in_translation', 'in_review', 'ready', 'delivered')),
  to_status TEXT NOT NULL CHECK (to_status IN ('received', 'ocr_reviewed', 'in_translation', 'in_review', 'ready', 'delivered')),
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translations table
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  translator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT,
  is_draft BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Glossary terms
CREATE TABLE IF NOT EXISTS public.glossary_terms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_term TEXT NOT NULL,
  translated_term TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('job_received', 'job_updated', 'job_ready', 'assignment', 'review_request')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON public.jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_translator ON public.jobs(assigned_translator_id);
CREATE INDEX IF NOT EXISTS idx_job_files_job_id ON public.job_files(job_id);
CREATE INDEX IF NOT EXISTS idx_job_status_history_job_id ON public.job_status_history(job_id);
CREATE INDEX IF NOT EXISTS idx_translations_job_id ON public.translations(job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON public.audit_log(resource_type, resource_id);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can read all profiles, update only their own
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Jobs: customers see their own, staff/translators/reviewers see all
CREATE POLICY "jobs_customer_select" ON public.jobs FOR SELECT USING (
  auth.uid() = customer_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('staff_admin', 'translator', 'reviewer')
  )
);
CREATE POLICY "jobs_customer_insert" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "jobs_staff_update" ON public.jobs FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('staff_admin', 'translator', 'reviewer')
  )
);

-- Job files: same as jobs
CREATE POLICY "job_files_select" ON public.job_files FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_files.job_id
    AND (
      jobs.customer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('staff_admin', 'translator', 'reviewer')
      )
    )
  )
);
CREATE POLICY "job_files_insert" ON public.job_files FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_files.job_id
    AND (
      jobs.customer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('staff_admin', 'translator', 'reviewer')
      )
    )
  )
);

-- Status history: same read permissions as jobs
CREATE POLICY "job_status_history_select" ON public.job_status_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_status_history.job_id
    AND (
      jobs.customer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('staff_admin', 'translator', 'reviewer')
      )
    )
  )
);
CREATE POLICY "job_status_history_insert" ON public.job_status_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Translations: translator assigned to job, staff, reviewer
CREATE POLICY "translations_select" ON public.translations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = translations.job_id
    AND (
      jobs.customer_id = auth.uid()
      OR jobs.assigned_translator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('staff_admin', 'reviewer')
      )
    )
  )
);
CREATE POLICY "translations_insert" ON public.translations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "translations_update" ON public.translations FOR UPDATE USING (
  translator_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('staff_admin', 'reviewer')
  )
);

-- Glossary: all authenticated users can read, staff can write
CREATE POLICY "glossary_select" ON public.glossary_terms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "glossary_insert" ON public.glossary_terms FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('staff_admin', 'translator')
  )
);

-- Notifications: users see only their own
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Audit log: staff admins can read all, others see their own
CREATE POLICY "audit_log_select" ON public.audit_log FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'staff_admin'
  )
);
CREATE POLICY "audit_log_insert" ON public.audit_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
