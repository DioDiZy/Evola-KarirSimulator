
# CareerLab Mission Engine — MVP Build Plan

Bahasa Indonesia UI. Forged-inspired dark, technical, editorial look. Route flow: landing → auth → dashboard (Fields) → Track → Career Level → Episode → Mission runner → evaluation → credit reward.

## 1. Foundation
- Enable **Lovable Cloud** (auth + Postgres).
- Design system in `src/styles.css` (dark oklch tokens: deep near-black bg, off-white ink, single accent, mono + serif display pairing). No purple. Token-only colors.
- Root layout: header with logo + `Masuk`/user menu, main outlet, minimal footer.
- SEO metadata per route in Bahasa Indonesia.

## 2. Auth (Cloud, email/password + Google)
- `_authenticated/` layout (managed).
- `/auth` public page: tab Masuk / Daftar.
- `profiles` table (id, display_name, avatar_url) + trigger on signup.
- Header reflects session; sign-out hygiene.

## 3. Data model (schema, migrations, GRANTs, RLS)

Content lives as seeded rows so the MVP is demo-ready:

- `fields` — Teknologi Informasi (aktif), Hukum (preview), etc.
- `career_tracks` — per field (e.g. Frontend Dev, Data Analyst).
- `career_levels` — Pekerja / Senior (Senior = coming_soon flag).
- `episodes` — per track+level, ordered.
- `missions` — belongs to episode; type: `mission` | `micro_task` | `senior_project`; JSON `content` (scenario, choices, tasks).
- `user_track_progress` — per (user, track): performance_points, career_credits, current_episode_id.
- `user_mission_attempts` — per (user, mission): score, decisions, completed_at.
- `user_episode_completions` — grants career_credit once.

RLS: users read/write only their own progress rows; content tables readable by `authenticated` (and `anon` for the public catalog preview on landing). GRANTs included per rules.

## 4. Content seed (Teknologi Informasi track, playable)
One full Track (Frontend Developer) with 1 Episode ("Sprint Pertama") containing 3 missions:
1. **Mission — Standup Keputusan** — scenario + 3 choices with weighted scoring.
2. **Micro-task — Debug UI** — interactive card: pick the broken component in a mocked UI.
3. **Micro-task — Code Review** — choose the correct diff.

Other tracks/fields shown as `Coming Soon` cards (Hukum preview, Senior locked).

## 5. Routes
- `/` — landing (hero with R3F scene, value prop, field grid preview, CTA).
- `/auth` — sign in / up.
- `/_authenticated/dashboard` — Fields grid, resume-progress card.
- `/_authenticated/fields/$fieldSlug` — Tracks list.
- `/_authenticated/tracks/$trackSlug` — Levels (Pekerja active, Senior locked) + episodes with progress.
- `/_authenticated/episodes/$episodeId` — Episode overview, mission list, progress bar.
- `/_authenticated/missions/$missionId` — Mission runner (renders per type). Post-completion → evaluation screen. On last mission of episode → grant career_credit, show reward modal.
- `/profile` — stats per track, total credits, badges.

Data fetching: `createServerFn` + TanStack Query per canonical pattern.

## 6. Functional 3D (React Three Fiber)
- Deps: `three`, `@react-three/fiber`, `@react-three/drei`.
- **Hero scene** (`/`): floating wireframe "career module" — instanced glass panels orbiting a core, mouse-parallax, subtle bloom. `<ClientOnly>` wrapper, lazy-loaded.
- **Mission scene**: inside the Frontend track's debug mission — a 3D "workspace" (monitor + code panels floating). User rotates to inspect; clicking a panel is the interactive step (bug identification).

## 7. Evaluation & rewards
- Per-mission scoring computed server-side (`createServerFn` with `requireSupabaseAuth`) from submitted decisions vs. the mission's rubric in `content`.
- Performance Points update (can go up or down).
- Career Credit granted once per episode completion (never decreases).
- Evaluation screen: rubric breakdown, feedback strings, next-mission CTA.

## 8. Polish
- Loading skeletons, empty states, toasts (`sonner`).
- Progress persistence per track (verified in profile view).
- Sitemap + robots.
- Head metadata + OG on landing (generate hero image).

## Technical notes
- Bahasa Indonesia strings inline (no i18n framework).
- All server logic via `createServerFn` — no edge functions.
- Content JSON typed via zod.
- R3F only inside `<ClientOnly>` + `React.lazy`.
- Coming Soon fields/level rendered as disabled cards (never dead links).

## Out of scope (v1)
- Hukum missions (preview only).
- Senior projects (Coming Soon).
- Multiplayer, leaderboards, certificates, admin CMS.

Ready to build on approval.
