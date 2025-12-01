import { useState } from 'react';
import { X, Link2, Copy, Check, Eye, Edit3 } from 'lucide-react';

interface ShareBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    boardId: string;
    boardTitle: string;
}

export function ShareBoardModal({ isOpen, onClose, boardId, boardTitle }: ShareBoardModalProps) {
    const [copiedReadonly, setCopiedReadonly] = useState(false);
    const [copiedEdit, setCopiedEdit] = useState(false);
    
    const readonlyUrl = `${window.location.origin}/shared/${boardId}`;
    const editUrl = `${window.location.origin}/shared/${boardId}/edit`;

    const handleCopyReadonly = async () => {
        try {
            await navigator.clipboard.writeText(readonlyUrl);
            setCopiedReadonly(true);
            setTimeout(() => setCopiedReadonly(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleCopyEdit = async () => {
        try {
            await navigator.clipboard.writeText(editUrl);
            setCopiedEdit(true);
            setTimeout(() => setCopiedEdit(false), 2000);
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
                    {/* Readonly Link */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-4 h-4 text-blue-600" />
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                ลิงก์อ่านอย่างเดียว
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={readonlyUrl}
                                readOnly
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 text-sm font-mono"
                            />
                            <button
                                onClick={handleCopyReadonly}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                            >
                                {copiedReadonly ? (
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            ผู้ที่มีลิงก์นี้สามารถดูบอร์ดได้อย่างเดียว ไม่สามารถแก้ไขได้
                        </p>
                    </div>

                    {/* Edit Link */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Edit3 className="w-4 h-4 text-green-600" />
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                ลิงก์แก้ไขได้
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={editUrl}
                                readOnly
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 text-sm font-mono"
                            />
                            <button
                                onClick={handleCopyEdit}
                                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                            >
                                {copiedEdit ? (
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            ผู้ที่มีลิงก์นี้สามารถดู แก้ไข เพิ่ม และลบงานในบอร์ดได้
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="rounded-lg p-4 border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                        <p className="text-sm text-amber-900 dark:text-amber-300">
                            <strong>หมายเหตุ:</strong> ใช้ลิงก์ที่เหมาะสมตามสิทธิ์ที่ต้องการให้ผู้อื่น ลิงก์ทั้งสองแยกกันและใช้งานได้พร้อมกัน
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
