/**
 * Database interface definitions
 */

export interface Subject {
  id: number;
  title: string;
  usage_count: number;
  description?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  title: string;
  address: string;
  status: number;
  author_id: string;
  created_at: string;
  updated_at: string;
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
  project_id: number;
  author_id: string;
  file_path: string;
  uploaded_at: string;
  status: string;
}

export interface Discussion {
  id: number;
  project_id: number;
  author_id: string;
  message: string;
  is_client_visible: boolean;
  created_at: string;
  updated_at: string;
  is_completed: boolean;
  company_name?: string;
}
