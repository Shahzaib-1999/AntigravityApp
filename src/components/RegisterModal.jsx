import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export default function RegisterModal({ open, onOpenChange }) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
        },
      });

      if (error) throw error;

      toast.success("Account created! Please check your email to complete registration.");
      onOpenChange(false);
      setFormData({ full_name: "", email: "", password: "" });
    } catch (error) {
      toast.error(error.message || "Failed to create account");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Join Usta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="full_name"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password"
                className="pl-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 h-11 text-base font-semibold"
          >
            {loading ? "Creating Account..." : "Create Account"}
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
                console.log('[Register] platform:', platform, 'isNative:', isNative);

                if (isNative) {
                  // Native flow: use the capacitor-google-auth plugin
                  const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

                  try {
                    await GoogleAuth.initialize();
                    console.log('[Register] GoogleAuth.initialize() completed');
                  } catch (initErr) {
                    console.warn('[Register] GoogleAuth.initialize() failed', initErr);
                  }

                  console.log('[Register] native Google sign-in: calling GoogleAuth.signIn()');
                  const user = await GoogleAuth.signIn();
                  console.log('[Register] GoogleAuth returned:', user);

                  // Extract idToken (plugin may return it in a couple of shapes)
                  const idToken = user?.authentication?.idToken || user?.idToken;
                  if (!idToken) throw new Error('No id token returned from native Google sign-in');

                  // Exchange id token with Supabase for a session
                  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
                  if (error) throw error;

                  toast.success('Signed in with Google (native)');
                  onOpenChange(false);
                } else {
                  // Web fallback: existing OAuth redirect flow
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: window.location.origin,
                    },
                  });
                  if (error) throw error;
                }
              } catch (error) {
                console.error('[Register] Google sign-in error', error);
                toast.error(error.message || "Failed to sign up with Google");
              }
            }}
            className="w-full h-11"
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
      </DialogContent>
    </Dialog>
  );
}
