import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft, GraduationCap, Lock, CheckCircle2 } from "lucide-react";
import { listInternTracks, getRoleAccess } from "@/lib/intern.functions";
import { ROLE_META, isInternRole, type InternRole } from "@/lib/intern-roles";

const tracksQO = (role: InternRole) =>
  queryOptions({
    queryKey: ["intern", "tracks", role],
    queryFn: () => listInternTracks({ data: { role } }),
  });
const accessQO = queryOptions({ queryKey: ["intern", "role-access"], queryFn: () => getRoleAccess() });

export const Route = createFileRoute("/_authenticated/magang/")({
  validateSearch: (search: Record<string, unknown>): { role: InternRole } => {
    const raw = typeof search.role === "string" ? search.role : "magang";
    return { role: isInternRole(raw) ? raw : "magang" };
  },
  head: () => ({
    meta: [
      { title: "Misi Karier · CareerLab" },
      { name: "description", content: "Pilih bidang karier dan jalankan misi sesuai tingkat role kamu." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loaderDeps: ({ search }) => ({ role: search.role }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(tracksQO(deps.role)),
      context.queryClient.ensureQueryData(accessQO),
    ]);
  },
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-6 py-16" role="alert">
      <h1 className="font-display text-3xl">Role ini belum bisa dibuka</h1>
      <p className="mt-2 text-sm text-ink-dim">{error.message}</p>
      <Link to="/roles" className="mt-6 inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm">
        Lihat tingkatan role
      </Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl">Halaman tidak ditemukan</h1>
    </div>
  ),
  component: RoleTrackList,
});

function RoleTrackList() {
  const { role } = Route.useSearch();
  const { data: tracks } = useSuspenseQuery(tracksQO(role));
  const { data: rolesData } = useSuspenseQuery(accessQO);
  const roles = rolesData as Array<{
    role: InternRole;
    unlocked: boolean;
    completedMissions: number;
    requiredMissions: number;
    credits: number;
  }>;
  const meta = ROLE_META[role];
  const stat = roles.find((r) => r.role === role);
  const nextRole = roles.find((r) => ROLE_META[r.role].unlockedBy === role);


  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
      <Link to="/roles" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Tingkatan role
      </Link>

      <p className="mt-6 eyebrow inline-flex items-center gap-2">
        <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" /> Role {meta.label} · {meta.difficulty}
      </p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Pilih bidang karier yang ingin kamu coba.</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-dim">
        Semua role memiliki bidang karier yang sama — yang membedakan hanya tingkat kesulitan misinya.{" "}
        {meta.blurb}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label={`Kredit role ${meta.label}`} value={`${stat?.credits ?? 0}`} accent />
        <Stat label="Misi selesai" value={`${stat?.completedMissions ?? 0}`} />
        <Stat label="Tingkat kesulitan" value={meta.difficulty} />
      </div>

      {nextRole && !nextRole.unlocked && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-xs text-ink-dim">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Role {ROLE_META[nextRole.role].label} terbuka setelah {nextRole.requiredMissions} misi role{" "}
          {meta.label} selesai ({stat?.completedMissions ?? 0}/{nextRole.requiredMissions}).
        </p>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.length === 0 && (
          <p className="text-sm text-ink-muted">Belum ada bidang karier yang tersedia.</p>
        )}
        {tracks.map((t) => {
          const done = t.missionCount > 0 && t.completedCount >= t.missionCount;
          return (
            <Link
              key={t.id}
              to="/magang/$trackSlug"
              params={{ trackSlug: t.slug }}
              search={{ role }}
              className="surface-panel group flex flex-col p-5 transition hover:border-primary-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan"
            >
              <p className="eyebrow">{t.fieldName}</p>
              <h2 className="mt-2 font-display text-2xl leading-tight">{t.name}</h2>
              <p className="mt-2 flex-1 text-sm text-ink-dim">{t.tagline}</p>
              <div className="mt-5 flex items-center justify-between text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  {done && <CheckCircle2 className="h-3.5 w-3.5 text-primary-cyan" aria-hidden="true" />}
                  {t.completedCount}/{t.missionCount} misi selesai
                </span>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="surface-panel p-5">
      <p className="eyebrow">{label}</p>
      <p className={`mt-2 font-display text-3xl ${accent ? "text-primary-cyan" : ""}`}>{value}</p>
    </div>
  );
}
