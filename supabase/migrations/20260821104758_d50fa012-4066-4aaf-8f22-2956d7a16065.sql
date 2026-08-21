DROP POLICY IF EXISTS "Intern options readable" ON public.intern_answer_options;
DROP POLICY IF EXISTS "Intern questions readable" ON public.intern_questions;

REVOKE ALL ON public.intern_answer_options FROM anon, authenticated;
REVOKE ALL ON public.intern_questions FROM anon, authenticated;

GRANT ALL ON public.intern_answer_options TO service_role;
GRANT ALL ON public.intern_questions TO service_role;

ALTER TABLE public.intern_answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_questions ENABLE ROW LEVEL SECURITY;