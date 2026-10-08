import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, getToken, clearToken, ApiError } from '../api';
import type { CurrentUser } from '../types/api';

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Восстанавливаем сессию из localStorage при старте
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    authApi
      .fetchMe()
      .then((u) => {
        setUser(u);
      })
      .catch(() => {
        // Токен истёк или невалиден — чистим
        clearToken();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    await authApi.login(email, password);
    const me = await authApi.fetchMe();
    setUser(me);
  };

  const register = async (email: string, password: string) => {
    await authApi.register(email, password);
    const me = await authApi.fetchMe();
    setUser(me);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
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
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}