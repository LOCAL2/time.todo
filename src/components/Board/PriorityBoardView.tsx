import { useState, useEffect } from 'react';
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
import { arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { BoardHeader } from './BoardHeader';
import { BacklogSection } from './BacklogSection';
import { PriorityQueueSection } from './PriorityQueueSection';
import { CompletedSection } from './CompletedSection';
import { TaskCard } from './TaskCard';
import { BoardNotFound } from './BoardNotFound';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

export function PriorityBoardView() {
    const { 
        tasks, 
        activeBoardId, 
        fetchBoardData, 
        updateTask, 
        setTasks, 
        searchQuery, 
        filterPriority
    } = useStore();
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [boardNotFound, setBoardNotFound] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch board data and check if board exists
    useEffect(() => {
        if (!activeBoardId) return;

        const checkAndFetchBoard = async () => {
            try {
                setLoading(true);
                
                // Check if board exists in database
                const { data: boardData, error } = await supabase
                    .from('boards')
                    .select('id')
                    .eq('id', activeBoardId)
                    .single();

                if (error || !boardData) {
                    // Board doesn't exist
                    setBoardNotFound(true);
                    setLoading(false);
                    return;
                }

                // Board exists, fetch data
                setBoardNotFound(false);
                await fetchBoardData(activeBoardId);
                setLoading(false);
            } catch (err) {
                console.error('Error checking board:', err);
                setBoardNotFound(true);
                setLoading(false);
            }
        };

        checkAndFetchBoard();
    }, [activeBoardId, fetchBoardData]);

    // Set up real-time subscriptions - only refresh when data changes
    useEffect(() => {
        if (!activeBoardId) return;

        console.log('Setting up realtime subscriptions for board:', activeBoardId);

        // Subscribe to task changes
        const taskChannel = supabase
            .channel(`tasks-${activeBoardId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `board_id=eq.${activeBoardId}`
                },
                (payload) => {
                    console.log('Task change detected:', payload);
                    // Refresh only when task changes
                    fetchBoardData(activeBoardId);
                }
            )
            .subscribe((status) => {
                console.log('Task subscription status:', status);
            });

        // Subscribe to column changes
        const columnChannel = supabase
            .channel(`columns-${activeBoardId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'columns',
                    filter: `board_id=eq.${activeBoardId}`
                },
                (payload) => {
                    console.log('Column change detected:', payload);
                    // Refresh only when column changes
                    fetchBoardData(activeBoardId);
                }
            )
            .subscribe((status) => {
                console.log('Column subscription status:', status);
            });

        return () => {
            console.log('Cleaning up realtime subscriptions');
            supabase.removeChannel(taskChannel);
            supabase.removeChannel(columnChannel);
        };
    }, [activeBoardId, fetchBoardData]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        })
    );

    // Filter tasks based on search and priority
    const filteredTasks = tasks.filter(task => {
        // Search filter
        const matchesSearch = !searchQuery || 
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Priority filter
        const matchesPriority = !filterPriority || task.priority === filterPriority;
        
        return matchesSearch && matchesPriority;
    });

    // แบ่ง tasks ตามสถานะ
    const backlogTasks = filteredTasks.filter(t => t.status === 'backlog' || !t.status);
    const priorityTasks = filteredTasks.filter(t => t.status === 'priority').sort((a, b) => a.position - b.position);
    const completedTasks = filteredTasks.filter(t => t.status === 'completed');

    function onDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === 'Task') {
            setActiveTask(event.active.data.current.task);
        }
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const activeTask = tasks.find(t => t.id === activeId);
        const overTask = tasks.find(t => t.id === overId);

        if (!activeTask) return;

        // ถ้าทั้งสองอยู่ใน priority queue ให้เรียงลำดับใหม่
        if (activeTask.status === 'priority' && overTask?.status === 'priority') {
            setTasks((tasks: Task[]) => {
                const activeIndex = tasks.findIndex(t => t.id === activeId);
                const overIndex = tasks.findIndex(t => t.id === overId);
                
                const newTasks = arrayMove(tasks, activeIndex, overIndex);
                
                // อัพเดท position ของ tasks ใน priority queue
                const priorityTasks = newTasks.filter(t => t.status === 'priority');
                priorityTasks.forEach((task, index) => {
                    task.position = index;
                });
                
                return newTasks;
            });
        }
    }

    function onDragEnd(event: DragEndEvent) {
        setActiveTask(null);

        const { active, over } = event;
        if (!over) return;

        const taskId = active.id as string;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const overTask = tasks.find(t => t.id === over.id);
        const overSection = over.data.current?.section;

        // ถ้าลากภายใน priority queue
        if (task.status === 'priority' && overTask?.status === 'priority') {
            // ใช้ tasks จาก state ปัจจุบัน (หลัง onDragOver อัพเดทแล้ว)
            const currentPriorityTasks = tasks.filter(t => t.status === 'priority');
            
            // บันทึก position ของทุก task ใน priority queue ลง database
            const updates = currentPriorityTasks.map((t, index) => {
                return updateTask(t.id, { position: index });
            });
            
            // รอให้ทุก update เสร็จ
            Promise.all(updates).then(() => {
                console.log('All positions updated');
            });
            
            return;
        }

        // ถ้าย้ายไป section อื่น
        if (!overSection || task.status === overSection) return;

        // คำนวณ position ใหม่
        let newPosition = 0;
        if (overSection === 'priority') {
            const priorityTasksCount = tasks.filter(t => t.status === 'priority').length;
            newPosition = priorityTasksCount;
        }

        // Optimistic update - อัพเดท UI ทันทีก่อน
        setTasks((currentTasks: Task[]) => {
            return currentTasks.map(t => 
                t.id === taskId 
                    ? { ...t, status: overSection as any, position: newPosition }
                    : t
            );
        });

        // แล้วค่อยบันทึกลง database (async)
        updateTask(taskId, { 
            status: overSection,
            position: newPosition 
        });
    }

    // Show loading state
    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-950">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">กำลังโหลดบอร์ด...</p>
                </div>
            </div>
        );
    }

    // Show 404 if board not found
    if (boardNotFound) {
        return <BoardNotFound />;
    }

    return (
        <div className="h-full w-full flex flex-col bg-slate-950">
            {/* Header with Share button */}
            <BoardHeader />

            {/* Board Content - Responsive Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <DndContext
                    sensors={sensors}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                >
                    {/* Mobile: Scrollable horizontal, Desktop: Side by side */}
                    <div className="flex-1 flex flex-col md:flex-row overflow-x-auto md:overflow-x-hidden overflow-y-hidden">
                        {/* Backlog Section */}
                        <BacklogSection tasks={backlogTasks} />

                        {/* Priority Queue Section */}
                        <PriorityQueueSection tasks={priorityTasks} />

                        {/* Completed Section */}
                        <CompletedSection tasks={completedTasks} />
                    </div>

                    {createPortal(
                        <DragOverlay>
                            {activeTask && <TaskCard task={activeTask} />}
                        </DragOverlay>,
                        document.body
                    )}
                </DndContext>
            </div>
        </div>
    );
}
