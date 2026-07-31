import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { listFields } from "@/lib/careerlab.functions";
import { CareerExperience } from "@/components/experience/career-experience";
import type { CareerTunnelField } from "@/components/dashboard/career-screen";

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
      { title: "CareerLab · Rasakan dunia kerja sebelum benar-benar memasukinya" },
      {
        name: "description",
        content:
          "Mission Engine untuk simulasi karier: keputusan profesional, micro-task nyata, evaluasi berbasis performa.",
      },
      { property: "og:title", content: "CareerLab · Mission Engine" },
      {
        property: "og:description",
        content:
          "Simulasi karier interaktif untuk mahasiswa, siswa SMK, fresh graduate, dan career switcher.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    <div className="min-h-screen flex flex-col exp-bg">
      <SiteHeader variant="landing" tone="dark" />
      <main className="flex-1">
        <CareerExperience fields={careerFields} />
      </main>

      <footer className="border-t border-white/5 exp-bg">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm exp-ink-dim">
          <p className="font-mono-cl">CareerLab · CITECH 2026 · Universitas Jember</p>
          <p className="exp-eyebrow">Mission Engine v1</p>
        </div>
      </footer>
    </div>
  );
}
