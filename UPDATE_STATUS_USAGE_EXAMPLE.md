# Update Status API - New Usage

## New Approach

Instead of calling `project-statuses` first, you can now pass the status array directly to `update-status` and let it determine the appropriate role data.

## Request Format

```typescript
// Call update-status with status array
const response = await fetch("/api/update-status", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    currentProject: {
      id: 123,
      status: 10,
      // ... other project data
    },
    newStatus: 20,
    statuses: {
      20: {
        admin: {
          status_name: "Generating Proposal",
          status_action: "View Project",
          email_subject: "Proposal Being Generated",
          email_content: "We are generating a proposal for {{CLIENT_NAME}}...",
          modal: "Proposal generation started",
          button_text: "View Project",
          button_link: "/project/123",
        },
        client: {
          status_name: "Proposal in Progress",
          status_action: "View Project",
          email_subject: "Your Proposal is Being Prepared",
          email_content: "We are preparing your proposal...",
          modal: "Your proposal is being prepared",
          button_text: "View Project",
          button_link: "/project/123",
        },
      },
    },
  }),
});
```

## How It Works

1. **Pass status array** - Include the full `statuses` object with `admin` and `client` data
2. **Automatic role detection** - The API uses `checkAuth` to determine user role
3. **Role-based data selection** - Automatically uses `statuses[newStatus].admin` or `statuses[newStatus].client`
4. **No additional API calls** - No need to call `project-statuses` first

## Benefits

1. **Single API call** - No need to call `project-statuses` first
2. **Automatic role handling** - API determines which data to use based on user role
3. **Cleaner frontend code** - Just pass the status array you already have
4. **Better performance** - One API call instead of two
5. **Consistent data** - Same status data used for both APIs

## Frontend Usage

```typescript
// Get statuses first (for UI display)
const statusesResponse = await fetch("/api/project-statuses");
const { statuses } = await statusesResponse.json();

// Update status with the same status array
const updateResponse = await fetch("/api/update-status", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    currentProject: project,
    newStatus: 20,
    statuses: statuses, // Pass the same status array
  }),
});
```

## Response Format

The API returns the same format as before, but now uses the role-appropriate data:

```typescript
{
  success: true,
  project: updatedProject,
  newStatus: 20,
  statusConfig: {
    // Role-appropriate data (admin or client based on user role)
    status_name: "Generating Proposal", // or "Proposal in Progress" for clients
    email_subject: "Proposal Being Generated", // or client version
    email_content: "We are generating...", // or client version
    modal: "Proposal generation started", // or client version
    // ... etc
  },
  notificationData: {
    admin: { /* admin notification data */ },
    client: { /* client notification data */ }
  }
}
```
