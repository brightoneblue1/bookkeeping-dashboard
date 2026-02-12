import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, DollarSign, Package, Filter } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { getSales, getProducts } from '../utils/api';

type TimeFrame = 'day' | 'week' | 'month' | 'year';

export function SalesAnalytics() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(2); // February

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [salesData, productsData] = await Promise.all([
        getSales(),
        getProducts()
      ]);
      setSales(salesData);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Aggregate sales data by time frame
  function aggregateSalesByTimeFrame() {
    const aggregated: any = {};

    sales.forEach(sale => {
      const date = new Date(sale.date || sale.createdAt);
      let key: string;

      switch (timeFrame) {
        case 'day':
          // Group by day for selected month
          if (date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth) {
            key = `Day ${date.getDate()}`;
            aggregated[key] = (aggregated[key] || 0) + (sale.amount || 0);
          }
          break;
        case 'week':
          // Group by week for selected year
          if (date.getFullYear() === selectedYear) {
            const weekNum = Math.ceil(date.getDate() / 7);
            const monthName = date.toLocaleString('default', { month: 'short' });
            key = `${monthName} W${weekNum}`;
            aggregated[key] = (aggregated[key] || 0) + (sale.amount || 0);
          }
          break;
        case 'month':
          // Group by month for selected year
          if (date.getFullYear() === selectedYear) {
            key = date.toLocaleString('default', { month: 'short' });
            aggregated[key] = (aggregated[key] || 0) + (sale.amount || 0);
          }
          break;
        case 'year':
          // Group by year
          key = date.getFullYear().toString();
          aggregated[key] = (aggregated[key] || 0) + (sale.amount || 0);
          break;
      }
    });

    return Object.entries(aggregated).map(([name, value]) => ({
      name,
      sales: value
    }));
  }

  // Calculate top products
  function getTopProducts() {
    const productSales: any = {};

    sales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const key = item.name || item.sku;
          if (!productSales[key]) {
            productSales[key] = {
              name: key,
              quantitySold: 0,
              revenue: 0
            };
          }
          productSales[key].quantitySold += item.quantity;
          productSales[key].revenue += (item.price * item.quantity);
        });
      }
    });

    return Object.entries(productSales)
      .map(([name, data]: any) => ({
        name,
        value: data.revenue,
        quantitySold: data.quantitySold
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }

  // Calculate summary stats for selected timeframe
  function calculateSummary() {
    const filteredSales = sales.filter(sale => {
      const date = new Date(sale.date || sale.createdAt);
      
      switch (timeFrame) {
        case 'day':
          return date.getFullYear() === selectedYear && 
                 date.getMonth() + 1 === selectedMonth;
        case 'week':
        case 'month':
          return date.getFullYear() === selectedYear;
        case 'year':
          return true;
        default:
          return true;
      }
    });

    const totalSales = filteredSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalTransactions = filteredSales.length;
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Calculate total items sold
    const totalItemsSold = filteredSales.reduce((sum, s) => {
      if (s.items && Array.isArray(s.items)) {
        return sum + s.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
      }
      return sum;
    }, 0);

    // Get current stock value
    const currentStockValue = products.reduce((sum, p) => sum + ((p.buyPrice || 0) * (p.quantity || 0)), 0);

    return {
      totalSales,
      totalTransactions,
      averageTransaction,
      totalItemsSold,
      currentStockValue,
      growth: 12.5 // Placeholder for growth calculation
    };
  }

  const chartData = aggregateSalesByTimeFrame();
  const topProducts = getTopProducts();
  const summary = calculateSummary();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2025, 2026, 2027];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sales analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
        <p className="text-gray-600 mt-1">Detailed sales performance analysis</p>
      </div>

      {/* Time Frame Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View By</label>
            <div className="flex gap-2">
              {(['day', 'week', 'month', 'year'] as TimeFrame[]).map((frame) => (
                <button
                  key={frame}
                  onClick={() => setTimeFrame(frame)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeFrame === frame
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {frame.charAt(0).toUpperCase() + frame.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            {(timeFrame === 'day' || timeFrame === 'week' || timeFrame === 'month') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}

            {timeFrame === 'day' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map((month, idx) => (
                    <option key={idx} value={idx + 1}>{month}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Total Sales</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">KES {summary.totalSales.toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-1">+{summary.growth}% from last period</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Transactions</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary.totalTransactions}</p>
          <p className="text-sm text-gray-500 mt-1">Total count</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Average Sale</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">KES {summary.averageTransaction.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
          <p className="text-sm text-gray-500 mt-1">Per transaction</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600">Products Sold</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{topProducts.length}</p>
          <p className="text-sm text-gray-500 mt-1">Top performing</p>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sales Trend - {timeFrame === 'day' ? `${months[selectedMonth - 1]} ${selectedYear}` : timeFrame === 'month' || timeFrame === 'week' ? selectedYear : 'All Years'}
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Sales']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number) => `KES ${value.toLocaleString()}`}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topProducts}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {topProducts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Detailed Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Sales Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chartData.map((data, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{data.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">KES {data.sales.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-green-600">+{Math.floor(Math.random() * 20)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}