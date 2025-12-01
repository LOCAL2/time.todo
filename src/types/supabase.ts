export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    avatar_url: string | null
                }
                Insert: {
                    id: string
                    username?: string | null
                    avatar_url?: string | null
                }
                Update: {
                    id?: string
                    username?: string | null
                    avatar_url?: string | null
                }
            }
            boards: {
                Row: {
                    id: string
                    title: string
                    owner_id: string
                    position: number
                    created_at: string
                    readonly_token: string | null
                    edit_token: string | null
                }
                Insert: {
                    id?: string
                    title: string
                    owner_id: string
                    position?: number
                    created_at?: string
                    readonly_token?: string | null
                    edit_token?: string | null
                }
                Update: {
                    id?: string
                    title?: string
                    owner_id?: string
                    position?: number
                    created_at?: string
                    readonly_token?: string | null
                    edit_token?: string | null
                }
            }
            columns: {
                Row: {
                    id: string
                    board_id: string
                    title: string
                    position: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    board_id: string
                    title: string
                    position: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    board_id?: string
                    title?: string
                    position?: number
                    created_at?: string
                }
            }
            tasks: {
                Row: {
                    id: string
                    board_id: string
                    column_id: string | null
                    title: string
                    description: string | null
                    priority: 'low' | 'medium' | 'high' | null
                    status: 'backlog' | 'priority' | 'completed' | null
                    due_date: string | null
                    position: number
                    created_at: string
                    assigned_to: string | null
                    image_url: string | null
                }
                Insert: {
                    id?: string
                    board_id: string
                    column_id?: string | null
                    title: string
                    description?: string | null
                    priority?: 'low' | 'medium' | 'high' | null
                    status?: 'backlog' | 'priority' | 'completed' | null
                    due_date?: string | null
                    position?: number
                    created_at?: string
                    assigned_to?: string | null
                }
                Update: {
                    id?: string
                    board_id?: string
                    column_id?: string | null
                    title?: string
                    description?: string | null
                    priority?: 'low' | 'medium' | 'high' | null
                    status?: 'backlog' | 'priority' | 'completed' | null
                    due_date?: string | null
                    position?: number
                    created_at?: string
                    assigned_to?: string | null
                }
            }
            board_members: {
                Row: {
                    id: string
                    board_id: string
                    user_id: string
                    role: 'owner' | 'editor' | 'viewer'
                    created_at: string
                }
                Insert: {
                    id?: string
                    board_id: string
                    user_id: string
                    role: 'owner' | 'editor' | 'viewer'
                    created_at?: string
                }
                Update: {
                    id?: string
                    board_id?: string
                    user_id?: string
                    role?: 'owner' | 'editor' | 'viewer'
                    created_at?: string
                }
            }
        }
    }
}

// Collaboration Types

// Board Member Role type
export type BoardMemberRole = 'owner' | 'editor' | 'viewer';

// Board Member types
export type BoardMember = Database['public']['Tables']['board_members']['Row'];

export interface BoardMemberWithUser extends BoardMember {
    user_email?: string;
    user_name?: string;
}

// Board Permissions interface
export interface BoardPermissions {
    canEdit: boolean;
    canDelete: boolean;
    canManageMembers: boolean;
    canInvite: boolean;
}

// Real-time event types
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload<T> {
    eventType: RealtimeEvent;
    new: T;
    old: T;
    errors: string[] | null;
}

// Connection State types
export type ConnectionState =
    | { status: 'connected' }
    | { status: 'connecting'; attempt: number }
    | { status: 'disconnected'; reason: string }
    | { status: 'error'; error: Error; canRetry: boolean };

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'offline';

// Permission Error types
export type PermissionError =
    | 'INSUFFICIENT_PERMISSIONS'
    | 'OWNER_REQUIRED'
    | 'EDITOR_REQUIRED'
    | 'NOT_A_MEMBER';

export interface PermissionErrorResponse {
    error: PermissionError;
    message: string;
    requiredRole?: BoardMemberRole;
}

// Optimistic Update types
export interface OptimisticUpdate<T> {
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: T;
    previousState?: T;
    timestamp: number;
}

// Extended Board type with ownership information
export interface BoardWithOwnership {
    id: string;
    title: string;
    owner_id: string;
    position: number;
    created_at: string;
    is_owner: boolean;
    owner_email?: string;
    owner_name?: string;
    user_role: BoardMemberRole;
}
