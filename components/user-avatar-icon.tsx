type UserAvatarIconProps = {
  icon: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-9 w-9 text-lg",
  md: "h-11 w-11 text-xl",
  lg: "h-14 w-14 text-2xl"
};

export function UserAvatarIcon({ icon, size = "md" }: UserAvatarIconProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-sky-100 ${sizeClasses[size]}`}
      aria-hidden
    >
      {icon}
    </span>
  );
}
