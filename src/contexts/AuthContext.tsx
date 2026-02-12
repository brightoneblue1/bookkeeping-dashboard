import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'owner' | 'bookkeeper' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'inactive';
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    try {
      // Get users from localStorage
      const storedUsers = localStorage.getItem('system_users');
      if (!storedUsers) {
        // Create default owner if no users exist
        const defaultOwner = {
          id: 'USER-001',
          name: 'John Kamau',
          email: 'admin@store.co.ke',
          phone: '0712345678',
          role: 'owner' as UserRole,
          status: 'active' as const,
          permissions: [
            'dashboard.view',
            'todaysprofit.view',
            'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
            'pos.access',
            'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete',
            'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
            'cashbank.view', 'cashbank.create', 'cashbank.edit', 'cashbank.delete',
            'debtors.view', 'debtors.edit',
            'reports.view', 'reports.generate',
            'tax.view', 'tax.file',
            'settings.view', 'settings.edit',
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'analytics.view',
            'productcategories.view',
            'datamanagement.view',
            'microinvestintegration.view'
          ]
        };
        localStorage.setItem('system_users', JSON.stringify([defaultOwner]));
        
        // Check if logging in as default owner
        if (email === 'admin@store.co.ke' && password === 'admin123') {
          setUser(defaultOwner);
          setIsAuthenticated(true);
          localStorage.setItem('current_user', JSON.stringify(defaultOwner));
          return true;
        }
        return false;
      }

      const users = JSON.parse(storedUsers);
      
      // Simple authentication (in production, use proper hashing)
      // For demo: password is 'password123' for all users, or 'admin123' for default admin
      const foundUser = users.find((u: any) => 
        u.email === email && 
        u.status === 'active'
      );

      if (foundUser && (password === 'password123' || password === 'admin123')) {
        const userSession = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          phone: foundUser.phone,
          role: foundUser.role,
          status: foundUser.status,
          permissions: foundUser.permissions
        };
        
        setUser(userSession);
        setIsAuthenticated(true);
        localStorage.setItem('current_user', JSON.stringify(userSession));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  function logout() {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('current_user');
  }

  function hasPermission(permission: string): boolean {
    if (!user) return false;
    return user.permissions.includes(permission);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, isAuthenticated }}>
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