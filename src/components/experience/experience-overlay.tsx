import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { CareerTunnelField } from "@/components/dashboard/career-screen";
import { MISSION_ENGINE_PANELS } from "@/components/landing/workstation-panels";
import { CHAPTERS, type ChapterId } from "./experience-progress";

type Props = {
  chapter: ChapterId;
  activeField: CareerTunnelField | null;
  activeFieldIndex: number;
  totalFields: number;
  signedIn: boolean;
};

function Shell({
  visible,
  children,
  align = "left",
}: {
  visible: boolean;
  children: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div
      aria-hidden={!visible}
      className={`absolute inset-0 flex items-center transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-4"
      }`}
    >
      <div
        className={`mx-auto w-full max-w-7xl px-5 sm:px-6 pb-[env(safe-area-inset-bottom)] ${
          align === "center" ? "text-center" : ""
        }`}
      >
        <div className={align === "center" ? "mx-auto max-w-2xl" : "max-w-xl"}>{children}</div>
      </div>
    </div>
  );
}

/**
 * DOM overlay untuk tiap chapter — memakai konten landing page existing.
 * Hanya chapter aktif yang interaktif.
 */
export function ExperienceOverlay({
  chapter,
  activeField,
  activeFieldIndex,
  totalFields,
  signedIn,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Chapter 1 — Entrance */}
      <Shell visible={chapter === "entrance"}>
        <div className="pointer-events-auto">
          <p className="exp-eyebrow">Career Simulation · Bahasa Indonesia</p>
          <h1
            className="mt-5 font-display leading-[1.05] exp-ink"
            style={{ fontSize: "clamp(2.1rem, 6vw, 4.2rem)" }}
          >
            Rasakan dunia kerja
            <br />
            <span className="exp-cyan">sebelum benar-benar</span>
            <br />
            memasukinya.
          </h1>
          <p className="mt-5 max-w-lg text-sm sm:text-base exp-ink-dim leading-relaxed">
            Masuki lingkungan kerja virtual. Hadapi situasi profesional. Ambil keputusan.
            Kerjakan micro-task nyata. Bangun performa dan Career Credit-mu — sebelum
            wawancara pertama.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              aria-label="Mulai mission pertama"
              className="exp-btn-primary"
            >
              Mulai Mission Pertama <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/auth" aria-label="Masuk ke akun" className="exp-btn-ghost">
              Saya sudah punya akun
            </Link>
          </div>
          <p className="mt-8 exp-eyebrow text-[10px]">Scroll untuk masuk · CareerLab Entrance</p>
        </div>
      </Shell>

      {/* Chapter 2 — Briefing */}
      <Shell visible={chapter === "briefing"}>
        <div className="pointer-events-auto">
          <p className="exp-eyebrow">Briefing Room · Mission Engine</p>
          <h2 className="mt-4 font-display text-3xl sm:text-5xl exp-ink">
            Bukan kursus. Bukan kuis. Ini simulasi kerja.
          </h2>
          <ul className="mt-6 space-y-4">
            {MISSION_ENGINE_PANELS.map((p, i) => (
              <li key={p.title} className="exp-card">
                <span className="exp-eyebrow text-[10px]">{`0${i + 1}`}</span>
                <h3 className="mt-1 font-display text-lg exp-ink">{p.title}</h3>
                <p className="mt-1 text-sm exp-ink-dim">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Shell>

      {/* Chapter 3 — Career Fields */}
      <Shell visible={chapter === "fields"}>
        <div className="pointer-events-auto">
          <p className="exp-eyebrow">Bidang Karier · Field Gallery</p>
          {activeField ? (
            <>
              <p className="mt-3 font-mono-cl text-xs exp-ink-dim">
                {String(activeFieldIndex + 1).padStart(2, "0")} / {String(totalFields).padStart(2, "0")}
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-5xl exp-ink">
                {activeField.name}
              </h2>
              <p className="mt-3 max-w-md text-sm sm:text-base exp-ink-dim">
                {activeField.tagline}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span
                  className={
                    activeField.status === "active" ? "exp-badge-active" : "exp-badge-soon"
                  }
                >
                  {activeField.status === "active" ? "Career Field" : "Coming Soon"}
                </span>
                {activeField.status === "active" && (
                  <Link
                    to="/fields/$fieldSlug"
                    params={{ fieldSlug: activeField.slug }}
                    aria-label={`Masuki bidang ${activeField.name}`}
                    className="exp-btn-primary"
                  >
                    Masuki Bidang <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </>
          ) : (
            <h2 className="mt-4 font-display text-3xl sm:text-5xl exp-ink">
              Pilih dunia yang ingin kamu rasakan.
            </h2>
          )}
          <p className="mt-6 hidden sm:block text-xs exp-ink-dim">
            MVP fokus pada Teknologi Informasi. Bidang lain sedang disiapkan.
          </p>
        </div>
      </Shell>

      {/* Chapter 4 — Mission System */}
      <Shell visible={chapter === "mission"}>
        <div className="pointer-events-auto">
          <p className="exp-eyebrow">Mission Workstation</p>
          <h2 className="mt-4 font-display text-3xl sm:text-5xl exp-ink">
            Setiap keputusan punya konsekuensi.
          </h2>
          <p className="mt-4 text-sm sm:text-base exp-ink-dim leading-relaxed">
            Mission dimulai dari briefing pekerjaan, lalu keputusan profesional, lalu micro-task
            5–20 menit. Hasilnya dievaluasi berdasarkan performa — bukan hafalan.
          </p>
        </div>
      </Shell>

      {/* Chapter 5 — Career Progress */}
      <Shell visible={chapter === "progress"} align="center">
        <div className="pointer-events-auto">
          <p className="exp-eyebrow">Career Command Center</p>
          <h2 className="mt-4 font-display text-3xl sm:text-5xl exp-ink">
            Wawancara pertamamu jangan
            <br />
            jadi <span className="exp-violet">simulasi pertamamu.</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base exp-ink-dim">
            Naik dari Magang ke Pekerja hingga Senior. Career Credit-mu permanen dan tercatat pada
            profil.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {signedIn ? (
              <Link to="/dashboard" aria-label="Buka dashboard" className="exp-btn-primary">
                Buka Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  aria-label="Buat akun gratis"
                  className="exp-btn-primary"
                >
                  Buat Akun Gratis <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/auth" aria-label="Masuk" className="exp-btn-ghost">
                  Masuk
                </Link>
              </>
            )}
          </div>
        </div>
      </Shell>

      {/* Chapter indicator */}
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-2">
        {CHAPTERS.map((c) => (
          <span
            key={c.id}
            className={`h-6 w-[2px] rounded-full transition-colors duration-500 ${
              c.id === chapter ? "exp-dot-active" : "exp-dot"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
