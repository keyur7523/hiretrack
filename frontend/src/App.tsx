import { useEffect } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { setGlobalLogoutHandler, setGlobalUnauthorizedHandler } from '@/api/client';
import { AppRouter } from '@/routes/router';

const queryClient = new QueryClient();

function AuthInitializer() {
  const navigate = useNavigate();
  const setNavigate = useAuthStore((state) => state.setNavigate);
  const initAuth = useAuthStore((state) => state.initAuth);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);

  useEffect(() => {
    setGlobalLogoutHandler(logout);
    setGlobalUnauthorizedHandler(() => navigate('/app/unauthorized'));
  }, [logout, navigate]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthInitializer />
      <AppRouter />
      <Toaster position="bottom-right" richColors closeButton />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
