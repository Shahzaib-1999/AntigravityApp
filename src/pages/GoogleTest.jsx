import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function GoogleTest() {
  const [result, setResult] = useState(null);
  const runTest = async () => {
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      console.log('[GoogleTest] calling GoogleAuth.signIn()');
      const user = await GoogleAuth.signIn();
      console.log('[GoogleTest] returned:', user);
      setResult(user);
      toast.success('GoogleAuth.signIn() returned - check logs and UI');
    } catch (err) {
      console.error('[GoogleTest] error:', err);
      toast.error(err.message || 'Google sign-in failed');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4">Google Native Sign-In Test</h2>
      <p className="mb-4">This test calls the native plugin and prints the returned object below.</p>
      <Button onClick={runTest} className="mb-4">Run native Google sign-in</Button>
      <pre className="text-xs bg-gray-50 p-4 rounded border overflow-auto" style={{maxHeight: 300}}>{result ? JSON.stringify(result, null, 2) : 'No result yet'}</pre>
    </div>
  );
}
