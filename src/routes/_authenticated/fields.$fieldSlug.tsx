import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getFieldBySlug } from "@/lib/careerlab.functions";
import { ArrowRight, ArrowLeft } from "lucide-react";

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

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
      </Link>
      <p className="mt-6 eyebrow">Bidang Karier</p>
      <h1 className="mt-2 font-display text-5xl">{field.name}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-dim">{field.tagline}</p>

      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map((t) => {
          const disabled = t.status !== "active";
          const inner = (
            <div className={`surface-panel p-6 min-h-[200px] flex flex-col justify-between transition ${disabled ? "opacity-60" : "hover:border-accent"}`}>
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
  );
}
