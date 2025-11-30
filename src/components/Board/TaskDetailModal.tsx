import { X, Calendar, Flag, Image as ImageIcon } from 'lucide-react';
import type { Database } from '../../types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
}

export function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {task.title}
                        </h2>
                        {task.priority && (
                            <div className="flex items-center gap-2 mt-2">
                                <Flag className="w-4 h-4" />
                                <span className={`text-sm font-medium ${
                                    task.priority === 'high'
                                        ? 'text-red-400'
                                        : task.priority === 'medium'
                                        ? 'text-yellow-400'
                                        : 'text-green-400'
                                }`}>
                                    {task.priority === 'high' ? 'High Priority' : task.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Image */}
                    {task.image_url && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Attachment
                            </label>
                            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                <img
                                    src={task.image_url}
                                    alt="Task attachment"
                                    className="w-full max-h-96 object-contain bg-slate-50 dark:bg-slate-800"
                                />
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {task.description && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Description
                            </label>
                            <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                {task.description}
                            </p>
                        </div>
                    )}

                    {/* Due Date */}
                    {task.due_date && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Due Date
                            </label>
                            <p className="text-slate-600 dark:text-slate-400">
                                {new Date(task.due_date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    )}

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Status
                        </label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            task.status === 'completed'
                                ? 'bg-green-500/10 text-green-400'
                                : task.status === 'priority'
                                ? 'bg-yellow-500/10 text-yellow-400'
                                : 'bg-slate-500/10 text-slate-400'
                        }`}>
                            {task.status === 'completed' ? 'Completed' : task.status === 'priority' ? 'Priority' : 'Backlog'}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
