import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User | null; // 👈 allow null para safe sa guest
    showEmail?: boolean;
}) {
    const getInitials = useInitials();

    // 🧩 If user is null (guest)
    if (!user) {
        return (
            <>
                <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                        G
                    </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Guest</span>
                </div>
            </>
        );
    }

    // 👇 If user exists (logged in)
    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                ) : (
                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                        {getInitials(user.name)}
                    </AvatarFallback>
                )}
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {showEmail && user.email && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
