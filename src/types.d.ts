/// <reference types="react" />

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
} 

export type Category = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Subject = 'Communication' | 'SAE' | 'Anglais' | 'Informatique' | 'Management' | 'Marketing';
export type TargetType = 'global' | 'personal' | 'group';
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  category: Category;
  created_at: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  due_date: string;
  created_by: string;
  target_type: TargetType;
  target_groups?: Category[];
  target_users?: string[];
  is_archived?: boolean;
  links?: { url: string; title: string; }[];
}

export interface CompletionStats {
  completed: number;
  total: number;
} 