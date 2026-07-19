import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { ClientOnly } from "@/components/client-only";
import { SiteHeader } from "@/components/site-header";
import { listFields } from "@/lib/careerlab.functions";
import { ArrowRight, Sparkles, Target, Trophy } from "lucide-react";

const HeroScene = lazy(() => import("@/components/hero-scene").then(m => ({ default: m.HeroScene })));

const fieldsQO = queryOptions({
  queryKey: ["fields"],
  queryFn: () => listFields(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareerLab · Rasakan dunia kerja sebelum benar-benar memasukinya" },
      { name: "description", content: "Mission Engine untuk simulasi karier: keputusan profesional, micro-task nyata, evaluasi berbasis performa." },
      { property: "og:title", content: "CareerLab · Mission Engine" },
      { property: "og:description", content: "Simulasi karier interaktif untuk mahasiswa, siswa SMK, fresh graduate, dan career switcher." },
    ],
  }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(fieldsQO); },
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Values />
        <FieldsPreview />
        <FinalCTA />
        <footer className="border-t border-line mt-24">
          <div className="mx-auto max-w-7xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-ink-muted">
            <p className="font-mono-cl">CareerLab · CITECH 2026 · Universitas Jember</p>
            <p className="eyebrow">Mission Engine v1</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <p className="eyebrow">Career Simulation · Bahasa Indonesia</p>
          <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02]">
            Rasakan dunia kerja
            <br />
            <span className="text-accent">sebelum benar-benar</span>
            <br />
            memasukinya.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-dim leading-relaxed">
            Masuki lingkungan kerja virtual. Hadapi situasi profesional. Ambil keputusan. Kerjakan micro-task
            nyata. Bangun performa dan Career Credit-mu — sebelum wawancara pertama.
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
              className="inline-flex items-center gap-2 rounded-md border border-line-strong px-6 py-3 text-sm font-medium hover:border-accent transition"
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

        <div className="relative aspect-square w-full max-w-[560px] mx-auto">
          <div className="absolute inset-0 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative h-full w-full surface-panel overflow-hidden">
            <ClientOnly fallback={<div className="h-full w-full grid place-items-center eyebrow">Memuat scene 3D…</div>}>
              <Suspense fallback={<div className="h-full w-full grid place-items-center eyebrow">Memuat scene 3D…</div>}>
                <HeroScene />
              </Suspense>
            </ClientOnly>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-xs text-ink-muted font-mono-cl">
              <span>CAREER_MODULE.v1</span>
              <span>{new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Values() {
  const items = [
    { icon: Target, title: "Keputusan yang berbobot", body: "Setiap pilihan ditimbang seperti di tempat kerja nyata: dampak, komunikasi, prioritas." },
    { icon: Sparkles, title: "Micro-task 5–20 menit", body: "Selesaikan tugas kecil yang meniru pekerjaan harian. Bukan kursus. Bukan kuis." },
    { icon: Trophy, title: "Career Credit permanen", body: "Kredit diberikan setelah episode selesai. Tidak pernah berkurang karena kegagalan." },
  ];
  return (
    <section className="border-t border-line/60">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <p className="eyebrow">Bagaimana Mission Engine Bekerja</p>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl max-w-2xl">Bukan kursus. Bukan kuis. Ini simulasi kerja.</h2>
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {items.map((it) => (
            <div key={it.title} className="surface-panel p-8">
              <it.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-6 font-display text-2xl">{it.title}</h3>
              <p className="mt-3 text-ink-dim leading-relaxed">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FieldsPreview() {
  const { data: fields } = useSuspenseQuery(fieldsQO);
  return (
    <section className="border-t border-line/60">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Bidang Karier</p>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl">Pilih dunia yang ingin kamu rasakan.</h2>
          </div>
          <p className="max-w-md text-ink-dim">
            MVP fokus pada Teknologi Informasi. Bidang lain sedang disiapkan.
          </p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fields.map((f) => {
            const status = f.status as string;
            return (
              <div key={f.id} className="surface-panel p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${status === "active" ? "bg-accent" : "bg-ink-muted/50"}`} />
                    <span className="eyebrow">
                      {status === "active" ? "Aktif" : status === "preview" ? "Preview" : "Segera Hadir"}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-2xl">{f.name}</h3>
                  <p className="mt-2 text-sm text-ink-dim">{f.tagline}</p>
                </div>
                {status === "active" ? (
                  <Link to="/auth" search={{ mode: "signup" }} className="mt-6 inline-flex items-center gap-1 text-accent text-sm">
                    Masuk simulasi <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <span className="mt-6 text-xs text-ink-muted font-mono-cl">— tidak dapat dimainkan —</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="border-t border-line/60">
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="eyebrow">Mulai Sekarang</p>
        <h2 className="mt-6 font-display text-4xl sm:text-6xl">
          Wawancara pertamamu jangan
          <br />
          jadi <span className="text-accent">simulasi pertamamu.</span>
        </h2>
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="mt-10 inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-ink"
        >
          Buat Akun Gratis <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
