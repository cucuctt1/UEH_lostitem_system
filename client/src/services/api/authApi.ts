import { ApiEnvelope, AuthUser, LoginPayload } from "../../types";
import { apiClient } from "./client";

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<ApiEnvelope<AuthResponse>>("/auth/login", payload);
  return data.data;
}

export async function meApi(): Promise<AuthUser> {
  const { data } = await apiClient.get<ApiEnvelope<AuthUser>>("/users/me");
  return data.data;
}

export async function changeMyPasswordApi(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.patch("/users/me/password", payload);
}
