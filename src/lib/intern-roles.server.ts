import { ROLE_MISSION_REQUIREMENT, ROLE_META, ROLE_ORDER, isInternRole, type InternRole } from "@/lib/intern-roles";

type AnyClient = {
  from: (table: string) => any;
};

export type RoleStats = {
  role: InternRole;
  unlocked: boolean;
  completedMissions: number;
  requiredMissions: number;
  credits: number;
};

export function resolveRoleFromInput(value: string | undefined): InternRole {
  if (!value) return "magang";
  if (!isInternRole(value)) throw new Error("Role tidak dikenal");
  return value;
}

/**
 * Computes, for every role, how many of its missions the user has completed and
 * whether the role is unlocked. Unlock rule: a role opens once the user has
 * completed ROLE_MISSION_REQUIREMENT missions of the role right below it.
 */
export async function roleAccessFromProgress(supabase: AnyClient, userId: string) {
  const [{ data: missions }, { data: progress }] = await Promise.all([
    supabase.from("intern_missions").select("id, target_role"),
    supabase.from("user_intern_progress").select("mission_id, status, credit_awarded").eq("user_id", userId),
  ]);

  const roleOfMission = new Map<string, string>(
    ((missions ?? []) as Array<{ id: string; target_role: string }>).map((m) => [m.id, m.target_role]),
  );

  const completed: Record<string, number> = { magang: 0, pekerja: 0, senior: 0 };
  const credits: Record<string, number> = { magang: 0, pekerja: 0, senior: 0 };

  for (const p of (progress ?? []) as Array<{
    mission_id: string;
    status: string;
    credit_awarded: number;
  }>) {
    const role = roleOfMission.get(p.mission_id);
    if (!role || !(role in completed)) continue;
    credits[role] += p.credit_awarded;
    if (p.status === "completed") completed[role] += 1;
  }

  const stats: RoleStats[] = ROLE_ORDER.map((role) => {
    const prev = ROLE_META[role].unlockedBy;
    return {
      role,
      unlocked: prev === null ? true : completed[prev] >= ROLE_MISSION_REQUIREMENT,
      completedMissions: completed[role],
      requiredMissions: prev === null ? 0 : ROLE_MISSION_REQUIREMENT,
      credits: credits[role],
    };
  });

  const highestUnlocked = [...stats].reverse().find((s) => s.unlocked)?.role ?? "magang";

  return {
    stats,
    byRole: new Map(stats.map((s) => [s.role, s])),
    completed,
    credits,
    highestUnlocked,
    totalCredits: credits.magang + credits.pekerja + credits.senior,
    totalCompleted: completed.magang + completed.pekerja + completed.senior,
  };
}

export function assertRoleUnlocked(stats: RoleStats | undefined, role: InternRole) {
  if (!stats?.unlocked) {
    throw new Error(`Role ${ROLE_META[role].label} masih terkunci. ${ROLE_META[role].requirement}`);
  }
}
