export type InternRole = "magang" | "pekerja" | "senior";

export const ROLE_ORDER: InternRole[] = ["magang", "pekerja", "senior"];

export const ROLE_MISSION_REQUIREMENT = 2;

export const ROLE_META: Record<
  InternRole,
  { label: string; blurb: string; requirement: string; difficulty: string; unlockedBy: InternRole | null }
> = {
  magang: {
    label: "Magang",
    blurb: "Dibimbing langsung AI Senior lewat room chat, dengan pilihan jawaban terarah.",
    requirement: "Terbuka untuk semua akun baru.",
    difficulty: "Pemula",
    unlockedBy: null,
  },
  pekerja: {
    label: "Pekerja",
    blurb: "Kamu mengeksekusi tugas nyata sendiri dengan trade-off teknis dan tenggat yang ketat.",
    requirement: `Selesaikan ${ROLE_MISSION_REQUIREMENT} misi role Magang.`,
    difficulty: "Menengah",
    unlockedBy: "magang",
  },
  senior: {
    label: "Senior",
    blurb: "Kamu memimpin arah kerja, menilai risiko, dan menentukan prioritas tim.",
    requirement: `Selesaikan ${ROLE_MISSION_REQUIREMENT} misi role Pekerja.`,
    difficulty: "Lanjutan",
    unlockedBy: "pekerja",
  },
};

export function isInternRole(value: string): value is InternRole {
  return (ROLE_ORDER as string[]).includes(value);
}
