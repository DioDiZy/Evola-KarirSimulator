import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listFields, getMyProgress } from "@/lib/careerlab.functions";
import { ArrowRight } from "lucide-react";

const fieldsQO = queryOptions({ queryKey: ["fields"], queryFn: () => listFields() });
const progressQO = queryOptions({ queryKey: ["progress"], queryFn: () => getMyProgress() });

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · CareerLab" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(fieldsQO);
    context.queryClient.ensureQueryData(progressQO);
  },
  component: Dashboard,
});

function Dashboard() {
  const { data: fields } = useSuspenseQuery(fieldsQO);
  const { data: progress } = useSuspenseQuery(progressQO);
  const totalCredits = progress.trackProgress.reduce((s, p) => s + p.career_credits, 0);
  const totalPP = progress.trackProgress.reduce((s, p) => s + p.performance_points, 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <p className="eyebrow">Selamat datang kembali</p>
      <h1 className="mt-3 font-display text-5xl">Ke mana hari ini?</h1>

      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        <Stat label="Career Credit" value={totalCredits} accent />
        <Stat label="Performance Points" value={totalPP} />
        <Stat label="Track diikuti" value={progress.trackProgress.length} />
      </div>

      <div className="mt-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Bidang Karier</p>
            <h2 className="mt-3 font-display text-3xl">Pilih bidang untuk mulai.</h2>
          </div>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fields.map((f) => {
            const s = f.status as string;
            const disabled = s !== "active";
            const inner = (
              <div className={`surface-panel p-6 min-h-[200px] flex flex-col justify-between transition ${disabled ? "opacity-60" : "hover:border-accent"}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${s === "active" ? "bg-accent" : "bg-ink-muted/50"}`} />
                    <span className="eyebrow">{s === "active" ? "Aktif" : s === "preview" ? "Preview" : "Segera Hadir"}</span>
                  </div>
                  <h3 className="mt-4 font-display text-2xl">{f.name}</h3>
                  <p className="mt-2 text-sm text-ink-dim">{f.tagline}</p>
                </div>
                {!disabled && (
                  <span className="text-accent text-sm inline-flex items-center gap-1 mt-4">
                    Buka <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            );
            return disabled ? (
              <div key={f.id}>{inner}</div>
            ) : (
              <Link key={f.id} to="/fields/$fieldSlug" params={{ fieldSlug: f.slug }}>{inner}</Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="surface-panel p-6">
      <p className="eyebrow">{label}</p>
      <p className={`mt-2 font-display text-4xl ${accent ? "text-accent" : ""}`}>{value}</p>
    </div>
  );
}
