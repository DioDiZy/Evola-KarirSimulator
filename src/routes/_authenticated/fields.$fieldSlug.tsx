import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, MousePointerClick } from "lucide-react";

import { getFieldBySlug } from "@/lib/careerlab.functions";
import { ClientOnly } from "@/components/client-only";
import { useWebGLSupport } from "@/hooks/use-webgl-support";
import { FieldChamberScene } from "@/components/game/field-chamber-scene";
import { requireWorkUnlocked } from "@/lib/work-gate";

const fieldQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["field", slug],
    queryFn: () =>
      getFieldBySlug({
        data: { slug },
      }),
  });

export const Route = createFileRoute("/_authenticated/fields/$fieldSlug")({
  head: ({ params }) => ({
    meta: [
      {
        title: `${params.fieldSlug} · Evola`,
      },
      {
        name: "robots",
        content: "noindex",
      },
    ],
  }),

  loader: async ({ context, params }) => {
    await requireWorkUnlocked(context.queryClient);
    return context.queryClient.ensureQueryData(fieldQueryOptions(params.fieldSlug));
  },

  component: FieldPage,
});

function FieldPage() {
  const { fieldSlug } = Route.useParams();

  const { data } = useSuspenseQuery(fieldQueryOptions(fieldSlug));

  const { field, tracks } = data;
  const webgl = useWebGLSupport();

  const chamberTracks = tracks.map((track) => ({
    id: track.id,
    slug: track.slug,
    name: track.name,
    tagline: track.tagline,
    status: track.status as string,
  }));

  const activeTrackCount = tracks.filter(
    (track) => track.status === "active",
  ).length;

  return (
    /*
     * Fixed dan z-index tinggi membuat halaman ini menjadi
     * pengalaman fullscreen serta menutupi navbar dari layout.
     */
    <main className="fixed inset-0 z-[9999] isolate h-dvh overflow-hidden bg-[#edf2f7] text-slate-950">
      {/* Background ketika scene belum selesai dimuat */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,#ffffff_0%,#eef4fa_42%,#dce5ef_100%)]" />

      {/* Scene 3D */}
      <ClientOnly fallback={<SceneLoading />}>
        {webgl ? (
          <div className="absolute inset-0 z-0">
            <FieldChamberScene tracks={chamberTracks} fieldName={field.name} />
          </div>
        ) : (
          <TrackFallback
            fieldName={field.name}
            fieldTagline={field.tagline}
            tracks={tracks}
          />
        )}
      </ClientOnly>

      {/* Overlay untuk mengurangi cahaya berlebihan */}
      {webgl && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-[#edf2f7] via-[#edf2f7]/65 to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-56 bg-gradient-to-t from-slate-950/30 via-slate-950/5 to-transparent" />

          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(15,23,42,0.10)_100%)]" />
        </>
      )}

      {/* Tombol kembali */}
      <div className="pointer-events-none absolute left-0 top-0 z-30 p-4 sm:p-6">
        <Link
          to="/dashboard"
          aria-label="Kembali ke dashboard"
          className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 text-sm font-medium text-slate-700 shadow-[0_12px_35px_rgba(15,23,42,0.12)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Kembali</span>
        </Link>
      </div>

      {/* Judul bagian tengah atas */}
      {webgl && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-20 pt-5 sm:pt-7">
          <div className="max-w-xl text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-slate-400 sm:text-[10px]">
              Pilih Profesi di Bidang Pilihanmu
            </p>
          </div>
        </div>
      )}

      {/* Instruksi desktop */}
      {webgl && (
        <div className="pointer-events-none absolute right-0 top-0 z-30 hidden p-6 md:block">
          <div className="flex max-w-[285px] items-start gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-[0_12px_35px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
              <MousePointerClick className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-900">
                Pilih jalur karier
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Klik salah satu monolit untuk melihat track dan memasuki
                simulasi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Informasi bidang bagian bawah */}
      {webgl && (
        <section className="pointer-events-none absolute inset-x-0 left-[-220] bottom-10 z-30 px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="mx-auto flex max-w-6xl items-end justify-between gap-4">
            <div className="max-w-[520px]  rounded-2xl border border-white/70 bg-white/75 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:px-6 sm:py-5">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  Evola Karir
                </span>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white">
                  {activeTrackCount} track aktif
                </span>
              </div>

              <h2 className="mt-3 font-display text-xl font-semibold leading-tight text-slate-950 sm:text-3xl">
                {field.name}
              </h2>

              <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
                {field.tagline}
              </p>

              <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-slate-600 md:hidden">
                <MousePointerClick className="h-3.5 w-3.5" />
                Sentuh salah satu monolit untuk memilih track.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Daftar tersembunyi untuk screen reader */}
      {webgl && (
        <nav
          aria-label="Daftar track karier"
          className="sr-only focus-within:not-sr-only"
        >
          {tracks.map((track) => {
            if (track.status !== "active") {
              return <span key={track.id}>{track.name}, segera hadir</span>;
            }

            return (
              <Link
                key={track.id}
                to="/tracks/$trackSlug"
                params={{
                  trackSlug: track.slug,
                }}
              >
                {track.name}
              </Link>
            );
          })}
        </nav>
      )}
    </main>
  );
}

function SceneLoading() {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,#ffffff_0%,#edf2f7_62%,#dce5ef_100%)]">
      <div className="flex flex-col items-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />

        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
          Menyiapkan ruang karier
        </p>
      </div>
    </div>
  );
}

type TrackFallbackProps = {
  fieldName: string;
  fieldTagline: string;
  tracks: Array<{
    id: string;
    slug: string;
    name: string;
    tagline: string;
    status: string;
  }>;
};

function TrackFallback({
  fieldName,
  fieldTagline,
  tracks,
}: TrackFallbackProps) {
  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-[#edf2f7] px-4 pb-12 pt-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            Bidang Karier
          </p>

          <h1 className="mt-2 font-display text-3xl font-semibold text-slate-950 sm:text-5xl">
            {fieldName}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
            {fieldTagline}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            Perangkat tidak mendukung tampilan 3D. Silakan pilih track melalui
            daftar berikut.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => {
            const disabled = track.status !== "active";

            const card = (
              <article
                className={[
                  "flex min-h-[220px] flex-col justify-between rounded-3xl border p-6",
                  "bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]",
                  "transition duration-300",
                  disabled
                    ? "border-slate-200 opacity-60"
                    : "border-slate-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-[0_24px_60px_rgba(15,23,42,0.13)]",
                ].join(" ")}
              >
                <div>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {disabled ? "Segera hadir" : "Track aktif"}
                  </span>

                  <h2 className="mt-4 font-display text-2xl font-semibold text-slate-950">
                    {track.name}
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {track.tagline}
                  </p>
                </div>

                {!disabled && (
                  <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    Masuk track
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </article>
            );

            if (disabled) {
              return <div key={track.id}>{card}</div>;
            }

            return (
              <Link
                key={track.id}
                to="/tracks/$trackSlug"
                params={{
                  trackSlug: track.slug,
                }}
              >
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
