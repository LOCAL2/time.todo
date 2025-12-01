import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, ArrowLeft, Edit3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PriorityBoardView } from './PriorityBoardView';
import { BoardNotFound } from './BoardNotFound';
import { useStore } from '../../store/useStore';
import type { Database } from '../../types/supabase';

type Board = Database['public']['Tables']['boards']['Row'] & { share_mode?: 'readonly' | 'edit' };
type Task = Database['public']['Tables']['tasks']['Row'];

export function SharedBoardView() {
    const { boardId } = useParams<{ boardId: string }>();
    const navigate = useNavigate();
    const { setActiveBoardId, setTasks: setStoreTasks } = useStore();
    const [board, setBoard] = useState<Board | null>(null);
    const [ownerName, setOwnerName] = useState<string>('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Set active board ID for edit mode
    useEffect(() => {
        if (boardId && board?.share_mode === 'edit') {
            setActiveBoardId(boardId);
        }
    }, [boardId, board?.share_mode, setActiveBoardId]);

    useEffect(() => {
        if (!boardId) return;

        const loadSharedBoard = async () => {
            try {
                console.log('Loading shared board:', boardId);
                
                // Use RPC function to bypass RLS for shared boards
                const { data: boardData, error: boardError } = await (supabase.rpc as any)('get_shared_board', {
                    board_id_param: boardId
                });

                console.log('Board data:', boardData, 'Error:', boardError);

                if (boardError) {
                    console.error('Board error details:', boardError);
                    throw boardError;
                }
                if (!boardData || boardData.length === 0) {
                    console.error('No board data returned');
                    throw new Error('Board not found');
                }
                
                const board = boardData[0] as Board;
                console.log('Board loaded:', board);
                setBoard(board);

                // Fetch owner information
                if (board.owner_id) {
                    const { data: ownerNameData } = await (supabase.rpc as any)('get_user_email_by_id', {
                        user_id: board.owner_id
                    });
                    if (ownerNameData) {
                        setOwnerName(ownerNameData);
                    }
                }

                // Use RPC function to get tasks for shared board
                const { data: tasksData, error: tasksError } = await (supabase.rpc as any)('get_shared_board_tasks', {
                    board_id_param: boardId
                });

                console.log('Tasks data:', tasksData, 'Error:', tasksError);

                if (tasksError) {
                    console.error('Tasks error details:', tasksError);
                    throw tasksError;
                }
                
                const loadedTasks = tasksData || [];
                setTasks(loadedTasks);
                
                // Set tasks in store for edit mode (use board variable, not state)
                if (board.share_mode === 'edit') {
                    console.log('Setting tasks in store for edit mode:', loadedTasks);
                    setStoreTasks(loadedTasks);
                }

                setLoading(false);
            } catch (err: any) {
                console.error('Error loading shared board:', err);
                console.error('Full error object:', JSON.stringify(err, null, 2));
                setError(err.message || 'Failed to load board');
                setLoading(false);
            }
        };

        loadSharedBoard();
    }, [boardId]);

    // Set up real-time subscriptions - only refresh when data changes
    useEffect(() => {
        if (!boardId || !board || board.share_mode === 'edit') return;

        // Subscribe to task changes
        const taskChannel = supabase
            .channel(`shared-tasks-${boardId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `board_id=eq.${boardId}`
                },
                async () => {
                    // Refresh only when task changes
                    try {
                        const { data: tasksData, error: tasksError } = await (supabase.rpc as any)('get_shared_board_tasks', {
                            board_id_param: boardId
                        });

                        if (!tasksError && tasksData) {
                            setTasks(tasksData);
                        }
                    } catch (err) {
                        console.error('Error refreshing tasks:', err);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(taskChannel);
        };
    }, [boardId, board]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">กำลังโหลดบอร์ด...</p>
                </div>
            </div>
        );
    }

    if (error || !board) {
        return <BoardNotFound />;
    }

    // If edit mode, use PriorityBoardView
    if (board.share_mode === 'edit') {
        return (
            <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
                <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                {board.title}
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">โหมดแก้ไขได้</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                        <Edit3 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                            กำลังแก้ไขบอร์ดที่แชร์{ownerName && ` โดย ${ownerName}`}
                        </span>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <PriorityBoardView isSharedMode={true} />
                </div>
            </div>
        );
    }

    // Read-only mode
    const backlogTasks = tasks.filter(t => t.status === 'backlog' || !t.status);
    const priorityTasks = tasks.filter(t => t.status === 'priority').sort((a, b) => a.position - b.position);
    const completedTasks = tasks.filter(t => t.status === 'completed');

    const TaskItem = ({ task, index }: { task: Task; index?: number }) => (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-start gap-2 mb-2">
                {index !== undefined && (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {index + 1}
                    </div>
                )}
                <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-slate-200 text-sm leading-tight">
                        {task.title}
                    </h3>
                </div>
                {task.priority && (
                    <div className={`flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-md text-xs font-medium ${
                        task.priority === 'high'
                            ? 'bg-red-500/10 text-red-400'
                            : task.priority === 'medium'
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-green-500/10 text-green-400'
                    }`}>
                        {task.priority === 'high' ? 'สูง' : task.priority === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                    </div>
                )}
            </div>
            {task.image_url && (
                <div className="mb-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <img
                        src={task.image_url}
                        alt="Task attachment"
                        className="w-full h-64 object-contain"
                    />
                </div>
            )}
            {task.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {task.description}
                </p>
            )}
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {board.title}
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">โหมดอ่านอย่างเดียว</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">
                        กำลังดูบอร์ดที่แชร์{ownerName && ` โดย ${ownerName}`}
                    </span>
                </div>
            </div>

            <div className="flex-1 flex gap-4 p-6 overflow-hidden">
                <div className="flex-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl flex flex-col border border-slate-200/50 dark:border-slate-800/50 min-w-0">
                    <div className="p-3 border-b border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                Backlog
                            </h2>
                            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium">
                                {backlogTasks.length}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {backlogTasks.map((task) => (
                            <TaskItem key={task.id} task={task} />
                        ))}
                    </div>
                </div>

                <div className="flex-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl flex flex-col border border-slate-200/50 dark:border-slate-800/50 min-w-0">
                    <div className="p-3 border-b border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                Priority Queue
                            </h2>
                            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium">
                                {priorityTasks.length}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {priorityTasks.map((task, index) => (
                            <TaskItem key={task.id} task={task} index={index} />
                        ))}
                    </div>
                </div>

                <div className="flex-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl flex flex-col border border-slate-200/50 dark:border-slate-800/50 min-w-0">
                    <div className="p-3 border-b border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                Completed
                            </h2>
                            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium">
                                {completedTasks.length}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {completedTasks.map((task) => (
                            <TaskItem key={task.id} task={task} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
