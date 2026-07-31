import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { CareerTunnelField } from "@/components/dashboard/career-screen";
import { MISSION_ENGINE_PANELS } from "@/components/landing/workstation-panels";

/**
 * Fallback aksesibel untuk device tanpa WebGL.
 * Konten identik dengan chapter overlay 3D.
 */
export function ExperienceFallback({
  fields,
  signedIn,
}: {
  fields: CareerTunnelField[];
  signedIn: boolean;
}) {
  return (
    <div className="exp-bg">
      <section className="mx-auto max-w-7xl px-5 sm:px-6 pt-32 pb-20">
        <p className="exp-eyebrow">Career Simulation · Bahasa Indonesia</p>
        <h1 className="mt-5 font-display text-4xl sm:text-6xl leading-[1.05] exp-ink max-w-3xl">
          Rasakan dunia kerja <span className="exp-cyan">sebelum benar-benar</span> memasukinya.
        </h1>
        <p className="mt-5 max-w-xl exp-ink-dim leading-relaxed">
          Masuki lingkungan kerja virtual. Hadapi situasi profesional. Ambil keputusan. Kerjakan
          micro-task nyata. Bangun performa dan Career Credit-mu — sebelum wawancara pertama.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/auth" search={{ mode: "signup" }} className="exp-btn-primary">
            Mulai Mission Pertama <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/auth" className="exp-btn-ghost">
            Saya sudah punya akun
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-6 py-16">
        <p className="exp-eyebrow">Briefing Room · Mission Engine</p>
        <h2 className="mt-4 font-display text-3xl sm:text-4xl exp-ink">
          Bukan kursus. Bukan kuis. Ini simulasi kerja.
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {MISSION_ENGINE_PANELS.map((p, i) => (
            <div key={p.title} className="exp-card">
              <span className="exp-eyebrow text-[10px]">{`0${i + 1}`}</span>
              <h3 className="mt-1 font-display text-lg exp-ink">{p.title}</h3>
              <p className="mt-1 text-sm exp-ink-dim">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-6 py-16">
        <p className="exp-eyebrow">Bidang Karier · Field Gallery</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {fields.map((f, i) =>
            f.status === "active" ? (
              <Link
                key={f.id}
                to="/fields/$fieldSlug"
                params={{ fieldSlug: f.slug }}
                className="exp-card block hover:brightness-125 transition"
              >
                <span className="exp-eyebrow text-[10px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 font-display text-2xl exp-ink">{f.name}</h3>
                <p className="mt-1 text-sm exp-ink-dim">{f.tagline}</p>
                <span className="mt-3 inline-block exp-badge-active">Career Field</span>
              </Link>
            ) : (
              <div key={f.id} className="exp-card">
                <span className="exp-eyebrow text-[10px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 font-display text-2xl exp-ink">{f.name}</h3>
                <p className="mt-1 text-sm exp-ink-dim">{f.tagline}</p>
                <span className="mt-3 inline-block exp-badge-soon">Coming Soon</span>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 sm:px-6 py-20 text-center">
        <p className="exp-eyebrow">Career Command Center</p>
        <h2 className="mt-4 font-display text-3xl sm:text-5xl exp-ink">
          Wawancara pertamamu jangan jadi{" "}
          <span className="exp-violet">simulasi pertamamu.</span>
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {signedIn ? (
            <Link to="/dashboard" className="exp-btn-primary">
              Buka Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link to="/auth" search={{ mode: "signup" }} className="exp-btn-primary">
              Buat Akun Gratis <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
