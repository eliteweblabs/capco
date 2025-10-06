// export interface ProjectStatus {
//   statusCode: number;
//   adminStatusName: string;
//   project_action: string;
//   clientStatusName: string;
//   client_status_tab: string;
//   admin_status_tab: string;
//   admin_status_slug: string;
//   client_status_slug: string;
//   admin_project_action: string;
//   client_project_action: string;
// }

// export interface ProjectStatusWithCount extends ProjectStatus {
//   count: number;
//   projects: any[];
// }

// export type ProjectStatusSlug =
//   | "draft"
//   | "submitted"
//   | "review"
//   | "approved"
//   | "in_progress"
//   | "completed"
//   | "cancelled"
//   | "on_hold";

// export interface ProjectStatusConfig {
//   [key: string]: ProjectStatusWithCount;
// }

// export interface ProjectStatusUpdate {
//   projectId: number;
//   newStatusId: number;
//   reason?: string;
//   updatedBy: string;
// }

// export interface ProjectStatusHistory {
//   id: number;
//   projectId: number;
//   old_status_id?: number;
//   new_status_id: number;
//   changed_by: string;
//   reason?: string;
//   createdAt: string;
// }

// export const DEFAULT_PROJECT_STATUSES: Omit<ProjectStatus, "id" | "createdAt" | "updatedAt">[] = [
//   {
//     name: "Draft",
//     slug: "draft",
//     color: "#6B7280",
//     description: "Project is being prepared",
//     order: 1,
//     isActive: true,
//   },
//   {
//     name: "Submitted",
//     slug: "submitted",
//     color: "#3B82F6",
//     description: "Project has been submitted for review",
//     order: 2,
//     isActive: true,
//   },
//   {
//     name: "Under Review",
//     slug: "review",
//     color: "#F59E0B",
//     description: "Project is being reviewed",
//     order: 3,
//     isActive: true,
//   },
//   {
//     name: "Approved",
//     slug: "approved",
//     color: "#10B981",
//     description: "Project has been approved",
//     order: 4,
//     isActive: true,
//   },
//   {
//     name: "In Progress",
//     slug: "in_progress",
//     color: "#8B5CF6",
//     description: "Project is currently being worked on",
//     order: 5,
//     isActive: true,
//   },
//   {
//     name: "Completed",
//     slug: "completed",
//     color: "#059669",
//     description: "Project has been completed",
//     order: 6,
//     isActive: true,
//   },
//   {
//     name: "On Hold",
//     slug: "on_hold",
//     color: "#EF4444",
//     description: "Project is temporarily paused",
//     order: 7,
//     isActive: true,
//   },
//   {
//     name: "Cancelled",
//     slug: "cancelled",
//     color: "#6B7280",
//     description: "Project has been cancelled",
//     order: 8,
//     isActive: true,
//   },
// ];
