import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

interface PresenceUser {
    user_id: string;
    username: string;
    avatar_url: string | null;
}

interface ActiveUsersProps {
    boardId: string;
}

export function ActiveUsers({ boardId }: ActiveUsersProps) {
    const { session } = useStore();
    const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);

    useEffect(() => {
        if (!boardId || !session) return;

        const channelName = `board:${boardId}`;
        const channel = supabase.channel(channelName, {
            config: {
                presence: {
                    key: session.user.id,
                },
            },
        });

        // Track presence
        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const users: PresenceUser[] = [];
                
                Object.keys(state).forEach((key) => {
                    const presences = state[key] as any[];
                    presences.forEach((presence) => {
                        users.push({
                            user_id: presence.user_id,
                            username: presence.username,
                            avatar_url: presence.avatar_url,
                        });
                    });
                });

                setActiveUsers(users);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Send current user's presence
                    await channel.track({
                        user_id: session.user.id,
                        username: session.user.user_metadata?.full_name || 
                                 session.user.user_metadata?.name || 
                                 session.user.email?.split('@')[0] || 
                                 'Anonymous',
                        avatar_url: session.user.user_metadata?.avatar_url || null,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [boardId, session]);

    if (activeUsers.length === 0) return null;

    const displayUsers = activeUsers.slice(0, 5);
    const remainingCount = activeUsers.length - 5;

    return (
        <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
                {displayUsers.map((user) => (
                    <div
                        key={user.user_id}
                        className="relative group"
                        title={user.username}
                    >
                        {user.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.username}
                                className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 hover:z-10 transition-transform hover:scale-110"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 flex items-center justify-center text-white text-xs font-bold hover:z-10 transition-transform hover:scale-110">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {user.username}
                        </div>
                    </div>
                ))}
                {remainingCount > 0 && (
                    <div
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-600 flex items-center justify-center text-white text-xs font-bold"
                        title={`${remainingCount} more user${remainingCount > 1 ? 's' : ''}`}
                    >
                        +{remainingCount}
                    </div>
                )}
            </div>
        </div>
    );
}
