// Type definitions for the application

export interface User {
  id: string;
  email: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  role: "Admin" | "Staff" | "Client";
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  authorId: string;
  title: string;
  address: string;
  status: number;
  sqFt?: number;
  newConstruction: boolean;
  createdAt: string;
  updatedAt: string;
  authorProfile?: {
    id: string;
    companyName: string;
    firstName: string;
    lastName: string;
  } | null;
  assignedToProfile?: {
    id: string;
    companyName: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface Discussion {
  id: number;
  projectId: number;
  authorId: string;
  message: string;
  internal: boolean;
  markCompleted: boolean;
  parentId?: number;
  imageUrls?: string[];
  imagePaths?: string[];
  companyName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface File {
  id: number;
  projectId: number;
  authorId: string;
  filePath: string;
  uploadedAt: string;
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
  companyName?: string;
  role: UserRole;
  profile?: User;
}
