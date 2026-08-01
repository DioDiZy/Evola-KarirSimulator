import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Code2, Palette } from "lucide-react";

import { MISSION_ENGINE_PANELS } from "./workstation-panels";

export function LandingExperience() {
  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        {/* Grid background */}
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

          {/* Hanya tampil pada desktop */}
          <DesktopCareerVisual />
        </div>
      </section>

      {/* Informasi tambahan untuk screen reader */}
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
      {/* Glow besar di belakang semua objek */}
      <div
        className="
          pointer-events-none absolute left-1/2 top-1/2
          h-[420px] w-[420px]
          -translate-x-1/2 -translate-y-1/2
          rounded-full bg-[#7C3AED]/10 blur-3xl
        "
      />

      {/* Orbit luar */}
      <div
        className="
          absolute left-1/2 top-1/2
          h-[310px] w-[310px]
          -translate-x-1/2 -translate-y-1/2
          rounded-full border border-dashed border-accent/25
        "
      />

      {/* Orbit dalam */}
      <div
        className="
          absolute left-1/2 top-1/2
          h-[220px] w-[220px]
          -translate-x-1/2 -translate-y-1/2
          rounded-full border border-accent/10
        "
      />

      {/* Logo Evola di tengah */}
      <div
        className="
          absolute left-1/2 top-1/2 z-10
          flex h-36 w-40
          -translate-x-1/2 -translate-y-1/2
          items-center justify-center
          rounded-[30px]
          border border-line/80
          bg-white/95
          p-6
          shadow-[0_24px_70px_rgba(99,102,241,0.18)]
          backdrop-blur-sm
          transition-transform duration-500
          hover:scale-105
        "
      >
        <img
          src="/evola.png"
          alt=""
          draggable={false}
          className="
            block max-h-20 w-full
            select-none object-contain
          "
        />
      </div>

      {/* Programmer */}
      <CareerBadge
        icon={Code2}
        label="Programmer"
        className="left-4 top-[14%]"
        stackDirection="right"
        rotation="-2deg"
      />

      {/* UI/UX Designer */}
      <CareerBadge
        icon={Palette}
        label="UI/UX Designer"
        className="right-0 top-[29%]"
        stackDirection="left"
        rotation="2deg"
      />

      {/* Data Analyst */}
      <CareerBadge
        icon={BarChart3}
        label="Data Analyst"
        className="left-8 bottom-[12%]"
        stackDirection="right"
        rotation="1deg"
      />
    </div>
  );
}

type CareerBadgeProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  className?: string;
  stackDirection?: "left" | "right";
  rotation?: string;
};

function CareerBadge({
  icon: Icon,
  label,
  className = "",
  stackDirection = "right",
  rotation = "0deg",
}: CareerBadgeProps) {
  const firstBackCard =
    stackDirection === "right"
      ? "translate-x-5 -translate-y-3 rotate-[5deg]"
      : "-translate-x-5 -translate-y-3 -rotate-[5deg]";

  const secondBackCard =
    stackDirection === "right"
      ? "translate-x-10 -translate-y-6 rotate-[9deg]"
      : "-translate-x-10 -translate-y-6 -rotate-[9deg]";

  return (
    <div className={`absolute z-20 ${className}`}>
      <div
        className="
          group relative min-w-[190px]
          transition-transform duration-500
          hover:-translate-y-1
        "
        style={{ transform: `rotate(${rotation})` }}
      >
        {/* Kartu bayangan paling belakang */}
        <div
          className={`
            pointer-events-none absolute inset-0
            rounded-2xl
            border border-line/40
            bg-white/50
            shadow-sm
            backdrop-blur-sm
            transition-transform duration-500
            group-hover:translate-x-12
            ${secondBackCard}
          `}
        />

        {/* Kartu bayangan tengah */}
        <div
          className={`
            pointer-events-none absolute inset-0
            rounded-2xl
            border border-line/60
            bg-white/75
            shadow-md
            backdrop-blur-sm
            transition-transform duration-500
            ${firstBackCard}
          `}
        />

        {/* Kartu utama */}
        <div
          className="
            relative z-10
            flex min-h-[58px] items-center gap-3
            rounded-2xl
            border border-line/70
            bg-white/95
            px-4 py-3
            text-sm font-medium text-ink
            shadow-[0_14px_35px_rgba(15,23,42,0.12)]
            backdrop-blur-md
            transition-all duration-300
            group-hover:shadow-[0_20px_45px_rgba(99,102,241,0.16)]
          "
        >
          <span
            className="
              grid h-9 w-9 shrink-0 place-items-center
              rounded-full bg-accent/10
            "
          >
            <Icon className="h-4 w-4 text-accent" />
          </span>

          <span className="whitespace-nowrap">{label}</span>
        </div>
      </div>
    </div>
  );
}
