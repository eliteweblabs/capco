// Type definitions for the application

export interface User {
  id: string;
  email: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  role: "Admin" | "Staff" | "Client";
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  author_id: string;
  title: string;
  address: string;
  status: number;
  sq_ft?: number;
  new_construction: boolean;
  created_at: string;
  updated_at: string;
}

export interface Discussion {
  id: number;
  project_id: number;
  author_id: string;
  message: string;
  internal: boolean;
  mark_completed: boolean;
  parent_id?: number;
  image_urls?: string[];
  image_paths?: string[];
  company_name?: string;
  created_at: string;
  updated_at: string;
}

export interface File {
  id: number;
  project_id: number;
  author_id: string;
  file_path: string;
  uploaded_at: string;
  status: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  count: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export type UserRole = "Admin" | "Staff" | "Client";

export interface AuthUser {
  id: string;
  email: string;
  company_name?: string;
  role: UserRole;
  profile?: User;
}
