import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getMyProgress, listFields } from "@/lib/careerlab.functions";
import { useSession } from "@/hooks/use-session";
import { Trophy } from "lucide-react";

const progressQO = queryOptions({ queryKey: ["progress"], queryFn: () => getMyProgress() });
const fieldsQO = queryOptions({ queryKey: ["fields"], queryFn: () => listFields() });

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profil · CareerLab" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(progressQO);
    context.queryClient.ensureQueryData(fieldsQO);
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { data: progress } = useSuspenseQuery(progressQO);
  const { user } = useSession();
  const totalCredits = progress.trackProgress.reduce((s, p) => s + p.career_credits, 0);
  const totalPP = progress.trackProgress.reduce((s, p) => s + p.performance_points, 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="eyebrow">Profil Kamu</p>
      <h1 className="mt-2 font-display text-5xl">
        {(user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Kamu"}
      </h1>
      <p className="mt-2 text-ink-muted">{user?.email}</p>

      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        <Stat label="Total Career Credit" value={totalCredits} accent icon={<Trophy className="h-4 w-4" />} />
        <Stat label="Total Performance" value={totalPP} />
        <Stat label="Episode Selesai" value={progress.completions.length} />
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl">Progres per Track</h2>
        {progress.trackProgress.length === 0 ? (
          <p className="mt-4 text-ink-muted">Belum ada track yang kamu ikuti. Mulai dari Dashboard.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {progress.trackProgress.map(tp => (
              <li key={tp.id} className="surface-panel p-4 flex items-center justify-between">
                <span className="font-mono-cl text-sm text-ink-dim">Track {tp.track_id.slice(0, 8)}…</span>
                <div className="flex gap-4 text-sm">
                  <span>{tp.performance_points} PP</span>
                  <span className="text-accent">{tp.career_credits} credit</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent, icon }: { label: string; value: number; accent?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="surface-panel p-5">
      <div className="flex items-center gap-2 eyebrow">{icon}{label}</div>
      <p className={`mt-2 font-display text-4xl ${accent ? "text-accent" : ""}`}>{value}</p>
    </div>
  );
}
