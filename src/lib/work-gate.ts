import { queryOptions } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { getRoleAccess } from "@/lib/intern.functions";
import { ROLE_MISSION_REQUIREMENT, type InternRole } from "@/lib/intern-roles";

export type RoleAccessItem = {
  role: InternRole;
  unlocked: boolean;
  completedMissions: number;
  requiredMissions: number;
  credits: number;
};

export const roleAccessQO = queryOptions({
  queryKey: ["intern", "role-access"],
  queryFn: () => getRoleAccess(),
});

/**
 * The "work simulator" (fields → tracks → episodes → missions) is the Pekerja
 * experience. Magang is the mandatory first role, so these routes stay locked
 * until the user finishes the required Magang chat missions.
 */
export async function requireWorkUnlocked(queryClient: {
  ensureQueryData: (opts: typeof roleAccessQO) => Promise<unknown>;
}) {
  const roles = (await queryClient.ensureQueryData(roleAccessQO)) as RoleAccessItem[];
  const pekerja = roles.find((r) => r.role === "pekerja");
  if (!pekerja?.unlocked) {
    throw redirect({ to: "/magang", search: { role: "magang" as InternRole } });
  }
  return roles;
}

export function workGateProgress(roles: RoleAccessItem[] | undefined) {
  const magang = roles?.find((r) => r.role === "magang");
  const pekerja = roles?.find((r) => r.role === "pekerja");
  return {
    unlocked: pekerja?.unlocked ?? false,
    done: magang?.completedMissions ?? 0,
    required: ROLE_MISSION_REQUIREMENT,
  };
}
