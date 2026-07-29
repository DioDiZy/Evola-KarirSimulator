import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_my_progress",
  title: "Get my progress",
  description: "Return the signed-in user's track progress, completed episodes, and recent mission attempts.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const [tracks, episodes, attempts] = await Promise.all([
      supabase.from("user_track_progress").select("*").eq("user_id", userId),
      supabase.from("user_episode_completions").select("*").eq("user_id", userId),
      supabase
        .from("user_mission_attempts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);
    const err = tracks.error ?? episodes.error ?? attempts.error;
    if (err) return { content: [{ type: "text", text: err.message }], isError: true };
    const payload = {
      track_progress: tracks.data ?? [],
      episode_completions: episodes.data ?? [],
      recent_attempts: attempts.data ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
