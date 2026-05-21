import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import api from '../lib/api';

export function useAuth() {
  const { token, user, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      const { data } = await api.post('/auth/token/', {
        username: usernameOrEmail,
        password,
      });

      const userData = data.user || null;
      if (userData) {
        setAuth(data.access, data.refresh, {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          role: userData.role,
        });
      } else {
        const userRes = await api.get('/auth/me/', {
          headers: { Authorization: `Bearer ${data.access}` },
        });
        setAuth(data.access, data.refresh, {
          id: userRes.data.id,
          username: userRes.data.username,
          email: userRes.data.email,
          firstName: userRes.data.first_name,
          lastName: userRes.data.last_name,
          role: userRes.data.role,
        });
      }
      navigate('/admin');
    },
    [setAuth, navigate]
  );

  const logout = useCallback(() => {
    clearAuth();
    navigate('/admin/login');
  }, [clearAuth, navigate]);

  const isAuthenticated = !!token;
  const isSuperAdmin = user?.role === 'super_admin';

  return { user, isAuthenticated, isSuperAdmin, login, logout };
}
