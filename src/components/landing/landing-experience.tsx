import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  Sparkles,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { MISSION_ENGINE_PANELS } from "./workstation-panels";

const HERO_STATISTICS = [
  {
    value: "5–20",
    label: "menit micro-task",
  },
  {
    value: "4+",
    label: "bidang karier",
  },
  {
    value: "Real",
    label: "simulasi kerja",
  },
] as const;

const PANEL_ICONS: LucideIcon[] = [Target, Sparkles, Trophy];

export function LandingExperience() {
  return (
    <main className="relative overflow-x-clip bg-background">
      <HeroSection />
      <MissionEngineSection />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-background">
      {/* Background 2D */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 -z-30
          bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_62%,#eef6ff_100%)]
        "
      />

      {/* Dekorasi blur kiri */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -left-40 top-1/4 -z-20
          h-80 w-80 rounded-full bg-primary-cyan/5 blur-[100px]
          sm:h-[500px] sm:w-[500px]
        "
      />

      {/* Dekorasi blur kanan */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -right-48 bottom-0 -z-20
          h-96 w-96 rounded-full bg-accent/5 blur-[120px]
          sm:h-[600px] sm:w-[600px]
        "
      />

      {/* Grid halus */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 -z-10 opacity-[0.025]
          [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)]
          [background-size:40px_40px]
        "
      />

      <div
        className="
          mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col
          px-4 pb-8 pt-28
          sm:px-6 sm:pb-10 sm:pt-32
          lg:px-8 lg:pt-36
        "
      >
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-5xl">
            <p className="eyebrow text-ink-muted">Simulasi Kerja</p>

            <h1
              className="
                mt-5 max-w-5xl font-display
                text-[clamp(2.75rem,10vw,7rem)]
                leading-[0.92] tracking-[-0.045em] text-ink
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
                mt-6 max-w-2xl text-base leading-relaxed text-ink-dim
                sm:mt-8 sm:text-lg
                lg:text-xl
              "
            >
              Hadapi situasi kerja, ambil keputusan, dan selesaikan tugas
              seperti seorang profesional. Bangun pengalaman dan rekam jejakmu
              sebelum memasuki dunia kerja.
            </p>

            <div
              className="
                mt-8 flex flex-col items-stretch gap-3
                sm:mt-10 sm:flex-row sm:items-center
              "
            >
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="
                  inline-flex min-h-12 w-full items-center justify-center
                  gap-2 rounded-md bg-primary px-6 py-3
                  text-sm font-medium text-primary-foreground
                  transition duration-200 hover:brightness-110
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-primary
                  focus-visible:ring-offset-2
                  sm:w-auto
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
                  text-sm font-medium text-ink
                  transition duration-200 hover:bg-surface-2
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-primary
                  focus-visible:ring-offset-2
                  sm:w-auto
                "
              >
                Saya sudah punya akun
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 sm:mt-16">
          <dl className="grid max-w-2xl grid-cols-3 gap-2 sm:gap-4">
            {HERO_STATISTICS.map((item) => (
              <div
                key={item.label}
                className="
                  min-w-0 rounded-lg border border-line
                  bg-surface/90 px-3 py-4 shadow-sm
                  backdrop-blur-sm sm:px-5 sm:py-5
                "
              >
                <dt
                  className="
                    font-display text-2xl text-primary-cyan
                    sm:text-3xl
                  "
                >
                  {item.value}
                </dt>

                <dd
                  className="
                    eyebrow mt-2 break-words
                    text-[8px] leading-relaxed
                    sm:text-[10px]
                  "
                >
                  {item.label}
                </dd>
              </div>
            ))}
          </dl>

          <a
            href="#mission-engine"
            className="
              mt-5 inline-flex items-center gap-2 text-ink-muted
              transition hover:text-ink
              sm:mt-6
            "
          >
            <ArrowDown className="h-4 w-4 animate-bounce" />

            <span className="eyebrow text-[9px] sm:text-[10px]">
              Scroll untuk melihat Mission Engine
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

function MissionEngineSection() {
  return (
    <section
      id="mission-engine"
      aria-labelledby="mission-engine-title"
      className="
        relative scroll-mt-20 overflow-hidden
        border-t border-line/60 bg-background
      "
    >
      {/* Background 2D Mission Engine */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(circle_at_50%_10%,rgba(34,211,238,0.08),transparent_38%)]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 opacity-[0.025]
          [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)]
          [background-size:48px_48px]
        "
      />

      <div
        className="
          relative mx-auto w-full max-w-7xl
          px-4 py-20
          sm:px-6 sm:py-24
          lg:px-8 lg:py-32
        "
      >
        <div className="max-w-3xl">
          <p className="eyebrow text-ink-muted">Mission Engine</p>

          <h2
            id="mission-engine-title"
            className="
              mt-4 font-display text-4xl
              leading-[1.05] tracking-[-0.03em] text-ink
              sm:text-5xl
              lg:text-6xl
            "
          >
            Bukan kursus. Bukan kuis.
            <br />
            <span className="text-accent">Ini simulasi kerja.</span>
          </h2>

          <p
            className="
              mt-6 max-w-2xl text-base leading-relaxed text-ink-dim
              sm:text-lg
            "
          >
            Ikuti alur misi, hadapi situasi profesional, dan selesaikan
            pekerjaan berdasarkan bidang karier yang kamu pilih.
          </p>
        </div>

        <div
          className="
            mt-12 grid gap-5
            sm:mt-14
            md:grid-cols-3 md:gap-6
          "
        >
          {MISSION_ENGINE_PANELS.slice(0, 3).map((panel, index) => {
            const Icon = PANEL_ICONS[index] ?? Target;

            return (
              <article
                key={panel.title}
                className="
                    group relative overflow-hidden rounded-2xl
                    border border-line bg-surface p-6
                    shadow-sm transition duration-300
                    hover:-translate-y-1
                    hover:border-primary-cyan/30
                    hover:shadow-lg
                    sm:p-8
                  "
              >
                <div
                  aria-hidden="true"
                  className="
                      pointer-events-none absolute -right-16 -top-16
                      h-40 w-40 rounded-full bg-primary-cyan/5
                      blur-3xl transition duration-300
                      group-hover:bg-primary-cyan/10
                    "
                />

                <div
                  className="
                      relative grid h-12 w-12 place-items-center
                      rounded-xl border border-line
                      bg-background
                    "
                >
                  <Icon className="h-5 w-5 text-accent" />
                </div>

                <div className="relative">
                  <p className="eyebrow mt-8 text-[9px] text-ink-muted">
                    Tahap {String(index + 1).padStart(2, "0")}
                  </p>

                  <h3
                    className="
                        mt-3 font-display text-2xl
                        leading-tight text-ink
                        sm:text-3xl
                      "
                  >
                    {panel.title}
                  </h3>

                  <p className="mt-4 leading-relaxed text-ink-dim">
                    {panel.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div
          className="
            mt-12 flex flex-col items-start justify-between gap-6
            rounded-2xl border border-line bg-surface
            p-6 shadow-sm
            sm:mt-16 sm:flex-row sm:items-center sm:p-8
          "
        >
          <div>
            <p className="eyebrow text-ink-muted">Siap Memulai?</p>

            <h3
              className="
                mt-3 max-w-xl font-display text-2xl
                leading-tight text-ink
                sm:text-3xl
              "
            >
              Pilih bidang karier dan jalankan mission pertamamu.
            </h3>
          </div>

          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="
              inline-flex min-h-12 w-full shrink-0
              items-center justify-center gap-2
              rounded-md bg-primary px-6 py-3
              text-sm font-medium text-primary-foreground
              transition duration-200 hover:brightness-110
              sm:w-auto
            "
          >
            Mulai Sekarang
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
