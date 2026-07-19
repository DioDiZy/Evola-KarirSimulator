import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getEpisode, getMyMissionAttempts } from "@/lib/careerlab.functions";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock } from "lucide-react";

const epQO = (id: string) =>
  queryOptions({ queryKey: ["episode", id], queryFn: () => getEpisode({ data: { episodeId: id } }) });
const attemptsQO = (id: string) =>
  queryOptions({ queryKey: ["attempts", id], queryFn: () => getMyMissionAttempts({ data: { episodeId: id } }) });

export const Route = createFileRoute("/_authenticated/episodes/$episodeId")({
  head: () => ({ meta: [{ title: "Episode · CareerLab" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(epQO(params.episodeId));
    context.queryClient.ensureQueryData(attemptsQO(params.episodeId));
  },
  component: EpisodePage,
});

function EpisodePage() {
  const { episodeId } = Route.useParams();
  const { data } = useSuspenseQuery(epQO(episodeId));
  const { data: attempts } = useSuspenseQuery(attemptsQO(episodeId));
  const { episode, missions, track } = data;

  const passedIds = new Set(attempts.filter(a => a.passed).map(a => a.mission_id));
  const total = missions.length;
  const done = missions.filter(m => passedIds.has(m.id)).length;
  const progressPct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {track && (
        <Link to="/tracks/$trackSlug" params={{ trackSlug: track.slug }} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> {track.name}
        </Link>
      )}
      <p className="mt-6 eyebrow">Episode</p>
      <h1 className="mt-2 font-display text-5xl">{episode.name}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-dim">{episode.synopsis}</p>

      <div className="mt-8 surface-panel p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="eyebrow">Progres Episode</span>
            <span className="font-mono-cl">{done} / {total}</span>
          </div>
          <div className="h-1.5 bg-line rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="text-right">
          <div className="eyebrow">Reward</div>
          <div className="font-display text-xl text-accent">+{episode.career_credit_reward} credit</div>
        </div>
      </div>

      <ol className="mt-10 space-y-3">
        {missions.map((m, i) => {
          const passed = passedIds.has(m.id);
          const attempt = attempts.find(a => a.mission_id === m.id);
          return (
            <li key={m.id}>
              <Link to="/missions/$missionId" params={{ missionId: m.id }} className="surface-panel p-5 flex items-center gap-4 hover:border-accent transition group">
                <div className="w-10 h-10 rounded-md bg-surface-2 grid place-items-center">
                  {passed ? <CheckCircle2 className="h-5 w-5 text-accent" /> : <Circle className="h-5 w-5 text-ink-muted" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="eyebrow">Mission {i + 1} · {m.type === "mission" ? "Decision" : "Micro-task"}</span>
                    <span className="eyebrow inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {m.duration_minutes} menit</span>
                  </div>
                  <h3 className="mt-1 font-display text-2xl">{m.name}</h3>
                  {attempt && (
                    <p className="mt-1 text-xs text-ink-muted font-mono-cl">
                      Skor terakhir: {attempt.score}/{attempt.max_score}
                    </p>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-ink-muted group-hover:text-accent transition" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
