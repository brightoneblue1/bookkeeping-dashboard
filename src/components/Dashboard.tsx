import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Smartphone, 
  Building2, 
  Users, 
  Package, 
  AlertCircle,
  DollarSign,
  Database
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { UserRole } from '../App';
import { useState, useEffect } from 'react';
import { getDashboardStats, seedData } from '../utils/api';

interface DashboardProps {
  userRole: UserRole;
  onNavigate?: (page: string) => void;
}

export function Dashboard({ userRole, onNavigate }: { userRole: UserRole; onNavigate?: (page: string) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedData() {
    if (!confirm('This will add sample data to your database. Continue?')) {
      return;
    }
    try {
      setSeeding(true);
      await seedData();
      alert('Sample data added successfully! Refreshing dashboard...');
      await loadStats();
    } catch (error: any) {
      alert(error.message || 'Failed to seed data');
    } finally {
      setSeeding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  // Show seed data option if no data exists
  if (!stats || stats.totalProducts === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Database className="w-16 h-16 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900">No Data Found</h2>
        <p className="text-gray-600">Get started by adding sample data or creating your own records</p>
        <button
          onClick={handleSeedData}
          disabled={seeding}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {seeding ? 'Adding Sample Data...' : 'Add Sample Data'}
        </button>
      </div>
    );
  }

  const summaryData = [
    { 
      label: 'This Month Sales', 
      value: `KES ${(stats.totalSales || 0).toLocaleString()}`, 
      change: '+8%', 
      positive: true, 
      icon: DollarSign,
      color: 'bg-blue-50 text-blue-600',
      clickable: true,
      navigateTo: 'analytics'
    },
    { 
      label: 'Stock Value', 
      value: `KES ${(stats.stockValue || 0).toLocaleString()}`, 
      change: '+5%', 
      positive: true, 
      icon: Package,
      color: 'bg-cyan-50 text-cyan-600',
      clickable: true,
      navigateTo: 'inventory'
    },
    { 
      label: 'Customer Debts', 
      value: `KES ${(stats.totalDebt || 0).toLocaleString()}`, 
      change: '-8%', 
      positive: true, 
      icon: Users,
      color: 'bg-orange-50 text-orange-600',
      clickable: true,
      navigateTo: 'debtors'
    },
    { 
      label: 'Supplier Payables', 
      value: `KES ${(stats.totalPayables || 0).toLocaleString()}`, 
      change: '+12%', 
      positive: false, 
      icon: Users,
      color: 'bg-red-50 text-red-600',
      clickable: true,
      navigateTo: 'debtors'
    },
  ];

  const salesTrend = [
    { day: 'Mon', sales: 32000 },
    { day: 'Tue', sales: 38000 },
    { day: 'Wed', sales: 35000 },
    { day: 'Thu', sales: 42000 },
    { day: 'Fri', sales: 48000 },
    { day: 'Sat', sales: 55000 },
    { day: 'Sun', sales: 38000 },
  ];

  const cashFlow = [
    { month: 'Jan', inflow: 450000, outflow: 320000 },
    { month: 'Feb', inflow: 520000, outflow: 380000 },
    { month: 'Mar', inflow: 480000, outflow: 350000 },
    { month: 'Apr', inflow: 610000, outflow: 420000 },
    { month: 'May', inflow: 580000, outflow: 390000 },
  ];

  const alerts = [
    { type: 'warning', message: '12 products are running low on stock', priority: 'high', navigateTo: 'inventory' },
    { type: 'danger', message: '5 customers have overdue payments (>30 days)', priority: 'high', navigateTo: 'debtors' },
    { type: 'info', message: 'VAT filing due in 5 days', priority: 'medium', navigateTo: 'tax' },
    { type: 'warning', message: 'Monthly stock reconciliation pending', priority: 'medium', navigateTo: 'inventory' },
  ];

  const topProducts = [
    { name: 'Sugar 2kg', sales: 45000, color: '#3b82f6' },
    { name: 'Rice 5kg', sales: 38000, color: '#10b981' },
    { name: 'Cooking Oil 1L', sales: 32000, color: '#f59e0b' },
    { name: 'Wheat Flour 2kg', sales: 28000, color: '#8b5cf6' },
    { name: 'Maize Flour 2kg', sales: 25000, color: '#ec4899' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your business summary.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryData.map((item, index) => {
          const Icon = item.icon;
          return (
            <div 
              key={index} 
              onClick={() => item.clickable && onNavigate?.(item.navigateTo)}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all ${
                item.clickable 
                  ? 'cursor-pointer hover:shadow-md hover:border-blue-300 hover:scale-105' 
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {item.positive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${item.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change}
                </span>
                <span className="text-sm text-gray-500">vs last period</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div 
          onClick={() => onNavigate?.('analytics')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number) => `KES ${value.toLocaleString()}`}
              />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cash Flow */}
        <div 
          onClick={() => onNavigate?.('cashbank')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow (Monthly)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cashFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number) => `KES ${value.toLocaleString()}`}
              />
              <Bar dataKey="inflow" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflow" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Inflow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Outflow</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Alerts & Reminders</h2>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'danger'
                    ? 'bg-red-50 border-red-500'
                    : alert.type === 'warning'
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm text-gray-900">{alert.message}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      alert.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {alert.priority}
                  </span>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => onNavigate?.(alert.navigateTo)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div 
          onClick={() => onNavigate?.('analytics')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h2>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${product.color}20` }}>
                    <Package className="w-4 h-4" style={{ color: product.color }} />
                  </div>
                  <span className="text-sm text-gray-900">{product.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  KES {product.sales.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats - Only for Owner */}
      {userRole === 'owner' && (
        <div 
          onClick={() => onNavigate?.('reports')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white cursor-pointer hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          <h2 className="text-lg font-semibold mb-4">Monthly Performance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-blue-100 text-sm mb-1">Net Profit</p>
              <p className="text-3xl font-bold">KES 345,200</p>
              <p className="text-blue-100 text-sm mt-1">Margin: 28%</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold">KES 1,234,500</p>
              <p className="text-blue-100 text-sm mt-1">Target: 85% achieved</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Expenses</p>
              <p className="text-3xl font-bold">KES 889,300</p>
              <p className="text-blue-100 text-sm mt-1">Budget: Within limit</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}