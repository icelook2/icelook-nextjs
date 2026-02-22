import { Avatar } from "@/lib/ui/avatar";

interface UserProfileHeaderProps {
  name: string;
  avatarUrl?: string | null;
}

export function UserProfileHeader({ name, avatarUrl }: UserProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <Avatar size="lg" name={name} url={avatarUrl} />
      <h2 className="text-xl font-semibold">{name}</h2>
    </div>
  );
}
