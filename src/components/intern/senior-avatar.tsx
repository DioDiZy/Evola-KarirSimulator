import { Bot } from "lucide-react";

export function SeniorAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const dim = size === "lg" ? "h-11 w-11 text-sm" : size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <span
      aria-hidden="true"
      className={`${dim} shrink-0 inline-flex items-center justify-center rounded-full border border-primary-cyan/35 bg-primary-cyan/12 text-primary-cyan font-mono-cl tracking-wider`}
    >
      {initials || <Bot className="h-4 w-4" />}
    </span>
  );
}
