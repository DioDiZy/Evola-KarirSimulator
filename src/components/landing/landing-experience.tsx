import { Suspense, lazy, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Sparkles, Target, Trophy } from "lucide-react";

import { ClientOnly } from "@/components/client-only";
import { MISSION_ENGINE_PANELS } from "./workstation-panels";

const LandingScene = lazy(() =>
  import("./landing-scene").then((module) => ({
    default: module.LandingScene,
  })),
);

type LandingMode = "checking" | "webgl" | "fallback";

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
  const [mode, setMode] = useState<LandingMode>("checking");

  useEffect(() => {
    if (!checkWebGL() || prefersReducedMotion()) {
      setMode("fallback");
      return;
    }

    setMode("webgl");
  }, []);

  return (
    <div className="relative">
      {/* Hero sepenuhnya 2D */}
      <HeroSection />

      {/* Konten setelah Hero */}
      {mode === "fallback" ? (
        <MissionEngineFallback />
      ) : (
        <MissionEngineScene mode={mode} />
      )}

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

function HeroSection() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-background">
      {/* Hanya dekorasi 2D sederhana */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,250,252,1)_68%,rgba(239,246,255,1)_100%)]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute left-1/2 top-[42%] -z-10
          h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2
          rounded-full bg-primary-cyan/5 blur-[100px]
          sm:h-[600px] sm:w-[600px]
        "
      />

      <div className="mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col px-4 pb-8 pt-32 sm:px-6 sm:pb-10 sm:pt-36 lg:px-8">
        <div className="flex flex-1 items-center">
          <div className="max-w-4xl">
            <p className="eyebrow text-ink-muted">Simulasi Kerja</p>

            <h1
              className="
                mt-5 max-w-4xl font-display
                text-[clamp(3.2rem,11vw,7rem)]
                leading-[0.88] tracking-[-0.045em] text-ink
                sm:mt-6 sm:leading-[0.9]
              "
            >
              Rasakan dunia kerja
              <br />
              <span className="text-accent">sebelum benar-benar</span>
              <br />
              memasukinya.
            </h1>

            <p
              className="
                mt-7 max-w-2xl text-base leading-relaxed text-ink-dim
                sm:mt-8 sm:text-lg
              "
            >
              Hadapi situasi kerja, ambil keputusan, dan selesaikan tugas
              seperti seorang profesional. Bangun pengalaman dan rekam jejakmu
              sebelum memasuki dunia kerja.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="
                  inline-flex min-h-12 w-full items-center justify-center gap-2
                  rounded-md bg-primary px-6 py-3 text-sm font-medium
                  text-primary-foreground transition duration-200
                  hover:brightness-110 sm:w-auto
                "
              >
                Mulai Mission Pertama
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>

              <Link
                to="/auth"
                className="
                  inline-flex min-h-12 w-full items-center justify-center
                  rounded-md border border-line bg-surface px-6 py-3
                  text-sm font-medium text-ink transition duration-200
                  hover:bg-surface-2 sm:w-auto
                "
              >
                Saya sudah punya akun
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 sm:mt-16">
          <dl className="grid max-w-2xl grid-cols-3 gap-2 sm:gap-4">
            {[
              {
                value: "5–20",
                label: "menit micro-task",
              },
              {
                value: "4+",
                label: "bidang karier",
              },
              {
                value: "3D",
                label: "workspace nyata",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="
                  min-w-0 rounded-lg border border-line bg-surface
                  px-3 py-4 sm:px-5 sm:py-5
                "
              >
                <dt className="font-display text-2xl text-primary-cyan sm:text-3xl">
                  {item.value}
                </dt>

                <dd className="eyebrow mt-2 break-words text-[9px] leading-relaxed sm:text-[10px]">
                  {item.label}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex items-center gap-2 text-ink-muted">
            <ArrowDown className="h-4 w-4 animate-bounce" />

            <span className="eyebrow text-[10px]">
              Scroll untuk masuk ke Career Core
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function MissionEngineScene({ mode }: { mode: LandingMode }) {
  return (
    <section
      className="
        relative h-[300svh] border-t border-line/60 bg-background
        md:h-[300vh]
      "
      aria-label="Career Core 3D Experience"
    >
      <div
        className="
          sticky top-0 isolate h-[100svh] w-full overflow-hidden
          bg-background md:h-screen
        "
      >
        <ClientOnly fallback={<SceneBackdrop />}>
          <Suspense fallback={<SceneBackdrop />}>
            {mode === "webgl" ? <LandingScene /> : <SceneBackdrop />}
          </Suspense>
        </ClientOnly>

        {/* Informasi kecil pada section 3D, bukan di Hero */}
        <div
          className="
            pointer-events-none absolute inset-x-0 top-0 z-20
            bg-gradient-to-b from-background/95 via-background/30
            to-transparent px-4 pb-16 pt-8
            sm:px-6
          "
        >
          <div className="mx-auto flex max-w-7xl items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-ink-muted">Career Core</p>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-dim">
                Scroll untuk menjelajahi lingkungan simulasi kerja.
              </p>
            </div>

            <div
              className="
                hidden rounded-full border border-line bg-surface/80
                px-4 py-2 backdrop-blur-md sm:block
              "
            >
              <span className="eyebrow text-[10px]">Interactive 3D</span>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-x-0 bottom-0 z-20
            h-24 bg-gradient-to-t from-background/80 to-transparent
          "
        />
      </div>
    </section>
  );
}

function SceneBackdrop() {
  return (
    <div className="grid h-full w-full place-items-center bg-background">
      <div className="h-40 w-40 animate-pulse rounded-full bg-primary-cyan/10 blur-3xl" />
    </div>
  );
}

function MissionEngineFallback() {
  const panels = [
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
  ];

  return (
    <section className="border-t border-line/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <p className="eyebrow text-ink-muted">
          Bagaimana Mission Engine Bekerja
        </p>

        <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-ink sm:text-5xl">
          Bukan kursus. Bukan kuis. Ini simulasi kerja.
        </h2>

        <div className="mt-12 grid gap-6 md:mt-14 md:grid-cols-3">
          {panels.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="
                  rounded-xl border border-line bg-surface
                  p-6 sm:p-8
                "
              >
                <Icon className="h-6 w-6 text-accent" />

                <h3 className="mt-6 font-display text-2xl text-ink">
                  {item.title}
                </h3>

                <p className="mt-3 leading-relaxed text-ink-dim">{item.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
