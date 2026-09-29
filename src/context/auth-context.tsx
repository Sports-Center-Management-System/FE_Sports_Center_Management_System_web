import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthUser, LoginPayload, RegisterPayload } from "@/features/auth/types/auth.types";
import { loginApi, registerApi, logoutApi } from "@/features/auth/services/auth-api.service";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("access_token");
      const storedUser = localStorage.getItem("auth_user");

      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn("Failed to parse stored user profile", err);
      localStorage.removeItem("auth_user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (payload: LoginPayload): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const data = await loginApi(payload);
      const authUser = data.user;

      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);
      localStorage.setItem("auth_user", JSON.stringify(authUser));

      setUser(authUser);
      return authUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const data = await registerApi(payload);
      const authUser = data.user;

      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);
      localStorage.setItem("auth_user", JSON.stringify(authUser));

      setUser(authUser);
      return authUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await logoutApi();
    } catch (error) {
      console.warn("Logout API warning:", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("auth_user");
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
