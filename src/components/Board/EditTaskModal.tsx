import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Flag, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DatePicker } from '../common/DatePicker';
import { AlertModal } from '../common/AlertModal';
import { useStore } from '../../store/useStore';
import { compressImage } from '../../lib/imageCompression';
import type { Database } from '../../types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { title: string; description?: string; priority?: string; dueDate?: string; imageUrl?: string }) => void;
    onDelete: () => void;
    task: Task;
}

export function EditTaskModal({ isOpen, onClose, onSubmit, onDelete, task }: EditTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<string>('');
    const [dueDate, setDueDate] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadImage = useStore((state) => state.uploadImage);

    useEffect(() => {
        if (isOpen && task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setPriority(task.priority || '');
            setDueDate(task.due_date || '');
            setImagePreview(task.image_url || null);
            setSelectedImage(null);
            setIsUploading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, task]);

    const processImageFile = async (file: File) => {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit (before compression)
            setAlertMessage('File size must be less than 10MB.');
            setShowAlert(true);
            return;
        }
        if (!file.type.startsWith('image/')) {
            setAlertMessage('Please upload an image file.');
            setShowAlert(true);
            return;
        }

        try {
            // Compress image
            const compressedFile = await compressImage(file);
            setSelectedImage(compressedFile);
            
            // Show preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Error compressing image:', error);
            setAlertMessage('Failed to process image. Please try another file.');
            setShowAlert(true);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processImageFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            processImageFile(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || isUploading) return;

        let imageUrl: string | undefined = imagePreview || undefined;

        if (selectedImage) {
            setIsUploading(true);
            const url = await uploadImage(selectedImage);
            if (url) {
                imageUrl = url;
            }
            setIsUploading(false);
        }

        onSubmit({
            title: title.trim(),
            description: description.trim() || undefined,
            priority: priority || undefined,
            dueDate: dueDate || undefined,
            imageUrl,
        });

        onClose();
    };

    const handleDelete = () => {
        onDelete();
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in"
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit Task</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update task details</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Task Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter task title..."
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            maxLength={100}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more details..."
                            rows={3}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                            maxLength={500}
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Attachment
                        </label>

                        {!imagePreview ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
                                    isDragging
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                        : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                <ImageIcon className={`w-8 h-8 mb-2 transition-colors ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
                                <p className={`text-sm transition-colors ${isDragging ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {isDragging ? 'Drop image here' : 'Click or drag image to upload'}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Max 5MB</p>
                            </div>
                        ) : (
                            <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Priority & Due Date Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Flag className="w-4 h-4" />
                                Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                                <option value="">None</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        {/* Due Date */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Due Date
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-left text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                            >
                                {dueDate ? new Date(dueDate).toLocaleDateString() : 'Select date'}
                            </button>
                            {showDatePicker && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowDatePicker(false)}
                                    />
                                    <div className="fixed z-50 left-1/2 top-1/2 -translate-y-1/2 ml-[15.5rem]">
                                        <DatePicker
                                            value={dueDate}
                                            onChange={(date) => {
                                                setDueDate(date);
                                                setShowDatePicker(false);
                                            }}
                                            onClear={() => {
                                                setDueDate('');
                                                setShowDatePicker(false);
                                            }}
                                            onToday={() => {
                                                const today = new Date().toISOString().split('T')[0];
                                                setDueDate(today);
                                                setShowDatePicker(false);
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 hover:border-red-600/30 text-red-400 rounded-xl font-medium transition-all hover:scale-[1.02] flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                        <div className="flex-1 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all hover:scale-[1.02]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!title.trim() || isUploading}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/30 disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Task"
                message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
                confirmText="Delete Task"
                variant="danger"
            />

            <AlertModal
                isOpen={showAlert}
                onClose={() => setShowAlert(false)}
                title="File Too Large"
                message={alertMessage}
            />
        </div>
    );
}
