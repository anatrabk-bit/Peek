import { getAvatarRingClass } from "@/lib/avatar-icons";

type UserAvatarIconProps = {
  icon: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-9 w-9 text-lg",
  md: "h-11 w-11 text-xl",
  lg: "h-16 w-16 text-3xl"
};

export function UserAvatarIcon({ icon, size = "md" }: UserAvatarIconProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 ${getAvatarRingClass(icon)} ${sizeClasses[size]}`}
      aria-hidden
    >
      {icon}
    </span>
  );
}
