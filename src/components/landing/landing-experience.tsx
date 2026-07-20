import { Suspense, lazy, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Target, Trophy } from "lucide-react";
import { ClientOnly } from "@/components/client-only";
import { MISSION_ENGINE_PANELS } from "./workstation-panels";

const LandingScene = lazy(() =>
  import("./landing-scene").then((m) => ({ default: m.LandingScene })),
);

function checkWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")),
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

/**
 * Hero + Mission Engine experience:
 *  - Full-viewport 3D canvas
 *  - Accessible DOM overlay with hero copy & CTAs
 *  - Scroll drives 3D camera; when the viewport reaches end of experience,
 *    the rest of the page (Career Fields, Final CTA) continues normally.
 */
export function LandingExperience() {
  const [mode, setMode] = useState<"checking" | "webgl" | "fallback">("checking");

  useEffect(() => {
    if (!checkWebGL() || prefersReducedMotion()) {
      setMode("fallback");
    } else {
      setMode("webgl");
    }
  }, []);

  if (mode === "fallback") {
    return <StaticHero />;
  }

  return (
    <div className="relative">
      {/* 3D experience container: 3 pages tall so ScrollControls has scroll room */}
      <section className="relative h-[300vh]">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <ClientOnly fallback={<HeroBackdrop />}>
            <Suspense fallback={<HeroBackdrop />}>
              {mode === "webgl" ? <LandingScene /> : <HeroBackdrop />}
            </Suspense>
          </ClientOnly>

          {/* DOM overlay — accessible, keyboard navigable */}
          <div className="pointer-events-none absolute inset-0 flex flex-col">
            <div className="flex-1 flex items-center">
              <div className="mx-auto w-full max-w-7xl px-6">
                <div className="max-w-2xl pointer-events-auto">
                  <p className="eyebrow text-white/80">Career Simulation · Bahasa Indonesia</p>
                  <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02] text-white [text-shadow:_0_4px_40px_rgba(0,0,0,0.6)]">
                    Rasakan dunia kerja
                    <br />
                    <span className="text-accent">sebelum benar-benar</span>
                    <br />
                    memasukinya.
                  </h1>
                  <p className="mt-6 max-w-xl text-lg text-ink-dim leading-relaxed [text-shadow:_0_2px_20px_rgba(0,0,0,0.6)]">
                    Masuki lingkungan kerja virtual. Hadapi situasi profesional. Ambil keputusan.
                    Kerjakan micro-task nyata. Bangun performa dan Career Credit-mu — sebelum
                    wawancara pertama.
                  </p>
                  <div className="mt-10 flex flex-wrap items-center gap-3">
                    <Link
                      to="/auth"
                      search={{ mode: "signup" }}
                      className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-ink hover:brightness-110 transition"
                    >
                      Mulai Mission Pertama <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/auth"
                      className="inline-flex items-center gap-2 rounded-md border border-white/25 bg-black/30 backdrop-blur px-6 py-3 text-sm font-medium text-white hover:border-accent transition"
                    >
                      Saya sudah punya akun
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom row: stat panels as floating glass labels around Career Core */}
            <div className="pb-10">
              <div className="mx-auto max-w-7xl px-6">
                <dl className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl pointer-events-auto">
                  {[
                    { k: "5–20", v: "menit micro-task" },
                    { k: "4+", v: "bidang karier" },
                    { k: "3D", v: "workspace nyata" },
                  ].map((s) => (
                    <div
                      key={s.v}
                      className="rounded-lg border border-white/10 bg-black/40 backdrop-blur-md px-4 py-3"
                    >
                      <dt className="font-display text-2xl sm:text-3xl text-accent">{s.k}</dt>
                      <dd className="eyebrow mt-1 text-[10px]">{s.v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-6 eyebrow text-white/50 text-[10px]">
                  Scroll to explore · Career Core
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accessible text alternative for content rendered inside Canvas panels */}
      <section className="sr-only" aria-label="Bagaimana Mission Engine Bekerja">
        <h2>Bukan kursus. Bukan kuis. Ini simulasi kerja.</h2>
        <ul>
          {MISSION_ENGINE_PANELS.map((p) => (
            <li key={p.title}>
              <strong>{p.title}</strong>: {p.body}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function HeroBackdrop() {
  return (
    <div className="h-full w-full bg-gradient-to-b from-[#02060c] via-[#06101f] to-[#02060c] grid place-items-center">
      <div className="h-40 w-40 rounded-full bg-accent/10 blur-3xl animate-pulse" />
    </div>
  );
}

/**
 * 2D fallback for no-WebGL / reduced-motion users.
 * Uses the same copy as the 3D experience.
 */
function StaticHero() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 pt-32 pb-24">
          <p className="eyebrow">Career Simulation · Bahasa Indonesia</p>
          <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02] max-w-4xl">
            Rasakan dunia kerja <span className="text-accent">sebelum benar-benar</span>{" "}
            memasukinya.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-dim leading-relaxed">
            Masuki lingkungan kerja virtual. Hadapi situasi profesional. Ambil keputusan. Kerjakan
            micro-task nyata. Bangun performa dan Career Credit-mu — sebelum wawancara pertama.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-ink"
            >
              Mulai Mission Pertama <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-md border border-line-strong px-6 py-3 text-sm font-medium"
            >
              Saya sudah punya akun
            </Link>
          </div>
          <dl className="mt-14 grid grid-cols-3 gap-6 max-w-lg">
            {[
              { k: "5–20", v: "menit micro-task" },
              { k: "4+", v: "bidang karier" },
              { k: "3D", v: "workspace nyata" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-display text-3xl text-accent">{s.k}</dt>
                <dd className="eyebrow mt-1">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-line/60">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="eyebrow">Bagaimana Mission Engine Bekerja</p>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl max-w-2xl">
            Bukan kursus. Bukan kuis. Ini simulasi kerja.
          </h2>
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, ...MISSION_ENGINE_PANELS[0] },
              { icon: Sparkles, ...MISSION_ENGINE_PANELS[1] },
              { icon: Trophy, ...MISSION_ENGINE_PANELS[2] },
            ].map((it) => (
              <div key={it.title} className="surface-panel p-8">
                <it.icon className="h-6 w-6 text-accent" />
                <h3 className="mt-6 font-display text-2xl">{it.title}</h3>
                <p className="mt-3 text-ink-dim leading-relaxed">{it.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
