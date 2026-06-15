import { useEffect } from 'react';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { tokenStore } from '../services/api';

/**
 * On app mount: if a refresh token exists in localStorage,
 * silently fetch /auth/me to rehydrate the user session.
 * This prevents a logged-in user from seeing the login screen on refresh.
 */
export function useAuthBootstrap() {
  const { login, logout, setLoading } = useAuthStore();

  useEffect(() => {
    const rt = tokenStore.getRefresh();
    if (!rt) {
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then((res) => {
        const payload = res.data?.data ?? res.data;
        // Access token was refreshed by the interceptor already;
        // we just need the user object here.
        const at = tokenStore.getAccess() || '';
        login(payload.user ?? payload, at, rt);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
