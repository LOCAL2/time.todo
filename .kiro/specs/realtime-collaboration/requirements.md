# Requirements Document

## Introduction

ระบบ Real-time Collaborative Board เป็นฟีเจอร์ที่ช่วยให้ผู้ใช้หลายคนสามารถทำงานร่วมกันบน board เดียวกันได้แบบ real-time โดยผู้ใช้สามารถเห็นการเปลี่ยนแปลงที่เกิดขึ้นจากผู้ใช้คนอื่นทันทีโดยไม่ต้อง refresh หน้าเว็บ ระบบจะรองรับการแชร์ board, การจัดการสิทธิ์ของสมาชิก และการซิงค์ข้อมูลแบบ real-time สำหรับ tasks, columns และ board settings

## Glossary

- **Board**: พื้นที่ทำงานที่ประกอบด้วย columns และ tasks ซึ่งสามารถแชร์ให้ผู้ใช้คนอื่นได้
- **Task**: งานหรือรายการที่อยู่ใน board ซึ่งมีข้อมูลเช่น title, description, priority, status, due date
- **Column**: คอลัมน์ที่ใช้จัดกลุ่ม tasks ใน board
- **Board Member**: ผู้ใช้ที่ได้รับสิทธิ์ในการเข้าถึง board
- **Owner**: เจ้าของ board ที่มีสิทธิ์เต็มในการจัดการ board และสมาชิก
- **Editor**: สมาชิกที่สามารถสร้าง แก้ไข และลบ tasks และ columns ได้
- **Viewer**: สมาชิกที่สามารถดู board ได้อย่างเดียว ไม่สามารถแก้ไขได้
- **Real-time Sync**: การซิงค์ข้อมูลแบบทันทีระหว่างผู้ใช้หลายคนที่เปิด board เดียวกัน
- **Supabase Realtime**: ระบบ real-time subscription ของ Supabase ที่ใช้ PostgreSQL LISTEN/NOTIFY

## Requirements

### Requirement 1

**User Story:** ในฐานะเจ้าของ board ฉันต้องการแชร์ board ให้กับผู้ใช้คนอื่นผ่าน email เพื่อให้พวกเขาสามารถเข้ามาทำงานร่วมกันได้

#### Acceptance Criteria

1. WHEN the Owner opens the share modal THEN the System SHALL display an interface for inviting users by email
2. WHEN the Owner enters a valid email and selects a role THEN the System SHALL add that user as a board member with the specified role
3. WHEN the Owner attempts to invite a user who is already a member THEN the System SHALL prevent the duplicate invitation and display an error message
4. WHEN the Owner attempts to invite a user who does not exist in the system THEN the System SHALL display an error message indicating the user needs to sign up first
5. WHEN a user is successfully added as a board member THEN the System SHALL update the members list immediately

### Requirement 2

**User Story:** ในฐานะเจ้าของ board ฉันต้องการจัดการสมาชิกและสิทธิ์ของพวกเขา เพื่อควบคุมว่าใครสามารถทำอะไรได้บ้าง

#### Acceptance Criteria

1. WHEN the Owner views the members list THEN the System SHALL display all board members with their roles and email addresses
2. WHEN the Owner removes a member THEN the System SHALL revoke that user's access to the board immediately
3. WHEN the System displays member roles THEN the System SHALL show distinct visual indicators for Owner, Editor, and Viewer roles
4. WHEN a member attempts to perform an action THEN the System SHALL validate their role permissions before allowing the action
5. WHEN the Owner attempts to remove themselves THEN the System SHALL prevent the removal to ensure the board always has an owner

### Requirement 3

**User Story:** ในฐานะสมาชิก board ฉันต้องการเห็นการเปลี่ยนแปลงที่เกิดขึ้นจากผู้ใช้คนอื่นแบบ real-time เพื่อให้ทุกคนทำงานร่วมกันได้อย่างมีประสิทธิภาพ

#### Acceptance Criteria

1. WHEN a user creates a new task THEN the System SHALL broadcast the new task to all connected users viewing the same board
2. WHEN a user updates a task THEN the System SHALL broadcast the updated task data to all connected users viewing the same board
3. WHEN a user deletes a task THEN the System SHALL broadcast the deletion to all connected users and remove the task from their view
4. WHEN a user moves a task to a different column or position THEN the System SHALL broadcast the position change to all connected users
5. WHEN a user receives a real-time update THEN the System SHALL apply the change to the UI without requiring a page refresh

### Requirement 4

**User Story:** ในฐานะสมาชิก board ฉันต้องการเห็นการเปลี่ยนแปลงของ columns แบบ real-time เพื่อให้โครงสร้าง board ของทุกคนเหมือนกัน

#### Acceptance Criteria

1. WHEN a user creates a new column THEN the System SHALL broadcast the new column to all connected users viewing the same board
2. WHEN a user updates a column title THEN the System SHALL broadcast the updated column data to all connected users
3. WHEN a user deletes a column THEN the System SHALL broadcast the deletion to all connected users and remove the column from their view
4. WHEN a user reorders columns THEN the System SHALL broadcast the new column positions to all connected users
5. WHEN a column is deleted THEN the System SHALL handle tasks in that column according to the deletion strategy

### Requirement 5

**User Story:** ในฐานะสมาชิก board ฉันต้องการเห็นการเปลี่ยนแปลงของ board settings แบบ real-time เพื่อให้ข้อมูล board ของทุกคนเป็นปัจจุบัน

#### Acceptance Criteria

1. WHEN the Owner updates the board title THEN the System SHALL broadcast the new title to all connected users
2. WHEN the Owner adds a new member THEN the System SHALL broadcast the member addition to all connected users
3. WHEN the Owner removes a member THEN the System SHALL broadcast the removal and disconnect the removed user from the board
4. WHEN a removed user is viewing the board THEN the System SHALL redirect them away from the board or display an access denied message
5. WHEN board settings change THEN the System SHALL update the UI for all connected users within 1 second

### Requirement 6

**User Story:** ในฐานะผู้ใช้ที่ได้รับการแชร์ board ฉันต้องการเห็น board ที่แชร์ให้ฉันใน sidebar เพื่อให้เข้าถึงได้ง่าย

#### Acceptance Criteria

1. WHEN a user is added as a board member THEN the System SHALL display the shared board in their sidebar
2. WHEN the System displays boards in the sidebar THEN the System SHALL visually distinguish between owned boards and shared boards
3. WHEN a user clicks on a shared board THEN the System SHALL load the board with appropriate permissions based on their role
4. WHEN a user is removed from a board THEN the System SHALL remove that board from their sidebar immediately
5. WHEN the System displays a shared board THEN the System SHALL show the owner's name or an indicator of who shared it

### Requirement 7

**User Story:** ในฐานะ Editor ฉันต้องการสร้าง แก้ไข และลบ tasks และ columns ได้ เพื่อมีส่วนร่วมในการจัดการ board

#### Acceptance Criteria

1. WHEN an Editor creates a task THEN the System SHALL allow the creation and broadcast it to all users
2. WHEN an Editor updates a task THEN the System SHALL allow the update and broadcast it to all users
3. WHEN an Editor deletes a task THEN the System SHALL allow the deletion and broadcast it to all users
4. WHEN an Editor creates or modifies a column THEN the System SHALL allow the action and broadcast it to all users
5. WHEN an Editor attempts to manage board members THEN the System SHALL prevent the action and display a permission error

### Requirement 8

**User Story:** ในฐานะ Viewer ฉันต้องการดู board และ tasks ได้อย่างเดียว เพื่อติดตามความคืบหน้าโดยไม่เสี่ยงที่จะแก้ไขข้อมูลโดยไม่ตั้งใจ

#### Acceptance Criteria

1. WHEN a Viewer views a board THEN the System SHALL display all tasks and columns in read-only mode
2. WHEN a Viewer attempts to create a task THEN the System SHALL prevent the action and display a permission error
3. WHEN a Viewer attempts to edit a task THEN the System SHALL prevent the action and display a permission error
4. WHEN a Viewer attempts to delete a task THEN the System SHALL prevent the action and display a permission error
5. WHEN a Viewer receives real-time updates THEN the System SHALL display the changes without allowing interaction

### Requirement 9

**User Story:** ในฐานะผู้ใช้ ฉันต้องการให้ระบบจัดการ connection errors และ reconnection อัตโนมัติ เพื่อให้การทำงานไม่หยุดชะงักเมื่อมีปัญหาเครือข่าย

#### Acceptance Criteria

1. WHEN the real-time connection is lost THEN the System SHALL attempt to reconnect automatically
2. WHEN the System successfully reconnects THEN the System SHALL fetch the latest board state to ensure data consistency
3. WHEN the System is reconnecting THEN the System SHALL display a connection status indicator to the user
4. WHEN the System cannot reconnect after multiple attempts THEN the System SHALL display an error message with a manual refresh option
5. WHEN the user is offline THEN the System SHALL display a clear offline indicator and prevent editing actions

### Requirement 10

**User Story:** ในฐานะผู้พัฒนา ฉันต้องการให้ระบบจัดการ race conditions และ conflicts ได้อย่างถูกต้อง เพื่อป้องกันการสูญหายหรือเขียนทับข้อมูล

#### Acceptance Criteria

1. WHEN multiple users update the same task simultaneously THEN the System SHALL apply updates based on last-write-wins strategy
2. WHEN a user updates a task that has been deleted THEN the System SHALL handle the conflict gracefully and notify the user
3. WHEN a user moves a task that has been moved by another user THEN the System SHALL apply the most recent position
4. WHEN the System receives conflicting updates THEN the System SHALL use the database timestamp as the source of truth
5. WHEN a conflict occurs THEN the System SHALL log the conflict for debugging purposes without disrupting the user experience
