import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { listFields } from "@/lib/careerlab.functions";
import { LandingExperience } from "@/components/landing/landing-experience";
import {
  CareerTunnel,
  type CareerTunnelField,
} from "@/components/dashboard/career-tunnel";

const FIELD_MEDIA: Record<string, string> = {
  "ui-ux-designer": "/images/career/ui-ux-designer.webp",
  "frontend-developer": "/images/career/frontend-developer.webp",
  "backend-developer": "/images/career/backend-developer.webp",
  "ai-engineer": "/images/career/ai-engineer.webp",
};

const fieldsQO = queryOptions({
  queryKey: ["fields"],
  queryFn: () => listFields(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Evola · Rasakan dunia kerja sebelum benar-benar memasukinya" },
      {
        name: "description",
        content:
          "Mission Engine untuk simulasi karier: keputusan profesional, micro-task nyata, evaluasi berbasis performa.",
      },
      { property: "og:title", content: "Evola · Mission Engine" },
      {
        property: "og:description",
        content:
          "Simulasi karier interaktif untuk mahasiswa, siswa SMK, fresh graduate, dan career switcher.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(fieldsQO);
  },
  component: LandingPage,
});

function LandingPage() {
  const { data: fields } = useSuspenseQuery(fieldsQO);

  const careerFields: CareerTunnelField[] = fields.slice(0, 4).map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    tagline: f.tagline ?? "",
    status: f.status as string,
    mediaUrl: FIELD_MEDIA[f.slug] ?? null,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader variant="landing" />
      <main className="flex-1">
        <LandingExperience />

        <section className="relative border-t border-line/60 bg-background">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Bidang Karier · Field Gallery</p>
                <h2 className="mt-4 font-display text-4xl sm:text-5xl">
                  Pilih dunia yang ingin kamu rasakan.
                </h2>
              </div>
              <p className="max-w-md text-ink-dim">
                MVP fokus pada Teknologi Informasi. Bidang lain sedang
                disiapkan.
              </p>
            </div>
            <div className="mt-10">
              <CareerTunnel fields={careerFields} />
            </div>
          </div>
        </section>

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

        <footer className="border-t border-line mt-0">
          <div className="mx-auto max-w-7xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-ink-muted">
            <p className="font-mono-cl">Evola · 2026 </p>
            <p className="eyebrow">Simulasi Karir</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
