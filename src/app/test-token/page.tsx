'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

export default function TestTokenPage() {
  const { token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    console.log('=== TOKEN DEBUG ===');
    console.log('Store token:', token);
    console.log('LocalStorage token:', storedToken);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('==================');
  }, [token, isAuthenticated]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Token Debug</h1>
      <div className="space-y-2">
        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>Token in Store:</strong> {token ? 'Yes' : 'No'}</p>
        <p><strong>Token:</strong> {token?.substring(0, 50)}...</p>
      </div>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p className="text-sm">Check browser console for full debug output</p>
      </div>
    </div>
  );
}
