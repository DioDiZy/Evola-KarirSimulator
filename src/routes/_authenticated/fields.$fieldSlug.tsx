import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getFieldBySlug } from "@/lib/careerlab.functions";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { ClientOnly } from "@/components/client-only";
import { useWebGLSupport } from "@/hooks/use-webgl-support";
import { FieldChamberScene } from "@/components/game/field-chamber-scene";

const qo = (slug: string) =>
  queryOptions({ queryKey: ["field", slug], queryFn: () => getFieldBySlug({ data: { slug } }) });

export const Route = createFileRoute("/_authenticated/fields/$fieldSlug")({
  head: ({ params }) => ({ meta: [{ title: `${params.fieldSlug} · CareerLab` }, { name: "robots", content: "noindex" }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(qo(params.fieldSlug)),
  component: FieldPage,
});

function FieldPage() {
  const { fieldSlug } = Route.useParams();
  const { data } = useSuspenseQuery(qo(fieldSlug));
  const { field, tracks } = data;
  const webgl = useWebGLSupport();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background">
      {/* 3D chamber */}
      <ClientOnly fallback={null}>
        {webgl && (
          <div className="fixed inset-0 top-16 -z-0">
            <FieldChamberScene
              tracks={tracks.map((t) => ({
                id: t.id,
                slug: t.slug,
                name: t.name,
                tagline: t.tagline,
                status: t.status as string,
              }))}
              fieldName={field.name}
            />
          </div>
        )}
      </ClientOnly>

      {/* HUD overlay */}
      <div className="pointer-events-none relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="pointer-events-auto inline-block rounded-lg border border-line/50 bg-background/70 px-4 py-3 backdrop-blur-md">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <p className="mt-3 eyebrow">Bidang Karier</p>
          <h1 className="font-display text-3xl leading-tight">{field.name}</h1>
          <p className="mt-1 max-w-md text-sm text-ink-dim">{field.tagline}</p>
        </div>

        <div className="pointer-events-auto absolute right-6 top-8 hidden max-w-xs rounded-lg border border-line/50 bg-background/60 px-4 py-3 backdrop-blur-md md:block">
          <p className="eyebrow">Instruksi</p>
          <p className="mt-1 text-xs text-ink-dim">
            Klik salah satu monolit track di ruang untuk melakukan camera fly-in.
          </p>
        </div>
      </div>

      {/* Fallback / SR-accessible track list */}
      <div className={`relative z-10 mx-auto max-w-6xl px-6 pb-16 ${webgl ? "sr-only focus-within:not-sr-only" : "pt-8"}`}>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((t) => {
            const disabled = t.status !== "active";
            const inner = (
              <div className={`surface-panel bg-background/85 backdrop-blur p-6 min-h-[200px] flex flex-col justify-between transition ${disabled ? "opacity-60" : "hover:border-accent"}`}>
                <div>
                  <span className="eyebrow">{disabled ? "Segera Hadir" : "Aktif"}</span>
                  <h3 className="mt-3 font-display text-2xl">{t.name}</h3>
                  <p className="mt-2 text-sm text-ink-dim">{t.tagline}</p>
                </div>
                {!disabled && (
                  <span className="mt-4 text-accent text-sm inline-flex items-center gap-1">
                    Masuk track <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            );
            return disabled ? <div key={t.id}>{inner}</div> : (
              <Link key={t.id} to="/tracks/$trackSlug" params={{ trackSlug: t.slug }}>{inner}</Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
