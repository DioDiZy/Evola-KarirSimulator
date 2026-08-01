import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Lock, Sparkles } from "lucide-react";
import { getRoleAccess } from "@/lib/intern.functions";
import { ROLE_META, ROLE_ORDER } from "@/lib/intern-roles";

const accessQO = queryOptions({ queryKey: ["intern", "role-access"], queryFn: () => getRoleAccess() });

export const Route = createFileRoute("/_authenticated/roles")({
  head: () => ({
    meta: [
      { title: "Tingkatan Role · CareerLab" },
      { name: "description", content: "Buka role Magang, Pekerja, dan Senior secara bertahap di CareerLab." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(accessQO),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-6 py-16" role="alert">
      <h1 className="font-display text-3xl">Gagal memuat tingkatan role</h1>
      <p className="mt-2 text-sm text-ink-dim">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl">Halaman tidak ditemukan</h1>
    </div>
  ),
  component: RolesPage,
});

function RolesPage() {
  const { data: roles } = useSuspenseQuery(accessQO);
  const byRole = new Map(roles.map((r) => [r.role, r]));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-12">
      <p className="eyebrow inline-flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Jalur Karier
      </p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Naik tingkat, satu role demi satu.</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-dim">
        Semua akun baru mulai sebagai <strong>Magang</strong>. Selesaikan 2 misi Magang untuk membuka role
        Pekerja, lalu 2 misi Pekerja untuk membuka role Senior. Bidang kariernya sama — yang berbeda hanya
        tingkat kesulitan misinya.
      </p>

      <ol className="mt-10 space-y-4">
        {ROLE_ORDER.map((role, i) => {
          const meta = ROLE_META[role];
          const stat = byRole.get(role);
          const unlocked = stat?.unlocked ?? false;
          const prev = meta.unlockedBy ? byRole.get(meta.unlockedBy) : null;

          return (
            <li
              key={role}
              className={`surface-panel p-5 sm:p-6 ${unlocked ? "" : "opacity-80"}`}
              aria-current={unlocked ? undefined : undefined}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-cl text-[11px] uppercase tracking-widest text-ink-muted">
                      Level {i + 1}
                    </span>
                    <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-ink-muted">
                      {meta.difficulty}
                    </span>
                    {unlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary-cyan/40 bg-primary-cyan/10 px-2.5 py-0.5 text-[11px] text-primary-cyan">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Terbuka
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-line-strong px-2.5 py-0.5 text-[11px] text-ink-muted">
                        <Lock className="h-3 w-3" aria-hidden="true" /> Terkunci
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 font-display text-2xl leading-tight">Role {meta.label}</h2>
                  <p className="mt-1.5 text-sm text-ink-dim">{meta.blurb}</p>

                  <p className="mt-3 text-xs text-ink-muted">
                    {unlocked ? (
                      <>
                        {stat?.completedMissions ?? 0} misi {meta.label} selesai · {stat?.credits ?? 0} kredit
                      </>
                    ) : (
                      <>
                        {meta.requirement} Progres:{" "}
                        <span className="text-ink-dim">
                          {Math.min(prev?.completedMissions ?? 0, stat?.requiredMissions ?? 2)}/
                          {stat?.requiredMissions ?? 2}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {unlocked ? (
                  <Link
                    to="/magang"
                    search={{ role }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:brightness-110"
                  >
                    Masuk role {meta.label}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-5 text-sm text-ink-muted">
                    <Lock className="h-4 w-4" aria-hidden="true" /> Terkunci
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
