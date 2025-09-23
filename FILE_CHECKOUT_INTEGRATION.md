# File Checkout System Integration Guide

## Overview
This system allows staff and admin users to check out files (preventing overwrites) and assign them to specific people. Clients don't see any of this complexity.

## Setup Steps

### 1. Run the SQL Migration
```bash
# Execute the SQL file to create the checkout system
psql -h your-supabase-host -U postgres -d postgres -f sql-queriers/add-file-checkout-system.sql
```

### 2. Add Components to Your Project Pages

#### For Project Detail Pages (where files are displayed):
```astro
---
// In your project detail page (e.g., src/pages/project/[id].astro)
import FileListWithCheckout from "@/components/project/FileListWithCheckout.astro";
import FileCheckoutManager from "@/components/project/FileCheckoutManager.astro";
---

<!-- Replace your existing file list with: -->
<FileListWithCheckout 
  projectId={project.id} 
  currentUser={currentUser} 
  currentRole={currentUser?.profile?.role} 
/>

<!-- Add checkout manager for staff/admin -->
<FileCheckoutManager 
  fileId={file.id} 
  currentUser={currentUser} 
  currentRole={currentUser?.profile?.role} 
/>
```

### 3. Add Admin Dashboard Link
Add a link to the admin dashboard in your navigation:
```astro
<!-- In your navigation component -->
<a href="/admin/file-checkouts" class="nav-link">
  <i class="bx bx-lock"></i>
  File Checkouts
</a>
```

## How It Works

### For Clients
- Clients see files normally
- No checkout/assignment interface visible
- Files appear as "Available" status

### For Staff/Admin
- **Check Out**: Prevents others from editing the file
- **Assign**: Assigns file to specific staff member
- **Check In**: Releases the file for others to use
- **Notes**: Add context about why file was checked out/assigned

### Status Indicators
- 🟢 **Available**: File can be checked out
- 🔴 **Checked Out**: Someone is currently editing
- 🟡 **Assigned**: File assigned to someone (but not checked out)

## API Endpoints

### Check Out a File
```javascript
POST /api/file-checkout
{
  "action": "checkout",
  "file_id": 123,
  "user_id": "uuid",
  "notes": "Working on revisions"
}
```

### Check In a File
```javascript
POST /api/file-checkout
{
  "action": "checkin", 
  "file_id": 123,
  "user_id": "uuid",
  "notes": "Completed revisions"
}
```

### Assign a File
```javascript
POST /api/file-checkout
{
  "action": "assign",
  "file_id": 123,
  "assigned_to": "uuid",
  "user_id": "uuid",
  "notes": "Please review this file"
}
```

### Get File Status
```javascript
GET /api/file-checkout?file_id=123
```

## Database Schema

### New Columns in `files` table:
- `checked_out_by` (UUID): Who has the file checked out
- `checked_out_at` (TIMESTAMP): When it was checked out
- `assigned_to` (UUID): Who the file is assigned to
- `assigned_at` (TIMESTAMP): When it was assigned
- `checkout_notes` (TEXT): Notes about the checkout/assignment

### New Table: `file_checkout_history`
- Tracks all checkout/checkin/assignment activities
- Includes user, action, notes, and timestamps

## Security
- RLS policies ensure users only see relevant checkout information
- Admins can see all checkouts
- Staff can see checkouts for their projects
- Clients see no checkout information

## Benefits
1. **Prevents File Conflicts**: No more overwriting each other's work
2. **Clear Ownership**: Know who's working on what
3. **Assignment System**: Delegate files to specific team members
4. **Audit Trail**: Track all file activities
5. **Client-Friendly**: Clients see none of this complexity

## Usage Examples

### Scenario 1: Staff Member Needs to Edit a File
1. Staff member clicks "Check Out" on a file
2. File shows as "Checked out by [Name]"
3. Other staff see it's unavailable
4. When done, staff member clicks "Check In"
5. File becomes available again

### Scenario 2: Admin Assigns File to Staff
1. Admin selects file and assigns to specific staff member
2. File shows as "Assigned to [Name]"
3. Assigned staff member can then check it out
4. Clear workflow for file management

### Scenario 3: Client Uploads File
1. Client uploads file normally
2. File appears as "Available" to staff
3. Staff can check out or assign as needed
4. Client sees no difference in their experience
