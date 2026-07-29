import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuthorizationDetails = {
  client?: { name?: string; client_uri?: string } | null;
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
};

type OAuthResult<T> = { data: T | null; error: { message: string } | null };

// Beta namespace; typed locally.
const oauthAuth = (supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails(id: string): Promise<OAuthResult<AuthorizationDetails>>;
    approveAuthorization(id: string): Promise<OAuthResult<AuthorizationDetails>>;
    denyAuthorization(id: string): Promise<OAuthResult<AuthorizationDetails>>;
  };
}).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthAuth.getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md">
        <h1 className="font-display text-2xl mb-3">Otorisasi tidak dapat dimuat</h1>
        <p className="text-ink-dim text-sm">{String((error as Error)?.message ?? error)}</p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauthAuth.approveAuthorization(authorization_id)
      : await oauthAuth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Server otorisasi tidak mengembalikan URL redirect.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "aplikasi ini";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-line rounded-lg bg-surface p-8 shadow-sm">
        <p className="eyebrow">CareerLab MCP</p>
        <h1 className="mt-3 font-display text-2xl leading-tight">
          Hubungkan <span className="text-accent">{clientName}</span> ke akun CareerLab-mu
        </h1>
        <p className="mt-4 text-sm text-ink-dim">
          {clientName} akan dapat memanggil tool MCP CareerLab sebagai kamu. Akses ke data (profil, progres, mission)
          tetap mengikuti aturan keamanan aplikasi.
        </p>
        {details?.scope && (
          <p className="mt-4 text-xs text-ink-dim">
            Scope yang diminta: <span className="font-mono">{details.scope}</span>
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 rounded-md bg-ink text-surface px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {busy ? "Memproses…" : "Setujui"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 rounded-md border border-line px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            Tolak
          </button>
        </div>
      </div>
    </main>
  );
}
