import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const testSchema = z.object({
  url: z
    .string()
    .trim()
    .url("URL tidak valid")
    .max(200)
    .refine((v) => v.startsWith("https://"), "URL harus memakai https://"),
  publishableKey: z.string().trim().min(10, "Key terlalu pendek").max(500),
});

export type SupabaseConnectionTest = {
  ok: boolean;
  status: number;
  message: string;
};

/**
 * Tests a Supabase project URL + publishable/anon key by pinging its auth health
 * endpoint from the server (avoids browser CORS). Nothing is persisted.
 */
export const testSupabaseConnection = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => testSchema.parse(data))
  .handler(async ({ data }): Promise<SupabaseConnectionTest> => {
    const base = data.url.replace(/\/+$/, "");
    try {
      const res = await fetch(`${base}/auth/v1/health`, {
        headers: { apikey: data.publishableKey },
      });
      const body = await res.text();
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          message: `Gagal terhubung (${res.status}): ${body.slice(0, 200)}`,
        };
      }
      return {
        ok: true,
        status: res.status,
        message: "Berhasil terhubung ke project Supabase tersebut.",
      };
    } catch (err) {
      return {
        ok: false,
        status: 0,
        message: `Tidak bisa menjangkau host: ${(err as Error).message}`,
      };
    }
  });
