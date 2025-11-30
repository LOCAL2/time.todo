# Implementation Plan

- [x] 1. Set up database schema and Row Level Security policies




  - Create `board_members` table with proper foreign keys and constraints
  - Add RLS policies for board_members (SELECT, INSERT, DELETE)
  - Update RLS policies for boards to include member access
  - Update RLS policies for tasks to check board membership
  - Update RLS policies for columns to check board membership
  - Create database indexes for performance (board_id, user_id lookups)
  - _Requirements: 1.2, 2.2, 7.1-7.5, 8.1-8.4_


- [x] 2. Extend TypeScript types and interfaces



  - Add `BoardMember` and `BoardMemberWithUser` types
  - Add `BoardMemberRole` type
  - Add `BoardPermissions` interface
  - Add `RealtimePayload` and `RealtimeEvent` types
  - Add `ConnectionState` and error types
  - Update existing types to support collaboration features
  - _Requirements: 1.1-1.5, 2.1-2.5_

- [x] 3. Implement core permission system in Zustand store



- [x] 3.1 Add collaboration state to store













  - Add `boardMembers`, `currentUserRole`, `realtimeStatus` state

  - Implement `setBoardMembers`, `setCurrentUserRole`, `setRealtimeStatus` actions
  - _Requirements: 2.1, 2.4_

-

- [x] 3.2 Implement permission calculation logic






  - Implement `getPermissions()` function that returns `BoardPermissions` based on role

  - Add helper functions for permission checks (`canEdit`, `canDelete`, etc.)
  - _Requirements: 2.4, 7.5, 8.1-8.4_

- [x] 3.3 Write property test for permission validation









  - **Property 6: Permission validation precedes actions**


  - **Validates: Requirements 2.4**

- [x] 3.4 Write unit tests for permission logic






  - Test `getPermissions()` for each role (owner, editor, viewer)
  - Test edge cases (null role, invalid role)
  - _Requirements: 2.4_
-

- [x] 4. Implement board member management actions





- [x] 4.1 Implement fetchBoardMembers action





  - Query board_members table with user information
  - Transform data to `BoardMemberWithUser[]`
  - Update store state

  - _Requirements: 2.1_

- [x] 4.2 Implement inviteMember action





  - Validate email format
  - Check if user exists in auth.users
  - Check if user is already a member
  - Insert new board_member record with specified role
  - Handle errors (user not found, already member, etc.)
  - _Requirements: 1.2, 1.3, 1.4_
-

- [x] 4.3 Write property test for member invitation







  - **Property 1: Member invitation creates member with correct role**





  - **Validates: Requirements 1.2**

- [x] 4.4 Implement removeMember action





  - Validate user is not removing themselves if they're the owner
  - Delete board_member record
  - Handle errors
  - _Requirements: 2.2, 2.5_

- [x] 4.5 Write property test for member removal




  - **Property 4: Member removal revokes access**
  - **Validates: Requirements 2.2**


- [x] 4.6 Write unit tests for member management










  - Test inviteMember with valid/invalid inputs
  - Test removeMember with various scenarios
  - Test error handling for all edge cases
  - _Requirements: 1.2-1.4, 2.2, 2.5_
- [x] 5. Implement real-time subscriptions for board members





- [x] 5. Implement real-time subscriptions for board members

- [x] 5.1 Implement subscribeToMembers action




  - Subscribe to board_members table changes for specific board
  - Handle INSERT events (new member added)
  - Handle DELETE events (member removed)
  - Update store state on events
  - Return cleanup function
  - _Requirements: 1.5, 2.2, 5.2, 5.3_

- [x]5.2 Write property test for member list updates


  - **Property 2: Members list upda
tes after successful addition**
  - **Validates: Requirements 1.5**
-

- [x] 5.3 Handle removed user disconnection




  - When current user is removed, detect the event
  - Redirect to boards list or show access denied message
  - Clean up subscriptions
  - _Requirements: 5.3, 5.4_

- [x] 5.4 Write property test for member removal broadcast






  - **Property 19: Member removal broadcasts and disconnects user**
  - **Validates: Requirements 5.3**
- [x] 6. Implement real-time subscriptions for tasks











- [ ] 6. Implement real-time subscriptions for tasks

- [x] 6.1 Enhance subscribeToTasks action







  - Subscribe to tasks table changes for specific board
  - Handle INSERT events (task created)
  - Handle UPDATE events (task updated or moved)
  - Handle DELETE events (task deleted)
  - Update store state on events
  - Ensure UI updates without page refresh
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

-
-

- [x] 6.2 Write property test for task creation broadcast











  - **Property 7: Task creation broadcasts to all users**
  - **Validates: Requirements 3.1**


- [x] 6.3 Write property test for task update broadcast












  - **Property 8: Task updates broadcast to all users**
  - **Validates: Requirements 3.2**
-

- [x] 6.4 Write property test for task deletion broadcast









  - **Property 9: Task deletion broadcasts to all users**
  - **Validates: Requirements 3.3**

- [x] 6.5 Write property test for task position broadcast





  - **Property 10: Task position changes broadcast to all users**
  - **Validates: Requirements 3.4**

- [x] 7. Implement real-time subscriptions for columns





- [x] 7.1 Create subscribeToColumns action in store

  - Subscribe to columns table changes for specific board
  - Handle INSERT events (column created)
  - Handle UPDATE events (column updated or reordered)
  - Handle DELETE events (column deleted)
  - Update store state on events
  - Return cleanup function
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7.2 Write property test for column creation broadcast






  - **Property 12: Column creation broadcasts to all users**
  - **Validates: Requirements 4.1**

- [x] 7.3 Write property test for column update broadcast






  - **Property 13: Column updates broadcast to all users**
  - **Validates: Requirements 4.2**

- [x] 7.4 Write property test for column deletion broadcast






  - **Property 14: Column deletion broadcasts to all users**
  - **Validates: Requirements 4.3**

- [x] 8. Implement real-time subscriptions for board settings



- [x] 8.1 Create subscribeToBoard action in store

  - Subscribe to boards table changes for specific board
  - Handle UPDATE events (board title changed)
  - Update store state on events
  - Return cleanup function
  - _Requirements: 5.1_

- [x] 8.2 Write property test for board title broadcast






  - **Property 17: Board title updates broadcast to all users**
  - **Validates: Requirements 5.1**

- [x] 9. Integrate real-time subscriptions in BoardView




- [x] 9.1 Set up all subscriptions when board loads


  - Call subscribeToMembers when board loads
  - Call subscribeToTasks when board loads
  - Call subscribeToColumns when board loads (after implementing)
  - Call subscribeToBoard when board loads (after implementing)
  - Store cleanup functions and call on unmount
  - _Requirements: 3.1-3.5, 4.1-4.4, 5.1-5.3_

- [x] 9.2 Fetch current user role on board load


  - Call fetchBoardMembers when board loads
  - Determine current user's role from board members
  - Set currentUserRole in store
  - _Requirements: 6.3, 7.5, 8.1_

- [x] 10. Update ShareBoardModal to use store actions



- [x] 10.1 Replace direct Supabase calls with store actions


  - Use inviteMember action instead of direct insert
  - Use removeMember action instead of direct delete
  - Use fetchBoardMembers action instead of direct query
  - Handle errors from store actions
  - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.5_

- [x] 10.2 Integrate real-time member list updates

  - Subscribe to member changes when modal opens
  - Unsubscribe when modal closes
  - Update member list automatically on changes
  - _Requirements: 1.5, 5.2_

- [x] 10.3 Add permission checks to ShareBoardModal

  - Only show invite form if user has canInvite permission
  - Only show remove buttons if user has canManageMembers permission
  - Disable actions for users without permissions
  - _Requirements: 2.4, 7.5_

- [x] 11. Create PermissionGate component



- [x] 11.1 Create PermissionGate component file

  - Accept `requiredPermission` prop ('canEdit', 'canDelete', 'canManageMembers', 'canInvite')
  - Accept optional `fallback` prop for denied access UI
  - Check current user's permissions from store
  - Render children if permission granted
  - Render fallback or null if permission denied
  - _Requirements: 2.4, 7.5, 8.1-8.4_

- [x] 11.2 Write unit tests for PermissionGate






  - Test rendering with different permissions
  - Test fallback rendering
  - Test with null role
  - _Requirements: 2.4_
-

- [x] 12. Update Sidebar to show shared boards




- [x] 12.1 Update fetchBoards to include shared boards


  - Modify query to fetch boards where user is owner OR member
  - Use RPC function or join with board_members table
  - Include owner information for shared boards
  - Update store to track which boards are shared vs owned
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 12.2 Update Sidebar UI to display shared boards


  - Display shared boards in separate section below owned boards
  - Show owner name or "Shared with you" indicator for shared boards
  - Visually distinguish owned vs shared boards (different icon/color)
  - Prevent drag-and-drop reordering for shared boards
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 12.3 Handle real-time sidebar updates


  - Subscribe to board_members changes for current user
  - Add board to sidebar when user is added as member
  - Remove board from sidebar when user is removed
  - Handle removedFromBoard flag to redirect user
  - _Requirements: 5.4, 6.1, 6.4_

- [x] 13. Update TaskCard component for permissions



- [x] 13.1 Add permission-based UI rendering

  - Wrap edit/delete buttons with PermissionGate
  - Disable drag-and-drop for viewers (check canEdit permission)
  - Show lock icon or tooltip for viewers
  - _Requirements: 7.1-7.5, 8.1-8.4_

- [x] 14. Update Column component for permissions




- [x] 14.1 Add permission-based UI rendering

  - Wrap column edit/delete actions with PermissionGate
  - Disable column reordering for viewers
  - Show appropriate tooltips for permission-denied actions
  - _Requirements: 7.4, 8.1-8.4_

- [x] 15. Update CreateTaskModal for permissions



- [x] 15.1 Add permission checks before opening

  - Check canEdit permission before allowing modal to open
  - Show error message if user lacks permission
  - _Requirements: 7.1, 8.2_

- [x] 16. Update EditTaskModal for permissions




- [x] 16.1 Add permission checks before opening


  - Check canEdit permission before allowing modal to open
  - Show error message if user lacks permission
  - _Requirements: 7.2, 8.3_

- [x] 17. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Handle edge cases and error scenarios





- [x] 18.1 Test and handle removed user access


  - Verify removed user is redirected when removedFromBoard flag is set
  - Verify subscriptions are cleaned up
  - Show appropriate message to removed user
  - _Requirements: 5.3, 5.4_



- [x] 18.2 Test and handle duplicate invitation prevention
  - Verify error message displays correctly in ShareBoardModal
  - Verify no duplicate records created
  - _Requirements: 1.3_



- [x] 18.3 Test and handle non-existent user invitation
  - Verify error message displays correctly in ShareBoardModal
  - Verify no invalid records created
  - _Requirements: 1.4_


- [x] 18.4 Test and handle owner self-removal prevention

  - Verify removal is blocked in removeMember action
  - Verify error message displays correctly
  - _Requirements: 2.5_


- [x] 18.5 Test and handle permission-denied actions

  - Verify editors cannot access member management
  - Verify viewers cannot edit/delete tasks
  - Verify error messages display correctly
  - _Requirements: 7.5, 8.2-8.4_

- [x] 19. Final checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
