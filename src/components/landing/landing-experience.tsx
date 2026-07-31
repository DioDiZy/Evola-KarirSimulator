import { Suspense, lazy, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Target, Trophy } from "lucide-react";

import { ClientOnly } from "@/components/client-only";
import { MISSION_ENGINE_PANELS } from "./workstation-panels";

const LandingScene = lazy(() =>
  import("./landing-scene").then((module) => ({
    default: module.LandingScene,
  })),
);

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
  const [mode, setMode] = useState<"checking" | "webgl" | "fallback">(
    "checking",
  );

  useEffect(() => {
    if (!checkWebGL() || prefersReducedMotion()) {
      setMode("fallback");
      return;
    }

    setMode("webgl");
  }, []);

  if (mode === "fallback") {
    return <StaticHero />;
  }

  return (
    <div className="relative">
      <section className="relative min-h-[100svh] overflow-hidden">
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
                inline-flex min-h-12 w-full items-center justify-center gap-2
                rounded-md bg-accent px-6 py-3 text-sm font-medium
                text-accent-ink transition hover:brightness-110 sm:w-auto
              "
            >
              Coba Simulasi Pertamamu
              <ArrowRight className="h-4 w-4" />
            </Link>
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

function HeroBackdrop() {
  return (
    <div className="grid h-full w-full place-items-center bg-gradient-to-b from-background via-background-secondary to-background">
      <div className="h-40 w-40 animate-pulse rounded-full bg-primary-cyan/10 blur-3xl" />
    </div>
  );
}

function StaticHero() {
  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden">
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
                inline-flex min-h-12 w-full items-center justify-center gap-2
                rounded-md bg-accent px-6 py-3 text-sm font-medium
                text-accent-ink transition hover:brightness-110 sm:w-auto
              "
            >
              Coba Simulasi Pertamamu
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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
