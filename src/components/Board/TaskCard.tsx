import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { EditTaskModal } from './EditTaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import type { Database } from '../../types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskCardProps {
    task: Task;
    showCompleteButton?: boolean;
}

function getRelativeTime(dateString: string): string {
    const now = new Date();
    const dueDate = new Date(dateString);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        const absDays = Math.abs(diffDays);
        if (absDays === 0) return 'today';
        if (absDays === 1) return '1 day ago';
        if (absDays < 30) return `${absDays} days ago`;
        if (absDays < 365) {
            const months = Math.floor(absDays / 30);
            return months === 1 ? '1 month ago' : `${months} months ago`;
        }
        const years = Math.floor(absDays / 365);
        return years === 1 ? '1 year ago' : `${years} years ago`;
    }

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    if (diffDays < 7) return `in ${diffDays} days`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? 'in 1 week' : `in ${weeks} weeks`;
    }
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return months === 1 ? 'in 1 month' : `in ${months} months`;
    }
    const years = Math.floor(diffDays / 365);
    return years === 1 ? 'in 1 year' : `in ${years} years`;
}

export function TaskCard({ task, showCompleteButton = false }: TaskCardProps) {
    const updateTask = useStore((state) => state.updateTask);
    const deleteTask = useStore((state) => state.deleteTask);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
        },
    });

    const handleCardClick = () => {
        setIsDetailModalOpen(true);
    };

    const handleComplete = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateTask(task.id, { status: 'completed' });
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const handleEditSubmit = (data: { title: string; description?: string; priority?: string; dueDate?: string; imageUrl?: string }) => {
        updateTask(task.id, {
            title: data.title,
            description: data.description || null,
            priority: (data.priority as 'low' | 'medium' | 'high' | null) || null,
            due_date: data.dueDate || null,
            image_url: data.imageUrl || null,
        });
    };

    const handleDelete = () => {
        deleteTask(task.id);
        setShowDeleteConfirm(false);
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-blue-500 opacity-50 h-[100px]"
            />
        );
    }

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                onClick={handleCardClick}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg dark:hover:shadow-black/20 group shadow-sm transition-all duration-200 hover:-translate-y-0.5 animate-slide-in-up cursor-pointer"
            >
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-slate-900 dark:text-slate-200 text-sm leading-tight flex-1">
                        {task.title}
                    </h3>
                    {task.priority && (
                        <div className={`flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-md text-xs font-medium ${task.priority === 'high'
                            ? 'bg-red-500/10 text-red-400'
                            : task.priority === 'medium'
                                ? 'bg-yellow-500/10 text-yellow-400'
                                : 'bg-green-500/10 text-green-400'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'high'
                                ? 'bg-red-500'
                                : task.priority === 'medium'
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`} />
                            {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
                        </div>
                    )}
                </div>

                {task.image_url && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <img
                            src={task.image_url}
                            alt="Task attachment"
                            className="w-full h-32 object-contain"
                        />
                    </div>
                )}

                {task.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                        {task.description}
                    </p>
                )}

                <div className="flex items-center justify-between gap-3 mt-auto">
                    <div className="flex items-center gap-3">
                        {task.due_date && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                                <Calendar className="w-3 h-3" />
                                <span>
                                    {new Date(task.due_date).toLocaleDateString()}
                                    <span className="text-slate-400 dark:text-slate-500"> ({getRelativeTime(task.due_date)})</span>
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleEdit}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 hover:border-blue-600/30 text-blue-400 transition-all hover:scale-110 cursor-pointer"
                            title="Edit task"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 hover:border-red-600/30 text-red-400 transition-all hover:scale-110 cursor-pointer"
                            title="Delete task"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        {showCompleteButton && (
                            <button
                                onClick={handleComplete}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-green-600/10 hover:bg-green-600/20 border border-green-600/20 hover:border-green-600/30 text-green-400 transition-all hover:scale-110 cursor-pointer"
                                title="Mark as completed"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <TaskDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                task={task}
            />

            <EditTaskModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditSubmit}
                onDelete={handleDelete}
                task={task}
            />

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Task"
                message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
                confirmText="Delete Task"
                variant="danger"
            />
        </>
    );
}
