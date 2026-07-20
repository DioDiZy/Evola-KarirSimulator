import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listFields, getMyProgress } from "@/lib/careerlab.functions";
import { CareerTunnel, type CareerTunnelField } from "@/components/dashboard/career-tunnel";

const fieldsQO = queryOptions({ queryKey: ["fields"], queryFn: () => listFields() });
const progressQO = queryOptions({ queryKey: ["progress"], queryFn: () => getMyProgress() });

const FIELD_MEDIA: Record<string, string> = {
  "ui-ux-designer": "/images/career/ui-ux-designer.webp",
  "frontend-developer": "/images/career/frontend-developer.webp",
  "backend-developer": "/images/career/backend-developer.webp",
  "ai-engineer": "/images/career/ai-engineer.webp",
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · CareerLab" }, { name: "robots", content: "noindex" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(fieldsQO),
      context.queryClient.ensureQueryData(progressQO),
    ]);
  },
  component: Dashboard,
});

function Dashboard() {
  const { data: fields } = useSuspenseQuery(fieldsQO);
  const { data: progress } = useSuspenseQuery(progressQO);
  const totalCredits = progress.trackProgress.reduce((s, p) => s + p.career_credits, 0);
  const totalPP = progress.trackProgress.reduce((s, p) => s + p.performance_points, 0);

  const careerFields: CareerTunnelField[] = fields.map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    tagline: f.tagline ?? "",
    status: f.status as string,
    mediaUrl: FIELD_MEDIA[f.slug] ?? null,
  }));

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
        <p className="eyebrow">Bidang Karier</p>
        <h2 className="mt-3 font-display text-3xl">Masuki lorong dan temukan bidangmu.</h2>
        <p className="mt-2 text-sm text-ink-dim max-w-2xl">
          Scroll untuk menyusuri koridor, lalu klik layar bidang untuk membuka detailnya.
        </p>
        <div className="mt-8">
          <CareerTunnel fields={careerFields} />
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
