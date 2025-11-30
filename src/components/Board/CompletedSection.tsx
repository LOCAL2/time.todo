import { useDroppable } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Database } from '../../types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

interface CompletedSectionProps {
    tasks: Task[];
}

export function CompletedSection({ tasks }: CompletedSectionProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'completed',
        data: { section: 'completed' },
    });

    const taskIds = tasks.map(t => t.id);

    return (
        <div className="w-full md:w-80 flex-shrink-0 bg-slate-100 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col min-h-0">
            {/* Header - Responsive */}
            <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">Completed</h2>
                        <p className="text-xs text-slate-600 dark:text-slate-500 hidden sm:block">งานที่ทำเสร็จแล้ว</p>
                    </div>
                </div>
                {tasks.length > 0 && (
                    <div className="mt-2 md:mt-3 bg-gradient-to-br from-green-600/10 to-emerald-600/10 border border-green-600/20 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-transparent" />
                        <div className="relative">
                            <div className="flex items-center justify-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                                <p className="text-green-400 font-bold text-xl md:text-2xl">{tasks.length}</p>
                            </div>
                            <p className="text-green-400/80 text-xs font-medium uppercase tracking-wide">
                                {tasks.length === 1 ? 'Task Done' : 'Tasks Done'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Completed Tasks List - Responsive */}
            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto p-2 md:p-3 space-y-2 transition-colors min-h-0 ${
                    isOver ? 'bg-green-600/10 border-2 border-green-600 border-dashed rounded-lg' : ''
                }`}
            >
                <SortableContext items={taskIds}>
                    {tasks.map((task) => (
                        <div key={task.id} className="relative">
                            <TaskCard task={task} />
                            {/* Completed Overlay */}
                            <div className="absolute inset-0 bg-green-600/5 rounded-lg pointer-events-none" />
                        </div>
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 text-xs md:text-sm px-4">
                        <Sparkles className="w-10 h-10 md:w-12 md:h-12 mb-2 md:mb-3 opacity-50" />
                        <p className="text-center">No completed tasks</p>
                        <p className="text-xs mt-1 text-center hidden sm:block">ลาก task ที่ทำเสร็จมาที่นี่</p>
                    </div>
                )}
            </div>
        </div>
    );
}
