import { useState, useEffect } from 'react';
import { authApi } from '../api/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then(setUser)
      .catch(() => {
        authApi.logout();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
    role: user?.role ?? 'guest',
  };
}