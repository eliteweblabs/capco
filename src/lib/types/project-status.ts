export interface ProjectStatus {
  status_code: number;
  admin_status_name: string;
  project_action: string;
  client_status_name: string;
  client_status_tab: string;
  admin_status_tab: string;
  admin_status_slug: string;
  client_status_slug: string;
}

export interface ProjectStatusWithCount extends ProjectStatus {
  count: number;
  projects: any[];
}

export type ProjectStatusSlug =
  | "draft"
  | "submitted"
  | "review"
  | "approved"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "on_hold";

export interface ProjectStatusConfig {
  [key: string]: ProjectStatusWithCount;
}

export interface ProjectStatusUpdate {
  projectId: number;
  newStatusId: number;
  reason?: string;
  updatedBy: string;
}

export interface ProjectStatusHistory {
  id: number;
  project_id: number;
  old_status_id?: number;
  new_status_id: number;
  changed_by: string;
  reason?: string;
  created_at: string;
}

export const DEFAULT_PROJECT_STATUSES: Omit<ProjectStatus, "id" | "created_at" | "updated_at">[] = [
  {
    name: "Draft",
    slug: "draft",
    color: "#6B7280",
    description: "Project is being prepared",
    order: 1,
    is_active: true,
  },
  {
    name: "Submitted",
    slug: "submitted",
    color: "#3B82F6",
    description: "Project has been submitted for review",
    order: 2,
    is_active: true,
  },
  {
    name: "Under Review",
    slug: "review",
    color: "#F59E0B",
    description: "Project is being reviewed",
    order: 3,
    is_active: true,
  },
  {
    name: "Approved",
    slug: "approved",
    color: "#10B981",
    description: "Project has been approved",
    order: 4,
    is_active: true,
  },
  {
    name: "In Progress",
    slug: "in_progress",
    color: "#8B5CF6",
    description: "Project is currently being worked on",
    order: 5,
    is_active: true,
  },
  {
    name: "Completed",
    slug: "completed",
    color: "#059669",
    description: "Project has been completed",
    order: 6,
    is_active: true,
  },
  {
    name: "On Hold",
    slug: "on_hold",
    color: "#EF4444",
    description: "Project is temporarily paused",
    order: 7,
    is_active: true,
  },
  {
    name: "Cancelled",
    slug: "cancelled",
    color: "#6B7280",
    description: "Project has been cancelled",
    order: 8,
    is_active: true,
  },
];
