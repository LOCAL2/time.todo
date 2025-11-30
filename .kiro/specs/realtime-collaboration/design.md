# Design Document: Real-time Collaborative Board

## Overview

The Real-time Collaborative Board feature enables multiple users to work together on the same board simultaneously with instant synchronization of all changes. The system leverages Supabase Realtime (PostgreSQL LISTEN/NOTIFY) to broadcast changes across all connected clients, ensuring that every user sees updates within milliseconds without requiring page refreshes.

The architecture follows a client-side state management pattern using Zustand, with Supabase handling authentication, authorization (Row Level Security), and real-time subscriptions. The system supports three distinct roles (Owner, Editor, Viewer) with granular permission controls enforced at both the database and application layers.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Components (UI Layer)                │ │
│  │  - ShareBoardModal  - TaskCard  - BoardView            │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Zustand Store (State Management)                │ │
│  │  - Board state  - Task state  - Member state           │ │
│  │  - Real-time subscriptions  - Permission checks        │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Supabase Client (Data Layer)                 │ │
│  │  - Auth  - Database queries  - Realtime subscriptions  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL Database                        │ │
│  │  - boards  - tasks  - columns  - board_members         │ │
│  │  - Row Level Security (RLS) policies                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Realtime Server (LISTEN/NOTIFY)               │ │
│  │  - Broadcasts database changes to subscribed clients   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Action**: User performs an action (create/update/delete task)
2. **Permission Check**: Client validates user's role and permissions
3. **Database Mutation**: If authorized, client sends mutation to Supabase
4. **RLS Validation**: Database validates permissions via Row Level Security
5. **Database Change**: If authorized, database applies the change
6. **Realtime Broadcast**: PostgreSQL triggers NOTIFY event
7. **Subscription Delivery**: Realtime server broadcasts to all subscribed clients
8. **State Update**: Each client receives the change and updates local state
9. **UI Re-render**: React components re-render with new state

## Components and Interfaces

### Database Schema Extensions

The existing schema is extended with the `board_members` table:

```typescript
interface BoardMember {
  id: string;                    // UUID primary key
  board_id: string;              // Foreign key to boards
  user_id: string;               // Foreign key to auth.users
  role: 'owner' | 'editor' | 'viewer';
  created_at: string;            // Timestamp
}
```

### Type Definitions

```typescript
// Extended Database types
type BoardMemberRole = 'owner' | 'editor' | 'viewer';

interface BoardMemberWithUser extends BoardMember {
  user_email?: string;
  user_name?: string;
}

interface BoardPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canInvite: boolean;
}

// Real-time event types
type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

interface RealtimePayload<T> {
  eventType: RealtimeEvent;
  new: T;
  old: T;
  errors: string[] | null;
}
```

### Store Extensions

The Zustand store is extended with collaboration-related state and actions:

```typescript
interface CollaborationState {
  // Board members
  boardMembers: BoardMemberWithUser[];
  setBoardMembers: (members: BoardMemberWithUser[]) => void;
  fetchBoardMembers: (boardId: string) => Promise<void>;
  inviteMember: (boardId: string, email: string, role: BoardMemberRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  
  // Permissions
  currentUserRole: BoardMemberRole | null;
  setCurrentUserRole: (role: BoardMemberRole | null) => void;
  getPermissions: () => BoardPermissions;
  
  // Real-time connection
  realtimeStatus: 'connected' | 'connecting' | 'disconnected';
  setRealtimeStatus: (status: 'connected' | 'connecting' | 'disconnected') => void;
  
  // Enhanced real-time subscriptions
  subscribeToBoard: (boardId: string) => () => void;
  subscribeToTasks: (boardId: string) => () => void;
  subscribeToColumns: (boardId: string) => () => void;
  subscribeToMembers: (boardId: string) => () => void;
}
```

### React Components

#### ShareBoardModal (Enhanced)

Existing component enhanced with:
- Real-time member list updates
- Better error handling
- Role change functionality
- User search by email

#### BoardMemberIndicator (New)

Shows active members viewing the board:
```typescript
interface BoardMemberIndicatorProps {
  boardId: string;
}
```

#### PermissionGate (New)

Wrapper component that conditionally renders based on permissions:
```typescript
interface PermissionGateProps {
  requiredRole: 'owner' | 'editor';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}
```

#### ConnectionStatusIndicator (New)

Shows real-time connection status:
```typescript
interface ConnectionStatusIndicatorProps {
  status: 'connected' | 'connecting' | 'disconnected';
}
```

## Data Models

### Board Members Table

```sql
CREATE TABLE board_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'editor', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(board_id, user_id)
);
```

### Row Level Security Policies

**Board Members Policies:**
- SELECT: Users can view members if they are a member of the board
- INSERT: Only owners can add members
- DELETE: Only owners can remove members

**Boards Policies (Updated):**
- SELECT: Users can view boards they own OR boards they are members of
- UPDATE: Users can update boards they own OR boards where they are editors/owners
- DELETE: Only owners can delete boards

**Tasks Policies (Updated):**
- SELECT: Users can view tasks in boards they have access to
- INSERT: Users can create tasks in boards where they are editors/owners
- UPDATE: Users can update tasks in boards where they are editors/owners
- DELETE: Users can delete tasks in boards where they are editors/owners

**Columns Policies (Updated):**
- SELECT: Users can view columns in boards they have access to
- INSERT: Users can create columns in boards where they are editors/owners
- UPDATE: Users can update columns in boards where they are editors/owners
- DELETE: Users can delete columns in boards where they are editors/owners


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Member invitation creates member with correct role
*For any* valid email and role (editor or viewer), when an owner invites that user, the system should create a board member record with the specified role.
**Validates: Requirements 1.2**

### Property 2: Members list updates after successful addition
*For any* successful member addition, the members list should immediately reflect the new member.
**Validates: Requirements 1.5**

### Property 3: Member list displays all required information
*For any* set of board members, when the members list is rendered, the output should contain each member's email address and role indicator.
**Validates: Requirements 2.1**

### Property 4: Member removal revokes access
*For any* board member, when they are removed from the board, they should no longer be able to access that board.
**Validates: Requirements 2.2**

### Property 5: Role indicators are visually distinct
*For any* role (owner, editor, viewer), the rendered role indicator should be visually distinct from other roles.
**Validates: Requirements 2.3**

### Property 6: Permission validation precedes actions
*For any* action and any member role, the system should validate permissions before allowing the action to proceed.
**Validates: Requirements 2.4**

### Property 7: Task creation broadcasts to all users
*For any* task creation on a board, all connected users viewing that board should receive the new task in real-time.
**Validates: Requirements 3.1**

### Property 8: Task updates broadcast to all users
*For any* task update on a board, all connected users viewing that board should receive the updated task data in real-time.
**Validates: Requirements 3.2**

### Property 9: Task deletion broadcasts to all users
*For any* task deletion on a board, all connected users viewing that board should see the task removed from their view in real-time.
**Validates: Requirements 3.3**

### Property 10: Task position changes broadcast to all users
*For any* task position change (column or order), all connected users viewing that board should see the new position in real-time.
**Validates: Requirements 3.4**

### Property 11: Real-time updates apply without page refresh
*For any* real-time update received by a client, the UI should update automatically without requiring a page refresh.
**Validates: Requirements 3.5**

### Property 12: Column creation broadcasts to all users
*For any* column creation on a board, all connected users viewing that board should receive the new column in real-time.
**Validates: Requirements 4.1**

### Property 13: Column updates broadcast to all users
*For any* column update on a board, all connected users viewing that board should receive the updated column data in real-time.
**Validates: Requirements 4.2**

### Property 14: Column deletion broadcasts to all users
*For any* column deletion on a board, all connected users viewing that board should see the column removed from their view in real-time.
**Validates: Requirements 4.3**

### Property 15: Column reordering broadcasts to all users
*For any* column reorder operation, all connected users viewing that board should see the new column order in real-time.
**Validates: Requirements 4.4**

### Property 16: Column deletion handles orphaned tasks consistently
*For any* column deletion, tasks in that column should be handled according to the defined deletion strategy (move to default column or delete).
**Validates: Requirements 4.5**

### Property 17: Board title updates broadcast to all users
*For any* board title update, all connected users viewing that board should receive the new title in real-time.
**Validates: Requirements 5.1**

### Property 18: Member addition broadcasts to all users
*For any* member addition to a board, all connected users viewing that board should be notified of the new member in real-time.
**Validates: Requirements 5.2**

### Property 19: Member removal broadcasts and disconnects user
*For any* member removal from a board, all connected users should be notified, and the removed user should be disconnected from the board.
**Validates: Requirements 5.3**

### Property 20: Shared boards appear in sidebar
*For any* user added as a board member, the shared board should appear in their sidebar.
**Validates: Requirements 6.1**

### Property 21: Sidebar distinguishes owned vs shared boards
*For any* board displayed in the sidebar, the UI should visually distinguish whether it's owned by the user or shared with them.
**Validates: Requirements 6.2**

### Property 22: Shared boards load with correct permissions
*For any* shared board and user role, when the board is loaded, the user should have permissions appropriate to their role.
**Validates: Requirements 6.3**

### Property 23: Removed boards disappear from sidebar
*For any* user removed from a board, that board should immediately disappear from their sidebar.
**Validates: Requirements 6.4**

### Property 24: Shared boards display owner information
*For any* shared board displayed in the sidebar, the UI should show the owner's name or an indicator of who shared it.
**Validates: Requirements 6.5**

### Property 25: Editors can create tasks
*For any* user with editor role, they should be able to create tasks and the creation should broadcast to all users.
**Validates: Requirements 7.1**

### Property 26: Editors can update tasks
*For any* user with editor role, they should be able to update tasks and the update should broadcast to all users.
**Validates: Requirements 7.2**

### Property 27: Editors can delete tasks
*For any* user with editor role, they should be able to delete tasks and the deletion should broadcast to all users.
**Validates: Requirements 7.3**

### Property 28: Editors can manage columns
*For any* user with editor role, they should be able to create and modify columns and the changes should broadcast to all users.
**Validates: Requirements 7.4**

### Property 29: Viewers see read-only board
*For any* user with viewer role, when they view a board, all tasks and columns should be displayed in read-only mode.
**Validates: Requirements 8.1**

### Property 30: Viewers receive real-time updates without interaction
*For any* real-time update received by a viewer, the changes should be displayed but the viewer should not be able to interact with or modify the content.
**Validates: Requirements 8.5**

### Property 31: Successful reconnection refreshes board state
*For any* successful reconnection after connection loss, the system should fetch the latest board state to ensure data consistency.
**Validates: Requirements 9.2**

### Property 32: Reconnection shows status indicator
*For any* reconnection attempt, the system should display a connection status indicator to inform the user.
**Validates: Requirements 9.3**

### Property 33: Offline state prevents editing
*For any* offline state, the system should display an offline indicator and prevent all editing actions.
**Validates: Requirements 9.5**

### Property 34: Concurrent updates use last-write-wins
*For any* simultaneous updates to the same task by multiple users, the system should apply the last-write-wins strategy based on database timestamps.
**Validates: Requirements 10.1**

### Property 35: Concurrent position changes use most recent
*For any* concurrent task position changes by multiple users, the system should apply the most recent position based on database timestamps.
**Validates: Requirements 10.3**

### Property 36: Database timestamp is source of truth for conflicts
*For any* conflicting updates, the system should use the database timestamp as the authoritative source of truth.
**Validates: Requirements 10.4**

### Property 37: Conflicts are logged without disrupting UX
*For any* conflict that occurs, the system should log the conflict for debugging purposes without disrupting the user experience.
**Validates: Requirements 10.5**


## Error Handling

### Permission Errors

**Design Decision**: All permission errors are handled at both the client and server layers for defense in depth.

- **Client-side validation**: Provides immediate feedback to users without network round-trips
- **Server-side validation**: Enforces security through Row Level Security policies
- **Error messages**: Clear, user-friendly messages that explain why an action was denied
- **UI feedback**: Disabled buttons and visual indicators for actions the user cannot perform

**Error Types**:
```typescript
type PermissionError = 
  | 'INSUFFICIENT_PERMISSIONS'
  | 'OWNER_REQUIRED'
  | 'EDITOR_REQUIRED'
  | 'NOT_A_MEMBER';

interface PermissionErrorResponse {
  error: PermissionError;
  message: string;
  requiredRole?: BoardMemberRole;
}
```

### Real-time Connection Errors

**Design Decision**: Implement exponential backoff with jitter for reconnection attempts to avoid thundering herd problems.

**Reconnection Strategy**:
1. Initial reconnection attempt after 1 second
2. Exponential backoff: 1s, 2s, 4s, 8s, 16s (max)
3. Add random jitter (0-1000ms) to prevent synchronized reconnections
4. After 5 failed attempts, prompt user for manual refresh
5. On successful reconnection, fetch latest board state

**Connection States**:
```typescript
type ConnectionState = 
  | { status: 'connected' }
  | { status: 'connecting', attempt: number }
  | { status: 'disconnected', reason: string }
  | { status: 'error', error: Error, canRetry: boolean };
```

### Conflict Resolution

**Design Decision**: Use last-write-wins (LWW) strategy with database timestamps as the source of truth.

**Rationale**: 
- Simple to implement and reason about
- Consistent with Supabase Realtime's event ordering
- Database timestamps are authoritative and cannot be manipulated by clients
- Acceptable for collaborative task management (not mission-critical data)

**Conflict Scenarios**:

1. **Update-Update Conflict**: Two users update the same task simultaneously
   - Resolution: Last write wins based on `updated_at` timestamp
   - User feedback: Silent resolution (both users see the final state)

2. **Update-Delete Conflict**: User A updates a task while User B deletes it
   - Resolution: Deletion wins (task is deleted)
   - User feedback: User A receives notification that task was deleted

3. **Move-Move Conflict**: Two users move the same task to different positions
   - Resolution: Last move wins based on `updated_at` timestamp
   - User feedback: Silent resolution (both users see the final position)

4. **Column Delete with Tasks**: User deletes a column containing tasks
   - Resolution: Tasks are moved to a default "Backlog" column
   - User feedback: Notification showing tasks were moved

### Invitation Errors

**Error Scenarios**:

1. **User Not Found**: Email doesn't exist in the system
   - Error message: "User not found. They need to sign up first."
   - Action: Provide link to share invitation via email

2. **Already a Member**: User is already a member of the board
   - Error message: "This user is already a member of the board."
   - Action: Show current role, offer to change role instead

3. **Invalid Email**: Email format is invalid
   - Error message: "Please enter a valid email address."
   - Action: Highlight email input field

4. **Self-Invitation**: Owner tries to invite themselves
   - Error message: "You are already the owner of this board."
   - Action: Dismiss modal

### Data Consistency Errors

**Design Decision**: Implement optimistic updates with rollback on failure.

**Optimistic Update Flow**:
1. User performs action (e.g., create task)
2. UI immediately updates (optimistic)
3. Request sent to Supabase
4. If successful: Real-time event confirms the change
5. If failed: Rollback UI change and show error

**Rollback Strategy**:
```typescript
interface OptimisticUpdate<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: T;
  previousState?: T;
  timestamp: number;
}

// Store maintains a queue of pending optimistic updates
// On error, revert changes in reverse chronological order
```

## Testing Strategy

### Unit Testing

**Framework**: Vitest with React Testing Library

**Test Coverage**:

1. **Permission Logic**:
   - Test `getPermissions()` for each role
   - Test permission checks for all actions
   - Test edge cases (null role, invalid role)

2. **Store Actions**:
   - Test `inviteMember()` with valid/invalid inputs
   - Test `removeMember()` with various scenarios
   - Test `fetchBoardMembers()` data transformation
   - Test optimistic update rollback logic

3. **Component Rendering**:
   - Test ShareBoardModal renders correctly for each role
   - Test PermissionGate shows/hides content based on role
   - Test ConnectionStatusIndicator displays correct status
   - Test role indicators are visually distinct

4. **Error Handling**:
   - Test permission error messages
   - Test invitation error scenarios
   - Test connection error handling
   - Test conflict resolution logic

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test must include a comment tag in this exact format:
```typescript
// **Feature: realtime-collaboration, Property {number}: {property_text}**
```

**Property Test Coverage**:

1. **Member Management Properties**:
   - Property 1: Member invitation creates member with correct role
   - Property 2: Members list updates after successful addition
   - Property 3: Member list displays all required information
   - Property 4: Member removal revokes access

2. **Real-time Broadcast Properties**:
   - Property 7-11: Task operations broadcast correctly
   - Property 12-15: Column operations broadcast correctly
   - Property 17-19: Board settings broadcast correctly

3. **Permission Properties**:
   - Property 6: Permission validation precedes actions
   - Property 25-28: Editor permissions work correctly
   - Property 29-30: Viewer permissions work correctly

4. **Conflict Resolution Properties**:
   - Property 34: Concurrent updates use last-write-wins
   - Property 35: Concurrent position changes use most recent
   - Property 36: Database timestamp is source of truth

**Generator Strategies**:

```typescript
// Smart generators for property tests
const arbitraryEmail = fc.emailAddress();
const arbitraryRole = fc.constantFrom('owner', 'editor', 'viewer');
const arbitraryBoardMember = fc.record({
  id: fc.uuid(),
  board_id: fc.uuid(),
  user_id: fc.uuid(),
  role: arbitraryRole,
  created_at: fc.date().map(d => d.toISOString())
});

// Generate realistic task updates
const arbitraryTaskUpdate = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 })),
  priority: fc.constantFrom('low', 'medium', 'high'),
  status: fc.constantFrom('todo', 'in_progress', 'done'),
  column_id: fc.uuid()
});
```

### Integration Testing

**Scope**: Test real-time subscriptions with Supabase local instance

**Test Scenarios**:

1. **Multi-Client Simulation**:
   - Create multiple Supabase clients
   - Perform action on client A
   - Verify client B receives real-time update
   - Verify UI updates correctly

2. **Reconnection Flow**:
   - Establish connection
   - Simulate network failure
   - Verify reconnection attempts
   - Verify state refresh after reconnection

3. **Permission Enforcement**:
   - Create board with multiple members
   - Attempt actions as different roles
   - Verify RLS policies enforce permissions
   - Verify client-side checks match server-side

### End-to-End Testing

**Framework**: Playwright

**Critical User Flows**:

1. **Share Board Flow**:
   - Owner opens share modal
   - Owner invites user with editor role
   - Invited user sees board in sidebar
   - Invited user can edit tasks

2. **Real-time Collaboration Flow**:
   - Two users open same board
   - User A creates task
   - User B sees task appear immediately
   - User B updates task
   - User A sees update immediately

3. **Permission Boundary Flow**:
   - Owner invites viewer
   - Viewer opens board
   - Viewer attempts to edit task
   - System prevents edit and shows error
   - Viewer sees real-time updates from others

4. **Reconnection Flow**:
   - User opens board
   - Simulate network disconnection
   - Verify offline indicator appears
   - Restore network
   - Verify reconnection and state refresh

### Performance Testing

**Metrics to Monitor**:

1. **Real-time Latency**: Time from action to broadcast receipt (target: <500ms)
2. **UI Update Time**: Time from broadcast receipt to UI render (target: <100ms)
3. **Reconnection Time**: Time to establish connection after network restore (target: <2s)
4. **Concurrent Users**: System behavior with 10+ users on same board

**Load Testing Scenarios**:
- 10 concurrent users creating tasks simultaneously
- 5 concurrent users moving tasks rapidly
- Rapid connection/disconnection cycles
- Large boards (100+ tasks, 10+ columns)

## Design Rationale

### Why Supabase Realtime over WebSockets?

**Decision**: Use Supabase Realtime (PostgreSQL LISTEN/NOTIFY) instead of custom WebSocket implementation.

**Rationale**:
- **Integrated with existing stack**: Already using Supabase for auth and database
- **Automatic authorization**: RLS policies apply to real-time subscriptions
- **Simplified architecture**: No need to maintain separate WebSocket server
- **Built-in reconnection**: Supabase client handles reconnection automatically
- **Scalability**: Supabase handles connection pooling and load balancing
- **Cost-effective**: Included in Supabase pricing, no additional infrastructure

### Why Client-Side State Management (Zustand)?

**Decision**: Use Zustand for client-side state management instead of server-side state or other solutions.

**Rationale**:
- **Optimistic updates**: Immediate UI feedback before server confirmation
- **Offline resilience**: Can queue actions and retry when connection restored
- **Performance**: Reduces server round-trips for read operations
- **Simplicity**: Lightweight, minimal boilerplate compared to Redux
- **React integration**: Excellent hooks-based API for React components
- **Persistence**: Easy to persist state to localStorage for offline support

### Why Last-Write-Wins for Conflict Resolution?

**Decision**: Use last-write-wins (LWW) strategy instead of operational transformation or CRDTs.

**Rationale**:
- **Simplicity**: Easy to implement and understand
- **Acceptable for use case**: Task management is not mission-critical like document editing
- **Database-native**: PostgreSQL timestamps provide authoritative ordering
- **User expectations**: Users expect their latest action to be reflected
- **Conflict rarity**: In practice, users rarely edit the exact same field simultaneously
- **Fallback option**: Can upgrade to CRDTs later if needed without breaking changes

### Why Three-Tier Permission Model?

**Decision**: Implement Owner/Editor/Viewer roles instead of fine-grained permissions.

**Rationale**:
- **User comprehension**: Simple mental model that users understand immediately
- **Common pattern**: Matches familiar patterns from Google Docs, Notion, etc.
- **Sufficient granularity**: Covers all realistic use cases for task boards
- **Easy to implement**: Three roles are easier to test and maintain than complex ACLs
- **Future extensibility**: Can add custom roles later if needed

### Why Optimistic Updates?

**Decision**: Implement optimistic updates with rollback instead of waiting for server confirmation.

**Rationale**:
- **Perceived performance**: UI feels instant and responsive
- **User satisfaction**: Users don't wait for network round-trips
- **Conflict rarity**: Rollbacks are rare in practice
- **Real-time sync**: Other users see changes quickly via real-time subscriptions
- **Error handling**: Clear rollback and error messages when operations fail
