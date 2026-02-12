import { useState, useEffect } from 'react';
import { Plus, Upload, Eye, PieChart as PieChartIcon, Download, Filter, X, Edit2, FileText, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getPurchases, createPurchase, updatePurchase, deletePurchase } from '../utils/api';

export function Purchases() {
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedExpense, setEditedExpense] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('summary');

  const [formData, setFormData] = useState({
    category: '',
    supplier: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'Paid',
    paymentMethod: 'cash',
    reference: ''
  });

  const categories = [
    'Stock Purchases',
    'Transport & Fuel',
    'Rent',
    'Electricity & Water',
    'Salaries & Wages',
    'Marketing & Advertising',
    'Repairs & Maintenance',
    'Office Supplies',
    'Insurance',
    'Miscellaneous'
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getPurchases();
      setPurchases(data);
    } catch (error) {
      console.error('Failed to load purchases:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateExpense() {
    if (!formData.category || !formData.supplier || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createPurchase({
        ...formData,
        amount: parseFloat(formData.amount),
        type: 'expense'
      });

      setFormData({
        category: '',
        supplier: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        status: 'Paid',
        paymentMethod: 'cash',
        reference: ''
      });
      setShowNewExpense(false);
      await loadData();
      alert('Expense recorded successfully!');
    } catch (error) {
      console.error('Failed to create expense:', error);
      alert('Failed to record expense. Please try again.');
    }
  }

  function handleEditExpense() {
    setIsEditMode(true);
    setEditedExpense({ ...selectedExpense });
  }

  function handleCancelEdit() {
    setIsEditMode(false);
    setEditedExpense(null);
  }

  async function handleSaveExpense() {
    if (!editedExpense) return;

    try {
      await updatePurchase(editedExpense.id, editedExpense);
      
      const updatedPurchases = purchases.map(p => 
        p.id === editedExpense.id ? editedExpense : p
      );
      setPurchases(updatedPurchases);

      setIsEditMode(false);
      setShowExpenseDetails(false);
      setEditedExpense(null);
      alert('Expense updated successfully!');
    } catch (error) {
      console.error('Failed to update expense:', error);
      alert('Failed to update expense. Please try again.');
    }
  }

  async function handleDeleteExpense() {
    if (!selectedExpense) return;
    
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await deletePurchase(selectedExpense.id);
      setPurchases(purchases.filter(p => p.id !== selectedExpense.id));
      setShowExpenseDetails(false);
      alert('Expense deleted successfully!');
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  }

  function handleExportExpenses() {
    try {
      const headers = ['ID', 'Date', 'Category', 'Supplier', 'Amount', 'Status', 'Payment Method', 'Description'];
      const csvRows = [headers.join(',')];

      const filteredExpenses = purchases.filter(exp => {
        const matchCategory = filterCategory === 'all' || exp.category === filterCategory;
        const matchStatus = filterStatus === 'all' || exp.status === filterStatus;
        return matchCategory && matchStatus;
      });

      filteredExpenses.forEach(exp => {
        const row = [
          exp.id,
          exp.date,
          `"${exp.category}"`,
          `"${exp.supplier}"`,
          exp.amount || 0,
          exp.status,
          exp.paymentMethod || 'cash',
          `"${exp.description || ''}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Expenses data exported successfully!');
    } catch (error) {
      console.error('Failed to export expenses:', error);
      alert('Failed to export expenses data.');
    }
  }

  // Calculate statistics
  const totalExpenses = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayments = purchases.filter(p => p.status === 'Pending').reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingCount = purchases.filter(p => p.status === 'Pending').length;

  // Category breakdown
  const categoryBreakdown = categories.map(cat => ({
    name: cat,
    value: purchases.filter(p => p.category === cat).reduce((sum, p) => sum + (p.amount || 0), 0),
    color: [
      '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
      '#ec4899', '#6b7280', '#14b8a6', '#f97316',
      '#06b6d4', '#a855f7'
    ][categories.indexOf(cat)]
  })).filter(item => item.value > 0);

  const largestCategory = categoryBreakdown.length > 0 
    ? categoryBreakdown.reduce((max, item) => item.value > max.value ? item : max, categoryBreakdown[0])
    : { name: 'N/A', value: 0 };

  // Monthly trend data (last 6 months)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthKey = date.toISOString().slice(0, 7);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    
    return {
      month: monthName,
      amount: purchases
        .filter(p => p.date?.startsWith(monthKey))
        .reduce((sum, p) => sum + (p.amount || 0), 0)
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading expenses data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchases & Expenses</h1>
          <p className="text-gray-600 mt-1">Track all business expenses and supplier purchases</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <FileText className="w-5 h-5" />
            Reports
          </button>
          <button
            onClick={() => setShowNewExpense(!showNewExpense)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Total Expenses (This Month)</p>
          <p className="text-3xl font-bold text-gray-900">KES {totalExpenses.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">{purchases.length} transactions</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Supplier Payables</p>
          <p className="text-3xl font-bold text-orange-600">KES {pendingPayments.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-2">{pendingCount} pending payment{pendingCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Largest Category</p>
          <p className="text-3xl font-bold text-blue-600">{largestCategory.name.split(' ')[0]}</p>
          <p className="text-sm text-gray-600 mt-2">
            {totalExpenses > 0 ? Math.round((largestCategory.value / totalExpenses) * 100) : 0}% of total
          </p>
        </div>
      </div>

      {/* New Expense Form */}
      {showNewExpense && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Record New Expense</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supplier/Payee *</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Enter supplier name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KES) *</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Invoice/Receipt number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows={1}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add notes or description"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setShowNewExpense(false);
                setFormData({
                  category: '',
                  supplier: '',
                  amount: '',
                  date: new Date().toISOString().split('T')[0],
                  description: '',
                  status: 'Paid',
                  paymentMethod: 'cash',
                  reference: ''
                });
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateExpense}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Expense
            </button>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Expense Breakdown</h2>
          </div>
          {categoryBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {categoryBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs text-gray-600 truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">No expense data available</p>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">6-Month Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
              <Bar dataKey="amount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">All Expenses</h2>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Status</div>
                      <button
                        onClick={() => { setFilterStatus('all'); setShowFilterMenu(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterStatus === 'all' ? 'bg-gray-100' : ''}`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => { setFilterStatus('Paid'); setShowFilterMenu(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterStatus === 'Paid' ? 'bg-gray-100' : ''}`}
                      >
                        Paid
                      </button>
                      <button
                        onClick={() => { setFilterStatus('Pending'); setShowFilterMenu(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterStatus === 'Pending' ? 'bg-gray-100' : ''}`}
                      >
                        Pending
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleExportExpenses}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {purchases
                .filter(exp => {
                  const matchCategory = filterCategory === 'all' || exp.category === filterCategory;
                  const matchStatus = filterStatus === 'all' || exp.status === filterStatus;
                  return matchCategory && matchStatus;
                })
                .map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{expense.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{expense.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{expense.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{expense.supplier}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      KES {(expense.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        expense.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => {
                          setSelectedExpense(expense);
                          setShowExpenseDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Details Modal */}
      {showExpenseDetails && selectedExpense && !isEditMode && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Expense Details</h3>
              <button
                onClick={() => setShowExpenseDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Expense ID:</p>
                <p className="text-sm font-medium text-gray-900">{selectedExpense.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date:</p>
                <p className="text-sm font-medium text-gray-900">{selectedExpense.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category:</p>
                <p className="text-sm font-medium text-gray-900">{selectedExpense.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Supplier/Payee:</p>
                <p className="text-sm font-medium text-gray-900">{selectedExpense.supplier}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount:</p>
                <p className="text-lg font-bold text-gray-900">KES {(selectedExpense.amount || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Method:</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{selectedExpense.paymentMethod || 'cash'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status:</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  selectedExpense.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {selectedExpense.status}
                </span>
              </div>
              {selectedExpense.reference && (
                <div>
                  <p className="text-sm text-gray-600">Reference:</p>
                  <p className="text-sm font-medium text-gray-900">{selectedExpense.reference}</p>
                </div>
              )}
              {selectedExpense.description && (
                <div>
                  <p className="text-sm text-gray-600">Description:</p>
                  <p className="text-sm text-gray-900">{selectedExpense.description}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={handleEditExpense}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDeleteExpense}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {isEditMode && editedExpense && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Expense - {editedExpense.id}</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={editedExpense.category}
                  onChange={(e) => setEditedExpense({ ...editedExpense, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier/Payee</label>
                <input
                  type="text"
                  value={editedExpense.supplier}
                  onChange={(e) => setEditedExpense({ ...editedExpense, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KES)</label>
                <input
                  type="number"
                  value={editedExpense.amount}
                  onChange={(e) => setEditedExpense({ ...editedExpense, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={editedExpense.date}
                  onChange={(e) => setEditedExpense({ ...editedExpense, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <select
                  value={editedExpense.status}
                  onChange={(e) => setEditedExpense({ ...editedExpense, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={editedExpense.paymentMethod || 'cash'}
                  onChange={(e) => setEditedExpense({ ...editedExpense, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                <input
                  type="text"
                  value={editedExpense.reference || ''}
                  onChange={(e) => setEditedExpense({ ...editedExpense, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={1}
                  value={editedExpense.description || ''}
                  onChange={(e) => setEditedExpense({ ...editedExpense, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExpense}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Expense Reports</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setReportType('summary')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    reportType === 'summary' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setReportType('category')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    reportType === 'category' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'
                  }`}
                >
                  By Category
                </button>
                <button
                  onClick={() => setReportType('supplier')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    reportType === 'supplier' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'
                  }`}
                >
                  By Supplier
                </button>
              </div>
            </div>

            {reportType === 'summary' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Expense Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-xl font-bold text-blue-600">KES {totalExpenses.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Paid</p>
                    <p className="text-xl font-bold text-green-600">
                      KES {purchases.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-xl font-bold text-orange-600">KES {pendingPayments.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-xl font-bold text-gray-900">{purchases.length}</p>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'category' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Expenses by Category</h4>
                <div className="space-y-2">
                  {categoryBreakdown.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }}></div>
                        <span className="font-medium text-gray-900">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">KES {cat.value.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          {totalExpenses > 0 ? ((cat.value / totalExpenses) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportType === 'supplier' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Expenses by Supplier</h4>
                <div className="space-y-2">
                  {Array.from(new Set(purchases.map(p => p.supplier))).map(supplier => {
                    const supplierTotal = purchases
                      .filter(p => p.supplier === supplier)
                      .reduce((sum, p) => sum + (p.amount || 0), 0);
                    return (
                      <div key={supplier} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{supplier}</span>
                        <p className="font-bold text-gray-900">KES {supplierTotal.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  handleExportExpenses();
                  setShowReportModal(false);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
