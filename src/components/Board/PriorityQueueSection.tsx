import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ListOrdered, ArrowDown } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Database } from '../../types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

interface PriorityQueueSectionProps {
    tasks: Task[];
}

export function PriorityQueueSection({ tasks }: PriorityQueueSectionProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'priority',
        data: { section: 'priority' },
    });

    const taskIds = tasks.map(t => t.id);

    return (
        <div className="w-full md:flex-1 bg-white dark:bg-slate-950 flex flex-col min-h-0">
            {/* Header - Responsive */}
            <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ListOrdered className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">Priority Queue</h2>
                        <p className="text-xs text-slate-600 dark:text-slate-500 hidden sm:block">ลาก task มาเรียงลำดับความสำคัญ</p>
                    </div>
                </div>
            </div>

            {/* Priority Queue - Responsive */}
            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto p-3 md:p-6 transition-colors min-h-0 ${
                    isOver ? 'bg-blue-600/10 border-2 border-blue-600 border-dashed rounded-lg' : ''
                }`}
            >
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    <div className="max-w-2xl mx-auto space-y-2 md:space-y-3">
                        {tasks.map((task, index) => (
                            <div 
                                key={task.id} 
                                className="relative group/item"
                            >
                                {/* Priority Number - Hidden on mobile, show on tablet+ */}
                                <div className="hidden md:flex absolute -left-14 top-1/2 -translate-y-1/2 flex-col items-center">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-600/30 group-hover/item:scale-110 transition-transform">
                                        {index + 1}
                                    </div>
                                    {index < tasks.length - 1 && (
                                        <div className="w-0.5 h-8 bg-gradient-to-b from-blue-600/50 to-transparent mt-2" />
                                    )}
                                </div>
                                {/* Mobile Priority Badge */}
                                <div className="md:hidden absolute -top-2 -left-2 z-10">
                                    <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-600/30">
                                        {index + 1}
                                    </div>
                                </div>
                                <TaskCard task={task} showCompleteButton={true} />
                            </div>
                        ))}
                    </div>
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 text-xs md:text-sm px-4">
                        <ArrowDown className="w-10 h-10 md:w-12 md:h-12 mb-2 md:mb-3 opacity-50 animate-bounce" />
                        <p className="text-center">Drag tasks here</p>
                        <p className="text-xs mt-1 text-center hidden sm:block">เรียงลำดับว่าจะทำอันไหนก่อนหลัง</p>
                    </div>
                )}
            </div>
        </div>
    );
}
