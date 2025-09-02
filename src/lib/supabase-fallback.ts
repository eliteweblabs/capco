// =====================================================
// DEVELOPMENT FALLBACK MODE
// Useful for testing new features without touching live database
// Set FALLBACK_MODE=true in .env or toggle here
// =====================================================

export const FALLBACK_MODE = false; // Back to normal - Supabase is working!

console.log(`🔧 [FALLBACK] Mode: ${FALLBACK_MODE ? "ENABLED" : "DISABLED"}`);

// Mock data that mirrors your real database structure
export const mockProjectStatuses = [
  {
    status_code: 1,
    status_name: "Submitted",
    client_visible: true,
    admin_visible: true,
    notify: true,
    email_content: "Your project has been submitted and is under review.",
    button_text: "View Project",
    button_link: "",
    est_time: "2-3 business days",
    project_action: "submit",
  },
  {
    status_code: 2,
    status_name: "Under Review",
    client_visible: true,
    admin_visible: true,
    notify: true,
    email_content: "Your project is currently under review by our team.",
    button_text: "View Project",
    button_link: "",
    est_time: "3-5 business days",
    project_action: "review",
  },
  {
    status_code: 3,
    status_name: "In Progress",
    client_visible: true,
    admin_visible: true,
    notify: true,
    email_content: "Work has begun on your project.",
    button_text: "View Project",
    button_link: "",
    est_time: "1-2 weeks",
    project_action: "progress",
  },
  {
    status_code: 4,
    status_name: "Completed",
    client_visible: true,
    admin_visible: true,
    notify: true,
    email_content: "Your project has been completed successfully!",
    button_text: "Download Documents",
    button_link: "",
    est_time: "Complete",
    project_action: "complete",
  },
  {
    status_code: 5,
    status_name: "On Hold",
    client_visible: false,
    admin_visible: true,
    notify: false,
    email_content: "Project is temporarily on hold.",
    button_text: "",
    button_link: "",
    est_time: "TBD",
    project_action: "hold",
  },
];

export const mockStaffUsers = [
  {
    id: "admin-1",
    name: "John Admin",
    role: "Admin",
    email: "admin@capcofire.com",
    first_name: "John",
    last_name: "Admin",
  },
  {
    id: "staff-1",
    name: "Jane Staff",
    role: "Staff",
    email: "jane@capcofire.com",
    first_name: "Jane",
    last_name: "Staff",
  },
  {
    id: "staff-2",
    name: "Bob Engineer",
    role: "Staff",
    email: "bob@capcofire.com",
    first_name: "Bob",
    last_name: "Engineer",
  },
];

export const mockProjects = [
  {
    id: 1,
    title: "Office Building Fire System",
    address: "123 Business Ave, Boston MA",
    status: 2,
    author_id: "client-1",
    assigned_to_id: "staff-1",
    comment_count: 3,
    sq_ft: 15000,
    new_construction: true,
    architect: "ABC Architecture",
    description: "Complete fire protection system for new office building",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-20T14:30:00Z",
  },
  {
    id: 2,
    title: "Warehouse Sprinkler Retrofit",
    address: "456 Industrial Rd, Cambridge MA",
    status: 3,
    author_id: "client-2",
    assigned_to_id: "staff-2",
    comment_count: 1,
    sq_ft: 50000,
    new_construction: false,
    architect: "XYZ Engineering",
    description: "Retrofit existing warehouse with modern sprinkler system",
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-01-22T11:15:00Z",
  },
];

export const mockDiscussions = [
  {
    id: 1,
    project_id: 1,
    author_id: "admin-1",
    content: "Project has been received and initial review is complete.",
    internal: false,
    created_at: "2024-01-16T10:00:00Z",
  },
  {
    id: 2,
    project_id: 1,
    author_id: "staff-1",
    content: "Need clarification on sprinkler head spacing in Zone A.",
    internal: true,
    created_at: "2024-01-17T14:00:00Z",
  },
  {
    id: 3,
    project_id: 1,
    author_id: "client-1",
    content: "When can we expect the preliminary drawings?",
    internal: false,
    created_at: "2024-01-18T16:30:00Z",
  },
];

export const mockUser = {
  id: "demo-user",
  email: "demo@example.com",
  role: "Admin",
};

// Helper functions for fallback mode
export const getFallbackData = (table: string, filters: any = {}) => {
  console.log(`🔧 [FALLBACK] Getting data for table: ${table}`, filters);

  switch (table) {
    case "project_statuses":
      return { data: mockProjectStatuses, error: null };
    case "profiles":
      return { data: mockStaffUsers, error: null };
    case "projects":
      let projects = [...mockProjects];
      if (filters.id) {
        projects = projects.filter((p) => p.id === parseInt(filters.id));
      }
      return { data: projects, error: null };
    case "discussion":
      let discussions = [...mockDiscussions];
      if (filters.project_id) {
        discussions = discussions.filter((d) => d.project_id === parseInt(filters.project_id));
      }
      if (filters.internal === false) {
        discussions = discussions.filter((d) => !d.internal);
      }
      return { data: discussions, error: null };
    default:
      return { data: [], error: null };
  }
};

export const fallbackApiResponse = (success: boolean, data: any = null, message: string = "") => {
  return {
    success,
    data,
    message:
      message ||
      (success ? "Fallback mode - operation simulated" : "Fallback mode - operation failed"),
    fallback: true,
    timestamp: new Date().toISOString(),
  };
};
