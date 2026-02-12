import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { SalesEnhanced } from './components/SalesEnhanced';
import { POS } from './components/POS';
import { PurchasesEnhanced } from './components/PurchasesEnhanced';
import { InventoryEnhanced } from './components/InventoryEnhanced';
import { CashBank } from './components/CashBank';
import { DebtorsCreditors } from './components/DebtorsCreditors';
import { ReportsEnhanced } from './components/ReportsEnhanced';
import { TaxCompliance } from './components/TaxCompliance';
import { SettingsEnhanced } from './components/SettingsEnhanced';
import { SalesAnalytics } from './components/SalesAnalytics';
import { UserManagement } from './components/UserManagement';
import { ProductCategories } from './components/ProductCategories';
import { DataManagement } from './components/DataManagement';
import { MicroinvestIntegration } from './components/MicroinvestIntegration';
import { TodaysProfit } from './components/TodaysProfit';
import { ContactsManagement } from './components/ContactsManagement';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Login } from './components/Login';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ShoppingBag, 
  Package, 
  Wallet, 
  Users, 
  FileText, 
  Receipt,
  BarChart3,
  Monitor,
  Settings as SettingsIcon,
  Shield,
  Tag,
  Database,
  Link,
  TrendingUp,
  BookUser
} from 'lucide-react';

export type UserRole = 'owner' | 'bookkeeper' | 'manager';

export interface User {
  name: string;
  role: UserRole;
  email: string;
}

function AccessDenied() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
        <p className="text-sm text-gray-500 mt-2">Contact your administrator for access.</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, isAuthenticated, hasPermission, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { id: 'todaysprofit', label: "Today's Profit", icon: TrendingUp, permission: 'todaysprofit.view' },
    { id: 'sales', label: 'Sales', icon: ShoppingCart, permission: 'sales.view' },
    { id: 'analytics', label: 'Sales Analytics', icon: BarChart3, permission: 'analytics.view' },
    { id: 'pos', label: 'POS', icon: Monitor, permission: 'pos.access' },
    { id: 'purchases', label: 'Purchases & Expenses', icon: ShoppingBag, permission: 'purchases.view' },
    { id: 'inventory', label: 'Inventory', icon: Package, permission: 'inventory.view' },
    { id: 'cashbank', label: 'Cash & Bank', icon: Wallet, permission: 'cashbank.view' },
    { id: 'debtors', label: 'Debtors & Creditors', icon: Users, permission: 'debtors.view' },
    { id: 'reports', label: 'Reports', icon: FileText, permission: 'reports.view' },
    { id: 'tax', label: 'Tax & Compliance', icon: Receipt, permission: 'tax.view' },
    { id: 'users', label: 'User Management', icon: Shield, permission: 'users.view' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, permission: 'settings.view' },
    { id: 'productcategories', label: 'Product Categories', icon: Tag, permission: 'productcategories.view' },
    { id: 'datamanagement', label: 'Data Management', icon: Database, permission: 'datamanagement.view' },
    { id: 'microinvestintegration', label: 'Microinvest Integration', icon: Link, permission: 'microinvestintegration.view' },
    { id: 'contactsmanagement', label: 'Contacts Management', icon: BookUser, permission: 'contactsmanagement.view' },
  ].filter(item => hasPermission(item.permission));

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return hasPermission('dashboard.view') ? <Dashboard userRole={user.role} onNavigate={setCurrentPage} /> : <AccessDenied />;
      case 'todaysprofit':
        return hasPermission('todaysprofit.view') ? <TodaysProfit /> : <AccessDenied />;
      case 'sales':
        return hasPermission('sales.view') ? <SalesEnhanced /> : <AccessDenied />;
      case 'analytics':
        return hasPermission('analytics.view') ? <SalesAnalytics /> : <AccessDenied />;
      case 'pos':
        return hasPermission('pos.access') ? <POS /> : <AccessDenied />;
      case 'purchases':
        return hasPermission('purchases.view') ? <PurchasesEnhanced /> : <AccessDenied />;
      case 'inventory':
        return hasPermission('inventory.view') ? <InventoryEnhanced /> : <AccessDenied />;
      case 'cashbank':
        return hasPermission('cashbank.view') ? <CashBank /> : <AccessDenied />;
      case 'debtors':
        return hasPermission('debtors.view') ? <DebtorsCreditors /> : <AccessDenied />;
      case 'reports':
        return hasPermission('reports.view') ? <ReportsEnhanced /> : <AccessDenied />;
      case 'tax':
        return hasPermission('tax.view') ? <TaxCompliance /> : <AccessDenied />;
      case 'users':
        return hasPermission('users.view') ? <UserManagement /> : <AccessDenied />;
      case 'settings':
        return hasPermission('settings.view') ? <SettingsEnhanced /> : <AccessDenied />;
      case 'productcategories':
        return hasPermission('productcategories.view') ? <ProductCategories /> : <AccessDenied />;
      case 'datamanagement':
        return hasPermission('datamanagement.view') ? <DataManagement /> : <AccessDenied />;
      case 'microinvestintegration':
        return hasPermission('microinvestintegration.view') ? <MicroinvestIntegration /> : <AccessDenied />;
      case 'contactsmanagement':
        return hasPermission('contactsmanagement.view') ? <ContactsManagement /> : <AccessDenied />;
      default:
        return <Dashboard userRole={user.role} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        menuItems={menuItems} 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderPage()}
        </main>
      </div>
      <OfflineIndicator />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;