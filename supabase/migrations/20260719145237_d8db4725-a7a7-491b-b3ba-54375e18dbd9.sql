
-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by owner" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles updatable by owner" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles insertable by owner" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =========================================================
-- CONTENT CATALOG (public read)
-- =========================================================
CREATE TABLE public.fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'preview' | 'coming_soon'
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fields TO anon, authenticated;
GRANT ALL ON public.fields TO service_role;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fields public read" ON public.fields FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.career_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.career_tracks TO anon, authenticated;
GRANT ALL ON public.career_tracks TO service_role;
ALTER TABLE public.career_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tracks public read" ON public.career_tracks FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.career_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.career_tracks(id) ON DELETE CASCADE,
  slug TEXT NOT NULL, -- 'pekerja' | 'senior'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'coming_soon'
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE (track_id, slug)
);
GRANT SELECT ON public.career_levels TO anon, authenticated;
GRANT ALL ON public.career_levels TO service_role;
ALTER TABLE public.career_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Levels public read" ON public.career_levels FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES public.career_levels(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  career_credit_reward INT NOT NULL DEFAULT 10,
  UNIQUE (level_id, slug)
);
GRANT SELECT ON public.episodes TO anon, authenticated;
GRANT ALL ON public.episodes TO service_role;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Episodes public read" ON public.episodes FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'mission' | 'micro_task' | 'senior_project'
  duration_minutes INT NOT NULL DEFAULT 10,
  sort_order INT NOT NULL DEFAULT 0,
  content JSONB NOT NULL, -- scenario, options, correct answers, rubric
  UNIQUE (episode_id, slug)
);
GRANT SELECT ON public.missions TO anon, authenticated;
GRANT ALL ON public.missions TO service_role;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Missions public read" ON public.missions FOR SELECT TO anon, authenticated USING (true);

-- =========================================================
-- USER PROGRESS
-- =========================================================
CREATE TABLE public.user_track_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.career_tracks(id) ON DELETE CASCADE,
  performance_points INT NOT NULL DEFAULT 0,
  career_credits INT NOT NULL DEFAULT 0,
  current_episode_id UUID REFERENCES public.episodes(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, track_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_track_progress TO authenticated;
GRANT ALL ON public.user_track_progress TO service_role;
ALTER TABLE public.user_track_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own track progress" ON public.user_track_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER set_utp_updated BEFORE UPDATE ON public.user_track_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_mission_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  score INT NOT NULL,
  max_score INT NOT NULL,
  performance_delta INT NOT NULL DEFAULT 0,
  decisions JSONB NOT NULL,
  feedback JSONB NOT NULL,
  passed BOOLEAN NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.user_mission_attempts TO authenticated;
GRANT ALL ON public.user_mission_attempts TO service_role;
ALTER TABLE public.user_mission_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own attempts" ON public.user_mission_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_episode_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  career_credits_awarded INT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, episode_id)
);
GRANT SELECT, INSERT ON public.user_episode_completions TO authenticated;
GRANT ALL ON public.user_episode_completions TO service_role;
ALTER TABLE public.user_episode_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own completions" ON public.user_episode_completions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- SEED CONTENT
-- =========================================================
INSERT INTO public.fields (slug, name, tagline, status, sort_order) VALUES
  ('teknologi-informasi', 'Teknologi Informasi', 'Bangun produk digital dari kode pertama hingga rilis.', 'active', 1),
  ('desain-produk', 'Desain Produk', 'Rancang pengalaman yang membuat pengguna bertahan.', 'coming_soon', 2),
  ('hukum', 'Hukum', 'Telaah kasus, susun argumen, tegakkan keadilan.', 'preview', 3),
  ('bisnis-pemasaran', 'Bisnis & Pemasaran', 'Pahami pasar, ambil keputusan bertumbuh.', 'coming_soon', 4);

WITH f AS (SELECT id FROM public.fields WHERE slug='teknologi-informasi')
INSERT INTO public.career_tracks (field_id, slug, name, tagline, status, sort_order) VALUES
  ((SELECT id FROM f), 'frontend-developer', 'Frontend Developer', 'Antarmuka yang cepat, indah, dan dapat diandalkan.', 'active', 1),
  ((SELECT id FROM f), 'data-analyst', 'Data Analyst', 'Ubah angka menjadi keputusan.', 'coming_soon', 2),
  ((SELECT id FROM f), 'devops-engineer', 'DevOps Engineer', 'Otomatiskan jalur menuju produksi.', 'coming_soon', 3);

WITH t AS (SELECT id FROM public.career_tracks WHERE slug='frontend-developer')
INSERT INTO public.career_levels (track_id, slug, name, description, status, sort_order) VALUES
  ((SELECT id FROM t), 'pekerja', 'Pekerja', 'Selesaikan micro-task 5–20 menit di lingkungan kerja nyata.', 'active', 1),
  ((SELECT id FROM t), 'senior', 'Senior', 'Proyek end-to-end lintas tim.', 'coming_soon', 2);

WITH l AS (
  SELECT cl.id FROM public.career_levels cl
  JOIN public.career_tracks ct ON ct.id = cl.track_id
  WHERE ct.slug='frontend-developer' AND cl.slug='pekerja'
)
INSERT INTO public.episodes (level_id, slug, name, synopsis, sort_order, career_credit_reward)
VALUES ((SELECT id FROM l), 'sprint-pertama', 'Sprint Pertama',
  'Hari pertamamu di tim frontend startup. Ikuti standup, benahi UI yang rusak, dan lakukan code review.', 1, 15);

-- Missions for Sprint Pertama
WITH e AS (
  SELECT ep.id FROM public.episodes ep
  JOIN public.career_levels cl ON cl.id = ep.level_id
  JOIN public.career_tracks ct ON ct.id = cl.track_id
  WHERE ct.slug='frontend-developer' AND cl.slug='pekerja' AND ep.slug='sprint-pertama'
)
INSERT INTO public.missions (episode_id, slug, name, type, duration_minutes, sort_order, content) VALUES
((SELECT id FROM e), 'standup-keputusan', 'Standup: Ambil Keputusan', 'mission', 10, 1, '{
  "scenario": "Tim standup dimulai. Product manager melapor bug kritis pada halaman checkout menjelang demo klien pukul 14.00. Kamu sudah berjanji mengirim fitur profil hari ini. Apa yang kamu lakukan?",
  "choices": [
    {"id":"a","text":"Selesaikan fitur profil dulu sesuai janji, bug checkout urus setelahnya.","score":1,"feedback":"Konsistensi baik, tapi bug produksi yang memengaruhi klien harus diprioritaskan."},
    {"id":"b","text":"Angkat bug ke tim, tawarkan diri memperbaikinya sekarang, komunikasikan penundaan fitur profil ke PM.","score":5,"feedback":"Tepat. Komunikasi terbuka + prioritas berbasis dampak = perilaku senior."},
    {"id":"c","text":"Diam saja, kerjakan keduanya semalaman.","score":0,"feedback":"Menumpuk tanpa komunikasi berisiko burnout dan miskoordinasi."},
    {"id":"d","text":"Serahkan bug ke tim lain tanpa konteks.","score":2,"feedback":"Delegasi tanpa konteks memperlambat tim, bukan mempercepat."}
  ],
  "max_score": 5
}'::jsonb),

((SELECT id FROM e), 'debug-ui', 'Micro-task: Cari Bug UI', 'micro_task', 8, 2, '{
  "scenario": "Halaman produk kacau. Pilih komponen yang paling mungkin menyebabkan layout rusak.",
  "components": [
    {"id":"header","label":"Header","broken":false,"reason":"Header terlihat normal, tidak ada style bocor."},
    {"id":"grid","label":"Product Grid","broken":true,"reason":"Grid kehilangan gap dan menggunakan display block, bukan grid."},
    {"id":"footer","label":"Footer","broken":false,"reason":"Footer sesuai desain."},
    {"id":"cta","label":"Tombol CTA","broken":false,"reason":"Tombol utuh, hanya berada di posisi tak biasa akibat grid rusak."}
  ],
  "correct_id": "grid",
  "score_correct": 5,
  "score_wrong": 1,
  "max_score": 5
}'::jsonb),

((SELECT id FROM e), 'code-review', 'Micro-task: Code Review', 'micro_task', 7, 3, '{
  "scenario": "Rekan tim mengirim pull request. Pilih diff yang layak di-approve.",
  "diffs": [
    {"id":"a","label":"Menghapus null-check dengan alasan ''selalu ada''.","approve":false,"feedback":"Kode defensif tetap penting. Tolak."},
    {"id":"b","label":"Menambahkan loading state dan menutup subscription di unmount.","approve":true,"feedback":"Tepat. Menangani edge case dan mencegah memory leak."},
    {"id":"c","label":"Meng-hardcode API key di frontend.","approve":false,"feedback":"Masalah keamanan serius, tolak segera."}
  ],
  "correct_id":"b",
  "score_correct": 5,
  "score_wrong": 1,
  "max_score": 5
}'::jsonb);
