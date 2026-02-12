import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'owner' | 'bookkeeper' | 'manager' | 'sales_agent';

export interface User {
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const rolePermissions: Record<UserRole, string[]> = {
  owner: [
    'dashboard.view',
    'todaysprofit.view',
    'sales.view',
    'sales.create',
    'sales.edit',
    'sales.delete',
    'analytics.view',
    'pos.access',
    'purchases.view',
    'purchases.create',
    'purchases.edit',
    'purchases.delete',
    'inventory.view',
    'inventory.edit',
    'cashbank.view',
    'cashbank.edit',
    'debtors.view',
    'debtors.edit',
    'reports.view',
    'tax.view',
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'settings.view',
    'settings.edit',
    'productcategories.view',
    'productcategories.edit',
    'datamanagement.view',
    'microinvestintegration.view',
    'contactsmanagement.view',
    'contactsmanagement.edit'
  ],
  bookkeeper: [
    'dashboard.view',
    'todaysprofit.view',
    'sales.view',
    'purchases.view',
    'purchases.create',
    'inventory.view',
    'cashbank.view',
    'cashbank.edit',
    'debtors.view',
    'reports.view',
    'tax.view',
    'settings.view',
    'contactsmanagement.view'
  ],
  manager: [
    'dashboard.view',
    'todaysprofit.view',
    'sales.view',
    'sales.create',
    'sales.edit',
    'analytics.view',
    'pos.access',
    'purchases.view',
    'purchases.create',
    'inventory.view',
    'inventory.edit',
    'cashbank.view',
    'debtors.view',
    'reports.view',
    'settings.view',
    'productcategories.view',
    'contactsmanagement.view',
    'contactsmanagement.edit'
  ],
  sales_agent: [
    'dashboard.view',
    'sales.view',
    'sales.create',
    'pos.access',
    'inventory.view',
    'contactsmanagement.view'
  ]
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Get users from localStorage
    const storedUsers = localStorage.getItem('users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];

    // Find user by email and password
    const foundUser = users.find(
      (u: any) => u.email === email && u.password === password && u.isActive
    );

    if (foundUser) {
      const userData: User = {
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // Log activity
      const activityLog = JSON.parse(localStorage.getItem('activity_log') || '[]');
      activityLog.push({
        id: `ACT-${Date.now()}`,
        type: 'login',
        user: foundUser.name,
        description: 'User logged in',
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('activity_log', JSON.stringify(activityLog));
      
      return true;
    }

    return false;
  };

  const logout = () => {
    // Log activity
    if (user) {
      const activityLog = JSON.parse(localStorage.getItem('activity_log') || '[]');
      activityLog.push({
        id: `ACT-${Date.now()}`,
        type: 'logout',
        user: user.name,
        description: 'User logged out',
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('activity_log', JSON.stringify(activityLog));
    }

    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return rolePermissions[user.role]?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, hasPermission }}>
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
