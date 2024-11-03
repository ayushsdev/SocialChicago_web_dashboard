'use client';

import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { user, signOut } = useAuth();

  if (!user) {
    return <Login />;
  }

  return <Dashboard user={user} signOut={signOut} />;
}
