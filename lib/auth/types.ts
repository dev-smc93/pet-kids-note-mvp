import type { User } from "@supabase/supabase-js";

export type Role = "ADMIN" | "GUARDIAN";

export interface Profile {
  id: string;
  userId: string;
  role: Role;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isProfileLoading: boolean;
}
