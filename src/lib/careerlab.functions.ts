import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import { roleAccessFromProgress } from "@/lib/intern-roles.server";
import { ROLE_META } from "@/lib/intern-roles";

/* ---------- Public catalog (SSR-safe, no auth) ---------- */

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listFields = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb.from("fields").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getFieldBySlug = createServerFn({ method: "GET" })
  .inputValidator((i: { slug: string }) => z.object({ slug: z.string() }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: field } = await sb.from("fields").select("*").eq("slug", data.slug).maybeSingle();
    if (!field) throw new Error("Field tidak ditemukan");
    const { data: tracks } = await sb.from("career_tracks").select("*").eq("field_id", field.id).order("sort_order");
    return { field, tracks: tracks ?? [] };
  });

export const getTrackBySlug = createServerFn({ method: "GET" })
  .inputValidator((i: { slug: string }) => z.object({ slug: z.string() }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: track } = await sb.from("career_tracks").select("*").eq("slug", data.slug).maybeSingle();
    if (!track) throw new Error("Track tidak ditemukan");
    const { data: field } = await sb.from("fields").select("*").eq("id", track.field_id).maybeSingle();
    const { data: levels } = await sb.from("career_levels").select("*").eq("track_id", track.id).order("sort_order");
    const levelIds = (levels ?? []).map(l => l.id);
    const { data: episodes } = levelIds.length
      ? await sb.from("episodes").select("*").in("level_id", levelIds).order("sort_order")
      : { data: [] };
    return { track, field, levels: levels ?? [], episodes: episodes ?? [] };
  });

export const getEpisode = createServerFn({ method: "GET" })
  .inputValidator((i: { episodeId: string }) => z.object({ episodeId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: episode } = await sb.from("episodes").select("*").eq("id", data.episodeId).maybeSingle();
    if (!episode) throw new Error("Episode tidak ditemukan");
    const { data: missions } = await sb.from("missions").select("*").eq("episode_id", data.episodeId).order("sort_order");
    const { data: level } = await sb.from("career_levels").select("*").eq("id", episode.level_id).maybeSingle();
    const { data: track } = level ? await sb.from("career_tracks").select("*").eq("id", level.track_id).maybeSingle() : { data: null };
    return { episode, missions: missions ?? [], level, track };
  });

export const getMission = createServerFn({ method: "GET" })
  .inputValidator((i: { missionId: string }) => z.object({ missionId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: mission } = await sb.from("missions").select("*").eq("id", data.missionId).maybeSingle();
    if (!mission) throw new Error("Mission tidak ditemukan");
    const { data: episode } = await sb.from("episodes").select("*").eq("id", mission.episode_id).maybeSingle();
    const { data: siblings } = await sb.from("missions").select("id, slug, sort_order").eq("episode_id", mission.episode_id).order("sort_order");
    return { mission, episode, siblings: siblings ?? [] };
  });

/* ---------- Authenticated progress ---------- */

export const getMyProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [tp, ec] = await Promise.all([
      supabase.from("user_track_progress").select("*").eq("user_id", userId),
      supabase.from("user_episode_completions").select("*").eq("user_id", userId),
    ]);
    return { trackProgress: tp.data ?? [], completions: ec.data ?? [] };
  });

export const getMyMissionAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { episodeId: string }) => z.object({ episodeId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const missions = await supabase.from("missions").select("id").eq("episode_id", data.episodeId);
    const ids = (missions.data ?? []).map(m => m.id);
    if (!ids.length) return [];
    const { data: attempts } = await supabase
      .from("user_mission_attempts")
      .select("*")
      .eq("user_id", userId)
      .in("mission_id", ids);
    return attempts ?? [];
  });

/* Submit a mission — computes score server-side based on mission content. */
export const submitMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { missionId: string; decisions: unknown }) =>
    z.object({ missionId: z.string().uuid(), decisions: z.any() }).parse(i)
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Magang is the mandatory first role: block the work simulator until it is cleared.
    const access = await roleAccessFromProgress(supabase, userId);
    if (!access.byRole.get("pekerja")?.unlocked) {
      throw new Error(`Simulasi kerja masih terkunci. ${ROLE_META.pekerja.requirement}`);
    }

    const { data: mission, error: mErr } = await supabase.from("missions").select("*").eq("id", data.missionId).maybeSingle();
    if (mErr || !mission) throw new Error("Mission tidak ditemukan");

    const content = mission.content as Record<string, unknown>;
    const decisions = data.decisions as Record<string, string>;

    let score = 0;
    const maxScore = Number(content.max_score ?? 5);
    const feedbackItems: { label: string; ok: boolean; note: string }[] = [];

    if (mission.type === "mission" && Array.isArray(content.choices)) {
      const pick = decisions.choice;
      const choice = (content.choices as Array<{ id: string; text: string; score: number; feedback: string }>).find(c => c.id === pick);
      if (choice) {
        score = choice.score;
        feedbackItems.push({ label: choice.text, ok: choice.score >= 4, note: choice.feedback });
      }
    } else if (mission.slug === "debug-ui" && Array.isArray(content.components)) {
      const pick = decisions.choice;
      const comps = content.components as Array<{ id: string; label: string; broken: boolean; reason: string }>;
      const chosen = comps.find(c => c.id === pick);
      const correct = String(content.correct_id);
      if (chosen) {
        const ok = chosen.id === correct;
        score = ok ? Number(content.score_correct ?? 5) : Number(content.score_wrong ?? 1);
        feedbackItems.push({ label: chosen.label, ok, note: chosen.reason });
        if (!ok) {
          const right = comps.find(c => c.id === correct);
          if (right) feedbackItems.push({ label: `Jawaban tepat: ${right.label}`, ok: true, note: right.reason });
        }
      }
    } else if (mission.slug === "code-review" && Array.isArray(content.diffs)) {
      const pick = decisions.choice;
      const diffs = content.diffs as Array<{ id: string; label: string; approve: boolean; feedback: string }>;
      const chosen = diffs.find(d => d.id === pick);
      const correct = String(content.correct_id);
      if (chosen) {
        const ok = chosen.id === correct;
        score = ok ? Number(content.score_correct ?? 5) : Number(content.score_wrong ?? 1);
        feedbackItems.push({ label: chosen.label, ok, note: chosen.feedback });
      }
    }

    const passed = score >= Math.ceil(maxScore * 0.6);
    // performance delta: pass -> +score, fail -> +max/2 - score (small negative possible)
    const perfDelta = passed ? score : Math.max(-2, score - Math.ceil(maxScore / 2));

    // Save attempt
    const { error: attErr } = await supabase.from("user_mission_attempts").insert({
      user_id: userId,
      mission_id: mission.id,
      score,
      max_score: maxScore,
      performance_delta: perfDelta,
      decisions,
      feedback: feedbackItems,
      passed,
    });
    if (attErr) throw new Error(attErr.message);

    // Look up track for this mission
    const { data: episode } = await supabase.from("episodes").select("id, level_id, career_credit_reward").eq("id", mission.episode_id).maybeSingle();
    const { data: level } = episode ? await supabase.from("career_levels").select("id, track_id").eq("id", episode.level_id).maybeSingle() : { data: null };
    const trackId = level?.track_id;
    if (!trackId) return { score, maxScore, passed, feedback: feedbackItems, perfDelta, completedEpisode: false, creditsAwarded: 0 };

    // Upsert progress
    const { data: existing } = await supabase.from("user_track_progress").select("*").eq("user_id", userId).eq("track_id", trackId).maybeSingle();
    const newPP = Math.max(0, (existing?.performance_points ?? 0) + perfDelta);
    if (existing) {
      await supabase.from("user_track_progress").update({ performance_points: newPP, current_episode_id: episode!.id }).eq("id", existing.id);
    } else {
      await supabase.from("user_track_progress").insert({ user_id: userId, track_id: trackId, performance_points: newPP, career_credits: 0, current_episode_id: episode!.id });
    }

    // Check episode completion: all missions in episode passed at least once
    const { data: missionsInEp } = await supabase.from("missions").select("id").eq("episode_id", mission.episode_id);
    const missionIds = (missionsInEp ?? []).map(m => m.id);
    const { data: passedAttempts } = await supabase.from("user_mission_attempts").select("mission_id, passed").eq("user_id", userId).in("mission_id", missionIds);
    const passedSet = new Set((passedAttempts ?? []).filter(a => a.passed).map(a => a.mission_id));
    const allPassed = missionIds.every(id => passedSet.has(id));

    let creditsAwarded = 0;
    let completedEpisode = false;
    if (allPassed) {
      const { data: alreadyDone } = await supabase.from("user_episode_completions").select("id").eq("user_id", userId).eq("episode_id", mission.episode_id).maybeSingle();
      if (!alreadyDone) {
        creditsAwarded = episode!.career_credit_reward;
        await supabase.from("user_episode_completions").insert({
          user_id: userId,
          episode_id: mission.episode_id,
          career_credits_awarded: creditsAwarded,
        });
        // Career Credit never decreases
        const { data: prog2 } = await supabase.from("user_track_progress").select("*").eq("user_id", userId).eq("track_id", trackId).maybeSingle();
        if (prog2) {
          await supabase.from("user_track_progress").update({ career_credits: prog2.career_credits + creditsAwarded }).eq("id", prog2.id);
        }
        completedEpisode = true;
      }
    }

    return { score, maxScore, passed, feedback: feedbackItems, perfDelta, completedEpisode, creditsAwarded };
  });
