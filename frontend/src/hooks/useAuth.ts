import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import api from '../lib/api';

export function useAuth() {
  const { token, user, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post('/auth/token/', { email, password });
      const userRes = await api.get('/auth/me/', {
        headers: { Authorization: `Bearer ${data.access}` },
      });
      setAuth(data.access, data.refresh, userRes.data);
      navigate('/admin');
    },
    [setAuth, navigate]
  );

  const logout = useCallback(() => {
    clearAuth();
    navigate('/admin/login');
  }, [clearAuth, navigate]);

  const isAuthenticated = !!token;

  return { user, isAuthenticated, login, logout };
}
