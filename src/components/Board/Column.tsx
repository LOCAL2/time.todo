import { useMemo, useState } from 'react';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { useStore } from '../../store/useStore';
import type { Database } from '../../types/supabase';

type Column = Database['public']['Tables']['columns']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface ColumnProps {
    column: Column;
    tasks: Task[];
}

export function Column({ column, tasks }: ColumnProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const createTask = useStore((state) => state.createTask);
    const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        data: {
            type: 'Column',
            column,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-slate-200/50 dark:bg-slate-800/50 w-[300px] h-[500px] max-h-full rounded-xl border-2 border-blue-500 opacity-50 flex-shrink-0"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-slate-100/50 dark:bg-slate-900/50 w-[300px] h-full max-h-full rounded-xl flex flex-col flex-shrink-0 border border-slate-200/50 dark:border-slate-800/50"
        >
            {/* Column Header */}
            <div
                {...attributes}
                {...listeners}
                className="p-3 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 cursor-grab active:cursor-grabbing"
            >
                <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        {column.title}
                    </h2>
                    <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium">
                        {tasks.length}
                    </span>
                </div>
                <button className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* Tasks Container */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <SortableContext items={taskIds}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>
            </div>

            {/* Footer / Add Task */}
            <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/50">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 p-2 rounded-lg text-sm transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Task
                </button>
            </div>

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={(data) => {
                    createTask(column.id, data.title, data.description, data.priority, data.dueDate, data.imageUrl);
                }}
                columnTitle={column.title}
            />
        </div>
    );
}
