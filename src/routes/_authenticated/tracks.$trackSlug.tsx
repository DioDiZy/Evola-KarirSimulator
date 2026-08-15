import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getTrackBySlug, getMyProgress } from "@/lib/careerlab.functions";
import { ArrowRight, ArrowLeft, Lock } from "lucide-react";
import { ClientOnly } from "@/components/client-only";
import { useWebGLSupport } from "@/hooks/use-webgl-support";
import { TrackMapScene } from "@/components/game/track-map-scene";
import { requireWorkUnlocked } from "@/lib/work-gate";

const trackQO = (slug: string) =>
  queryOptions({ queryKey: ["track", slug], queryFn: () => getTrackBySlug({ data: { slug } }) });
const progressQO = queryOptions({ queryKey: ["progress"], queryFn: () => getMyProgress() });

export const Route = createFileRoute("/_authenticated/tracks/$trackSlug")({
  head: ({ params }) => ({ meta: [{ title: `${params.trackSlug} · CareerLab` }, { name: "robots", content: "noindex" }] }),
  loader: async ({ context, params }) => {
    await requireWorkUnlocked(context.queryClient);
    await Promise.all([
      context.queryClient.ensureQueryData(trackQO(params.trackSlug)),
      context.queryClient.ensureQueryData(progressQO),
    ]);
  },
  component: TrackPage,
});

function TrackPage() {
  const { trackSlug } = Route.useParams();
  const { data } = useSuspenseQuery(trackQO(trackSlug));
  const { data: progress } = useSuspenseQuery(progressQO);
  const { track, field, levels, episodes } = data;
  const webgl = useWebGLSupport();

  const trackProgress = progress.trackProgress.find((p) => p.track_id === track.id);
  const completed = new Set(progress.completions.map((c) => c.episode_id));

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background">
      <ClientOnly fallback={null}>
        {webgl && (
          <div className="fixed inset-0 top-16 -z-0">
            <TrackMapScene
              trackName={track.name}
              levels={levels.map((l) => ({ id: l.id, name: l.name, status: l.status as string, description: l.description }))}
              episodes={episodes.map((e) => ({
                id: e.id,
                name: e.name,
                synopsis: e.synopsis,
                career_credit_reward: e.career_credit_reward,
                level_id: e.level_id,
              }))}
              completedIds={completed}
            />
          </div>
        )}
      </ClientOnly>

      {/* HUD overlay */}
      <div className="pointer-events-none relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="pointer-events-auto inline-block rounded-lg border border-line/50 bg-background/70 px-4 py-3 backdrop-blur-md">
          {field && (
            <Link
              to="/fields/$fieldSlug"
              params={{ fieldSlug: field.slug }}
              className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {field.name}
            </Link>
          )}
          <p className="mt-3 eyebrow">Career Track</p>
          <h1 className="font-display text-3xl leading-tight">{track.name}</h1>
          <p className="mt-1 max-w-md text-sm text-ink-dim">{track.tagline}</p>
        </div>

        <div className="pointer-events-auto absolute right-6 top-8 flex gap-3">
          <MiniStat label="Performance" value={trackProgress?.performance_points ?? 0} />
          <MiniStat label="Credit" value={trackProgress?.career_credits ?? 0} accent />
        </div>
      </div>

      {/* Fallback / SR list */}
      <div className={`relative z-10 mx-auto max-w-6xl px-6 pb-20 ${webgl ? "sr-only focus-within:not-sr-only" : "pt-4"}`}>
        <div className="space-y-8">
          {levels.map((lvl) => {
            const lvlEpisodes = episodes.filter((e) => e.level_id === lvl.id);
            const locked = lvl.status !== "active";
            return (
              <section key={lvl.id}>
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl">{lvl.name}</h2>
                  {locked && (
                    <span className="eyebrow inline-flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Segera Hadir
                    </span>
                  )}
                </div>
                {locked ? (
                  <div className="mt-4 surface-panel bg-background/85 backdrop-blur p-6 text-center text-ink-muted">
                    Proyek end-to-end untuk level Senior sedang dipersiapkan.
                  </div>
                ) : (
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    {lvlEpisodes.map((ep, idx) => {
                      const done = completed.has(ep.id);
                      return (
                        <Link
                          key={ep.id}
                          to="/episodes/$episodeId"
                          params={{ episodeId: ep.id }}
                          className="surface-panel bg-background/85 backdrop-blur p-5 hover:border-accent transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="eyebrow">Episode {idx + 1}</span>
                            <span className="eyebrow">{done ? "Selesai" : "Belum"}</span>
                          </div>
                          <h3 className="mt-2 font-display text-xl">{ep.name}</h3>
                          <p className="mt-1 text-sm text-ink-dim">{ep.synopsis}</p>
                          <div className="mt-3 flex items-center justify-between">
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
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="surface-panel bg-background/70 backdrop-blur-md px-4 py-3 min-w-24 text-center">
      <div className="eyebrow">{label}</div>
      <div className={`font-display text-2xl mt-1 ${accent ? "text-accent" : ""}`}>{value}</div>
    </div>
  );
}
