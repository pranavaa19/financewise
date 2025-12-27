"use client";

import React, { createContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

const AUTH_ROUTES = ['/login', '/signup'];
const PUBLIC_ROUTES = ['/'];

const AppLoader = () => (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-1/2" />
      </div>
    </div>
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (loading) return;

    const isAuthRoute = AUTH_ROUTES.includes(pathname);
    const isPublicRoute = pathname === '/' || PUBLIC_ROUTES.some(route => pathname.startsWith(route) && route !== '/');

    if (!user && !isAuthRoute && !isPublicRoute) {
      router.push('/login');
    } else if (user && isAuthRoute) {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);

  const isHandledRoute = (AUTH_ROUTES.includes(pathname) || PUBLIC_ROUTES.includes(pathname));
  if (loading && !isHandledRoute) {
    return <AppLoader />;
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
