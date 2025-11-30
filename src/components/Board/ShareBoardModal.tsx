import { useState, useEffect } from 'react';
import { X, Link2, Copy, Check, Eye, Edit3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ShareBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    boardId: string;
    boardTitle: string;
}

export function ShareBoardModal({ isOpen, onClose, boardId, boardTitle }: ShareBoardModalProps) {
    const [copied, setCopied] = useState(false);
    const [shareMode, setShareMode] = useState<'readonly' | 'edit'>('readonly');
    const [loading, setLoading] = useState(false);
    
    const shareUrl = `${window.location.origin}/shared/${boardId}`;

    // Load current share mode
    useEffect(() => {
        if (isOpen && boardId) {
            loadShareMode();
        }
    }, [isOpen, boardId]);

    const loadShareMode = async () => {
        try {
            const { data, error } = await supabase
                .from('boards')
                .select('share_mode')
                .eq('id', boardId)
                .single<{ share_mode: string }>();

            if (error) throw error;
            if (data?.share_mode) {
                setShareMode(data.share_mode as 'readonly' | 'edit');
            }
        } catch (err) {
            console.error('Error loading share mode:', err);
        }
    };

    const updateShareMode = async (mode: 'readonly' | 'edit') => {
        setLoading(true);
        try {
            const { error } = await (supabase
                .from('boards')
                .update as any)({ share_mode: mode })
                .eq('id', boardId);

            if (error) throw error;
            setShareMode(mode);
        } catch (err) {
            console.error('Error updating share mode:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center">
                            <Link2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">แชร์บอร์ด</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{boardTitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Share Mode Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            สิทธิ์การเข้าถึง
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => updateShareMode('readonly')}
                                disabled={loading}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                    shareMode === 'readonly'
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        shareMode === 'readonly'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}>
                                        <Eye className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <div className={`font-medium text-sm ${
                                            shareMode === 'readonly'
                                                ? 'text-blue-900 dark:text-blue-300'
                                                : 'text-slate-700 dark:text-slate-300'
                                        }`}>
                                            อ่านอย่างเดียว
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            ดูได้อย่างเดียว
                                        </div>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => updateShareMode('edit')}
                                disabled={loading}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                    shareMode === 'edit'
                                        ? 'border-green-600 bg-green-50 dark:bg-green-950/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        shareMode === 'edit'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}>
                                        <Edit3 className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <div className={`font-medium text-sm ${
                                            shareMode === 'edit'
                                                ? 'text-green-900 dark:text-green-300'
                                                : 'text-slate-700 dark:text-slate-300'
                                        }`}>
                                            แก้ไขได้
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            แก้ไข/เพิ่ม/ลบได้
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Share Link */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            ลิงก์แชร์
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 text-sm font-mono"
                            />
                            <button
                                onClick={handleCopy}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        คัดลอกแล้ว!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        คัดลอก
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className={`rounded-lg p-4 border ${
                        shareMode === 'edit'
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                            : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                    }`}>
                        <p className={`text-sm ${
                            shareMode === 'edit'
                                ? 'text-green-900 dark:text-green-300'
                                : 'text-blue-900 dark:text-blue-300'
                        }`}>
                            <strong>หมายเหตุ:</strong> {shareMode === 'edit' 
                                ? 'ผู้ที่มีลิงก์นี้สามารถดู แก้ไข เพิ่ม และลบงานในบอร์ดได้'
                                : 'ผู้ที่มีลิงก์นี้สามารถดูบอร์ดและงานของคุณได้ แต่ไม่สามารถแก้ไขหรือลบได้'
                            }
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    );
}
