import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toFileUrl } from "@/lib/file-url";

export function UserAvatar({
  fullName,
  imagePath,
}: {
  fullName: string;
  imagePath?: string | null;
}) {
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <Avatar className="size-11 rounded-2xl border border-border/70">
      <AvatarImage src={toFileUrl(imagePath) ?? undefined} alt={fullName} />
      <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
