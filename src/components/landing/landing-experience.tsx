import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  LoaderCircle,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { ClientOnly } from "@/components/client-only";
import { MISSION_ENGINE_PANELS } from "./workstation-panels";

const LandingScene = lazy(() =>
  import("./landing-scene").then((module) => ({
    default: module.LandingScene,
  })),
);

type ExperienceMode = "checking" | "webgl" | "fallback";

function checkWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");

    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function LandingExperience() {
  const [mode, setMode] = useState<ExperienceMode>("checking");

  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    if (!checkWebGL() || prefersReducedMotion()) {
      setMode("fallback");
      return;
    }

    setMode("webgl");
  }, []);

  /*
   * Jika WebGL gagal selesai dimuat dalam 15 detik,
   * gunakan tampilan statis agar pengguna tidak
   * terjebak pada loading terus-menerus.
   */
  useEffect(() => {
    if (mode !== "webgl" || sceneReady) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setMode("fallback");
    }, 15_000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [mode, sceneReady]);

  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
  }, []);

  if (mode === "checking") {
    return <LandingLoader standalone />;
  }

  if (mode === "fallback") {
    return <StaticHero />;
  }

  return (
    <div className="relative">
      <section className="relative h-[300svh] md:h-[300vh]">
        <div className="sticky top-0 isolate h-[100svh] w-full overflow-hidden bg-[#F8FAFC] md:h-screen">
          <ClientOnly fallback={null}>
            <Suspense fallback={null}>
              <LandingScene onReady={handleSceneReady} />
            </Suspense>
          </ClientOnly>

          {!sceneReady && <LandingLoader />}

          <div
            aria-hidden="true"
            className="
              pointer-events-none absolute inset-0 z-10 md:hidden
              bg-[linear-gradient(to_bottom,rgba(248,250,252,0.72)_0%,rgba(248,250,252,0.26)_45%,rgba(248,250,252,0.58)_72%,rgba(248,250,252,0.94)_100%)]
            "
          />

          <div
            className={`
              pointer-events-none absolute inset-0 z-20 flex flex-col
              transition-all duration-700 ease-out
              ${
                sceneReady
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }
            `}
          >
            <div className="flex flex-1 items-start pt-28 md:items-center md:pt-0">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
                <div className="pointer-events-auto max-w-2xl">
                  <p className="eyebrow text-ink-muted">Simulasi Kerja</p>

                  <h1 className="mt-5 font-display text-[clamp(2.5rem,11vw,4.5rem)] leading-[0.98] tracking-[-0.03em] text-ink sm:mt-6 sm:leading-[1.05]">
                    Rasakan dunia kerja
                    <br />
                    <span className="text-accent">sebelum benar-benar</span>
                    <br />
                    memasukinya.
                  </h1>

                  <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-dim sm:mt-6 sm:text-lg">
                    Masuki lingkungan kerja virtual. Hadapi situasi profesional.
                    Ambil keputusan. Kerjakan micro-task nyata. Bangun performa
                    dan Career Credit-mu sebelum wawancara pertama.
                  </p>

                  <div className="mt-7 flex flex-col items-stretch gap-3 sm:mt-10 sm:flex-row sm:items-center">
                    <Link
                      to="/auth"
                      search={{ mode: "signup" }}
                      className="
                        inline-flex min-h-12 w-full items-center
                        justify-center gap-2 rounded-md bg-primary
                        px-6 py-3 text-sm font-medium
                        text-primary-foreground transition
                        hover:brightness-110 sm:w-auto
                      "
                    >
                      Mulai Mission Pertama
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>

                    <Link
                      to="/auth"
                      className="
                        inline-flex min-h-12 w-full items-center
                        justify-center gap-2 rounded-md border
                        border-line bg-surface/90 px-6 py-3
                        text-sm font-medium text-ink
                        backdrop-blur-md transition
                        hover:bg-surface-2 sm:w-auto
                      "
                    >
                      Saya sudah punya akun
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="pb-6 sm:pb-10">
              <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <dl className="pointer-events-auto grid max-w-2xl grid-cols-3 gap-2 sm:gap-6">
                  {[
                    {
                      k: "5–20",
                      v: "menit micro-task",
                    },
                    {
                      k: "4+",
                      v: "bidang karier",
                    },
                    {
                      k: "3D",
                      v: "workspace nyata",
                    },
                  ].map((item) => (
                    <div
                      key={item.v}
                      className="
                        min-w-0 rounded-lg border border-line
                        bg-surface/90 px-3 py-3 backdrop-blur-md
                        sm:px-4
                      "
                    >
                      <dt className="font-display text-2xl text-primary-cyan sm:text-3xl">
                        {item.k}
                      </dt>

                      <dd className="eyebrow mt-1 break-words text-[9px] leading-relaxed sm:text-[10px]">
                        {item.v}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="eyebrow mt-4 hidden text-[10px] text-ink-muted sm:block">
                  Scroll to explore · Career Core
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="sr-only"
        aria-label="Bagaimana Mission Engine Bekerja"
      >
        <h2>Bukan kursus. Bukan kuis. Ini simulasi kerja.</h2>

        <ul>
          {MISSION_ENGINE_PANELS.map((panel) => (
            <li key={panel.title}>
              <strong>{panel.title}</strong>: {panel.body}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function LandingLoader({ standalone = false }: { standalone?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Memuat pengalaman Evola"
      className={`
        z-50 flex items-center justify-center bg-[#F8FAFC]
        ${standalone ? "min-h-[100svh] w-full" : "absolute inset-0"}
      `}
    >
      <div className="flex flex-col items-center px-6 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400/10" />

          <div className="absolute inset-2 animate-pulse rounded-full border border-cyan-400/30" />

          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg shadow-slate-900/10">
            <LoaderCircle className="h-7 w-7 animate-spin text-violet-600" />
          </div>
        </div>

        <p className="mt-6 font-display text-2xl tracking-[0.25em] text-slate-900">
          EVOLA
        </p>

        <p className="mt-3 text-sm text-slate-500">
          Menyiapkan dunia kerja virtual
        </p>

        <div className="mt-6 h-1 w-44 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-cyan-400 to-violet-600" />
        </div>

        <span className="sr-only">Sedang memuat, mohon tunggu.</span>
      </div>
    </div>
  );
}

function StaticHero() {
  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden bg-background">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 sm:pb-24">
          <p className="eyebrow">Simulasi Kerja</p>

          <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.7rem,11vw,4.5rem)] leading-[0.98] tracking-[-0.03em] sm:leading-[1.02]">
            Rasakan dunia kerja{" "}
            <span className="text-accent">sebelum benar-benar</span>{" "}
            memasukinya.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-dim sm:text-lg">
            Hadapi situasi kerja, ambil keputusan, dan selesaikan tugas seperti
            seorang profesional. Bangun pengalaman dan rekam jejakmu sebelum
            memasuki dunia kerja.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="
                inline-flex min-h-12 w-full items-center
                justify-center gap-2 rounded-md bg-accent
                px-6 py-3 text-sm font-medium text-accent-ink
                transition hover:brightness-110 sm:w-auto
              "
            >
              Coba Simulasi Pertamamu
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/auth"
              className="
                inline-flex min-h-12 w-full items-center
                justify-center rounded-md border border-line
                bg-surface/80 px-6 py-3 text-sm font-medium
                text-ink sm:w-auto
              "
            >
              Saya sudah punya akun
            </Link>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-2 sm:mt-14 sm:gap-6">
            {[
              {
                k: "5–20",
                v: "menit micro-task",
              },
              {
                k: "4+",
                v: "bidang karier",
              },
              {
                k: "3D",
                v: "workspace nyata",
              },
            ].map((item) => (
              <div
                key={item.v}
                className="rounded-lg border border-line bg-surface/80 p-3 sm:border-0 sm:bg-transparent sm:p-0"
              >
                <dt className="font-display text-2xl text-accent sm:text-3xl">
                  {item.k}
                </dt>

                <dd className="eyebrow mt-1 break-words text-[9px] leading-relaxed sm:text-[10px]">
                  {item.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-line/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <p className="eyebrow">Bagaimana Mission Engine Bekerja</p>

          <h2 className="mt-4 max-w-2xl font-display text-4xl sm:text-5xl">
            Bukan kursus. Bukan kuis. Ini simulasi kerja.
          </h2>

          <div className="mt-12 grid gap-6 md:mt-14 md:grid-cols-3">
            {[
              {
                icon: Target,
                ...MISSION_ENGINE_PANELS[0],
              },
              {
                icon: Sparkles,
                ...MISSION_ENGINE_PANELS[1],
              },
              {
                icon: Trophy,
                ...MISSION_ENGINE_PANELS[2],
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="surface-panel p-6 sm:p-8">
                  <Icon className="h-6 w-6 text-accent" />

                  <h3 className="mt-6 font-display text-2xl">{item.title}</h3>

                  <p className="mt-3 leading-relaxed text-ink-dim">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
