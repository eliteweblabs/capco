/**
 * Database interface definitions
 */

export interface Subject {
  id: number;
  title: string;
  usageCount: number;
  description?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  title: string;
  address: string;
  status: number;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  profile?: {
    name: string;
    role: string;
    phone?: string;
  };
}

export interface File {
  id: number;
  projectId: number;
  authorId: string;
  filePath: string;
  uploadedAt: string;
  status: string;
}

export interface Discussion {
  id: number;
  projectId: number;
  authorId: string;
  message: string;
  is_client_visible: boolean;
  createdAt: string;
  updatedAt: string;
  is_completed: boolean;
  companyName?: string;
}
