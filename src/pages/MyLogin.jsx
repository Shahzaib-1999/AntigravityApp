import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { useLanguage } from "../components/LanguageContext";
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";

export default function MyLogin() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      toast.success("Logged in successfully!");
      navigate(createPageUrl("Home"));
    } catch (error) {
      toast.error(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('welcomeBack')}</h1>
          <p className="text-gray-600">{t('loginToAccount')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('enterEmail')}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('enterPassword')}
              required
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {loading ? "Logging in..." : t('login')}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              try {
                const { Capacitor } = await import('@capacitor/core');
                const platform = Capacitor.getPlatform();
                const isNative = platform !== 'web';
                console.log('[GoogleSignIn] platform:', platform, 'isNative:', isNative);

                if (isNative) {
                  const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

                  // Ensure native client is initialized (uses values from capacitor.config.ts)
                  try {
                    await GoogleAuth.initialize();
                    console.log('[GoogleSignIn] GoogleAuth.initialize() completed');
                  } catch (initErr) {
                    console.warn('[GoogleSignIn] GoogleAuth.initialize() failed', initErr);
                  }

                  // Native Google Sign-In (shows native account picker)
                  console.log('[GoogleSignIn] calling GoogleAuth.signIn()');
                  const user = await GoogleAuth.signIn();
                  console.log('[GoogleSignIn] signIn() returned:', user);

                  // Extract idToken (for Supabase signInWithIdToken)
                  const idToken = user?.authentication?.idToken || user?.idToken;

                  if (!idToken) {
                    console.error('[GoogleSignIn] No idToken returned. user:', user);
                    toast.error('Native Google sign-in returned no ID token. Check GoogleAuth configuration and OAuth client.');
                    return;
                  }

                  const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: idToken,
                  });
                  if (error) throw error;

                  toast.success('Logged in with Google');
                  navigate(createPageUrl('Home'));
                } else {
                  // Web OAuth flow when running in browser
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: window.location.origin,
                      queryParams: {
                        prompt: 'select_account',
                      },
                    },
                  });
                  if (error) throw error;
                }
              } catch (error) {
                console.error('[GoogleSignIn] error:', error);
                toast.error(error.message || "Failed to login with Google");
              }
            }}
            className="w-full"
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
            </svg>
            Google
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t('dontHaveAccount')}{" "}
            <Link
              to={createPageUrl("MySignup")}
              className="text-orange-500 hover:text-orange-600 font-semibold"
            >
              {t('signUp')}
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
