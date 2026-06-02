export const PROGRAM_TYPES = ["TEPE", "TEP", "TEPE+"] as const;
export type ProgramType = (typeof PROGRAM_TYPES)[number];

export const MAJORS = [
  "Chemical Engineering and Management",
  "Civil Engineering and Real Estate Development",
  "Electrical and Data Engineering",
  "Mechanical Engineering and Industrial Management",
  "Industrial Engineering (Legacy Program)",
] as const;
export type Major = (typeof MAJORS)[number];

export const PARTNER_UNIVERSITIES: Record<ProgramType, string[]> = {
  TEPE: [],
  TEP: ["University of Nottingham", "University of New South Wales", "KU Leuven"],
  "TEPE+": ["University of Nottingham", "University of Bath"],
};

export const GENERATIONS = Array.from({ length: 31 }, (_, i) => i + 1);

export function generationStatus(gen: number | null | undefined): "Alumni" | "Current Student" | "Incoming Student" | "—" {
  if (!gen) return "—";
  if (gen >= 1 && gen <= 27) return "Alumni";
  if (gen >= 28 && gen <= 30) return "Current Student";
  if (gen === 31) return "Incoming Student";
  return "—";
}

export const CONSENT_VERSION = "1.0";

export const EMPLOYMENT_TYPES = ["internship", "full_time", "part_time", "contract"] as const;
export const EMPLOYMENT_TYPE_LABELS: Record<(typeof EMPLOYMENT_TYPES)[number], string> = {
  internship: "Internship",
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
};
