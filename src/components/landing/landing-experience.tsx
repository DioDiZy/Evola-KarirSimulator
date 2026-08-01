import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Code2,
  Palette,
  Target,
  Sparkles,
  Trophy,
} from "lucide-react";

import { MISSION_ENGINE_PANELS } from "./workstation-panels";

export function LandingExperience() {
  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />

        <div
          className="
            relative mx-auto grid min-h-[680px] max-w-7xl
            items-center px-4 pb-20 pt-32
            sm:px-6 sm:pb-24
            lg:min-h-[720px]
            lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]
            lg:gap-8
          "
        >
          <HeroContent />

          {/* Desktop only */}
          <DesktopCareerVisual />
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

function HeroContent() {
  return (
    <div className="relative z-10 max-w-4xl">
      <p className="eyebrow">Simulasi Kerja</p>

      <h1
        className="
          mt-6 font-display
          text-[clamp(2.7rem,11vw,4.5rem)]
          leading-[0.98] tracking-[-0.03em]
          sm:leading-[1.02]
          lg:text-[clamp(3.5rem,5.2vw,4.5rem)]
        "
      >
        Rasakan dunia kerja{" "}
        <span className="text-accent">sebelum benar-benar</span> memasukinya.
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
            text-accent-ink transition duration-200
            hover:-translate-y-0.5 hover:brightness-110
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-accent
            focus-visible:ring-offset-2
            sm:w-auto
          "
        >
          Coba Simulasi Pertamamu
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function DesktopCareerVisual() {
  return (
    <div
      className="
        relative hidden h-[560px] min-h-[560px]
        w-full lg:block
      "
      aria-hidden="true"
    >
      {/* Glow background */}
      <div
        className="
          pointer-events-none absolute left-1/2 top-1/2
          h-[380px] w-[380px]
          -translate-x-1/2 -translate-y-1/2
          rounded-full bg-blue-400/15 blur-3xl
        "
      />

      {/* Orbit line */}
      <div
        className="
          absolute left-1/2 top-1/2
          h-[300px] w-[300px]
          -translate-x-1/2 -translate-y-1/2
          rounded-full border border-dashed border-accent/20
        "
      />

      {/* Center logo card */}
      <div
        className="
          absolute left-1/2 top-1/2 z-10
          flex h-28 w-28 -translate-x-1/2 -translate-y-1/2
          items-center justify-center rounded-[28px]
          border border-line bg-white shadow-xl
        "
      >
        <img
          src="/evola.png"
          alt="Logo Evola"
          className="h-22 w-auto object-contain"
        />
      </div>

      {/* Career badges */}
      <CareerBadge
        icon={Code2}
        label="Programmer"
        className="left-4 top-[12%]"
      />

      <CareerBadge
        icon={Palette}
        label="UI/UX Designer"
        className="right-0 top-[28%]"
      />

      <CareerBadge
        icon={BarChart3}
        label="Data Analyst"
        className="left-8 bottom-[10%]"
      />
    </div>
  );
}

type CareerBadgeProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  className?: string;
};

function CareerBadge({ icon: Icon, label, className = "" }: CareerBadgeProps) {
  return (
    <div
      className={`
        absolute z-20 flex items-center gap-3
        rounded-full border border-line/70 bg-white
        px-4 py-3 text-sm font-medium text-ink
        shadow-md
        ${className}
      `}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/10">
        <Icon className="h-4 w-4 text-accent" />
      </span>
      <span>{label}</span>
    </div>
  );
}

function StaticHero() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 sm:pb-24">
          <HeroContent />
        </div>
      </section>

      <section className="border-t border-line/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <p className="eyebrow">Cara Evola Bekerja</p>

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
