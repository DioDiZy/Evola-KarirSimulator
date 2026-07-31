import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getProfileTool from "./tools/get-profile";
import listFieldsTool from "./tools/list-fields";
import getTrackTool from "./tools/get-track";
import getProgressTool from "./tools/get-progress";

const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "Evola-mcp",
  title: "Evola Mission Engine",
  version: "0.1.0",
  instructions:
    "Tools for Evola, an interactive career simulation. Use these tools to read the signed-in user's profile, career fields and tracks, and their mission progress. All calls act as the authenticated user; RLS applies.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getProfileTool, listFieldsTool, getTrackTool, getProgressTool],
});
