import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { Plus, Inbox } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { useStore } from '../../store/useStore';
import type { Database } from '../../types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

interface BacklogSectionProps {
    tasks: Task[];
}

export function BacklogSection({ tasks }: BacklogSectionProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { activeBoardId, createTask } = useStore();
    const { setNodeRef, isOver } = useDroppable({
        id: 'backlog',
        data: { section: 'backlog' },
    });

    const taskIds = tasks.map(t => t.id);

    return (
        <div className="w-full md:w-80 flex-shrink-0 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col min-h-0">
            {/* Header - Responsive */}
            <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Inbox className="w-4 h-4 md:w-5 md:h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">Backlog</h2>
                        <p className="text-xs text-slate-600 dark:text-slate-500 hidden sm:block">สร้าง task ใหม่</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full mt-2 md:mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 active:scale-95"
                >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Create Task</span>
                    <span className="sm:hidden">New</span>
                </button>
            </div>

            {/* Tasks List - Responsive */}
            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto p-2 md:p-3 space-y-2 transition-colors min-h-0 ${isOver ? 'bg-blue-600/10 border-2 border-blue-600 border-dashed rounded-lg' : ''
                    }`}
            >
                <SortableContext items={taskIds}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 text-xs md:text-sm px-4">
                        <Inbox className="w-10 h-10 md:w-12 md:h-12 mb-2 md:mb-3 opacity-50" />
                        <p className="text-center">No tasks yet</p>
                        <p className="text-xs mt-1 text-center hidden sm:block">Click "Create Task" to start</p>
                    </div>
                )}
            </div>

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={(data) => {
                    if (!activeBoardId) return;
                    createTask(activeBoardId, data.title, data.description, data.priority, data.dueDate, data.imageUrl, 'backlog');
                }}
                columnTitle="Backlog"
            />
        </div>
    );
}
