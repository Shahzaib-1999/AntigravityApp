import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { App as CapacitorApp } from '@capacitor/app';
import { useEffect } from 'react';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    CapacitorApp.addListener('appUrlOpen', async (data) => {
      console.log('App opened with URL:', data.url);

      const url = new URL(data.url);

      // Handle PKCE flow (code in search params)
      const code = url.searchParams.get('code');
      if (code) {
        const { supabase } = await import('@/api/supabaseClient');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          window.location.href = '/Home';
          return;
        }
      }

      // Handle Implicit flow (tokens in hash)
      const hash = url.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { supabase } = await import('@/api/supabaseClient');
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error) {
          window.location.href = '/Home';
        }
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Pages />
      <Toaster />
    </QueryClientProvider>
  )
}

export default App 