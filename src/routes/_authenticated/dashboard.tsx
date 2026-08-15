import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listFields, getMyProgress } from "@/lib/careerlab.functions";
import { CareerTunnel, type CareerTunnelField } from "@/components/dashboard/career-tunnel";
import { Link } from "@tanstack/react-router";
import { getRoleAccess } from "@/lib/intern.functions";
import { ROLE_META, ROLE_ORDER, type InternRole } from "@/lib/intern-roles";
import { ArrowRight, Lock, CheckCircle2, MessageSquare } from "lucide-react";
import { workGateProgress, type RoleAccessItem } from "@/lib/work-gate";

const rolesQO = queryOptions({ queryKey: ["intern", "role-access"], queryFn: () => getRoleAccess() });

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
      context.queryClient.ensureQueryData(rolesQO),
    ]);
  },
  component: Dashboard,
});

function Dashboard() {
  const { data: fields } = useSuspenseQuery(fieldsQO);
  const { data: progress } = useSuspenseQuery(progressQO);
  const { data: rolesData } = useSuspenseQuery(rolesQO);
  const roles = rolesData as RoleAccessItem[];
  const gate = workGateProgress(roles);
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

      <section className="mt-8 surface-panel p-6 sm:p-8">
        <p className="eyebrow inline-flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> Langkah pertama · Role Magang
        </p>
        <h2 className="mt-3 font-display text-3xl">
          {gate.unlocked ? "Magang selesai — simulasi kerja terbuka." : "Selesaikan magang dulu lewat room chat."}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-dim">
          {gate.unlocked
            ? "Kamu sudah lulus tahap Magang. Room chat tetap terbuka kalau mau menambah misi."
            : `Di role Magang kamu dibimbing AI Senior lewat room chat dengan pilihan jawaban. Selesaikan ${gate.required} misi Magang (${gate.done}/${gate.required}) untuk membuka simulasi kerja role Pekerja.`}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/magang"
            search={{ role: "magang" as InternRole }}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:brightness-110"
          >
            {gate.done > 0 ? "Lanjutkan room chat magang" : "Mulai room chat magang"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <span className="font-mono-cl text-xs text-ink-muted">
            Progres magang {gate.done}/{gate.required}
          </span>
        </div>
      </section>

      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        <Stat label="Career Credit" value={totalCredits} accent />
        <Stat label="Performance Points" value={totalPP} />
        <Stat label="Track diikuti" value={progress.trackProgress.length} />
      </div>

      <section className="mt-14">
        <p className="eyebrow">Jalur Role</p>
        <h2 className="mt-3 font-display text-3xl">Mulai dari Magang, naik ke Pekerja, lalu Senior.</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-dim">
          Semua role memakai bidang karier yang sama, hanya tingkat kesulitan misinya yang berbeda.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {ROLE_ORDER.map((r) => {
            const stat = roles.find((x) => x.role === r);
            const meta = ROLE_META[r];
            const unlocked = stat?.unlocked ?? false;
            return unlocked ? (
              <Link
                key={r}
                to="/magang"
                search={{ role: r }}
                className="surface-panel group p-5 transition hover:border-primary-cyan"
              >
                <p className="eyebrow inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-cyan" aria-hidden="true" /> {meta.difficulty}
                </p>
                <p className="mt-2 font-display text-2xl">Role {meta.label}</p>
                <p className="mt-1 text-xs text-ink-muted">{stat?.completedMissions ?? 0} misi selesai</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary-cyan">
                  Buka misi <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ) : (
              <div key={r} className="surface-panel p-5 opacity-75">
                <p className="eyebrow inline-flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Terkunci
                </p>
                <p className="mt-2 font-display text-2xl">Role {meta.label}</p>
                <p className="mt-1 text-xs text-ink-muted">{meta.requirement}</p>
              </div>
            );
          })}
        </div>
        <Link to="/roles" className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-dim hover:text-ink">
          Lihat detail tingkatan role <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </section>

      <div className="mt-16">
        <p className="eyebrow">Bidang Karier · Simulasi Kerja</p>
        <h2 className="mt-3 font-display text-3xl">Masuki lorong dan temukan bidangmu.</h2>
        {gate.unlocked ? (
          <>
            <p className="mt-2 text-sm text-ink-dim max-w-2xl">
              Scroll untuk menyusuri koridor, lalu klik layar bidang untuk membuka detailnya.
            </p>
            <div className="mt-8">
              <CareerTunnel fields={careerFields} />
            </div>
          </>
        ) : (
          <div className="mt-6 surface-panel p-6 sm:p-8">
            <p className="eyebrow inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Terkunci
            </p>
            <p className="mt-3 max-w-2xl text-sm text-ink-dim">
              Koridor bidang karier berisi misi kerja tingkat Pekerja. Terbuka setelah {gate.required} misi
              Magang selesai ({gate.done}/{gate.required}).
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {careerFields.map((f) => (
                <li key={f.id} className="rounded-lg border border-line px-4 py-3 text-sm text-ink-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" /> {f.name}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              to="/magang"
              search={{ role: "magang" as InternRole }}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-5 text-sm hover:border-primary-cyan"
            >
              Kerjakan misi magang <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
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
