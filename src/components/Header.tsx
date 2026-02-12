import { Bell, Search, User, LogOut, ChevronDown } from 'lucide-react';
import { User as UserType } from '../App';
import { useAuth } from './AuthContext';
import { useState } from 'react';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  user: UserType;
}

export function Header({ user }: HeaderProps) {
  const { logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const getRoleBadge = (role: string) => {
    const badges = {
      owner: { label: 'Owner', color: 'bg-purple-100 text-purple-700' },
      bookkeeper: { label: 'Bookkeeper', color: 'bg-green-100 text-green-700' },
      manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700' },
      sales_agent: { label: 'Sales Agent', color: 'bg-orange-100 text-orange-700' },
    };
    return badges[role as keyof typeof badges] || badges.manager;
  };

  const badge = getRoleBadge(user.role);

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-xl ml-12 md:ml-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search transactions, products, customers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 ml-4">
          <NotificationCenter />
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 relative">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 w-10 h-10 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
            >
              <User className="w-5 h-5 text-blue-700 mx-auto" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}