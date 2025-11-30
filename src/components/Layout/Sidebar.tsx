import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Layout, Settings, User, GripVertical, Trash2, BookOpen } from 'lucide-react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../../store/useStore';
import { CreateBoardModal } from './CreateBoardModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { appConfig } from '../../config/app';
import type { BoardWithOwnership } from '../../types/supabase';

function SortableBoardItem({ board, isActive, onClick, onDelete }: { board: BoardWithOwnership; isActive: boolean; onClick: () => void; onDelete: () => void }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: board.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <button
                onClick={onClick}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${isActive
                        ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
            >
                <span className="w-2 h-2 rounded-full bg-current opacity-75" />
                <div className="flex-1 min-w-0">
                    <div className="truncate">{board.title}</div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <div
                        onClick={handleDelete}
                        className="p-1 hover:bg-red-600/20 text-red-400 rounded transition-colors cursor-pointer"
                        title="Delete board"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                handleDelete(e as any);
                            }
                        }}
                    >
                        <Trash2 className="w-3 h-3" />
                    </div>
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="w-3 h-3" />
                    </div>
                </div>
            </button>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={onDelete}
                title="Delete Board"
                message={`Are you sure you want to delete "${board.title}"? All tasks in this board will be deleted permanently.`}
                confirmText="Delete Board"
                variant="danger"
            />
        </div>
    );
}

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { boards, activeBoardId, session, fetchBoards, createBoard, setBoards, updateBoardPositions, deleteBoard } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isSettingsActive = location.pathname === '/settings';

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        if (session) {
            fetchBoards();
        }
    }, [session, fetchBoards]);



    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = boards.findIndex((b) => b.id === active.id);
            const newIndex = boards.findIndex((b) => b.id === over.id);

            const newBoards = arrayMove(boards, oldIndex, newIndex);
            setBoards(newBoards);

            // บันทึก position ใหม่ลง database
            updateBoardPositions(newBoards);
        }
    }

    return (
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Layout className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-bold text-xl tracking-tight text-slate-900 dark:text-slate-50">
                    {appConfig.appName}
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {/* Boards Section */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Boards</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="p-1.5 hover:bg-blue-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-white transition-all hover:scale-110"
                        title="Create new board"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={boards.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1 mb-6">
                            {boards.map((board) => (
                                <SortableBoardItem
                                    key={board.id}
                                    board={board}
                                    isActive={activeBoardId === board.id}
                                    onClick={() => navigate(`/boards/${board.id}`)}
                                    onDelete={() => {
                                        deleteBoard(board.id);
                                        if (activeBoardId === board.id) {
                                            navigate('/boards');
                                        }
                                    }}
                                />
                            ))}

                            {boards.length === 0 && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 italic px-2">
                                    No boards yet. Create one!
                                </div>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            <CreateBoardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={async (title) => {
                    const newBoardId = await createBoard(title);
                    // Navigate to the newly created board
                    if (newBoardId) {
                        navigate(`/boards/${newBoardId}`);
                    }
                }}
            />

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <button
                    onClick={() => navigate('/guide')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                >
                    <BookOpen className="w-4 h-4" />
                    <span>คู่มือการใช้งาน</span>
                </button>

                <button
                    onClick={() => navigate('/settings')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${isSettingsActive
                            ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                </button>

                {session && (
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                        {session.user.user_metadata.avatar_url ? (
                            <img
                                src={session.user.user_metadata.avatar_url}
                                alt="Avatar"
                                className="w-8 h-8 rounded-full"
                            />
                        ) : (
                            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                                {session.user.user_metadata.full_name || session.user.user_metadata.name || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {session.user.email}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
