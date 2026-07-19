import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useState, Suspense, lazy } from "react";
import { getMission, submitMission } from "@/lib/careerlab.functions";
import { ClientOnly } from "@/components/client-only";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MissionScene = lazy(() => import("@/components/mission-scene").then(m => ({ default: m.MissionScene })));

const qo = (id: string) =>
  queryOptions({ queryKey: ["mission", id], queryFn: () => getMission({ data: { missionId: id } }) });

type Result = Awaited<ReturnType<typeof submitMission>>;

export const Route = createFileRoute("/_authenticated/missions/$missionId")({
  head: () => ({ meta: [{ title: "Mission · CareerLab" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(qo(params.missionId)),
  component: MissionPage,
});

function MissionPage() {
  const { missionId } = Route.useParams();
  const { data } = useSuspenseQuery(qo(missionId));
  const { mission, episode, siblings } = data;
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [choice, setChoice] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    setChoice(null);
    setResult(null);
  }, [missionId]);

  const mutation = useMutation({
    mutationFn: (decisions: Record<string, string>) => submitMission({ data: { missionId, decisions } }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries();
      if (r.completedEpisode) toast.success(`Episode selesai! +${r.creditsAwarded} Career Credit`);
      else if (r.passed) toast.success("Mission dilewati.");
      else toast.warning("Belum lulus — coba lagi.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gagal mengirim"),
  });

  const content = mission.content as Record<string, unknown>;
  const idx = siblings.findIndex(s => s.id === mission.id);
  const nextMission = idx >= 0 ? siblings[idx + 1] : null;

  const isDebug = mission.slug === "debug-ui";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {episode && (
        <Link to="/episodes/$episodeId" params={{ episodeId: episode.id }} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> {episode.name}
        </Link>
      )}
      <div className="mt-6 flex items-baseline justify-between">
        <div>
          <p className="eyebrow">Mission · {mission.type === "mission" ? "Decision" : "Micro-task"} · {mission.duration_minutes} menit</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">{mission.name}</h1>
        </div>
      </div>

      {!result ? (
        <div className="mt-10 grid lg:grid-cols-[1.15fr_1fr] gap-8">
          <div className="surface-panel p-8">
            <p className="eyebrow">Skenario</p>
            <p className="mt-4 text-lg leading-relaxed">{String(content.scenario ?? "")}</p>

            <div className="mt-8 space-y-3">
              {renderChoices(mission, content, choice, setChoice)}
            </div>

            <button
              disabled={!choice || mutation.isPending}
              onClick={() => choice && mutation.mutate({ choice })}
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-ink disabled:opacity-50"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Kirim keputusan
            </button>
          </div>

          <div className="min-h-[420px] lg:min-h-full surface-panel overflow-hidden relative">
            {isDebug ? (
              <ClientOnly fallback={<div className="h-full w-full grid place-items-center eyebrow">Memuat workspace 3D…</div>}>
                <Suspense fallback={<div className="h-full w-full grid place-items-center eyebrow">Memuat workspace 3D…</div>}>
                  <MissionScene
                    components={(content.components as Array<{ id: string; label: string; broken: boolean }>) ?? []}
                    selectedId={choice}
                    onSelect={setChoice}
                  />
                </Suspense>
              </ClientOnly>
            ) : (
              <div className="h-full p-8 flex flex-col justify-between">
                <div>
                  <p className="eyebrow">Konteks Kerja</p>
                  <h3 className="mt-4 font-display text-3xl">
                    {mission.type === "mission" ? "Ruang Standup" : "Antrean Review"}
                  </h3>
                  <p className="mt-3 text-ink-dim">
                    Bayangkan kamu berada di kantor tim frontend. Waktu jalan terus, keputusan harus tepat.
                  </p>
                </div>
                <div className="grid-bg h-32 rounded-md" />
              </div>
            )}
            <div className="absolute bottom-3 left-4 text-[10px] text-ink-muted font-mono-cl">
              WORKSPACE // {mission.slug.toUpperCase()}
            </div>
          </div>
        </div>
      ) : (
        <ResultPanel
          result={result}
          maxScore={Number(content.max_score ?? 5)}
          onRetry={() => { setResult(null); setChoice(null); }}
          nextHref={nextMission ? { missionId: nextMission.id } : null}
          episodeId={episode?.id}
        />
      )}
    </div>
  );
}

function renderChoices(
  mission: { slug: string; type: string },
  content: Record<string, unknown>,
  choice: string | null,
  setChoice: (id: string) => void,
) {
  if (mission.type === "mission" && Array.isArray(content.choices)) {
    return (content.choices as Array<{ id: string; text: string }>).map((c) => (
      <ChoiceBtn key={c.id} active={choice === c.id} onClick={() => setChoice(c.id)}>
        <span className="font-mono-cl text-xs mr-3 text-ink-muted">{c.id.toUpperCase()}</span>
        {c.text}
      </ChoiceBtn>
    ));
  }
  if (mission.slug === "debug-ui" && Array.isArray(content.components)) {
    return (
      <div>
        <p className="text-sm text-ink-dim mb-3">Rotasi workspace 3D di kanan, klik komponen yang rusak.</p>
        <div className="grid grid-cols-2 gap-2">
          {(content.components as Array<{ id: string; label: string }>).map(c => (
            <ChoiceBtn key={c.id} active={choice === c.id} onClick={() => setChoice(c.id)}>
              {c.label}
            </ChoiceBtn>
          ))}
        </div>
      </div>
    );
  }
  if (mission.slug === "code-review" && Array.isArray(content.diffs)) {
    return (content.diffs as Array<{ id: string; label: string }>).map(d => (
      <ChoiceBtn key={d.id} active={choice === d.id} onClick={() => setChoice(d.id)}>
        <span className="font-mono-cl text-xs mr-3 text-ink-muted">DIFF/{d.id.toUpperCase()}</span>
        {d.label}
      </ChoiceBtn>
    ));
  }
  return null;
}

function ChoiceBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-md border px-4 py-3 text-sm transition ${
        active ? "border-accent bg-accent/10 text-ink" : "border-line hover:border-line-strong text-ink-dim"
      }`}
    >
      {children}
    </button>
  );
}

function ResultPanel({
  result,
  maxScore,
  onRetry,
  nextHref,
  episodeId,
}: {
  result: Result;
  maxScore: number;
  onRetry: () => void;
  nextHref: { missionId: string } | null;
  episodeId?: string;
}) {
  return (
    <div className="mt-10 grid lg:grid-cols-[1fr_1.2fr] gap-8">
      <div className={`surface-panel p-8 ${result.completedEpisode ? "glow-accent" : ""}`}>
        <p className="eyebrow">Hasil</p>
        <div className="mt-4 flex items-baseline gap-4">
          <span className="font-display text-7xl text-accent">{result.score}</span>
          <span className="font-mono-cl text-ink-muted">/ {maxScore}</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm">
          {result.passed ? (
            <><CheckCircle2 className="h-4 w-4 text-accent" /> Lulus mission</>
          ) : (
            <><XCircle className="h-4 w-4 text-danger" /> Belum lulus (butuh {Math.ceil(maxScore * 0.6)})</>
          )}
        </div>
        <div className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-muted">Performance Δ</span>
            <span className={result.perfDelta >= 0 ? "text-accent" : "text-danger"}>
              {result.perfDelta >= 0 ? "+" : ""}{result.perfDelta} PP
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Career Credit</span>
            <span className="text-accent">+{result.creditsAwarded}</span>
          </div>
        </div>

        {result.completedEpisode && (
          <div className="mt-8 border-t border-line pt-6">
            <div className="flex items-center gap-2 text-accent">
              <Trophy className="h-5 w-5" />
              <p className="font-display text-xl">Episode selesai!</p>
            </div>
            <p className="mt-2 text-sm text-ink-dim">
              Kamu memperoleh {result.creditsAwarded} Career Credit. Progres tersimpan permanen untuk track ini.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={onRetry} className="rounded-md border border-line-strong px-4 py-2 text-sm hover:border-accent">
            Coba lagi
          </button>
          {nextHref && result.passed && (
            <Link to="/missions/$missionId" params={nextHref} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink inline-flex items-center gap-2">
              Mission berikutnya <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          {episodeId && (
            <Link to="/episodes/$episodeId" params={{ episodeId }} className="rounded-md border border-line px-4 py-2 text-sm">
              Kembali ke Episode
            </Link>
          )}
        </div>
      </div>

      <div className="surface-panel p-8">
        <p className="eyebrow">Evaluasi</p>
        <ul className="mt-4 space-y-4">
          {result.feedback.map((f, i) => (
            <li key={i} className="flex gap-3">
              <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${f.ok ? "bg-accent" : "bg-danger"}`} />
              <div>
                <p className="font-medium">{f.label}</p>
                <p className="mt-1 text-sm text-ink-dim leading-relaxed">{f.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
