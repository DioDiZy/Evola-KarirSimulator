import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle2, MessageSquare, Timer } from "lucide-react";
import { listInternMissions } from "@/lib/intern.functions";
import { ROLE_META, isInternRole, type InternRole } from "@/lib/intern-roles";

const qo = (trackSlug: string, role: InternRole) =>
  queryOptions({
    queryKey: ["intern", "missions", trackSlug, role],
    queryFn: () => listInternMissions({ data: { trackSlug, role } }),
  });

export const Route = createFileRoute("/_authenticated/magang/$trackSlug")({
  validateSearch: (search: Record<string, unknown>): { role: InternRole } => {
    const raw = typeof search.role === "string" ? search.role : "magang";
    return { role: isInternRole(raw) ? raw : "magang" };
  },
  head: ({ params }) => ({
    meta: [{ title: `Misi · ${params.trackSlug} · CareerLab` }, { name: "robots", content: "noindex" }],
  }),
  loaderDeps: ({ search }) => ({ role: search.role }),
  loader: ({ context, params, deps }) => context.queryClient.ensureQueryData(qo(params.trackSlug, (deps as { role: InternRole }).role)),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-6 py-16" role="alert">
      <h1 className="font-display text-3xl">Gagal memuat data misi</h1>
      <p className="mt-2 text-sm text-ink-dim">{error.message}</p>
      <Link to="/magang" search={{ role: "magang" as const }} className="mt-6 inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm">
        Kembali ke daftar bidang
      </Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl">Bidang tidak ditemukan</h1>
    </div>
  ),
  component: InternMissionList,
});

function InternMissionList() {
  const { trackSlug } = Route.useParams();
  const { role } = Route.useSearch() as { role: InternRole };
  const meta = ROLE_META[role];
  const { data } = useSuspenseQuery(qo(trackSlug, role));
  const { track, missions } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-12">
      <Link to="/magang" search={{ role }} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Bidang karier
      </Link>

      <p className="mt-6 eyebrow">Misi Role {meta.label} · {meta.difficulty}</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">{track.name}</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-dim">{track.tagline}</p>

      {missions.length === 0 ? (
        <p className="mt-10 surface-panel p-6 text-sm text-ink-muted">
          Belum ada misi role {meta.label} untuk bidang ini. Coba bidang lain dulu ya.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {missions.map((m) => (
            <li key={m.id} className="surface-panel p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-ink-muted">
                      {meta.difficulty}
                    </span>
                    {m.status === "completed" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary-cyan/40 bg-primary-cyan/10 px-2.5 py-0.5 text-[11px] text-primary-cyan">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Selesai
                      </span>
                    )}
                    {m.status === "in_progress" && (
                      <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-[11px] text-ink-dim">
                        Sedang dikerjakan · {m.answered}/{m.questionCount}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 font-display text-2xl leading-tight">{m.title}</h2>
                  <p className="mt-1.5 text-sm text-ink-dim">{m.description}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5" aria-hidden="true" /> {m.jobCount} pekerjaan ·{" "}
                      {m.questionCount} pertanyaan
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> Senior {m.senior_name}
                    </span>
                    <span className="text-primary-cyan">+{m.reward_credit} kredit</span>
                  </div>
                </div>

                <Link
                  to="/magang/misi/$missionSlug"
                  params={{ missionSlug: m.slug }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:brightness-110"
                >
                  {m.status === "not_started" ? "Mulai misi" : m.status === "in_progress" ? "Lanjutkan" : "Buka lagi"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
