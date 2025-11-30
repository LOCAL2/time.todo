import { useEffect, useState } from 'react';
import { Image as ImageIcon, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface StorageFile {
    name: string;
    id: string;
    created_at: string;
    metadata: {
        size: number;
    };
}

export function StorageView() {
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteFile, setDeleteFile] = useState<string | null>(null);

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        setLoading(true);
        const { data, error } = await supabase.storage
            .from('task-images')
            .list();

        if (error) {
            console.error('Error loading files:', error);
        } else if (data) {
            setFiles(data.map(file => ({
                ...file,
                metadata: {
                    size: (file.metadata as any)?.size || 0
                }
            })) as StorageFile[]);
        }
        setLoading(false);
    };

    const handleDelete = async (fileName: string) => {
        const { error } = await supabase.storage
            .from('task-images')
            .remove([fileName]);

        if (error) {
            console.error('Error deleting file:', error);
        } else {
            loadFiles();
        }
        setDeleteFile(null);
    };

    const getPublicUrl = (fileName: string) => {
        const { data } = supabase.storage
            .from('task-images')
            .getPublicUrl(fileName);
        return data.publicUrl;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Storage Management
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Manage uploaded images ({files.length} files)
                </p>
            </div>

            {files.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <ImageIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">No images uploaded yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden group hover:shadow-lg transition-all"
                        >
                            {/* Image Preview */}
                            <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                                <img
                                    src={getPublicUrl(file.name)}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <a
                                        href={getPublicUrl(file.name)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                                        title="Open in new tab"
                                    >
                                        <ExternalLink className="w-5 h-5 text-white" />
                                    </a>
                                    <button
                                        onClick={() => setDeleteFile(file.name)}
                                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg backdrop-blur-sm transition-colors"
                                        title="Delete image"
                                    >
                                        <Trash2 className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* File Info */}
                            <div className="p-3">
                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate mb-1">
                                    {file.name}
                                </p>
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
                                    <span>{formatFileSize(file.metadata?.size || 0)}</span>
                                    <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteFile !== null}
                onClose={() => setDeleteFile(null)}
                onConfirm={() => deleteFile && handleDelete(deleteFile)}
                title="Delete Image"
                message="Are you sure you want to delete this image? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
