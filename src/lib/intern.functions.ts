import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { InternRole } from "@/lib/intern-roles";
import {
  roleAccessFromProgress,
  resolveRoleFromInput,
  assertRoleUnlocked,
} from "@/lib/intern-roles.server";

/* ---------------- Types ---------------- */

export type { InternRole };

export type RoleAccess = {
  role: InternRole;
  unlocked: boolean;
  completedMissions: number;
  requiredMissions: number;
  credits: number;
};

export type InternTrackSummary = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  fieldName: string;
  missionCount: number;
  completedCount: number;
};



export type InternMissionSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  reward_credit: number;
  senior_name: string;
  jobCount: number;
  questionCount: number;
  status: "not_started" | "in_progress" | "completed";
  correct: number;
  incorrect: number;
  answered: number;
};

export type InternOption = { id: string; label: string };
export type InternQuestion = {
  id: string;
  senior_message: string;
  question_text: string;
  options: InternOption[];
};
export type InternJob = {
  id: string;
  title: string;
  description: string;
  questions: InternQuestion[];
};
export type InternAnswerRecord = {
  question_id: string;
  selected_option_id: string;
  selected_label: string;
  is_correct: boolean;
  feedback: string;
  explanation: string;
};

/* ---------------- Profile / role ---------------- */

export const getMyInternProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, role")
      .eq("id", userId)
      .maybeSingle();
    const access = await roleAccessFromProgress(supabase, userId);
    return {
      displayName: profile?.display_name ?? "",
      role: (profile?.role ?? "magang") as InternRole,
      highestUnlockedRole: access.highestUnlocked as InternRole,
      internCredits: access.credits.magang,
      completedMissions: access.completed.magang,
      totalCredits: access.totalCredits,
      totalCompletedMissions: access.totalCompleted,
      roles: access.stats as RoleAccess[],
      workerUnlocked: access.byRole.get("pekerja")?.unlocked ?? false,
    };
  });

export const getRoleAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RoleAccess[]> => {
    const access = await roleAccessFromProgress(context.supabase, context.userId);
    return access.stats;
  });

/* ---------------- Catalog ---------------- */

export const listInternTracks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { role?: string } | undefined) =>
    z.object({ role: z.string().optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data }): Promise<InternTrackSummary[]> => {
    const { supabase, userId } = context;
    const role = resolveRoleFromInput(data.role);
    const access = await roleAccessFromProgress(supabase, userId);
    assertRoleUnlocked(access.byRole.get(role), role);

    const [{ data: tracks }, { data: fields }, { data: missions }, { data: progress }] =
      await Promise.all([
        supabase.from("career_tracks").select("id, slug, name, tagline, field_id, sort_order").order("sort_order"),
        supabase.from("fields").select("id, name"),
        supabase.from("intern_missions").select("id, track_id").eq("target_role", role),
        supabase.from("user_intern_progress").select("mission_id, status").eq("user_id", userId),
      ]);

    const fieldName = new Map((fields ?? []).map((f) => [f.id, f.name]));
    const doneMissions = new Set(
      (progress ?? []).filter((p) => p.status === "completed").map((p) => p.mission_id),
    );

    return (tracks ?? []).map((t) => {
      const ms = (missions ?? []).filter((m) => m.track_id === t.id);
      return {
        id: t.id,
        slug: t.slug,
        name: t.name,
        tagline: t.tagline ?? "",
        fieldName: fieldName.get(t.field_id) ?? "",
        missionCount: ms.length,
        completedCount: ms.filter((m) => doneMissions.has(m.id)).length,
      };
    });
  });

export const listInternMissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { trackSlug: string; role?: string }) =>
    z.object({ trackSlug: z.string(), role: z.string().optional() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const role = resolveRoleFromInput(data.role);
    const access = await roleAccessFromProgress(supabase, userId);
    assertRoleUnlocked(access.byRole.get(role), role);

    const { data: track } = await supabase
      .from("career_tracks")
      .select("id, slug, name, tagline")
      .eq("slug", data.trackSlug)
      .maybeSingle();
    if (!track) throw new Error("Bidang karier tidak ditemukan");

    const { data: missions } = await supabase
      .from("intern_missions")
      .select("id, slug, title, description, reward_credit, senior_name, difficulty, target_role")
      .eq("track_id", track.id)
      .eq("target_role", role)
      .order("order_index");


    const missionIds = (missions ?? []).map((m) => m.id);
    const [{ data: jobs }, { data: progress }] = await Promise.all([
      missionIds.length
        ? supabase.from("intern_jobs").select("id, mission_id").in("mission_id", missionIds)
        : Promise.resolve({ data: [] as { id: string; mission_id: string }[] }),
      supabase
        .from("user_intern_progress")
        .select("mission_id, status, correct_answers, incorrect_answers")
        .eq("user_id", userId),
    ]);

    const jobIds = (jobs ?? []).map((j) => j.id);
    const { data: questions } = jobIds.length
      ? await supabase.from("intern_questions").select("id, job_id").in("job_id", jobIds)
      : { data: [] as { id: string; job_id: string }[] };

    const jobsByMission = new Map<string, string[]>();
    for (const j of jobs ?? []) {
      jobsByMission.set(j.mission_id, [...(jobsByMission.get(j.mission_id) ?? []), j.id]);
    }
    const progressByMission = new Map((progress ?? []).map((p) => [p.mission_id, p]));

    const list: InternMissionSummary[] = (missions ?? []).map((m) => {
      const mJobs = jobsByMission.get(m.id) ?? [];
      const qCount = (questions ?? []).filter((q) => mJobs.includes(q.job_id)).length;
      const p = progressByMission.get(m.id);
      const correct = p?.correct_answers ?? 0;
      const incorrect = p?.incorrect_answers ?? 0;
      return {
        id: m.id,
        slug: m.slug,
        title: m.title,
        description: m.description,
        reward_credit: m.reward_credit,
        senior_name: m.senior_name,
        jobCount: mJobs.length,
        questionCount: qCount,
        status: (p?.status === "completed"
          ? "completed"
          : p
            ? "in_progress"
            : "not_started") as InternMissionSummary["status"],
        correct,
        incorrect,
        answered: correct + incorrect,
      };
    });

    return { track, missions: list, role };
  });

/* ---------------- Mission run ---------------- */

export const getInternMissionRun = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { missionSlug: string }) => z.object({ missionSlug: z.string() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: mission } = await supabase
      .from("intern_missions")
      .select(
        "id, slug, title, description, reward_credit, senior_name, senior_title, track_id, target_role, difficulty",
      )
      .eq("slug", data.missionSlug)
      .maybeSingle();
    if (!mission) throw new Error("Misi tidak ditemukan");

    const missionRole = resolveRoleFromInput(mission.target_role);
    const access = await roleAccessFromProgress(supabase, userId);
    assertRoleUnlocked(access.byRole.get(missionRole), missionRole);



    const [{ data: track }, { data: jobs }, { data: progress }, { data: profile }] = await Promise.all([
      supabase.from("career_tracks").select("id, slug, name").eq("id", mission.track_id).maybeSingle(),
      supabase
        .from("intern_jobs")
        .select("id, title, description, order_index")
        .eq("mission_id", mission.id)
        .order("order_index"),
      supabase
        .from("user_intern_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("mission_id", mission.id)
        .maybeSingle(),
      supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    ]);

    const jobIds = (jobs ?? []).map((j) => j.id);
    const { data: questions } = jobIds.length
      ? await supabase
          .from("intern_questions")
          .select("id, job_id, senior_message, question_text, order_index")
          .in("job_id", jobIds)
          .order("order_index")
      : { data: [] as Array<{ id: string; job_id: string; senior_message: string; question_text: string; order_index: number }> };

    const questionIds = (questions ?? []).map((q) => q.id);
    const { data: options } = questionIds.length
      ? await supabase
          .from("intern_answer_options")
          .select("id, question_id, label, order_index")
          .in("question_id", questionIds)
          .order("order_index")
      : { data: [] as Array<{ id: string; question_id: string; label: string; order_index: number }> };

    const structuredJobs: InternJob[] = (jobs ?? []).map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description,
      questions: (questions ?? [])
        .filter((q) => q.job_id === j.id)
        .map((q) => ({
          id: q.id,
          senior_message: q.senior_message,
          question_text: q.question_text,
          options: (options ?? [])
            .filter((o) => o.question_id === q.id)
            .map((o) => ({ id: o.id, label: o.label })),
        })),
    }));

    // Previously answered questions (for transcript replay after refresh)
    const { data: answers } = questionIds.length
      ? await supabase
          .from("user_intern_answers")
          .select("question_id, selected_option_id, is_correct, answered_at")
          .eq("user_id", userId)
          .in("question_id", questionIds)
          .order("answered_at")
      : { data: [] as Array<{ question_id: string; selected_option_id: string; is_correct: boolean; answered_at: string }> };

    let answerRecords: InternAnswerRecord[] = [];
    if ((answers ?? []).length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const [{ data: adminOptions }, { data: adminQuestions }] = await Promise.all([
        supabaseAdmin
          .from("intern_answer_options")
          .select("id, label, feedback")
          .in("id", (answers ?? []).map((a) => a.selected_option_id)),
        supabaseAdmin.from("intern_questions").select("id, explanation").in("id", questionIds),
      ]);
      const optMap = new Map((adminOptions ?? []).map((o) => [o.id, o]));
      const expMap = new Map((adminQuestions ?? []).map((q) => [q.id, q.explanation]));
      answerRecords = (answers ?? []).map((a) => ({
        question_id: a.question_id,
        selected_option_id: a.selected_option_id,
        selected_label: optMap.get(a.selected_option_id)?.label ?? "",
        is_correct: a.is_correct,
        feedback: optMap.get(a.selected_option_id)?.feedback ?? "",
        explanation: expMap.get(a.question_id) ?? "",
      }));
    }

    return {
      mission,
      track,
      jobs: structuredJobs,
      answers: answerRecords,
      progress,
      displayName: profile?.display_name ?? "",
    };
  });

export const answerInternQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { missionId: string; questionId: string; optionId: string }) =>
    z
      .object({
        missionId: z.string().uuid(),
        questionId: z.string().uuid(),
        optionId: z.string().uuid(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load full mission structure with answer key (server-side truth)
    const { data: mission } = await supabaseAdmin
      .from("intern_missions")
      .select("id, reward_credit")
      .eq("id", data.missionId)
      .maybeSingle();
    if (!mission) throw new Error("Misi tidak ditemukan");

    const { data: jobs } = await supabaseAdmin
      .from("intern_jobs")
      .select("id, order_index")
      .eq("mission_id", mission.id)
      .order("order_index");
    const jobIds = (jobs ?? []).map((j) => j.id);

    const { data: questions } = await supabaseAdmin
      .from("intern_questions")
      .select("id, job_id, explanation, order_index")
      .in("job_id", jobIds.length ? jobIds : ["00000000-0000-0000-0000-000000000000"])
      .order("order_index");

    const question = (questions ?? []).find((q) => q.id === data.questionId);
    if (!question) throw new Error("Pertanyaan bukan bagian dari misi ini");

    const { data: option } = await supabaseAdmin
      .from("intern_answer_options")
      .select("id, question_id, label, is_correct, feedback")
      .eq("id", data.optionId)
      .maybeSingle();
    if (!option || option.question_id !== question.id) throw new Error("Pilihan jawaban tidak valid");

    // Idempotent: an already answered question keeps its first answer
    const { data: existingAnswer } = await supabase
      .from("user_intern_answers")
      .select("selected_option_id, is_correct")
      .eq("user_id", userId)
      .eq("question_id", question.id)
      .maybeSingle();

    let isCorrect = option.is_correct;
    let feedback = option.feedback;
    let selectedLabel = option.label;

    if (existingAnswer) {
      isCorrect = existingAnswer.is_correct;
      const { data: prev } = await supabaseAdmin
        .from("intern_answer_options")
        .select("label, feedback")
        .eq("id", existingAnswer.selected_option_id)
        .maybeSingle();
      feedback = prev?.feedback ?? feedback;
      selectedLabel = prev?.label ?? selectedLabel;
    } else {
      const { error: insErr } = await supabase.from("user_intern_answers").insert({
        user_id: userId,
        question_id: question.id,
        selected_option_id: option.id,
        is_correct: option.is_correct,
      });
      if (insErr) throw new Error(insErr.message);
    }

    // Recount from stored answers (safe against refresh / double submit)
    const allQuestionIds = (questions ?? []).map((q) => q.id);
    const { data: myAnswers } = await supabase
      .from("user_intern_answers")
      .select("question_id, is_correct")
      .eq("user_id", userId)
      .in("question_id", allQuestionIds);

    const answered = new Set((myAnswers ?? []).map((a) => a.question_id));
    const correctCount = (myAnswers ?? []).filter((a) => a.is_correct).length;
    const incorrectCount = (myAnswers ?? []).length - correctCount;

    // Ordered flat list to derive current position
    const ordered = (jobs ?? []).flatMap((j) =>
      (questions ?? []).filter((q) => q.job_id === j.id).map((q) => ({ jobId: j.id, qId: q.id })),
    );
    const nextIdx = ordered.findIndex((x) => !answered.has(x.qId));
    const missionCompleted = nextIdx === -1;
    const currentJobIndex =
      nextIdx === -1
        ? Math.max(0, (jobs ?? []).length - 1)
        : (jobs ?? []).findIndex((j) => j.id === ordered[nextIdx].jobId);
    const questionsInCurrentJob = ordered.filter((x) => x.jobId === ordered[Math.max(0, nextIdx)]?.jobId);
    const currentQuestionIndex =
      nextIdx === -1 ? 0 : questionsInCurrentJob.findIndex((x) => x.qId === ordered[nextIdx].qId);

    const { data: existingProgress } = await supabase
      .from("user_intern_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("mission_id", mission.id)
      .maybeSingle();

    const alreadyCompleted = existingProgress?.status === "completed";
    const creditAwarded = alreadyCompleted
      ? existingProgress!.credit_awarded
      : missionCompleted
        ? mission.reward_credit
        : (existingProgress?.credit_awarded ?? 0);

    const payload = {
      user_id: userId,
      mission_id: mission.id,
      current_job_index: currentJobIndex,
      current_question_index: Math.max(0, currentQuestionIndex),
      correct_answers: correctCount,
      incorrect_answers: incorrectCount,
      status: missionCompleted ? "completed" : "in_progress",
      credit_awarded: creditAwarded,
      completed_at: missionCompleted
        ? (existingProgress?.completed_at ?? new Date().toISOString())
        : null,
    };

    if (existingProgress) {
      const { error } = await supabase
        .from("user_intern_progress")
        .update(payload)
        .eq("id", existingProgress.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("user_intern_progress").insert(payload);
      if (error) throw new Error(error.message);
    }

    const justAwardedCredit = missionCompleted && !alreadyCompleted ? mission.reward_credit : 0;

    // Promote the profile to the highest role the user has unlocked
    let roleUnlocked = false;
    let unlockedRole: InternRole | null = null;
    if (missionCompleted) {
      const access = await roleAccessFromProgress(supabase, userId);
      const highest = access.highestUnlocked as InternRole;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (profile?.role !== highest) {
        await supabase.from("profiles").update({ role: highest }).eq("id", userId);
        roleUnlocked = true;
        unlockedRole = highest;
      }
    }


    return {
      questionId: question.id,
      selectedOptionId: option.id,
      selectedLabel,
      isCorrect,
      feedback,
      explanation: question.explanation,
      alreadyAnswered: Boolean(existingAnswer),
      correctCount,
      incorrectCount,
      totalQuestions: ordered.length,
      missionCompleted,
      creditAwarded: justAwardedCredit,
      roleUnlocked,
      unlockedRole,
    };

  });
