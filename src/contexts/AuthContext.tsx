
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/workflow';
import { users } from '@/data/mockData';

type Role = 'admin' | 'employee';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    // Check localStorage on mount
    const storedRole = localStorage.getItem('demo_role') as Role;
    if (storedRole) {
      if (storedRole === 'admin') {
        // Admin: Mahesh (User 2)
        setUser({ ...users[1], isAdmin: true });
        setRole('admin');
      } else {
        // Employee: Samanthi (User 1)
        setUser({ ...users[0], isAdmin: false });
        setRole('employee');
      }
    }
  }, []);

  const login = (newRole: Role) => {
    localStorage.setItem('demo_role', newRole);
    if (newRole === 'admin') {
      setUser({ ...users[1], isAdmin: true });
    } else {
      setUser({ ...users[0], isAdmin: false });
    }
    setRole(newRole);
  };

  const logout = () => {
    localStorage.removeItem('demo_role');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
