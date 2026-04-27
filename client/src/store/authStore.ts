import { create } from "zustand";
import { AuthUser, LoginPayload } from "../types";
import { loginApi, meApi } from "../services/api/authApi";
import {
  clearStoredUser,
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken
} from "../services/api/token";
import { clearAllCachedValues } from "../utils/clientCache";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getToken(),
  user: getStoredUser<AuthUser>(),
  loading: false,
  error: null,

  initialize: async () => {
    const token = getToken();
    if (!token) {
      return;
    }

    try {
      const user = await meApi();
      set({ token, user });
      setStoredUser(user);
    } catch {
      clearToken();
      clearStoredUser();
      clearAllCachedValues();
      set({ token: null, user: null });
    }
  },

  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      clearAllCachedValues();
      const data = await loginApi(payload);
      setToken(data.token);
      setStoredUser(data.user);
      set({ token: data.token, user: data.user, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message ?? "Đăng nhập thất bại" });
      throw error;
    }
  },

  logout: () => {
    clearToken();
    clearStoredUser();
    clearAllCachedValues();
    set({ token: null, user: null });
  }
}));
