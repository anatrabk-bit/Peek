type UserInitialsAvatarProps = {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl"
};

export function UserInitialsAvatar({
  initials,
  size = "md",
  className = ""
}: UserInitialsAvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 font-semibold text-white shadow-sm ${SIZE_CLASSES[size]} ${className}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}
