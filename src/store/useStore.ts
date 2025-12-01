// @ts-nocheck
import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { Database, BoardWithOwnership } from '../types/supabase';
import { supabase } from '../lib/supabase';

type Board = Database['public']['Tables']['boards']['Row'];
type Column = Database['public']['Tables']['columns']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface AppState {
    session: Session | null;
    setSession: (session: Session | null) => void;

    boards: BoardWithOwnership[];
    setBoards: (boards: BoardWithOwnership[]) => void;
    fetchBoards: () => Promise<void>;
    createBoard: (title: string) => Promise<string | null>;
    updateBoardPositions: (boards: BoardWithOwnership[]) => Promise<void>;
    deleteBoard: (boardId: string) => Promise<void>;

    activeBoardId: string | null;
    setActiveBoardId: (id: string | null) => void;

    activeView: 'board' | 'settings';
    setActiveView: (view: 'board' | 'settings') => void;

    columns: Column[];
    setColumns: (columns: Column[] | ((cols: Column[]) => Column[])) => void;
    fetchBoardData: (boardId: string) => Promise<void>;
    createColumn: (boardId: string, title: string) => Promise<void>;

    tasks: Task[];
    setTasks: (tasks: Task[] | ((tasks: Task[]) => Task[])) => void;
    createTask: (boardId: string, title: string, description?: string, priority?: string, dueDate?: string, status?: string, imageUrl?: string) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    uploadImage: (file: File) => Promise<string | null>;
    deleteTask: (taskId: string) => Promise<void>;

    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filterPriority: string | null;
    setFilterPriority: (priority: string | null) => void;

    theme: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;
    toggleTheme: () => void;

    toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>;
    addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    removeToast: (id: string) => void;

    subscribeToRealtime: () => () => void;

    // Real-time subscriptions
    subscribeToTasks: (boardId: string) => () => void;
    subscribeToColumns: (boardId: string) => () => void;
    subscribeToBoard: (boardId: string) => () => void;
}

export const useStore = create<AppState>((set, get) => ({
    session: null,
    setSession: (session) => set({ session }),

    boards: [],
    setBoards: (boards) => set({ boards }),
    fetchBoards: async () => {
        const { session } = get();

        if (!session) {
            console.error('No session found');
            set({ boards: [] });
            return;
        }

        // Use RPC function to get boards where user is owner OR member
        const { data, error } = await supabase.rpc('get_user_boards', {
            p_user_id: session.user.id
        });

        if (error) {
            console.error('Error fetching boards:', error.message || error);
            console.error('Full error details:', JSON.stringify(error, null, 2));
            set({ boards: [] });
            return;
        }

        if (data) {
            // Transform data to BoardWithOwnership[]
            const boardsWithOwnership: BoardWithOwnership[] = data.map((board: any) => ({
                id: board.id,
                title: board.title,
                owner_id: board.owner_id,
                position: board.position,
                created_at: board.created_at,
                is_owner: board.is_owner,
                owner_email: board.owner_email,
                owner_name: board.owner_name,
                user_role: board.user_role as BoardMemberRole,
            }));

            set({ boards: boardsWithOwnership });
        }
    },
    createBoard: async (title) => {
        const { session, boards } = get();
        console.log('Creating board:', { title, session: !!session });

        if (!session) {
            console.error('No session found');
            return null;
        }

        // คำนวณ position ใหม่ (ท้ายสุด)
        const maxPosition = boards.length > 0 ? Math.max(...boards.map(b => b.position)) : -1;
        const newPosition = maxPosition + 1;

        const { data, error } = await supabase
            .from('boards')
            .insert({ title, owner_id: session.user.id, position: newPosition })
            .select()
            .single();

        if (error) {
            console.error('Error creating board:', error.message || error);
            console.error('Full error details:', JSON.stringify(error, null, 2));
            return null;
        }

        if (data) {
            console.log('Board created successfully:', data);

            // Create BoardWithOwnership object for the new board
            const newBoardWithOwnership: BoardWithOwnership = {
                id: data.id,
                title: data.title,
                owner_id: data.owner_id,
                position: data.position,
                created_at: data.created_at,
                is_owner: true,
                owner_email: session.user.email,
                owner_name: session.user.user_metadata?.name || session.user.email,
                user_role: 'owner',
            };

            set((state) => ({
                boards: [...state.boards, newBoardWithOwnership],
                activeBoardId: data.id
            }));

            return data.id; // Return the new board ID
        }

        return null;
    },

    updateBoardPositions: async (boards) => {
        // อัพเดท position ของทุก board (only for owned boards)
        const ownedBoards = boards.filter(b => b.is_owner);
        const updates = ownedBoards.map((board, index) =>
            supabase
                .from('boards')
                .update({ position: index })
                .eq('id', board.id)
        );

        await Promise.all(updates);
    },

    deleteBoard: async (boardId) => {
        const { error } = await supabase
            .from('boards')
            .delete()
            .eq('id', boardId);

        if (!error) {
            set((state) => ({
                boards: state.boards.filter(b => b.id !== boardId),
                activeBoardId: state.activeBoardId === boardId ? null : state.activeBoardId,
            }));
        }
    },

    activeBoardId: null,
    setActiveBoardId: (activeBoardId) => set({ activeBoardId, activeView: 'board' }),

    activeView: 'board',
    setActiveView: (activeView) => set({ activeView }),

    columns: [],
    setColumns: (columns) => set((state) => ({
        columns: typeof columns === 'function' ? columns(state.columns) : columns
    })),
    fetchBoardData: async (boardId) => {
        const [cols, tsks] = await Promise.all([
            supabase.from('columns').select('*').eq('board_id', boardId).order('position'),
            supabase.from('tasks').select('*').eq('board_id', boardId).order('position')
        ]);

        if (cols.data) set({ columns: cols.data });
        if (tsks.data) set({ tasks: tsks.data });
    },
    createColumn: async (boardId, title) => {
        const { columns } = get();
        const position = columns.length > 0 ? Math.max(...columns.map(c => c.position)) + 1 : 0;

        const { data, error } = await supabase
            .from('columns')
            .insert({ board_id: boardId, title, position })
            .select()
            .single();

        if (error) {
            console.error('Error creating column:', error);
            return;
        }

        if (data) set((state) => ({ columns: [...state.columns, data] }));
    },

    tasks: [],
    setTasks: (tasks) => set((state) => ({
        tasks: typeof tasks === 'function' ? tasks(state.tasks) : tasks
    })),
    createTask: async (boardId, title, description, priority, dueDate, imageUrl, status = 'backlog') => {
        const { tasks, addToast } = get();
        const position = tasks.length > 0 ? Math.max(...tasks.map(t => t.position)) + 1 : 0;

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                board_id: boardId,
                title,
                description: description || null,
                priority: priority || null,
                due_date: dueDate || null,
                image_url: imageUrl || null,
                status: status,
                position
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating task:', error);
            addToast('ไม่สามารถสร้างงานได้', 'error');
            return;
        }

        if (data) {
            set((state) => ({ tasks: [...state.tasks, data] }));
            addToast('สร้างงานสำเร็จ', 'success');
        }
    },
    updateTask: async (taskId, updates) => {
        console.log('Updating task:', taskId, 'with:', updates);
        const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId);

        if (error) {
            console.error('Error updating task:', error);
        } else {
            console.log('Task updated successfully');
            set((state) => ({
                tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
            }));
        }
    },
    deleteTask: async (taskId) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (!error) {
            set((state) => ({
                tasks: state.tasks.filter(t => t.id !== taskId)
            }));
        }
    },

    uploadImage: async (file: File) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('task-images')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                return null;
            }

            const { data } = supabase.storage
                .from('task-images')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error in uploadImage:', error);
            return null;
        }
    },

    searchQuery: '',
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    filterPriority: null,
    setFilterPriority: (filterPriority) => set({ filterPriority }),

    theme: (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
    setTheme: (theme) => {
        localStorage.setItem('theme', theme);
        set({ theme });
    },
    toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        set({ theme: newTheme });
    },

    subscribeToRealtime: () => {
        const channel = supabase.channel('db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'boards' },
                (payload) => {
                    const { session } = get();
                    if (!session) return;

                    if (payload.eventType === 'INSERT') {
                        const newBoard = payload.new as Board;
                        if (newBoard.owner_id === session.user.id) {
                            // Check if board already exists to prevent duplicates
                            const { boards } = get();
                            const boardExists = boards.some(b => b.id === newBoard.id);
                            
                            if (!boardExists) {
                                // Create BoardWithOwnership object for the new board
                                const newBoardWithOwnership: BoardWithOwnership = {
                                    id: newBoard.id,
                                    title: newBoard.title,
                                    owner_id: newBoard.owner_id,
                                    position: newBoard.position,
                                    created_at: newBoard.created_at,
                                    is_owner: true,
                                    owner_email: session.user.email,
                                    owner_name: session.user.user_metadata?.name || session.user.email,
                                    user_role: 'owner',
                                };
                                set((state) => ({ boards: [...state.boards, newBoardWithOwnership] }));
                            }
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'columns' },
                (payload) => {
                    const { activeBoardId } = get();
                    if (!activeBoardId) return;

                    if (payload.eventType === 'INSERT') {
                        const newCol = payload.new as Column;
                        if (newCol.board_id === activeBoardId) {
                            set((state) => ({ columns: [...state.columns, newCol] }));
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                (payload) => {
                    const { columns } = get();
                    const colIds = columns.map(c => c.id);

                    if (payload.eventType === 'INSERT') {
                        const newTask = payload.new as Task;
                        if (colIds.includes(newTask.column_id)) {
                            set((state) => ({ tasks: [...state.tasks, newTask] }));
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedTask = payload.new as Task;
                        if (colIds.includes(updatedTask.column_id)) {
                            set((state) => ({
                                tasks: state.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
                            }));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },



    // Real-time subscriptions for tasks
    subscribeToTasks: (boardId: string) => {
        const { session } = get();

        if (!session) {
            console.error('No session found for task subscription');
            return () => { };
        }

        const channel = supabase.channel(`board-tasks-${boardId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'tasks',
                    filter: `board_id=eq.${boardId}`
                },
                (payload) => {
                    console.log('Task created:', payload);

                    const newTask = payload.new as Task;

                    // Add the new task to the store
                    set((state) => ({
                        tasks: [...state.tasks, newTask]
                    }));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'tasks',
                    filter: `board_id=eq.${boardId}`
                },
                (payload) => {
                    console.log('Task updated:', payload);

                    const updatedTask = payload.new as Task;

                    // Update the task in the store
                    set((state) => ({
                        tasks: state.tasks.map(t =>
                            t.id === updatedTask.id ? updatedTask : t
                        )
                    }));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'tasks',
                    filter: `board_id=eq.${boardId}`
                },
                (payload) => {
                    console.log('Task deleted:', payload);

                    const deletedTask = payload.old as Task;

                    // Remove the task from the store
                    set((state) => ({
                        tasks: state.tasks.filter(t => t.id !== deletedTask.id)
                    }));
                }
            )
            .subscribe((status) => {
                console.log('Task subscription status:', status);
            });

        // Return cleanup function
        return () => {
            console.log('Cleaning up task subscription');
            supabase.removeChannel(channel);
        };
    },

    // Real-time subscriptions for columns
    subscribeToColumns: (boardId: string) => {
        const { session } = get();

        if (!session) {
            console.error('No session found for column subscription');
            return () => { };
        }

        const channel = supabase.channel(`board-columns-${boardId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'columns',
                    filter: `board_id=eq.${boardId}`
                },
                (payload) => {
                    console.log('Column created:', payload);

                    const newColumn = payload.new as Column;

                    // Add the new column to the store
                    set((state) => ({
                        columns: [...state.columns, newColumn]
                    }));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'columns',
                    filter: `board_id=eq.${boardId}`
                },
                (payload) => {
                    console.log('Column updated:', payload);

                    const updatedColumn = payload.new as Column;

                    // Update the column in the store
                    set((state) => ({
                        columns: state.columns.map(c =>
                            c.id === updatedColumn.id ? updatedColumn : c
                        )
                    }));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'columns',
                    filter: `board_id=eq.${boardId}`
                },
                (payload) => {
                    console.log('Column deleted:', payload);

                    const deletedColumn = payload.old as Column;

                    // Remove the column from the store
                    set((state) => ({
                        columns: state.columns.filter(c => c.id !== deletedColumn.id)
                    }));
                }
            )
            .subscribe((status) => {
                console.log('Column subscription status:', status);
            });

        // Return cleanup function
        return () => {
            console.log('Cleaning up column subscription');
            supabase.removeChannel(channel);
        };
    },

    // Real-time subscriptions for board settings
    subscribeToBoard: (boardId: string) => {
        const { session } = get();

        if (!session) {
            console.error('No session found for board subscription');
            return () => { };
        }

        const channel = supabase.channel(`board-settings-${boardId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'boards',
                    filter: `id=eq.${boardId}`
                },
                (payload) => {
                    console.log('Board updated:', payload);

                    const updatedBoard = payload.new as Board;

                    // Update the board in the boards list, preserving ownership info
                    set((state) => ({
                        boards: state.boards.map(b =>
                            b.id === updatedBoard.id
                                ? { ...b, title: updatedBoard.title, position: updatedBoard.position }
                                : b
                        )
                    }));
                }
            )
            .subscribe((status) => {
                console.log('Board subscription status:', status);
            });

        // Return cleanup function
        return () => {
            console.log('Cleaning up board subscription');
            supabase.removeChannel(channel);
        };
    },

    // Toast notifications
    toasts: [],
    addToast: (message, type) => {
        const id = Date.now().toString();
        set((state) => ({
            toasts: [...state.toasts, { id, message, type }]
        }));
    },
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter(t => t.id !== id)
        }));
    },

}));
