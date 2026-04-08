import { ApiEnvelope, AuthUser, LoginPayload, RegisterPayload } from "../../types";
import { apiClient } from "./client";

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<ApiEnvelope<AuthResponse>>("/auth/login", payload);
  return data.data;
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<ApiEnvelope<AuthResponse>>("/auth/register", payload);
  return data.data;
}

export async function meApi(): Promise<AuthUser> {
  const { data } = await apiClient.get<ApiEnvelope<AuthUser>>("/users/me");
  return data.data;
}
