import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getTrackBySlug, getMyProgress } from "@/lib/careerlab.functions";
import { ArrowRight, ArrowLeft, Lock } from "lucide-react";

const trackQO = (slug: string) =>
  queryOptions({ queryKey: ["track", slug], queryFn: () => getTrackBySlug({ data: { slug } }) });
const progressQO = queryOptions({ queryKey: ["progress"], queryFn: () => getMyProgress() });

export const Route = createFileRoute("/_authenticated/tracks/$trackSlug")({
  head: ({ params }) => ({ meta: [{ title: `${params.trackSlug} · CareerLab` }, { name: "robots", content: "noindex" }] }),
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(trackQO(params.trackSlug));
    context.queryClient.ensureQueryData(progressQO);
  },
  component: TrackPage,
});

function TrackPage() {
  const { trackSlug } = Route.useParams();
  const { data } = useSuspenseQuery(trackQO(trackSlug));
  const { data: progress } = useSuspenseQuery(progressQO);
  const { track, field, levels, episodes } = data;

  const trackProgress = progress.trackProgress.find(p => p.track_id === track.id);
  const completed = new Set(progress.completions.map(c => c.episode_id));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {field && (
        <Link to="/fields/$fieldSlug" params={{ fieldSlug: field.slug }} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> {field.name}
        </Link>
      )}
      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Career Track</p>
          <h1 className="mt-2 font-display text-5xl">{track.name}</h1>
          <p className="mt-3 max-w-2xl text-ink-dim">{track.tagline}</p>
        </div>
        <div className="flex gap-4">
          <MiniStat label="Performance" value={trackProgress?.performance_points ?? 0} />
          <MiniStat label="Credit" value={trackProgress?.career_credits ?? 0} accent />
        </div>
      </div>

      <div className="mt-14 space-y-10">
        {levels.map((lvl) => {
          const lvlEpisodes = episodes.filter(e => e.level_id === lvl.id);
          const locked = lvl.status !== "active";
          return (
            <section key={lvl.id}>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-3xl">{lvl.name}</h2>
                {locked && (
                  <span className="eyebrow inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Segera Hadir</span>
                )}
              </div>
              <p className="mt-2 text-ink-dim max-w-2xl">{lvl.description}</p>
              {locked ? (
                <div className="mt-6 surface-panel p-8 text-center text-ink-muted">
                  Proyek end-to-end untuk level Senior sedang dipersiapkan.
                </div>
              ) : (
                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  {lvlEpisodes.map((ep, idx) => {
                    const done = completed.has(ep.id);
                    return (
                      <Link key={ep.id} to="/episodes/$episodeId" params={{ episodeId: ep.id }} className="surface-panel p-6 hover:border-accent transition group">
                        <div className="flex items-center justify-between">
                          <span className="eyebrow">Episode {idx + 1}</span>
                          {done ? <span className="eyebrow text-accent">Selesai</span> : <span className="eyebrow">Belum</span>}
                        </div>
                        <h3 className="mt-3 font-display text-2xl">{ep.name}</h3>
                        <p className="mt-2 text-sm text-ink-dim">{ep.synopsis}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-ink-muted font-mono-cl">+{ep.career_credit_reward} credit</span>
                          <span className="text-accent text-sm inline-flex items-center gap-1">
                            {done ? "Ulangi" : "Mulai"} <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="surface-panel px-4 py-3 min-w-24 text-center">
      <div className="eyebrow">{label}</div>
      <div className={`font-display text-2xl mt-1 ${accent ? "text-accent" : ""}`}>{value}</div>
    </div>
  );
}
