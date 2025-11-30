import { useState, useMemo, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { BoardHeader } from './BoardHeader';
import { useStore } from '../../store/useStore';
import type { Database } from '../../types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];
type ColumnType = Database['public']['Tables']['columns']['Row'];

export function BoardView() {
    const {
        columns,
        tasks,
        setColumns,
        setTasks,
        activeBoardId,
        fetchBoardData,
        createColumn,
        subscribeToTasks,
        subscribeToColumns,
        subscribeToBoard
    } = useStore();
    const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

    // Fetch board data when board loads
    useEffect(() => {
        if (activeBoardId) {
            fetchBoardData(activeBoardId);
        }
    }, [activeBoardId, fetchBoardData]);

    // Set up all real-time subscriptions when board loads
    useEffect(() => {
        if (!activeBoardId) return;

        // Subscribe to all real-time changes
        const cleanupTasks = subscribeToTasks(activeBoardId);
        const cleanupColumns = subscribeToColumns(activeBoardId);
        const cleanupBoard = subscribeToBoard(activeBoardId);

        // Return cleanup function that unsubscribes from all channels
        return () => {
            cleanupTasks();
            cleanupColumns();
            cleanupBoard();
        };
    }, [activeBoardId, subscribeToTasks, subscribeToColumns, subscribeToBoard]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3, // 3px movement required to start drag
            },
        })
    );

    function onDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === 'Column') {
            setActiveColumn(event.active.data.current.column);
            return;
        }

        if (event.active.data.current?.type === 'Task') {
            setActiveTask(event.active.data.current.task);
            return;
        }
    }

    function onDragEnd(event: DragEndEvent) {
        setActiveColumn(null);
        setActiveTask(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveColumn = active.data.current?.type === 'Column';
        if (isActiveColumn) {
            setColumns((columns: ColumnType[]) => {
                const activeIndex = columns.findIndex((col) => col.id === activeId);
                const overIndex = columns.findIndex((col) => col.id === overId);
                return arrayMove(columns, activeIndex, overIndex);
            });
        }
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === 'Task';
        const isOverTask = over.data.current?.type === 'Task';

        if (!isActiveTask) return;

        // Dropping a Task over another Task
        if (isActiveTask && isOverTask) {
            setTasks((tasks: Task[]) => {
                const activeIndex = tasks.findIndex((t) => t.id === activeId);
                const overIndex = tasks.findIndex((t) => t.id === overId);

                if (tasks[activeIndex].column_id !== tasks[overIndex].column_id) {
                    tasks[activeIndex].column_id = tasks[overIndex].column_id;
                }

                return arrayMove(tasks, activeIndex, overIndex);
            });
        }

        const isOverColumn = over.data.current?.type === 'Column';

        // Dropping a Task over a Column
        if (isActiveTask && isOverColumn) {
            setTasks((tasks: Task[]) => {
                const activeIndex = tasks.findIndex((t) => t.id === activeId);
                tasks[activeIndex].column_id = String(overId);
                return arrayMove(tasks, activeIndex, activeIndex); // Trigger re-render
            });
        }
    }

    const handleCreateColumn = async () => {
        if (!activeBoardId) return;
        const title = window.prompt('Enter column title:');
        if (title) {
            await createColumn(activeBoardId, title);
        }
    };

    return (
        <div className="h-full w-full flex flex-col">
            {/* Board Header */}
            <BoardHeader />

            {/* Board Content */}
            <div className="flex-1 p-4 overflow-x-auto overflow-y-hidden">
                <DndContext
                    sensors={sensors}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDragOver={onDragOver}
                >
                    <div className="flex gap-4 h-full">
                        <SortableContext items={columnIds}>
                            {columns.map((col) => (
                                <Column
                                    key={col.id}
                                    column={col}
                                    tasks={tasks.filter((t) => {
                                        const matchesColumn = t.column_id === col.id;
                                        const { searchQuery, filterPriority } = useStore.getState();
                                        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
                                        const matchesPriority = !filterPriority || t.priority === filterPriority;
                                        return matchesColumn && matchesSearch && matchesPriority;
                                    })}
                                />
                            ))}
                        </SortableContext>

                        <button
                            onClick={handleCreateColumn}
                            className="h-[50px] min-w-[300px] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Column
                        </button>
                    </div>

                    {createPortal(
                        <DragOverlay>
                            {activeColumn && (
                                <Column
                                    column={activeColumn}
                                    tasks={tasks.filter((t) => t.column_id === activeColumn.id)}
                                />
                            )}
                            {activeTask && <TaskCard task={activeTask} />}
                        </DragOverlay>,
                        document.body
                    )}
                </DndContext>
            </div>
        </div>
    );
}
