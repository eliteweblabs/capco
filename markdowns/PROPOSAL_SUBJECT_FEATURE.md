# Proposal Subject Feature

## 🎯 **Overview**

The Proposal Subject feature allows users to customize the subject line of their project proposals. This provides:

- **Personalized proposals** with custom subject lines
- **Professional presentation** with editable headers
- **Dynamic defaults** based on project information
- **Real-time editing** with instant save functionality

## 🏗 **Implementation Details**

### **Database Schema**

#### **Option 1: Add Column to Projects Table (Recommended)**

```sql
-- Add subject column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS proposal_subject TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN projects.proposal_subject IS 'Custom subject line for the project proposal';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_proposal_subject ON projects(proposal_subject);
```

#### **Option 2: Dedicated Proposals Table (Alternative)**

```sql
-- Create separate proposals table (if you prefer this approach)
CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  subject TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
```

### **API Endpoint**

#### **`/api/update-proposal-subject`**

- **Method**: POST
- **Purpose**: Update proposal subject for a specific project
- **Authentication**: Required (user must own project or be Admin/Staff)
- **Validation**: Subject length limited to 200 characters

**Request Body:**

```json
{
  "projectId": "123",
  "subject": "Custom Fire Protection Services Proposal"
}
```

**Response:**

```json
{
  "success": true,
  "project": {
    "id": 123,
    "proposal_subject": "Custom Fire Protection Services Proposal",
    "title": "Office Building Project"
  },
  "message": "Proposal subject updated successfully"
}
```

### **UI Components**

#### **Editable Subject Display**

- **Default State**: Shows subject with edit icon
- **Edit State**: Input field with save/cancel buttons
- **Keyboard Support**: Enter to save, Escape to cancel
- **Visual Feedback**: Hover effects and transitions

#### **Subject Generation Logic**

```javascript
// Default subject generation
const defaultSubject = `Fire Protection Services Proposal - ${project.title || "Project"}`;
const proposalSubject = project.proposal_subject || defaultSubject;
```

## 🎨 **User Experience**

### **Visual Design**

- **Subtle Edit Icon**: Appears on hover to indicate editability
- **Inline Editing**: Subject edits in place without modal
- **Professional Typography**: Uses consistent font sizing and colors
- **Responsive Layout**: Works on all screen sizes

### **Interaction Flow**

1. **View Mode**: Subject displays with small edit icon
2. **Click to Edit**: Subject becomes editable input field
3. **Save Changes**: Updates database and shows success message
4. **Cancel Option**: Reverts to original subject
5. **Auto-Save**: Saves on Enter key press

### **Default Behavior**

- **New Projects**: Generate subject from project title
- **Existing Projects**: Use saved subject or generate default
- **Empty Subjects**: Fall back to project-based default
- **Long Subjects**: Truncate display but preserve full text

## 🔧 **Technical Implementation**

### **Frontend Components**

#### **ProposalManager.astro Updates**

```astro
<!-- Editable Subject Line -->
<div class="mt-3">
  <div id="proposal-subject-display" class="cursor-pointer">
    <p class="text-lg font-medium text-gray-800 hover:text-blue-600 transition-colors">
      <span id="proposal-subject-text">Fire Protection Services Proposal</span>
      <button id="edit-subject-btn" class="ml-2 text-gray-400 hover:text-blue-600">
        <i class="bx bx-edit text-sm"></i>
      </button>
    </p>
  </div>

  <div id="proposal-subject-edit" class="hidden">
    <div class="flex items-center space-x-2">
      <input type="text" id="proposal-subject-input" class="flex-1 px-3 py-2 border rounded-lg" />
      <button id="save-subject-btn" class="px-3 py-2 bg-blue-600 text-white rounded-lg">
        <i class="bx bx-check"></i>
      </button>
      <button id="cancel-subject-btn" class="px-3 py-2 bg-gray-500 text-white rounded-lg">
        <i class="bx bx-x"></i>
      </button>
    </div>
  </div>
</div>
```

#### **JavaScript Functionality**

```javascript
// Subject editing initialization
function initializeSubjectEditing() {
  const editBtn = document.getElementById("edit-subject-btn");
  const saveBtn = document.getElementById("save-subject-btn");
  const cancelBtn = document.getElementById("cancel-subject-btn");

  // Event listeners for edit/save/cancel
  editBtn.addEventListener("click", enterEditMode);
  saveBtn.addEventListener("click", saveSubject);
  cancelBtn.addEventListener("click", cancelEdit);
}

// Save subject to database
async function saveSubject() {
  const response = await fetch("/api/update-proposal-subject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, subject: newSubject }),
  });

  const data = await response.json();
  if (data.success) {
    updateUI(data.project.proposal_subject);
    showSuccessMessage();
  }
}
```

### **Backend Integration**

#### **ProposalManager Class Updates**

```typescript
// Update populateHeader method
private populateHeader(): void {
  const subjectElement = document.getElementById("proposal-subject-text");

  if (subjectElement) {
    const defaultSubject = `Fire Protection Services Proposal - ${this.project.title || 'Project'}`;
    const proposalSubject = this.project.proposal_subject || defaultSubject;
    subjectElement.textContent = proposalSubject;
  }

  // Re-initialize subject editing
  setTimeout(() => {
    if (typeof window.initializeSubjectEditing === 'function') {
      window.initializeSubjectEditing();
    }
  }, 100);
}
```

#### **API Security**

```typescript
// Permission validation
const hasAccess = project.author_id === user.id || ["Admin", "Staff"].includes(role);

if (!hasAccess) {
  return new Response(JSON.stringify({ error: "Access denied" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
```

## 🚀 **Setup Instructions**

### **1. Database Setup**

```sql
-- Run in Supabase SQL Editor:
-- Copy and execute: add-proposal-subject-column.sql
```

### **2. Deploy Code Changes**

The following files have been updated:

- `src/components/project/ProposalManager.astro` - UI components and JavaScript
- `src/lib/proposal-manager.ts` - ProposalManager class updates
- `src/pages/api/update-proposal-subject.ts` - API endpoint
- `add-proposal-subject-column.sql` - Database schema

### **3. Test the Feature**

1. **Generate Proposal**: Create or view existing proposal
2. **Edit Subject**: Click edit icon next to subject
3. **Save Changes**: Enter new subject and save
4. **Verify Persistence**: Refresh page to confirm subject is saved

## 💡 **Usage Examples**

### **Default Subject Generation**

```
Project: "Downtown Office Building"
Generated Subject: "Fire Protection Services Proposal - Downtown Office Building"
```

### **Custom Subject Examples**

- "Comprehensive Fire Safety Assessment - ABC Corp"
- "Emergency Sprinkler System Installation Proposal"
- "Code Compliance Review - Municipal Building Project"
- "Fire Protection Consulting Services - Phase 1"

### **Professional Templates**

- **New Construction**: "Fire Protection System Design - [Project Name]"
- **Renovation**: "Fire Safety Upgrade Proposal - [Project Name]"
- **Inspection**: "Fire Protection Inspection Services - [Project Name]"
- **Consulting**: "Fire Code Compliance Consulting - [Project Name]"

## 🔍 **Best Practices**

### **Subject Line Guidelines**

- **Keep it Descriptive**: Include service type and project name
- **Professional Tone**: Use formal business language
- **Reasonable Length**: Aim for 50-100 characters
- **Specific Services**: Mention key services when relevant

### **Default Generation**

- **Consistent Format**: Use standardized templates
- **Project Context**: Include project type when available
- **Service Focus**: Lead with "Fire Protection" or specific service
- **Fallback Options**: Handle missing project data gracefully

### **User Experience**

- **Visual Cues**: Clear indication that subject is editable
- **Quick Access**: Easy to find and modify
- **Immediate Feedback**: Show success/error messages
- **Mobile Friendly**: Ensure touch-friendly interface

## 🔐 **Security Considerations**

### **Access Control**

- **Project Ownership**: Users can only edit their own projects
- **Admin Override**: Admin/Staff can edit any project
- **Authentication Required**: All requests must be authenticated
- **Input Validation**: Sanitize and validate all inputs

### **Data Validation**

- **Length Limits**: Maximum 200 characters
- **XSS Prevention**: Proper HTML escaping
- **SQL Injection**: Parameterized queries
- **Rate Limiting**: Prevent abuse of API endpoint

## 📊 **Performance Considerations**

### **Database Impact**

- **Minimal Overhead**: Single column addition
- **Indexed Field**: Optional index for query performance
- **Efficient Updates**: Only updates when subject changes
- **No Breaking Changes**: Existing proposals continue to work

### **Frontend Performance**

- **Lazy Loading**: Subject editing initialized on demand
- **Minimal JavaScript**: Lightweight implementation
- **No External Dependencies**: Uses existing UI framework
- **Cached Data**: Leverages existing project data caching

## 🚀 **Future Enhancements**

### **Phase 2 Features**

- **Subject Templates**: Pre-defined subject templates by service type
- **Auto-Generation**: AI-powered subject suggestions
- **Version History**: Track subject changes over time
- **Bulk Updates**: Update subjects across multiple projects

### **Advanced Features**

- **Conditional Logic**: Subject based on project characteristics
- **Client Preferences**: Remember client-specific subject formats
- **Integration**: Sync with email/CRM systems
- **Analytics**: Track which subjects perform best

---

**Implementation Status**: ✅ **Complete and Ready to Use**
**Database Changes Required**: **Yes** - Run `add-proposal-subject-column.sql`
**User Training**: **Minimal** - Intuitive click-to-edit interface
