# Example: Integrating Global Services into ProjectNew.astro

Here's how you can integrate the global services into your existing `ProjectNew.astro` component:

## 1. Update File Upload Handler

In your `ProjectNew.astro` component, replace the existing upload logic:

```javascript
// Replace existing upload logic with global services
import {
  uploadFiles,
  showNotification,
  updateProjectStatus,
} from "../lib/global-services";

class ProjectFileUploader {
  constructor(container) {
    this.container = container;
    this.setupEventListeners();
  }

  async handleFileUpload(files, projectId) {
    try {
      // Use global service instead of custom upload logic
      const result = await uploadFiles(files, projectId);

      // Update project metadata with uploaded files
      await updateProjectStatus({
        projectId: projectId,
        status: "in-progress",
        metadata: {
          filesUploaded: result.files.map((f) => ({
            name: f.name,
            size: f.size,
            uploadedAt: new Date().toISOString(),
          })),
        },
      });
    } catch (error) {
      // Error notifications are handled automatically by global services
      console.error("Upload failed:", error);
    }
  }
}
```

## 2. Add Project Status Updates

```javascript
// Add these functions to your component

async function markProjectAsReady(projectId) {
  await updateProjectStatus({
    projectId,
    status: "review",
    metadata: {
      readyForReview: true,
      submittedAt: new Date().toISOString(),
    },
  });
}

async function sendProjectNotification(projectId, recipientEmail) {
  await sendEmail({
    to: recipientEmail,
    type: "notification",
    variables: {
      title: "Project Ready for Review",
      message: `Project ${projectId} has been submitted and is ready for review.`,
    },
  });
}
```

## 3. Listen for Global Events

```javascript
// Add event listeners for better UX
import { useGlobalEvents } from "../lib/global-services";

const { on } = useGlobalEvents();

// Update UI when files are uploaded
on("files:uploaded", (data) => {
  if (data.projectId === currentProjectId) {
    updateFilesList(data.files);
    updateProgressIndicator();
  }
});

// Show upload progress
on("files:uploading", (data) => {
  showUploadingState(data.files);
});

// Handle project status changes
on("project:status-updated", (data) => {
  updateProjectStatusDisplay(data.status);

  if (data.status === "completed") {
    showSuccessMessage();
  }
});
```

## 4. Quick Integration Script

Add this to your existing `ProjectNew.astro` script section:

```javascript
// Add to existing script section
import {
  globalServices,
  uploadFiles,
  updateProjectStatus,
  sendEmail,
  showNotification,
  useGlobalEvents,
} from "../lib/global-services";

// Get current project ID (you'll need to adapt this to your data structure)
const getCurrentProjectId = () => {
  // Your logic to get the current project ID
  return "your-project-id";
};

// Enhanced file upload with global services
const enhancedFileUpload = async (files) => {
  const projectId = getCurrentProjectId();

  try {
    // Upload files using global service
    const result = await uploadFiles(files, projectId);

    // Update project with file metadata
    await updateProjectStatus({
      projectId,
      status: "in-progress",
      metadata: {
        lastActivity: new Date().toISOString(),
        fileCount: result.files.length,
        totalSize: result.files.reduce((sum, f) => sum + f.size, 0),
      },
    });

    // Send notification to project stakeholders
    await sendEmail({
      to: "stakeholder@example.com",
      type: "notification",
      variables: {
        title: "Files Uploaded",
        message: `${result.files.length} file(s) have been uploaded to project ${projectId}`,
      },
    });
  } catch (error) {
    console.error("Enhanced upload failed:", error);
  }
};

// Setup global event listeners
const setupGlobalEvents = () => {
  const { on } = useGlobalEvents();

  // Listen for successful uploads
  on("files:uploaded", (data) => {
    console.log("Files uploaded:", data);
    // Update your existing UI accordingly
  });

  // Listen for project updates
  on("project:status-updated", (data) => {
    console.log("Project status updated:", data);
    // Refresh project display if needed
  });

  // Listen for email notifications
  on("email:sent", (data) => {
    console.log("Email sent:", data);
  });
};

// Initialize when component loads
document.addEventListener("DOMContentLoaded", () => {
  setupGlobalEvents();
});
```

This integration gives you:

- ✅ Automatic error handling and user notifications
- ✅ Consistent API calls across your app
- ✅ Real-time event updates
- ✅ Email notifications for project activities
- ✅ Centralized project status management
- ✅ Built-in loading states and progress feedback
