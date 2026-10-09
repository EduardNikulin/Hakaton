import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, getToken, clearToken, ApiError } from '../api';
import type { CurrentUser } from '../types/api';

interface AuthContextValue {
  user: CurrentUser | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateUser: (user: CurrentUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Роль берём из ответа /auth/me; если бэкенд её не отдаёт —
  // признак админа по префиксу почты (созвучно с бэкендом, role=='admin')
    const resolveRole = (u: CurrentUser): string =>
    (u as unknown as { role?: string }).role
    ?? (u.email.startsWith('admin') ? 'admin' : 'resident');

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
        setRole(resolveRole(u));
      })
      .catch(() => {
        // Токен истёк или невалиден — чистим
        clearToken();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

    // Любой 401 из API → сбрасываем сессию (ProtectedRoute уведёт на /login)
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setRole(null);
    };
    window.addEventListener('ecocity:unauthorized', onUnauthorized);
    return () => window.removeEventListener('ecocity:unauthorized', onUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    await authApi.login(email, password);
    const me = await authApi.fetchMe();
    setUser(me);
    setRole(resolveRole(me));
  };

  const register = async (email: string, password: string) => {
    await authApi.register(email, password);
    const me = await authApi.fetchMe();
    setUser(me);
    setRole(resolveRole(me));
  };

  const updateUser = (u: CurrentUser) => {
    setUser(u);
    setRole(resolveRole(u));
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        updateUser,
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