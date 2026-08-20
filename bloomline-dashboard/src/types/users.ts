// src/types/users.ts — dashboard users (Settings → Add people, §4.10).
export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface AddUserInput {
  name: string;
  email: string;
  role: string;
}
