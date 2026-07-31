import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getInternMissionRun } from "@/lib/intern.functions";
import { InternChatRoom } from "@/components/intern/intern-chat-room";

const qo = (missionSlug: string) =>
  queryOptions({
    queryKey: ["intern", "run", missionSlug],
    queryFn: () => getInternMissionRun({ data: { missionSlug } }),
    staleTime: Infinity,
  });

export const Route = createFileRoute("/_authenticated/magang/misi/$missionSlug")({
  head: () => ({
    meta: [{ title: "Room Chat Magang · CareerLab" }, { name: "robots", content: "noindex" }],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(qo(params.missionSlug)),
  pendingComponent: () => (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="h-[60vh] animate-pulse rounded-2xl border border-line bg-surface-2/50" />
      <p className="mt-4 text-sm text-ink-muted">Menyiapkan room chat…</p>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-6 py-16" role="alert">
      <h1 className="font-display text-3xl">Gagal memuat misi</h1>
      <p className="mt-2 text-sm text-ink-dim">{error.message}</p>
      <Link to="/magang" className="mt-6 inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm">
        Kembali ke daftar bidang
      </Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl">Misi tidak ditemukan</h1>
    </div>
  ),
  component: InternMissionRoom,
});

function InternMissionRoom() {
  const { missionSlug } = Route.useParams();
  const { data } = useSuspenseQuery(qo(missionSlug));

  return (
    <InternChatRoom
      key={missionSlug}
      mission={data.mission}
      track={data.track}
      jobs={data.jobs}
      answers={data.answers}
      displayName={data.displayName}
    />
  );
}
