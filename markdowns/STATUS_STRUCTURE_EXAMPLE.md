# Simplified Status Structure

## New Structure

Instead of complex nested objects, we now have a simple structure:

```typescript
{
  success: true,
  statuses: {
    10: {
      admin: {
        status_name: "Project Created",
        status_action: "View Project",
        email_subject: "New Project Created",
        email_content: "A new project has been created...",
        modal: "Project created successfully",
        button_text: "View Project",
        button_link: "/project/123"
      },
      client: {
        status_name: "Project Submitted",
        status_action: "View Project",
        email_subject: "Your Project Has Been Submitted",
        email_content: "Thank you for submitting your project...",
        modal: "Your project has been submitted successfully",
        button_text: "View Project",
        button_link: "/project/123"
      },
      current: {
        // This is automatically set based on user role
        // Admin/Staff users see admin version
        // Client users see client version
        status_name: "Project Created", // or "Project Submitted" for clients
        status_action: "View Project",
        email_subject: "New Project Created", // or client version
        email_content: "A new project has been created...", // or client version
        modal: "Project created successfully", // or client version
        button_text: "View Project",
        button_link: "/project/123"
      }
    },
    20: {
      admin: { /* ... */ },
      client: { /* ... */ },
      current: { /* ... */ }
    }
    // ... more status codes
  },
  selectOptions: [
    { value: "10", label: "Project Created" },
    { value: "20", label: "Generating Proposal" }
  ],
  userRole: "Admin"
}
```

## Usage Examples

### Get status data by code and role:
```typescript
// Get admin data for status 10
const adminData = response.statuses[10].admin;

// Get client data for status 10  
const clientData = response.statuses[10].client;

// Get current user's data for status 10 (automatically role-based)
const currentData = response.statuses[10].current;

// Or use the helper function
const statusData = getStatusData(response.statuses, 10, 'admin');
```

### Update status with new structure:
```typescript
// Instead of complex nested objects, just target the status code
const statusCode = 20;
const statusData = response.statuses[statusCode];

// Use the appropriate role data
const notificationData = {
  admin: statusData.admin,
  client: statusData.client,
  current: statusData.current
};
```

## Benefits

1. **Simple structure** - Just `statuses[code].{admin, client, current}`
2. **Role-based** - `current` automatically shows the right data for the user's role
3. **Easy targeting** - Just use the status code to get all role variants
4. **Consistent** - Same structure for all status codes
5. **Future-proof** - Easy to add new properties without breaking existing code
