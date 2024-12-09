export type Subject = string;
export type Category = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type TargetType = 'global' | 'personal' | 'group';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  category: Category;
  created_at: string;
}