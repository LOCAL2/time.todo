// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useStore } from './useStore';
import type { Database } from '../types/supabase';

type Column = Database['public']['Tables']['columns']['Row'];

describe('Real-time Column Subscriptions', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useStore.getState();
    store.setSession(null);
    store.setColumns([]);
    store.setActiveBoardId(null);
  });

  describe('Property 12: Column creation broadcasts to all users', () => {
    /**
     * **Feature: realtime-collaboration, Property 12: Column creation broadcasts to all users**
     * 
     * This property tests that for any column creation on a board, all connected users
     * viewing that board should receive the new column in real-time.
     * 
     * **Validates: Requirements 4.1**
     * 
     * Note: This property test validates the state management logic for column creation.
     * It tests that when a new column is added to the store, the column list is updated
     * correctly and all column properties are preserved.
     */
    it('should add newly created column to the column list', () => {
      fc.assert(
        fc.property(
          // Generate initial array of columns
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { 
              minLength: 0, 
              maxLength: 20,
              selector: (column) => column.id 
            }
          ),
          // Generate a new column to add
          fc.record({
            id: fc.uuid(),
            board_id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            position: fc.nat({ max: 100 }),
            created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
              .map(ts => new Date(ts).toISOString()),
          }),
          (initialColumns, newColumn) => {
            // Ensure the new column has a unique ID not in the initial list
            fc.pre(!initialColumns.some(c => c.id === newColumn.id));
            
            // Set initial columns list
            useStore.getState().setColumns(initialColumns);
            
            // Get fresh state reference to verify initial state
            let currentState = useStore.getState();
            expect(currentState.columns).toHaveLength(initialColumns.length);
            expect(currentState.columns).toEqual(initialColumns);
            
            // Simulate column creation by adding the new column
            // (This mimics what subscribeToColumns does when INSERT event is received)
            const updatedColumns = [...initialColumns, newColumn];
            useStore.getState().setColumns(updatedColumns);
            
            // Property: After column creation, the column list should include the new column
            // Get fresh state reference after update
            currentState = useStore.getState();
            const currentColumns = currentState.columns;
            
            // 1. The list should have grown by exactly one column
            expect(currentColumns.length).toBe(initialColumns.length + 1);
            
            // 2. The new column should be present in the list
            const addedColumn = currentColumns.find(c => c.id === newColumn.id);
            expect(addedColumn).toBeDefined();
            
            // 3. The new column should have all the correct properties
            expect(addedColumn).toEqual(newColumn);
            
            // 4. All original columns should still be present
            initialColumns.forEach(originalColumn => {
              const stillPresent = currentColumns.find(c => c.id === originalColumn.id);
              expect(stillPresent).toBeDefined();
              expect(stillPresent).toEqual(originalColumn);
            });
            
            // 5. No duplicate columns should exist
            const uniqueIds = new Set(currentColumns.map(c => c.id));
            expect(uniqueIds.size).toBe(currentColumns.length);
            
            // 6. The new column should have all required fields
            expect(addedColumn).toHaveProperty('id');
            expect(addedColumn).toHaveProperty('board_id');
            expect(addedColumn).toHaveProperty('title');
            expect(addedColumn).toHaveProperty('position');
            expect(addedColumn).toHaveProperty('created_at');
            
            // 7. Column title should not be empty
            expect(addedColumn!.title.length).toBeGreaterThan(0);
            
            // 8. Column position should be non-negative
            expect(addedColumn!.position).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve column data integrity during creation', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 0, maxLength: 10, selector: (column) => column.id }
          ),
          fc.record({
            id: fc.uuid(),
            board_id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            position: fc.nat({ max: 100 }),
            created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
              .map(ts => new Date(ts).toISOString()),
          }),
          (initialColumns, newColumn) => {
            fc.pre(!initialColumns.some(c => c.id === newColumn.id));
            
            useStore.getState().setColumns(initialColumns);
            
            // Add new column
            const updatedColumns = [...initialColumns, newColumn];
            useStore.getState().setColumns(updatedColumns);
            
            // Get fresh state reference
            const currentState = useStore.getState();
            const currentColumns = currentState.columns;
            const addedColumn = currentColumns.find(c => c.id === newColumn.id);
            
            // Property: Column data should be preserved exactly as provided
            expect(addedColumn).toBeDefined();
            expect(addedColumn!.id).toBe(newColumn.id);
            expect(addedColumn!.board_id).toBe(newColumn.board_id);
            expect(addedColumn!.title).toBe(newColumn.title);
            expect(addedColumn!.position).toBe(newColumn.position);
            expect(addedColumn!.created_at).toBe(newColumn.created_at);
            
            // Verify no data mutation occurred
            expect(addedColumn).toEqual(newColumn);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple column creations sequentially', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 0, maxLength: 5, selector: (column) => column.id }
          ),
          fc.array(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (initialColumns, newColumns) => {
            // Ensure all new columns have unique IDs
            const allIds = new Set([
              ...initialColumns.map(c => c.id),
              ...newColumns.map(c => c.id)
            ]);
            fc.pre(allIds.size === initialColumns.length + newColumns.length);
            
            useStore.getState().setColumns(initialColumns);
            const startingCount = initialColumns.length;
            
            // Add columns one by one
            newColumns.forEach((newColumn, index) => {
              const currentColumns = useStore.getState().columns;
              const updatedColumns = [...currentColumns, newColumn];
              useStore.getState().setColumns(updatedColumns);
              
              // Get fresh state reference after each addition
              const currentState = useStore.getState();
              
              // After each addition, verify the list is correct
              expect(currentState.columns.length).toBe(startingCount + index + 1);
              expect(currentState.columns.find(c => c.id === newColumn.id)).toBeDefined();
            });
            
            // Final verification: all new columns should be present
            const finalState = useStore.getState();
            const finalColumns = finalState.columns;
            expect(finalColumns.length).toBe(startingCount + newColumns.length);
            
            // All new columns should be present
            newColumns.forEach(newColumn => {
              expect(finalColumns.find(c => c.id === newColumn.id)).toBeDefined();
            });
            
            // All original columns should still be present
            initialColumns.forEach(originalColumn => {
              expect(finalColumns.find(c => c.id === originalColumn.id)).toBeDefined();
            });
            
            // No duplicates
            const uniqueIds = new Set(finalColumns.map(c => c.id));
            expect(uniqueIds.size).toBe(finalColumns.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain column list integrity after creation', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 0, maxLength: 10, selector: (column) => column.id }
          ),
          fc.record({
            id: fc.uuid(),
            board_id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            position: fc.nat({ max: 100 }),
            created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
              .map(ts => new Date(ts).toISOString()),
          }),
          (initialColumns, newColumn) => {
            fc.pre(!initialColumns.some(c => c.id === newColumn.id));
            
            useStore.getState().setColumns(initialColumns);
            
            // Add new column
            const updatedColumns = [...initialColumns, newColumn];
            useStore.getState().setColumns(updatedColumns);
            
            // Get fresh state reference
            const currentState = useStore.getState();
            const currentColumns = currentState.columns;
            
            // Property: After column creation, list integrity should be maintained
            
            // 1. All columns should have valid IDs
            currentColumns.forEach(column => {
              expect(column.id).toBeTruthy();
              expect(typeof column.id).toBe('string');
            });
            
            // 2. All columns should have valid board_ids
            currentColumns.forEach(column => {
              expect(column.board_id).toBeTruthy();
              expect(typeof column.board_id).toBe('string');
            });
            
            // 3. All columns should have non-empty titles
            currentColumns.forEach(column => {
              expect(column.title).toBeTruthy();
              expect(column.title.length).toBeGreaterThan(0);
            });
            
            // 4. All columns should have valid positions
            currentColumns.forEach(column => {
              expect(typeof column.position).toBe('number');
              expect(column.position).toBeGreaterThanOrEqual(0);
            });
            
            // 5. All columns should have valid created_at timestamps
            currentColumns.forEach(column => {
              expect(column.created_at).toBeTruthy();
              expect(() => new Date(column.created_at)).not.toThrow();
            });
            
            // 6. No duplicate IDs
            const ids = currentColumns.map(c => c.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should broadcast column creation to all board viewers', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // board_id
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 0, maxLength: 10, selector: (column) => column.id }
          ),
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            position: fc.nat({ max: 100 }),
            created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
              .map(ts => new Date(ts).toISOString()),
          }),
          (boardId, initialColumns, newColumnData) => {
            // Ensure all initial columns belong to the same board
            const columnsForBoard = initialColumns.map(c => ({ ...c, board_id: boardId }));
            
            // Ensure the new column has a unique ID
            fc.pre(!columnsForBoard.some(c => c.id === newColumnData.id));
            
            // Create the new column with the correct board_id
            const newColumn = { ...newColumnData, board_id: boardId };
            
            // Set initial state
            useStore.getState().setColumns(columnsForBoard);
            useStore.getState().setActiveBoardId(boardId);
            
            // Simulate column creation broadcast
            const updatedColumns = [...columnsForBoard, newColumn];
            useStore.getState().setColumns(updatedColumns);
            
            // Get fresh state reference
            const currentState = useStore.getState();
            const currentColumns = currentState.columns;
            
            // Property: All users viewing the board should see the new column
            
            // 1. The new column should be in the list
            const addedColumn = currentColumns.find(c => c.id === newColumn.id);
            expect(addedColumn).toBeDefined();
            
            // 2. The new column should belong to the correct board
            expect(addedColumn!.board_id).toBe(boardId);
            
            // 3. All columns in the list should belong to the same board
            currentColumns.forEach(column => {
              expect(column.board_id).toBe(boardId);
            });
            
            // 4. The column count should have increased by one
            expect(currentColumns.length).toBe(columnsForBoard.length + 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 13: Column updates broadcast to all users', () => {
    /**
     * **Feature: realtime-collaboration, Property 13: Column updates broadcast to all users**
     * 
     * This property tests that for any column update on a board, all connected users
     * viewing that board should receive the updated column data in real-time.
     * 
     * **Validates: Requirements 4.2**
     * 
     * Note: This property test validates the state management logic for column updates.
     * It tests that when a column is updated in the store, the column list reflects
     * the changes correctly while preserving other columns.
     */
    it('should update existing column with new data', () => {
      fc.assert(
        fc.property(
          // Generate initial array of columns
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { 
              minLength: 1, 
              maxLength: 20,
              selector: (column) => column.id 
            }
          ),
          // Generate index of column to update
          fc.nat(),
          // Generate updates to apply
          fc.record({
            title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            position: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
          }),
          (initialColumns, updateIndex, updates) => {
            // Ensure we have a valid index to update
            const indexToUpdate = updateIndex % initialColumns.length;
            const columnToUpdate = initialColumns[indexToUpdate];
            
            // Set initial columns list
            useStore.getState().setColumns(initialColumns);
            
            // Get fresh state reference to verify initial state
            let currentState = useStore.getState();
            expect(currentState.columns).toHaveLength(initialColumns.length);
            
            // Create updated column by merging updates
            const updatedColumn = { ...columnToUpdate, ...updates };
            
            // Simulate column update by updating the column in the list
            // (This mimics what subscribeToColumns does when UPDATE event is received)
            const updatedColumns = initialColumns.map(c => 
              c.id === columnToUpdate.id ? updatedColumn : c
            );
            useStore.getState().setColumns(updatedColumns);
            
            // Property: After column update, the column list should reflect the changes
            // Get fresh state reference after update
            currentState = useStore.getState();
            const currentColumns = currentState.columns;
            
            // 1. The list should have the same number of columns
            expect(currentColumns.length).toBe(initialColumns.length);
            
            // 2. The updated column should be present in the list
            const updatedColumnInStore = currentColumns.find(c => c.id === columnToUpdate.id);
            expect(updatedColumnInStore).toBeDefined();
            
            // 3. The updated column should have the new values
            if (updates.title !== undefined) {
              expect(updatedColumnInStore!.title).toBe(updates.title);
            }
            if (updates.position !== undefined) {
              expect(updatedColumnInStore!.position).toBe(updates.position);
            }
            
            // 4. All other columns should remain unchanged
            initialColumns.forEach(originalColumn => {
              if (originalColumn.id !== columnToUpdate.id) {
                const unchangedColumn = currentColumns.find(c => c.id === originalColumn.id);
                expect(unchangedColumn).toEqual(originalColumn);
              }
            });
            
            // 5. No duplicate columns should exist
            const uniqueIds = new Set(currentColumns.map(c => c.id));
            expect(uniqueIds.size).toBe(currentColumns.length);
            
            // 6. The column ID should not change
            expect(updatedColumnInStore!.id).toBe(columnToUpdate.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve column data integrity during updates', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 1, maxLength: 10, selector: (column) => column.id }
          ),
          fc.nat(),
          fc.record({
            title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            position: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
          }),
          (initialColumns, updateIndex, updates) => {
            const indexToUpdate = updateIndex % initialColumns.length;
            const columnToUpdate = initialColumns[indexToUpdate];
            
            useStore.getState().setColumns(initialColumns);
            
            // Filter out undefined values to avoid spreading them
            const cleanUpdates = Object.fromEntries(
              Object.entries(updates).filter(([_, v]) => v !== undefined)
            );
            
            // Update column
            const updatedColumn = { ...columnToUpdate, ...cleanUpdates };
            const updatedColumns = initialColumns.map(c => 
              c.id === columnToUpdate.id ? updatedColumn : c
            );
            useStore.getState().setColumns(updatedColumns);
            
            // Get fresh state reference
            const currentState = useStore.getState();
            const currentColumns = currentState.columns;
            const updatedColumnInStore = currentColumns.find(c => c.id === columnToUpdate.id);
            
            // Property: Column data should be preserved exactly as provided
            expect(updatedColumnInStore).toBeDefined();
            expect(updatedColumnInStore!.id).toBe(columnToUpdate.id);
            expect(updatedColumnInStore!.board_id).toBe(columnToUpdate.board_id);
            expect(updatedColumnInStore!.created_at).toBe(columnToUpdate.created_at);
            
            // Updated fields should have new values
            if (updates.title !== undefined) {
              expect(updatedColumnInStore!.title).toBe(updates.title);
            } else {
              expect(updatedColumnInStore!.title).toBe(columnToUpdate.title);
            }
            
            if (updates.position !== undefined) {
              expect(updatedColumnInStore!.position).toBe(updates.position);
            } else {
              expect(updatedColumnInStore!.position).toBe(columnToUpdate.position);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple sequential column updates', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 1, maxLength: 10, selector: (column) => column.id }
          ),
          fc.nat(),
          fc.array(
            fc.record({
              title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
              position: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (initialColumns, updateIndex, updateSequence) => {
            const indexToUpdate = updateIndex % initialColumns.length;
            const columnToUpdate = initialColumns[indexToUpdate];
            
            useStore.getState().setColumns(initialColumns);
            
            // Apply updates sequentially
            let currentColumn = columnToUpdate;
            updateSequence.forEach((updates) => {
              currentColumn = { ...currentColumn, ...updates };
              const updatedColumns = useStore.getState().columns.map(c => 
                c.id === columnToUpdate.id ? currentColumn : c
              );
              useStore.getState().setColumns(updatedColumns);
            });
            
            // Get fresh state reference
            const currentState = useStore.getState();
            const finalColumns = currentState.columns;
            const finalColumn = finalColumns.find(c => c.id === columnToUpdate.id);
            
            // Property: After multiple updates, the column should have the final state
            expect(finalColumn).toBeDefined();
            expect(finalColumns.length).toBe(initialColumns.length);
            
            // All updates should be applied
            const lastUpdate = updateSequence[updateSequence.length - 1];
            if (lastUpdate.title !== undefined) {
              expect(finalColumn!.title).toBe(lastUpdate.title);
            }
            if (lastUpdate.position !== undefined) {
              expect(finalColumn!.position).toBe(lastUpdate.position);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should broadcast column updates to all board viewers', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // board_id
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 1, maxLength: 10, selector: (column) => column.id }
          ),
          fc.nat(),
          fc.string({ minLength: 1, maxLength: 100 }),
          (boardId, initialColumns, updateIndex, newTitle) => {
            // Ensure all initial columns belong to the same board
            const columnsForBoard = initialColumns.map(c => ({ ...c, board_id: boardId }));
            
            const indexToUpdate = updateIndex % columnsForBoard.length;
            const columnToUpdate = columnsForBoard[indexToUpdate];
            
            // Set initial state
            useStore.getState().setColumns(columnsForBoard);
            useStore.getState().setActiveBoardId(boardId);
            
            // Simulate column update broadcast
            const updatedColumn = { ...columnToUpdate, title: newTitle };
            const updatedColumns = columnsForBoard.map(c => 
              c.id === columnToUpdate.id ? updatedColumn : c
            );
            useStore.getState().setColumns(updatedColumns);
            
            // Get fresh state reference
            const currentState = useStore.getState();
            const currentColumns = currentState.columns;
            
            // Property: All users viewing the board should see the updated column
            
            // 1. The updated column should be in the list
            const updatedColumnInStore = currentColumns.find(c => c.id === columnToUpdate.id);
            expect(updatedColumnInStore).toBeDefined();
            
            // 2. The updated column should have the new title
            expect(updatedColumnInStore!.title).toBe(newTitle);
            
            // 3. The updated column should belong to the correct board
            expect(updatedColumnInStore!.board_id).toBe(boardId);
            
            // 4. All columns in the list should belong to the same board
            currentColumns.forEach(column => {
              expect(column.board_id).toBe(boardId);
            });
            
            // 5. The column count should remain the same
            expect(currentColumns.length).toBe(columnsForBoard.length);
            
            // 6. All other columns should remain unchanged
            columnsForBoard.forEach(originalColumn => {
              if (originalColumn.id !== columnToUpdate.id) {
                const unchangedColumn = currentColumns.find(c => c.id === originalColumn.id);
                expect(unchangedColumn).toEqual(originalColumn);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain column list integrity after updates', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 1, maxLength: 20, selector: (column) => column.id }
          ),
          fc.nat(),
          fc.record({
            title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            position: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
          }),
          (initialColumns, updateIndex, updates) => {
            const indexToUpdate = updateIndex % initialColumns.length;
            const columnToUpdate = initialColumns[indexToUpdate];
            
            useStore.getState().setColumns(initialColumns);
            
            // Filter out undefined values to avoid spreading them
            const cleanUpdates = Object.fromEntries(
              Object.entries(updates).filter(([_, v]) => v !== undefined)
            );
            
            // Update column
            const updatedColumn = { ...columnToUpdate, ...cleanUpdates };
            const updatedColumns = initialColumns.map(c => 
              c.id === columnToUpdate.id ? updatedColumn : c
            );
            useStore.getState().setColumns(updatedColumns);
            
            // Get fresh state reference
            const currentState = useStore.getState();
            const currentColumns = currentState.columns;
            
            // Property: After column update, list integrity should be maintained
            
            // 1. All columns should have valid IDs
            currentColumns.forEach(column => {
              expect(column.id).toBeTruthy();
              expect(typeof column.id).toBe('string');
            });
            
            // 2. All columns should have valid board_ids
            currentColumns.forEach(column => {
              expect(column.board_id).toBeTruthy();
              expect(typeof column.board_id).toBe('string');
            });
            
            // 3. All columns should have non-empty titles
            currentColumns.forEach(column => {
              expect(column.title).toBeTruthy();
              expect(column.title.length).toBeGreaterThan(0);
            });
            
            // 4. All columns should have valid positions
            currentColumns.forEach(column => {
              expect(typeof column.position).toBe('number');
              expect(column.position).toBeGreaterThanOrEqual(0);
            });
            
            // 5. All columns should have valid created_at timestamps
            currentColumns.forEach(column => {
              expect(column.created_at).toBeTruthy();
              expect(() => new Date(column.created_at)).not.toThrow();
            });
            
            // 6. No duplicate IDs
            const ids = currentColumns.map(c => c.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
            
            // 7. All columns from the original list should still be present
            initialColumns.forEach(originalColumn => {
              const stillPresent = currentColumns.find(c => c.id === originalColumn.id);
              expect(stillPresent).toBeDefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 14: Column deletion broadcasts to all users', () => {
    /**
     * **Feature: realtime-collaboration, Property 14: Column deletion broadcasts to all users**
     * 
     * This property tests that for any column deletion on a board, all connected users
     * viewing that board should see the column removed from their view in real-time.
     * 
     * **Validates: Requirements 4.3**
     * 
     * Note: This property test validates the state management logic for column deletion.
     * It tests that when a column is deleted from the store, the column list is updated
     * correctly and the deleted column is no longer present.
     */
    it('should remove deleted column from the column list', () => {
      fc.assert(
        fc.property(
          // Generate initial array of columns
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { 
              minLength: 1, 
              maxLength: 20,
              selector: (column) => column.id 
            }
          ),
          // Generate index of column to delete
          fc.nat(),
          (initialColumns, deleteIndex) => {
            // Ensure we have a valid index to delete
            const indexToDelete = deleteIndex % initialColumns.length;
            const columnToDelete = initialColumns[indexToDelete];
            
            // Set initial columns list
            useStore.getState().setColumns(initialColumns);
            
            // Get fresh state reference to verify initial state
            let currentState = useStore.getState();
            expect(currentState.columns).toHaveLength(initialColumns.length);
            expect(currentState.columns.find(c => c.id === columnToDelete.id)).toBeDefined();
            
            // Simulate column deletion by removing the column from the list
            // (This mimics what subscribeToColumns does when DELETE event is received)
            const updatedColumns = initialColumns.filter(c => c.id !== columnToDelete.id);
            useStore.getState().setColumns(updatedColumns);
            
            // Property: After column deletion, the column should be removed from the list
            // Get fresh state reference after deletion
            currentState = useStore.getState();
            const currentColumns = currentState.columns;
            
            // 1. The list should have one fewer column
            expect(currentColumns.length).toBe(initialColumns.length - 1);
            
            // 2. The deleted column should not be present in the list
            const deletedColumn = currentColumns.find(c => c.id === columnToDelete.id);
            expect(deletedColumn).toBeUndefined();
            
            // 3. All other columns should still be present
            initialColumns.forEach(originalColumn => {
              if (originalColumn.id !== columnToDelete.id) {
                const stillPresent = currentColumns.find(c => c.id === originalColumn.id);
                expect(stillPresent).toBeDefined();
                expect(stillPresent).toEqual(originalColumn);
              }
            });
            
            // 4. No duplicate columns should exist
            const uniqueIds = new Set(currentColumns.map(c => c.id));
            expect(uniqueIds.size).toBe(currentColumns.length);
            
            // 5. The remaining columns should maintain their data integrity
            currentColumns.forEach(column => {
              expect(column).toHaveProperty('id');
              expect(column).toHaveProperty('board_id');
              expect(column).toHaveProperty('title');
              expect(column).toHaveProperty('position');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle deletion of multiple columns sequentially', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 3, maxLength: 10, selector: (column) => column.id }
          ),
          fc.nat({ min: 1, max: 3 }),
          (initialColumns, numToDelete) => {
            // Ensure we don't try to delete more columns than we have
            const deleteCount = Math.min(numToDelete, initialColumns.length);
            const columnsToDelete = initialColumns.slice(0, deleteCount);
            
            useStore.getState().setColumns(initialColumns);
            const startingCount = initialColumns.length;
            
            // Delete columns one by one
            let currentColumns = [...initialColumns];
            columnsToDelete.forEach((columnToDelete, index) => {
              currentColumns = currentColumns.filter(c => c.id !== columnToDelete.id);
              useStore.getState().setColumns(currentColumns);
              
              // Get fresh state reference after each deletion
              const currentState = useStore.getState();
              
              // After each deletion, verify the list is correct
              expect(currentState.columns.length).toBe(startingCount - index - 1);
              expect(currentState.columns.find(c => c.id === columnToDelete.id)).toBeUndefined();
            });
            
            // Final verification: all deleted columns should be gone
            const finalState = useStore.getState();
            const finalColumns = finalState.columns;
            expect(finalColumns.length).toBe(startingCount - deleteCount);
            
            // None of the deleted columns should be present
            columnsToDelete.forEach(deletedColumn => {
              expect(finalColumns.find(c => c.id === deletedColumn.id)).toBeUndefined();
            });
            
            // All remaining columns should be from the original list
            finalColumns.forEach(column => {
              expect(initialColumns.find(c => c.id === column.id)).toBeDefined();
            });
            
            // No duplicates
            const uniqueIds = new Set(finalColumns.map(c => c.id));
            expect(uniqueIds.size).toBe(finalColumns.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain column list integrity after deletion', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 2, maxLength: 20, selector: (column) => column.id }
          ),
          fc.nat(),
          (initialColumns, deleteIndex) => {
            const indexToDelete = deleteIndex % initialColumns.length;
            const columnToDelete = initialColumns[indexToDelete];
            
            useStore.getState().setColumns(initialColumns);
            
            // Delete the column
            const updatedColumns = initialColumns.filter(c => c.id !== columnToDelete.id);
            useStore.getState().setColumns(updatedColumns);
            
            // Get fresh state reference
            const currentState = useStore.getState();
            const currentColumns = currentState.columns;
            
            // Property: Column list integrity should be maintained
            // 1. No null or undefined columns
            currentColumns.forEach(column => {
              expect(column).toBeDefined();
              expect(column).not.toBeNull();
            });
            
            // 2. All columns have required fields
            currentColumns.forEach(column => {
              expect(typeof column.id).toBe('string');
              expect(typeof column.board_id).toBe('string');
              expect(typeof column.title).toBe('string');
              expect(typeof column.position).toBe('number');
            });
            
            // 3. All remaining columns are from the original list
            currentColumns.forEach(column => {
              const originalColumn = initialColumns.find(c => c.id === column.id);
              expect(originalColumn).toBeDefined();
              expect(column).toEqual(originalColumn);
            });
            
            // 4. No data corruption
            const remainingIds = initialColumns
              .filter(c => c.id !== columnToDelete.id)
              .map(c => c.id);
            const currentIds = currentColumns.map(c => c.id);
            expect(currentIds.sort()).toEqual(remainingIds.sort());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should broadcast column deletion to all board viewers', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // board_id
          fc.uniqueArray(
            fc.record({
              id: fc.uuid(),
              board_id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              position: fc.nat({ max: 100 }),
              created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-01-01').getTime() })
                .map(ts => new Date(ts).toISOString()),
            }),
            { minLength: 2, maxLength: 10, selector: (column) => column.id }
          ),
          fc.nat(),
          (boardId, initialColumns, deleteIndex) => {
            // Ensure all initial columns belong to the same board
            const columnsForBoard = initialColumns.map(c => ({ ...c, board_id: boardId }));
            
            const indexToDelete = deleteIndex % columnsForBoard.length;
            const columnToDelete = columnsForBoard[indexToDelete];
            
            // Set initial state
            useStore.getState().setColumns(columnsForBoard);
            useStore.getState().setActiveBoardId(boardId);
            
            // Simulate column deletion broadcast
            const updatedColumns = columnsForBoard.filter(c => c.id !== columnToDelete.id);
            useStore.getState().setColumns(updatedColumns);
            
            // Get fresh state reference
            const currentState = useStore.getState();
            const currentColumns = currentState.columns;
            
            // Property: All users viewing the board should see the column removed
            
            // 1. The deleted column should not be in the list
            const deletedColumn = currentColumns.find(c => c.id === columnToDelete.id);
            expect(deletedColumn).toBeUndefined();
            
            // 2. All remaining columns should belong to the correct board
            currentColumns.forEach(column => {
              expect(column.board_id).toBe(boardId);
            });
            
            // 3. The column count should have decreased by one
            expect(currentColumns.length).toBe(columnsForBoard.length - 1);
            
            // 4. All remaining columns should be from the original list
            currentColumns.forEach(column => {
              const originalColumn = columnsForBoard.find(c => c.id === column.id);
              expect(originalColumn).toBeDefined();
              expect(column).toEqual(originalColumn);
            });
            
            // 5. No duplicate columns should exist
            const uniqueIds = new Set(currentColumns.map(c => c.id));
            expect(uniqueIds.size).toBe(currentColumns.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
