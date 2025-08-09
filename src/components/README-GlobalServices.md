# Global Services System

This system provides a centralized way to handle common operations like sending emails, updating project status, and managing notifications across your Astro application.

## Architecture

### 1. **Service Classes** (`src/lib/global-services.ts`)

Centralized API and utility functions with event-driven architecture.

### 2. **Custom Events**

For cross-component communication without tight coupling.

### 3. **API Routes**

Server-side operations via `/api` endpoints.

### 4. **Toast Alerts** (`src/components/ToastAlerts.astro`)

Global notification management with visual feedback.

## Usage Examples

### Sending Emails

```javascript
import { sendEmail, sendReactEmail } from "../lib/global-services";

// Welcome email (basic template)
await sendEmail({
  to: "user@example.com",
  type: "welcome",
  variables: { name: "John Doe" },
});

// Custom email
await sendEmail({
  to: "user@example.com",
  type: "custom",
  subject: "Custom Subject",
  html: "<h1>Hello!</h1>",
  text: "Hello!",
});

// React Email (styled templates)
await sendReactEmail({
  to: "user@example.com",
  type: "welcome",
  name: "John Doe",
  appName: "CAPCo",
});

// Project notification email
await sendReactEmail({
  to: "client@example.com",
  type: "project-notification",
  recipientName: "John Doe",
  projectTitle: "Fire Protection System",
  projectId: "PROJ-123",
  statusMessage: "Your project has been updated.",
  actionRequired: true,
  actionUrl: "https://app.com/projects/123",
  actionText: "View Project",
});
```

### Updating Project Status

```javascript
import { updateProjectStatus } from "../lib/global-services";

await updateProjectStatus({
  projectId: "project-123",
  status: "completed",
  metadata: {
    completedAt: new Date().toISOString(),
    notes: "Project finished successfully",
  },
});
```

### Showing Notifications

```javascript
import { showNotification } from "../lib/global-services";

showNotification({
  type: "success",
  title: "Success!",
  message: "Operation completed successfully",
  duration: 3000,
});

// With actions
showNotification({
  type: "warning",
  title: "Confirm Action",
  message: "Are you sure you want to delete this?",
  duration: 0, // Manual close only
  actions: [
    { label: "Delete", action: () => performDelete() },
    { label: "Cancel", action: () => console.log("Cancelled") },
  ],
});
```

### File Upload

```javascript
import { uploadFiles } from "../lib/global-services";

// From a file input
const fileInput = document.getElementById("file-input");
await uploadFiles(fileInput.files, "project-123");
```

### Listening to Global Events

```javascript
import { useGlobalEvents } from "../lib/global-services";

const { on, emit } = useGlobalEvents();

// Listen for project updates
const unsubscribe = on("project:status-updated", (data) => {
  console.log("Project updated:", data);
  // Refresh UI, update state, etc.
});

// Emit custom events
emit("custom:event", { someData: "value" });

// Clean up listener when component unmounts
unsubscribe();
```

## Available Events

### Email Events

- `email:sending` - Email is being sent
- `email:sent` - Email sent successfully
- `email:error` - Email sending failed

### Project Events

- `project:status-updating` - Project status is being updated
- `project:status-updated` - Project status updated successfully
- `project:status-error` - Project status update failed
- `project:created` - New project created
- `project:updated` - Project data updated
- `project:deleted` - Project deleted
- `project:metadata-updated` - Project metadata updated
- `project:file-added` - File added to project

### File Events

- `files:uploading` - Files are being uploaded
- `files:uploaded` - Files uploaded successfully
- `files:error` - File upload failed

### Notification Events

- `notification:show` - Notification displayed
- `notification:hide` - Notification hidden

### Auth Events

- `auth:signout` - User signed out

## Component Integration

### In Astro Components

```astro
---
// Component script (server-side)
---

<div id="my-component">
  <!-- Your component content -->
</div>

<script>
  import { globalServices, showNotification } from "../lib/global-services";

  // Component logic
  const component = {
    async init() {
      // Set up event listeners
      globalServices.on("project:updated", this.handleProjectUpdate.bind(this));
    },

    async handleProjectUpdate(data) {
      showNotification({
        type: "info",
        title: "Project Updated",
        message: `Project ${data.name} has been updated`,
      });
    },

    async saveProject() {
      try {
        // Your save logic
        globalServices.emit("project:saved", { id: "project-123" });
      } catch (error) {
        showNotification({
          type: "error",
          title: "Save Failed",
          message: error.message,
        });
      }
    },
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    component.init();
  });
</script>
```

## Best Practices

1. **Error Handling**: Always wrap async operations in try-catch blocks
2. **Event Cleanup**: Unsubscribe from events when components unmount
3. **Type Safety**: Use TypeScript interfaces for better development experience
4. **Consistent Naming**: Follow the `domain:action` pattern for event names
5. **Debouncing**: For frequent operations, consider debouncing API calls
6. **Loading States**: Use events to manage loading states across components

## API Integration

The global services automatically integrate with your existing API routes:

- `/api/send-email` - Email sending
- `/api/upload` - File uploads
- Supabase client for database operations

## Configuration

Ensure your environment variables are set:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
EMAIL_PROVIDER=resend
EMAIL_API_KEY=your_email_api_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your App Name
```

## Testing

Use the `GlobalServicesExample.astro` component to test all functionality:

```astro
---
import GlobalServicesExample from "../components/GlobalServicesExample.astro";
---

<GlobalServicesExample />
```

This provides a complete testing interface for all global services features.
