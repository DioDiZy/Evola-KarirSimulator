import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, GraduationCap, Lock, CheckCircle2 } from "lucide-react";
import { listInternTracks, getMyInternProfile } from "@/lib/intern.functions";

const tracksQO = queryOptions({ queryKey: ["intern", "tracks"], queryFn: () => listInternTracks() });
const meQO = queryOptions({ queryKey: ["intern", "me"], queryFn: () => getMyInternProfile() });

export const Route = createFileRoute("/_authenticated/magang/")({
  head: () => ({
    meta: [{ title: "Program Magang · CareerLab" }, { name: "robots", content: "noindex" }],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(tracksQO),
      context.queryClient.ensureQueryData(meQO),
    ]);
  },
  component: InternHome,
});

function InternHome() {
  const { data: tracks } = useSuspenseQuery(tracksQO);
  const { data: me } = useSuspenseQuery(meQO);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
      <p className="eyebrow inline-flex items-center gap-2">
        <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" /> Role Magang
      </p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Pilih bidang karier yang ingin kamu coba.</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-dim">
        Bidang yang tersedia sama dengan role Pekerja, hanya saja tugasnya dibimbing langsung oleh AI Senior
        lewat room chat. Kumpulkan 10 kredit dari 2 misi untuk membuka role Pekerja.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Kredit magang" value={`${me.internCredits}`} accent />
        <Stat label="Misi selesai" value={`${me.completedMissions}`} />
        <Stat
          label="Status role"
          value={me.role === "pekerja" ? "Pekerja terbuka" : "Magang"}
        />
      </div>

      {me.role !== "pekerja" && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-xs text-ink-dim">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Role Pekerja terbuka setelah 2 misi magang selesai (10 kredit).
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
