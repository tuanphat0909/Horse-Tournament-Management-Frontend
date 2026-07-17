/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { logout } from '../api/authService';

interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  authReady: boolean;
  setUser: (u: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://hrms-backend-a4dwfmgmgfagf7ax.southeastasia-01.azurewebsites.net/api';

// Raw fetch — bypass api.js interceptor so we can handle 401 cleanly here.
async function validateTokenWithServer(token: string): Promise<{ role: string | null; status: string | null }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${BASE_URL}/auth-test/authenticated`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { role: null, status: null };
    const data = await res.json();
    const role = data?.role ?? null;
    const status = data?.status ?? null;
    return {
      role: role && role !== 'None' ? role : null,
      status: status
    };
  } catch {
    return { role: null, status: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  // Ensures validation runs exactly once per app lifecycle — even in StrictMode.
  const validated = useRef(false);

  function setUser(u: AuthUser | null) {
    setUserState(u);
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  useEffect(() => {
    if (validated.current) return;
    validated.current = true;

    const token = localStorage.getItem('token');
    if (!token) {
      setAuthReady(true);
      return;
    }

    validateTokenWithServer(token).then(result => {
      const serverRole = result.role;
      const serverStatus = result.status;
      if (!serverRole) {
        // Token expired or invalid — clear everything
        logout();
        setUserState(null);
      } else {
        // Token valid. Use server role (cannot be spoofed) + stored display info.
        try {
          const stored = JSON.parse(localStorage.getItem('user') || 'null');
          const verified: AuthUser = {
            id: stored?.id ?? 0,
            fullName: stored?.fullName ?? '',
            email: stored?.email ?? '',
            role: serverRole,
            status: serverStatus || stored?.status || 'Active',
          };
          localStorage.setItem('user', JSON.stringify(verified));
          setUserState(verified);
        } catch {
          setUserState({ id: 0, fullName: '', email: '', role: serverRole, status: serverStatus || 'Active' });
        }
      }
    }).finally(() => {
      setAuthReady(true);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, authReady, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
