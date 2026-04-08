export type Role = "user" | "admin";

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  fullName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export type PostType = "lost" | "found";
export type PostStatus = "searching" | "found" | "returned";
export type ModerationStatus = "pending" | "approved" | "rejected";
