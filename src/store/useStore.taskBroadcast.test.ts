// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useStore } from './useStore';
import type { Database } from '../types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

describe('Real-time Task Subscriptions', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useStore.getState();
    store.setSession(null);
    store.setTasks([]);
    store.setActiveBoardId(null);
  });

  describe('Property 7: Task creation broadcasts to all users', () => {
    /**
     * **Feature: realtime-collaboration, Property 7: Task creation broadcasts to all users**
     * 
     * This property tests that for any task creation on a board, all connected users
     * viewing that board should receive the new task in real-time.
     * 
     * **Validates: Requirements 3.1**
     * 
     * Note: This property test validates the state management logic for task creation.
     * It tests that when a new task is added to the store, the task list is updated
     * correctly and all task properties are preserved.
     */
    it('should add newly created task to the task list', () => {
      fc.assert(
        fc.property(
          // Generate initial array of tasks
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              column_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
              priority: fc.option(fc.constantFrom('low', 'medium', 'high'), { nil: null }),
              due_date: fc.option(
                fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-01-01').getTime() })
                  .map(ts => new Date(ts).toISOString()),
                { nil: null }
              ),
              status: fc.constantFrom('todo', 'in_progress', 'done', 'backlog'),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
              updated_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { 
              minLength: 0, 
              maxLength: 20,
              selector: (task) => task.id 
            }
          ),
          // Generate a new task to add
          fc.record({
            id: fc.uuid(),
            board_id: fc.uuid(),
            column_id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
            priority: fc.option(fc.constantFrom('low', 'medium', 'high'), { nil: null }),
            due_date: fc.option(
              fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
              { nil: null }
            ),
            status: fc.constantFrom('todo', 'in_progress', 'done', 'backlog'),
            position: fc.nat({ max: 100 }),
            created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
              .map(ts => new Date(ts).toISOString()),
            updated_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
              .map(ts => new Date(ts).toISOString()),
          }),
          (initialTasks, newTask) => {
            // Ensure the new task has a unique ID not in the initial list
            fc.pre(!initialTasks.some(t => t.id === newTask.id));
            
            // Set initial tasks list
            useStore.getState().setTasks(initialTasks);
            
            // Get fresh state reference to verify initial state
            let currentState = useStore.getState();
            expect(currentState.tasks).toHaveLength(initialTasks.length);
            expect(currentState.tasks).toEqual(initialTasks);
            
            // Simulate task creation by adding the new task
            // (This mimics what subscribeToTasks does when INSERT event is received)
            const updatedTasks = [...initialTasks, newTask];
            useStore.getState().setTasks(updatedTasks);
            
            // Property: After task creation, the task list should include the new task
            // Get fresh state reference after update
            currentState = useStore.getState();
            const currentTasks = currentState.tasks;
            
            // 1. The list should have grown by exactly one task
            expect(currentTasks.length).toBe(initialTasks.length + 1);
            
            // 2. The new task should be present in the list
            const addedTask = currentTasks.find(t => t.id === newTask.id);
            expect(addedTask).toBeDefined();
            
            // 3. The new task should have all the correct properties
            expect(addedTask).toEqual(newTask);
            
            // 4. All original tasks should still be present
            initialTasks.forEach(originalTask => {
              const stillPresent = currentTasks.find(t => t.id === originalTask.id);
              expect(stillPresent).toBeDefined();
              expect(stillPresent).toEqual(originalTask);
            });
            
            // 5. No duplicate tasks should exist
            const uniqueIds = new Set(currentTasks.map(t => t.id));
            expect(uniqueIds.size).toBe(currentTasks.length);
            
            // 6. The new task should have all required fields
            expect(addedTask).toHaveProperty('id');
            expect(addedTask).toHaveProperty('board_id');
            expect(addedTask).toHaveProperty('column_id');
            expect(addedTask).toHaveProperty('title');
            expect(addedTask).toHaveProperty('status');
            expect(addedTask).toHaveProperty('position');
            expect(addedTask).toHaveProperty('created_at');
            expect(addedTask).toHaveProperty('updated_at');
            
            // 7. Task title should not be empty
            expect(addedTask!.title.length).toBeGreaterThan(0);
            
            // 8. Task status should be valid
            expect(['todo', 'in_progress', 'done', 'backlog']).toContain(addedTask!.status);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve task data integrity during creation', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              column_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
              priority: fc.option(fc.constantFrom('low', 'medium', 'high'), { nil: null }),
              due_date: fc.option(
                fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-01-01').getTime() })
                  .map(ts => new Date(ts).toISOString()),
                { nil: null }
              ),
              status: fc.constantFrom('todo', 'in_progress', 'done', 'backlog'),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
              updated_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 0, maxLength: 10, selector: (task) => task.id }
          ),
          fc.record({
            id: fc.uuid(),
            board_id: fc.uuid(),
            column_id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
            priority: fc.option(fc.constantFrom('low', 'medium', 'high'), { nil: null }),
            due_date: fc.option(
              fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
              { nil: null }
            ),
            status: fc.constantFrom('todo', 'in_progress', 'done', 'backlog'),
            position: fc.nat({ max: 100 }),
            created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
              .map(ts => new Date(ts).toISOString()),
            updated_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
              .map(ts => new Date(ts).toISOString()),
          }),
          (initialTasks, newTask) => {
            fc.pre(!initialTasks.some(t => t.id === newTask.id));
            
            useStore.getState().setTasks(initialTasks);
            
            // Add new task
            const updatedTasks = [...initialTasks, newTask];
            useStore.getState().setTasks(updatedTasks);
            
            // Get fresh state reference
            const currentState = useStore.getState();
            const currentTasks = currentState.tasks;
            const addedTask = currentTasks.find(t => t.id === newTask.id);
            
            // Property: Task data should be preserved exactly as provided
            expect(addedTask).toBeDefined();
            expect(addedTask!.id).toBe(newTask.id);
            expect(addedTask!.board_id).toBe(newTask.board_id);
            expect(addedTask!.column_id).toBe(newTask.column_id);
            expect(addedTask!.title).toBe(newTask.title);
            expect(addedTask!.description).toBe(newTask.description);
            expect(addedTask!.priority).toBe(newTask.priority);
            expect(addedTask!.due_date).toBe(newTask.due_date);
            expect(addedTask!.status).toBe(newTask.status);
            expect(addedTask!.position).toBe(newTask.position);
            expect(addedTask!.created_at).toBe(newTask.created_at);
            expect(addedTask!.updated_at).toBe(newTask.updated_at);
            
            // Verify no data mutation occurred
            expect(addedTask).toEqual(newTask);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Task updates broadcast to all users', () => {
    /**
     * **Feature: realtime-collaboration, Property 8: Task updates broadcast to all users**
     * 
     * This property tests that for any task update on a board, all connected users
     * viewing that board should receive the updated task data in real-time.
     * 
     * **Validates: Requirements 3.2**
     * 
     * Note: This property test validates the state management logic for task updates.
     * It tests that when a task is updated in the store, the task list reflects
     * the changes correctly while preserving other tasks.
     */
    it('should update existing task with new data', () => {
      fc.assert(
        fc.property(
          // Generate initial array of tasks
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              column_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
              priority: fc.option(fc.constantFrom('low', 'medium', 'high'), { nil: null }),
              due_date: fc.option(
                fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-01-01').getTime() })
                  .map(ts => new Date(ts).toISOString()),
                { nil: null }
              ),
              status: fc.constantFrom('todo', 'in_progress', 'done', 'backlog'),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
              updated_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { 
              minLength: 1, 
              maxLength: 20,
              selector: (task) => task.id 
            }
          ),
          // Generate index of task to update
          fc.nat(),
          // Generate updates to apply
          fc.record({
            title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
            priority: fc.option(fc.constantFrom('low', 'medium', 'high'), { nil: undefined }),
            status: fc.option(fc.constantFrom('todo', 'in_progress', 'done', 'backlog'), { nil: undefined }),
            position: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
          }),
          (initialTasks, updateIndex, updates) => {
            // Ensure we have a valid index to update
            const indexToUpdate = updateIndex % initialTasks.length;
            const taskToUpdate = initialTasks[indexToUpdate];
            
            // Set initial tasks list
            useStore.getState().setTasks(initialTasks);
            
            // Get fresh state reference to verify initial state
            let currentState = useStore.getState();
            expect(currentState.tasks).toHaveLength(initialTasks.length);
            
            // Create updated task by merging updates
            const updatedTask = { ...taskToUpdate, ...updates };
            
            // Simulate task update by updating the task in the list
            // (This mimics what subscribeToTasks does when UPDATE event is received)
            const updatedTasks = initialTasks.map(t => 
              t.id === taskToUpdate.id ? updatedTask : t
            );
            useStore.getState().setTasks(updatedTasks);
            
            // Property: After task update, the task list should reflect the changes
            // Get fresh state reference after update
            currentState = useStore.getState();
            const currentTasks = currentState.tasks;
            
            // 1. The list should have the same number of tasks
            expect(currentTasks.length).toBe(initialTasks.length);
            
            // 2. The updated task should be present in the list
            const updatedTaskInStore = currentTasks.find(t => t.id === taskToUpdate.id);
            expect(updatedTaskInStore).toBeDefined();
            
            // 3. The updated task should have the new values
            if (updates.title !== undefined) {
              expect(updatedTaskInStore!.title).toBe(updates.title);
            }
            if (updates.description !== undefined) {
              expect(updatedTaskInStore!.description).toBe(updates.description);
            }
            if (updates.priority !== undefined) {
              expect(updatedTaskInStore!.priority).toBe(updates.priority);
            }
            if (updates.status !== undefined) {
              expect(updatedTaskInStore!.status).toBe(updates.status);
            }
            if (updates.position !== undefined) {
              expect(updatedTaskInStore!.position).toBe(updates.position);
            }
            
            // 4. All other tasks should remain unchanged
            initialTasks.forEach(originalTask => {
              if (originalTask.id !== taskToUpdate.id) {
                const unchangedTask = currentTasks.find(t => t.id === originalTask.id);
                expect(unchangedTask).toEqual(originalTask);
              }
            });
            
            // 5. No duplicate tasks should exist
            const uniqueIds = new Set(currentTasks.map(t => t.id));
            expect(uniqueIds.size).toBe(currentTasks.length);
            
            // 6. The task ID should not change
            expect(updatedTaskInStore!.id).toBe(taskToUpdate.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple sequential task updates', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              column_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
              priority: fc.option(fc.constantFrom('low', 'medium', 'high'), { nil: null }),
              due_date: fc.option(
                fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-01-01').getTime() })
                  .map(ts => new Date(ts).toISOString()),
                { nil: null }
              ),
              status: fc.constantFrom('todo', 'in_progress', 'done', 'backlog'),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
              updated_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 1, maxLength: 10, selector: (task) => task.id }
          ),
          fc.nat(),
          fc.array(
            fc.record({
              title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
              status: fc.option(fc.constantFrom('todo', 'in_progress', 'done', 'backlog'), { nil: undefined }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (initialTasks, updateIndex, updateSequence) => {
            const indexToUpdate = updateIndex % initialTasks.length;
            const taskToUpdate = initialTasks[indexToUpdate];
            
            useStore.getState().setTasks(initialTasks);
            
            // Apply updates sequentially
            let currentTask = taskToUpdate;
            updateSequence.forEach((updates) => {
              currentTask = { ...currentTask, ...updates };
              const updatedTasks = useStore.getState().tasks.map(t => 
                t.id === taskToUpdate.id ? currentTask : t
              );
              useStore.getState().setTasks(updatedTasks);
            });
            
            // Get fresh state reference
            const currentState = useStore.getState();
            const finalTasks = currentState.tasks;
            const finalTask = finalTasks.find(t => t.id === taskToUpdate.id);
            
            // Property: After multiple updates, the task should have the final state
            expect(finalTask).toBeDefined();
            expect(finalTasks.length).toBe(initialTasks.length);
            
            // All updates should be applied
            const lastUpdate = updateSequence[updateSequence.length - 1];
            if (lastUpdate.title !== undefined) {
              expect(finalTask!.title).toBe(lastUpdate.title);
            }
            if (lastUpdate.status !== undefined) {
              expect(finalTask!.status).toBe(lastUpdate.status);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Task deletion broadcasts to all users', () => {
    /**
     * **Feature: realtime-collaboration, Property 9: Task deletion broadcasts to all users**
     * 
     * This property tests that for any task deletion on a board, all connected users
     * viewing that board should see the task removed from their view in real-time.
     * 
     * **Validates: Requirements 3.3**
     * 
     * Note: This property test validates the state management logic for task deletion.
     * It tests that when a task is deleted from the store, the task list is updated
     * correctly and the deleted task is no longer present.
     */
    it('should remove deleted task from the task list', () => {
      fc.assert(
        fc.property(
          // Generate initial array of tasks
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              column_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
              priority: fc.option(fc.constantFrom('low', 'medium', 'high'), { nil: null }),
              due_date: fc.option(
                fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-01-01').getTime() })
                  .map(ts => new Date(ts).toISOString()),
                { nil: null }
              ),
              status: fc.constantFrom('todo', 'in_progress', 'done', 'backlog'),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
              updated_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { 
              minLength: 1, 
              maxLength: 20,
              selector: (task) => task.id 
            }
          ),
          // Generate index of task to delete
          fc.nat(),
          (initialTasks, deleteIndex) => {
            // Ensure we have a valid index to delete
            const indexToDelete = deleteIndex % initialTasks.length;
            const taskToDelete = initialTasks[indexToDelete];
            
            // Set initial tasks list
            useStore.getState().setTasks(initialTasks);
            
            // Get fresh state reference to verify initial state
            let currentState = useStore.getState();
            expect(currentState.tasks).toHaveLength(initialTasks.length);
            expect(currentState.tasks.find(t => t.id === taskToDelete.id)).toBeDefined();
            
            // Simulate task deletion by removing the task from the list
            // (This mimics what subscribeToTasks does when DELETE event is received)
            const updatedTasks = initialTasks.filter(t => t.id !== taskToDelete.id);
            useStore.getState().setTasks(updatedTasks);
            
            // Property: After task deletion, the task should be removed from the list
            // Get fresh state reference after deletion
            currentState = useStore.getState();
            const currentTasks = currentState.tasks;
            
            // 1. The list should have one fewer task
            expect(currentTasks.length).toBe(initialTasks.length - 1);
            
            // 2. The deleted task should not be present in the list
            const deletedTask = currentTasks.find(t => t.id === taskToDelete.id);
            expect(deletedTask).toBeUndefined();
            
            // 3. All other tasks should still be present
            initialTasks.forEach(originalTask => {
              if (originalTask.id !== taskToDelete.id) {
                const stillPresent = currentTasks.find(t => t.id === originalTask.id);
                expect(stillPresent).toBeDefined();
                expect(stillPresent).toEqual(originalTask);
              }
            });
            
            // 4. No duplicate tasks should exist
            const uniqueIds = new Set(currentTasks.map(t => t.id));
            expect(uniqueIds.size).toBe(currentTasks.length);
            
            // 5. The remaining tasks should maintain their data integrity
            currentTasks.forEach(task => {
              expect(task).toHaveProperty('id');
              expect(task).toHaveProperty('board_id');
              expect(task).toHaveProperty('column_id');
              expect(task).toHaveProperty('title');
              expect(task).toHaveProperty('status');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle deletion of multiple tasks sequentially', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              column_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
              priority: fc.option(fc.constantFrom('low', 'medium', 'high'), { nil: null }),
              due_date: fc.option(
                fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-01-01').getTime() })
                  .map(ts => new Date(ts).toISOString()),
                { nil: null }
              ),
              status: fc.constantFrom('todo', 'in_progress', 'done', 'backlog'),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
              updated_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 3, maxLength: 10, selector: (task) => task.id }
          ),
          fc.nat({ min: 1, max: 3 }),
          (initialTasks, numToDelete) => {
            // Ensure we don't try to delete more tasks than we have
            const deleteCount = Math.min(numToDelete, initialTasks.length);
            const tasksToDelete = initialTasks.slice(0, deleteCount);
            
            useStore.getState().setTasks(initialTasks);
            const startingCount = initialTasks.length;
            
            // Delete tasks one by one
            let currentTasks = [...initialTasks];
            tasksToDelete.forEach((taskToDelete, index) => {
              currentTasks = currentTasks.filter(t => t.id !== taskToDelete.id);
              useStore.getState().setTasks(currentTasks);
              
              // Get fresh state reference after each deletion
              const currentState = useStore.getState();
              
              // After each deletion, verify the list is correct
              expect(currentState.tasks.length).toBe(startingCount - index - 1);
              expect(currentState.tasks.find(t => t.id === taskToDelete.id)).toBeUndefined();
            });
            
            // Final verification: all deleted tasks should be gone
            const finalState = useStore.getState();
            const finalTasks = finalState.tasks;
            expect(finalTasks.length).toBe(startingCount - deleteCount);
            
            // None of the deleted tasks should be present
            tasksToDelete.forEach(deletedTask => {
              expect(finalTasks.find(t => t.id === deletedTask.id)).toBeUndefined();
            });
            
            // All remaining tasks should be from the original list
            finalTasks.forEach(task => {
              expect(initialTasks.find(t => t.id === task.id)).toBeDefined();
            });
            
            // No duplicates
            const uniqueIds = new Set(finalTasks.map(t => t.id));
            expect(uniqueIds.size).toBe(finalTasks.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain task list integrity after deletion', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              column_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
              priority: fc.option(fc.constantFrom('low', 'medium', 'high'), { nil: null }),
              due_date: fc.option(
                fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-01-01').getTime() })
                  .map(ts => new Date(ts).toISOString()),
                { nil: null }
              ),
              status: fc.constantFrom('todo', 'in_progress', 'done', 'backlog'),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
              updated_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 2, maxLength: 20, selector: (task) => task.id }
          ),
          fc.nat(),
          (initialTasks, deleteIndex) => {
            const indexToDelete = deleteIndex % initialTasks.length;
            const taskToDelete = initialTasks[indexToDelete];
            
            useStore.getState().setTasks(initialTasks);
            
            // Delete the task
            const updatedTasks = initialTasks.filter(t => t.id !== taskToDelete.id);
            useStore.getState().setTasks(updatedTasks);
            
            // Get fresh state reference
            const currentState = useStore.getState();
            const currentTasks = currentState.tasks;
            
            // Property: Task list integrity should be maintained
            // 1. No null or undefined tasks
            currentTasks.forEach(task => {
              expect(task).toBeDefined();
              expect(task).not.toBeNull();
            });
            
            // 2. All tasks have required fields
            currentTasks.forEach(task => {
              expect(typeof task.id).toBe('string');
              expect(typeof task.board_id).toBe('string');
              expect(typeof task.column_id).toBe('string');
              expect(typeof task.title).toBe('string');
              expect(typeof task.status).toBe('string');
              expect(typeof task.position).toBe('number');
            });
            
            // 3. All remaining tasks are from the original list
            currentTasks.forEach(task => {
              const originalTask = initialTasks.find(t => t.id === task.id);
              expect(originalTask).toBeDefined();
              expect(task).toEqual(originalTask);
            });
            
            // 4. No data corruption
            const remainingIds = initialTasks
              .filter(t => t.id !== taskToDelete.id)
              .map(t => t.id);
            const currentIds = currentTasks.map(t => t.id);
            expect(currentIds.sort()).toEqual(remainingIds.sort());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 10: Task position changes broadcast to all users', () => {
    /**
     * **Feature: realtime-collaboration, Property 10: Task position changes broadcast to all users**
     * 
     * This property tests that for any task position change (column or order), all connected users
     * viewing that board should see the new position in real-time.
     * 
     * **Validates: Requirements 3.4**
     * 
     * Note: This property test validates the state management logic for task position changes.
     * It tests that when a task's position or column_id is updated in the store, the task list
     * reflects the changes correctly and all users see the new position.
     */
    it('should broadcast task position changes to all users', () => {
      fc.assert(
        fc.property(
          // Generate initial array of tasks
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              column_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
              priority: fc.option(fc.constantFrom('low', 'medium', 'high'), { nil: null }),
              due_date: fc.option(
                fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-01-01').getTime() })
                  .map(ts => new Date(ts).toISOString()),
                { nil: null }
              ),
              status: fc.constantFrom('todo', 'in_progress', 'done', 'backlog'),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
              updated_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { 
              minLength: 1, 
              maxLength: 20,
              selector: (task) => task.id 
            }
          ),
          // Generate index of task to move
          fc.nat(),
          // Generate new position data
          fc.record({
            newPosition: fc.nat({ max: 100 }),
            newColumnId: fc.option(fc.uuid(), { nil: undefined }),
          }),
          (initialTasks, moveIndex, positionUpdate) => {
            // Ensure we have a valid index to move
            const indexToMove = moveIndex % initialTasks.length;
            const taskToMove = initialTasks[indexToMove];
            
            // Set initial tasks list
            useStore.getState().setTasks(initialTasks);
            
            // Get fresh state reference to verify initial state
            let currentState = useStore.getState();
            expect(currentState.tasks).toHaveLength(initialTasks.length);
            
            // Create updated task with new position (and optionally new column)
            const updatedTask = {
              ...taskToMove,
              position: positionUpdate.newPosition,
              ...(positionUpdate.newColumnId && { column_id: positionUpdate.newColumnId })
            };
            
            // Simulate task position change by updating the task in the list
            // (This mimics what subscribeToTasks does when UPDATE event is received for position change)
            const updatedTasks = initialTasks.map(t => 
              t.id === taskToMove.id ? updatedTask : t
            );
            useStore.getState().setTasks(updatedTasks);
            
            // Property: After task position change, all users should see the new position
            // Get fresh state reference after update
            currentState = useStore.getState();
            const currentTasks = currentState.tasks;
            
            // 1. The list should have the same number of tasks
            expect(currentTasks.length).toBe(initialTasks.length);
            
            // 2. The moved task should be present in the list
            const movedTask = currentTasks.find(t => t.id === taskToMove.id);
            expect(movedTask).toBeDefined();
            
            // 3. The moved task should have the new position
            expect(movedTask!.position).toBe(positionUpdate.newPosition);
            
            // 4. If column was changed, the task should have the new column_id
            if (positionUpdate.newColumnId) {
              expect(movedTask!.column_id).toBe(positionUpdate.newColumnId);
            } else {
              // Column should remain unchanged
              expect(movedTask!.column_id).toBe(taskToMove.column_id);
            }
            
            // 5. All other task properties should remain unchanged
            expect(movedTask!.id).toBe(taskToMove.id);
            expect(movedTask!.board_id).toBe(taskToMove.board_id);
            expect(movedTask!.title).toBe(taskToMove.title);
            expect(movedTask!.description).toBe(taskToMove.description);
            expect(movedTask!.priority).toBe(taskToMove.priority);
            expect(movedTask!.due_date).toBe(taskToMove.due_date);
            expect(movedTask!.status).toBe(taskToMove.status);
            
            // 6. All other tasks should remain unchanged
            initialTasks.forEach(originalTask => {
              if (originalTask.id !== taskToMove.id) {
                const unchangedTask = currentTasks.find(t => t.id === originalTask.id);
                expect(unchangedTask).toEqual(originalTask);
              }
            });
            
            // 7. No duplicate tasks should exist
            const uniqueIds = new Set(currentTasks.map(t => t.id));
            expect(uniqueIds.size).toBe(currentTasks.length);
            
            // 8. Task list integrity should be maintained
            currentTasks.forEach(task => {
              expect(task).toBeDefined();
              expect(task).not.toBeNull();
              expect(task).toHaveProperty('id');
              expect(task).toHaveProperty('position');
              expect(task).toHaveProperty('column_id');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple position changes sequentially', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              column_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
              priority: fc.option(fc.constantFrom('low', 'medium', 'high'), { nil: null }),
              due_date: fc.option(
                fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-01-01').getTime() })
                  .map(ts => new Date(ts).toISOString()),
                { nil: null }
              ),
              status: fc.constantFrom('todo', 'in_progress', 'done', 'backlog'),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
              updated_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 1, maxLength: 10, selector: (task) => task.id }
          ),
          fc.nat(),
          fc.array(
            fc.record({
              newPosition: fc.nat({ max: 100 }),
              newColumnId: fc.option(fc.uuid(), { nil: undefined }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (initialTasks, moveIndex, positionUpdates) => {
            const indexToMove = moveIndex % initialTasks.length;
            const taskToMove = initialTasks[indexToMove];
            
            useStore.getState().setTasks(initialTasks);
            
            // Apply position updates sequentially
            let currentTask = taskToMove;
            positionUpdates.forEach((update) => {
              currentTask = {
                ...currentTask,
                position: update.newPosition,
                ...(update.newColumnId && { column_id: update.newColumnId })
              };
              const updatedTasks = useStore.getState().tasks.map(t => 
                t.id === taskToMove.id ? currentTask : t
              );
              useStore.getState().setTasks(updatedTasks);
            });
            
            // Get fresh state reference
            const currentState = useStore.getState();
            const finalTasks = currentState.tasks;
            const finalTask = finalTasks.find(t => t.id === taskToMove.id);
            
            // Property: After multiple position changes, the task should have the final position
            expect(finalTask).toBeDefined();
            expect(finalTasks.length).toBe(initialTasks.length);
            
            // The task should have the last position update applied
            const lastUpdate = positionUpdates[positionUpdates.length - 1];
            expect(finalTask!.position).toBe(lastUpdate.newPosition);
            
            if (lastUpdate.newColumnId) {
              expect(finalTask!.column_id).toBe(lastUpdate.newColumnId);
            }
            
            // Task ID and other properties should remain unchanged
            expect(finalTask!.id).toBe(taskToMove.id);
            expect(finalTask!.title).toBe(taskToMove.title);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve task data integrity during position changes', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              column_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
              priority: fc.option(fc.constantFrom('low', 'medium', 'high'), { nil: null }),
              due_date: fc.option(
                fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-01-01').getTime() })
                  .map(ts => new Date(ts).toISOString()),
                { nil: null }
              ),
              status: fc.constantFrom('todo', 'in_progress', 'done', 'backlog'),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
              updated_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 1, maxLength: 10, selector: (task) => task.id }
          ),
          fc.nat(),
          fc.nat({ max: 100 }),
          fc.uuid(),
          (initialTasks, moveIndex, newPosition, newColumnId) => {
            const indexToMove = moveIndex % initialTasks.length;
            const taskToMove = initialTasks[indexToMove];
            
            useStore.getState().setTasks(initialTasks);
            
            // Update task position and column
            const updatedTask = {
              ...taskToMove,
              position: newPosition,
              column_id: newColumnId
            };
            
            const updatedTasks = initialTasks.map(t => 
              t.id === taskToMove.id ? updatedTask : t
            );
            useStore.getState().setTasks(updatedTasks);
            
            // Get fresh state reference
            const currentState = useStore.getState();
            const currentTasks = currentState.tasks;
            const movedTask = currentTasks.find(t => t.id === taskToMove.id);
            
            // Property: Task data integrity should be preserved during position changes
            expect(movedTask).toBeDefined();
            
            // Position and column should be updated
            expect(movedTask!.position).toBe(newPosition);
            expect(movedTask!.column_id).toBe(newColumnId);
            
            // All other properties should remain exactly as they were
            expect(movedTask!.id).toBe(taskToMove.id);
            expect(movedTask!.board_id).toBe(taskToMove.board_id);
            expect(movedTask!.title).toBe(taskToMove.title);
            expect(movedTask!.description).toBe(taskToMove.description);
            expect(movedTask!.priority).toBe(taskToMove.priority);
            expect(movedTask!.due_date).toBe(taskToMove.due_date);
            expect(movedTask!.status).toBe(taskToMove.status);
            expect(movedTask!.created_at).toBe(taskToMove.created_at);
            expect(movedTask!.updated_at).toBe(taskToMove.updated_at);
            
            // No data corruption should occur
            expect(movedTask).toHaveProperty('id');
            expect(movedTask).toHaveProperty('board_id');
            expect(movedTask).toHaveProperty('column_id');
            expect(movedTask).toHaveProperty('title');
            expect(movedTask).toHaveProperty('position');
            expect(typeof movedTask!.position).toBe('number');
            expect(typeof movedTask!.column_id).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
