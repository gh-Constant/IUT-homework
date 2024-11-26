export type Category = 'C2' | 'C1' | 'B2' | 'B1' | 'A2' | 'A1';
export type Subject = 'Communication' | 'SAE' | 'Anglais' | 'Informatique' | 'Management' | 'Marketing';
export type TargetType = 'global' | 'group' | 'personal';
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  pin: string;
  category: Category;
  role: UserRole;
  created_at: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  due_date: string;
  completed: boolean;
  created_by: string;
  target_type: TargetType;
  target_groups?: Category[];
  target_users?: string[];
  created_at: string;
}