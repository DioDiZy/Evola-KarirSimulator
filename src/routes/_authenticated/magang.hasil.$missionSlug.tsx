import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getInternMissionRun, listInternMissions } from "@/lib/intern.functions";
import { MissionResultCard } from "@/components/intern/mission-result-card";
import { ROLE_META, type InternRole } from "@/lib/intern-roles";

const runQO = (missionSlug: string) =>
  queryOptions({
    queryKey: ["intern", "run", missionSlug],
    queryFn: () => getInternMissionRun({ data: { missionSlug } }),
  });

export const Route = createFileRoute("/_authenticated/magang/hasil/$missionSlug")({
  head: () => ({
    meta: [{ title: "Hasil Misi Magang · CareerLab" }, { name: "robots", content: "noindex" }],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(runQO(params.missionSlug)),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-6 py-16" role="alert">
      <h1 className="font-display text-3xl">Gagal memuat hasil misi</h1>
      <p className="mt-2 text-sm text-ink-dim">{error.message}</p>
      <Link to="/magang" className="mt-6 inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm">
        Kembali ke daftar bidang
      </Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl">Hasil tidak ditemukan</h1>
    </div>
  ),
  component: InternResultPage,
});

function InternResultPage() {
  const { missionSlug } = Route.useParams();
  const { data } = useSuspenseQuery(runQO(missionSlug));
  const trackSlug = data.track?.slug ?? "";
  const missionRole = ((data.mission as { target_role?: string }).target_role ?? "magang") as InternRole;
  const { data: list } = useSuspenseQuery(
    queryOptions({
      queryKey: ["intern", "missions", trackSlug, missionRole],
      queryFn: () => listInternMissions({ data: { trackSlug, role: missionRole } }),
    }),
  );

  const correct = data.answers.filter((a) => a.is_correct).length;
  const incorrect = data.answers.length - correct;
  const idx = list.missions.findIndex((m) => m.slug === missionSlug);
  const next = idx >= 0 ? list.missions[idx + 1] : null;

  if (data.progress?.status !== "completed") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="eyebrow">Belum selesai</p>
        <h1 className="mt-2 font-display text-3xl">Misi ini belum kamu selesaikan.</h1>
        <p className="mt-2 text-sm text-ink-dim">
          Selesaikan seluruh pekerjaan di room chat untuk melihat evaluasi akhir.
        </p>
        <Link
          to="/magang/misi/$missionSlug"
          params={{ missionSlug }}
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          Lanjutkan misi
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
      <MissionResultCard
        missionTitle={data.mission.title}
        trackName={data.track?.name ?? ""}
        trackSlug={trackSlug}
        seniorName={data.mission.senior_name}
        jobsDone={data.jobs.length}
        correct={correct}
        incorrect={incorrect}
        credit={data.progress.credit_awarded}
        nextMissionSlug={next?.slug ?? null}
        role={missionRole}
        roleLabel={ROLE_META[missionRole].label}
      />
    </div>
  );
}
