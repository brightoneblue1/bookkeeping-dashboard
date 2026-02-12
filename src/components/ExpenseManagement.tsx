import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Eye, Download, Tag, Calendar, DollarSign, FileText, Repeat, AlertCircle, TrendingUp, TrendingDown, Filter } from 'lucide-react';

interface Expense {
  id: string;
  expenseNo: string;
  date: string;
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  paymentMethod: string;
  paidTo: string;
  reference?: string;
  receiptNo?: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextDueDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  approvedBy?: string;
  notes?: string;
  attachments?: string[];
  tags?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  budget?: number;
  subcategories?: string[];
  isActive: boolean;
  createdAt: string;
}

export function ExpenseManagement() {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'categories' | 'recurring'>('list');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | 'category'>('add');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [formData, setFormData] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    category: '',
    subcategory: '',
    description: '',
    amount: 0,
    paymentMethod: 'Cash',
    paidTo: '',
    reference: '',
    receiptNo: '',
    isRecurring: false,
    recurringFrequency: 'monthly',
    status: 'paid',
    notes: '',
    tags: []
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    budget: 0,
    subcategories: [] as string[]
  });

  const defaultCategories: ExpenseCategory[] = [
    { id: 'CAT-1', name: 'Rent', description: 'Office and store rent', color: '#EF4444', icon: '🏢', budget: 50000, isActive: true, createdAt: new Date().toISOString() },
    { id: 'CAT-2', name: 'Utilities', description: 'Electricity, water, internet', color: '#F59E0B', icon: '⚡', budget: 15000, isActive: true, createdAt: new Date().toISOString() },
    { id: 'CAT-3', name: 'Salaries', description: 'Employee salaries and wages', color: '#10B981', icon: '👥', budget: 200000, isActive: true, createdAt: new Date().toISOString() },
    { id: 'CAT-4', name: 'Marketing', description: 'Advertising and promotion', color: '#8B5CF6', icon: '📢', budget: 30000, isActive: true, createdAt: new Date().toISOString() },
    { id: 'CAT-5', name: 'Transportation', description: 'Fuel, vehicle maintenance', color: '#3B82F6', icon: '🚗', budget: 20000, isActive: true, createdAt: new Date().toISOString() },
    { id: 'CAT-6', name: 'Office Supplies', description: 'Stationery and supplies', color: '#6366F1', icon: '📎', budget: 10000, isActive: true, createdAt: new Date().toISOString() },
    { id: 'CAT-7', name: 'Maintenance', description: 'Repairs and maintenance', color: '#EC4899', icon: '🔧', budget: 15000, isActive: true, createdAt: new Date().toISOString() },
    { id: 'CAT-8', name: 'Insurance', description: 'Business insurance', color: '#14B8A6', icon: '🛡️', budget: 25000, isActive: true, createdAt: new Date().toISOString() },
    { id: 'CAT-9', name: 'Professional Fees', description: 'Legal, accounting fees', color: '#F97316', icon: '⚖️', budget: 20000, isActive: true, createdAt: new Date().toISOString() },
    { id: 'CAT-10', name: 'Bank Charges', description: 'Transaction fees', color: '#06B6D4', icon: '🏦', budget: 5000, isActive: true, createdAt: new Date().toISOString() },
    { id: 'CAT-11', name: 'Taxes', description: 'Business taxes', color: '#DC2626', icon: '💰', isActive: true, createdAt: new Date().toISOString() },
    { id: 'CAT-12', name: 'Training', description: 'Staff training and development', color: '#7C3AED', icon: '📚', budget: 15000, isActive: true, createdAt: new Date().toISOString() },
    { id: 'CAT-13', name: 'Miscellaneous', description: 'Other expenses', color: '#64748B', icon: '📋', isActive: true, createdAt: new Date().toISOString() }
  ];

  const paymentMethods = ['Cash', 'M-Pesa', 'Bank Transfer', 'Cheque', 'Card', 'Mobile Money'];

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    const storedExpenses = localStorage.getItem('expenses');
    const storedCategories = localStorage.getItem('expense_categories');

    if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      setCategories(defaultCategories);
      localStorage.setItem('expense_categories', JSON.stringify(defaultCategories));
    }
  }

  function handleCreateExpense() {
    if (!formData.category || !formData.description || !formData.amount) {
      alert('Please fill in required fields');
      return;
    }

    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      expenseNo: `E-${Date.now()}`,
      date: formData.date,
      category: formData.category,
      subcategory: formData.subcategory,
      description: formData.description,
      amount: formData.amount,
      paymentMethod: formData.paymentMethod,
      paidTo: formData.paidTo,
      reference: formData.reference,
      receiptNo: formData.receiptNo,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
      nextDueDate: formData.isRecurring ? calculateNextDueDate(formData.date, formData.recurringFrequency) : undefined,
      status: formData.status,
      notes: formData.notes,
      tags: formData.tags,
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...expenses, newExpense];
    setExpenses(updated);
    localStorage.setItem('expenses', JSON.stringify(updated));

    resetForm();
    setActiveTab('list');
    alert('Expense created successfully!');
  }

  function handleUpdateExpense() {
    if (!selectedExpense) return;

    const updated = expenses.map(exp =>
      exp.id === selectedExpense.id
        ? {
            ...exp,
            ...formData,
            updatedAt: new Date().toISOString()
          }
        : exp
    );

    setExpenses(updated);
    localStorage.setItem('expenses', JSON.stringify(updated));

    resetForm();
    setShowModal(false);
    setSelectedExpense(null);
    alert('Expense updated successfully!');
  }

  function handleDeleteExpense(id: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    const updated = expenses.filter(exp => exp.id !== id);
    setExpenses(updated);
    localStorage.setItem('expenses', JSON.stringify(updated));
    alert('Expense deleted successfully!');
  }

  function calculateNextDueDate(currentDate: string, frequency: string): string {
    const date = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    
    return date.toISOString().split('T')[0];
  }

  function handleCreateCategory() {
    if (!categoryForm.name) {
      alert('Please enter category name');
      return;
    }

    const newCategory: ExpenseCategory = {
      id: `CAT-${Date.now()}`,
      name: categoryForm.name,
      description: categoryForm.description,
      color: categoryForm.color,
      icon: '📁',
      budget: categoryForm.budget,
      subcategories: categoryForm.subcategories,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const updated = [...categories, newCategory];
    setCategories(updated);
    localStorage.setItem('expense_categories', JSON.stringify(updated));

    resetCategoryForm();
    setShowModal(false);
    alert('Category created successfully!');
  }

  function handleUpdateCategory() {
    if (!selectedCategory) return;

    const updated = categories.map(cat =>
      cat.id === selectedCategory.id
        ? {
            ...cat,
            name: categoryForm.name,
            description: categoryForm.description,
            color: categoryForm.color,
            budget: categoryForm.budget,
            subcategories: categoryForm.subcategories
          }
        : cat
    );

    setCategories(updated);
    localStorage.setItem('expense_categories', JSON.stringify(updated));

    resetCategoryForm();
    setShowModal(false);
    setSelectedCategory(null);
    alert('Category updated successfully!');
  }

  function handleDeleteCategory(id: string) {
    if (!confirm('Are you sure you want to delete this category?')) return;

    const updated = categories.filter(cat => cat.id !== id);
    setCategories(updated);
    localStorage.setItem('expense_categories', JSON.stringify(updated));
    alert('Category deleted successfully!');
  }

  function resetForm() {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      subcategory: '',
      description: '',
      amount: 0,
      paymentMethod: 'Cash',
      paidTo: '',
      reference: '',
      receiptNo: '',
      isRecurring: false,
      recurringFrequency: 'monthly',
      status: 'paid',
      notes: '',
      tags: []
    });
  }

  function resetCategoryForm() {
    setCategoryForm({
      name: '',
      description: '',
      color: '#3B82F6',
      budget: 0,
      subcategories: []
    });
  }

  function openEditModal(expense: Expense) {
    setSelectedExpense(expense);
    setFormData({
      date: expense.date,
      category: expense.category,
      subcategory: expense.subcategory || '',
      description: expense.description,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
      paidTo: expense.paidTo,
      reference: expense.reference || '',
      receiptNo: expense.receiptNo || '',
      isRecurring: expense.isRecurring,
      recurringFrequency: expense.recurringFrequency || 'monthly',
      status: expense.status,
      notes: expense.notes || '',
      tags: expense.tags || []
    });
    setModalType('edit');
    setShowModal(true);
  }

  function openCategoryModal(category?: ExpenseCategory) {
    if (category) {
      setSelectedCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        color: category.color,
        budget: category.budget || 0,
        subcategories: category.subcategories || []
      });
    } else {
      resetCategoryForm();
      setSelectedCategory(null);
    }
    setModalType('category');
    setShowModal(true);
  }

  function handleExport() {
    const filteredData = getFilteredExpenses();
    
    const headers = ['Expense No', 'Date', 'Category', 'Description', 'Amount', 'Payment Method', 'Paid To', 'Status', 'Reference'];
    const csvRows = [headers.join(',')];

    filteredData.forEach(exp => {
      const row = [
        exp.expenseNo,
        new Date(exp.date).toLocaleDateString(),
        exp.category,
        `"${exp.description}"`,
        exp.amount,
        exp.paymentMethod,
        `"${exp.paidTo}"`,
        exp.status,
        exp.reference || ''
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getFilteredExpenses() {
    return expenses.filter(exp => {
      const matchSearch = exp.expenseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.paidTo.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory = filterCategory === 'all' || exp.category === filterCategory;
      const matchStatus = filterStatus === 'all' || exp.status === filterStatus;
      const matchPayment = filterPaymentMethod === 'all' || exp.paymentMethod === filterPaymentMethod;
      
      const matchDateFrom = !dateFrom || new Date(exp.date) >= new Date(dateFrom);
      const matchDateTo = !dateTo || new Date(exp.date) <= new Date(dateTo);
      
      return matchSearch && matchCategory && matchStatus && matchPayment && matchDateFrom && matchDateTo;
    });
  }

  const getStatusBadge = (status: string) => {
    const badges: any = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      overdue: 'bg-red-100 text-red-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const stats = {
    total: expenses.length,
    totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    paid: expenses.filter(exp => exp.status === 'paid').length,
    pending: expenses.filter(exp => exp.status === 'pending').length,
    thisMonth: expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const now = new Date();
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    }).reduce((sum, exp) => sum + exp.amount, 0),
    recurring: expenses.filter(exp => exp.isRecurring).length
  };

  const categoryStats = categories.map(cat => ({
    ...cat,
    spent: expenses
      .filter(exp => exp.category === cat.name)
      .reduce((sum, exp) => sum + exp.amount, 0),
    count: expenses.filter(exp => exp.category === cat.name).length
  }));

  const filteredExpenses = getFilteredExpenses();
  const recurringExpenses = expenses.filter(exp => exp.isRecurring);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600 mt-1">Track and manage business expenses</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'list' && (
            <>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('add');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add Expense
              </button>
            </>
          )}
          {activeTab === 'add' && (
            <button
              onClick={() => {
                resetForm();
                setActiveTab('list');
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          )}
          {activeTab === 'categories' && (
            <button
              onClick={() => openCategoryModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Category
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          List Expenses ({stats.total})
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'add' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Expense
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'categories' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Tag className="w-4 h-4 inline mr-2" />
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'recurring' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Repeat className="w-4 h-4 inline mr-2" />
          Recurring ({stats.recurring})
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-2xl font-bold text-red-600">
            KES {stats.totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">This Month</p>
          <p className="text-2xl font-bold text-orange-600">
            KES {stats.thisMonth.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Paid</p>
          <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Recurring</p>
          <p className="text-2xl font-bold text-purple-600">{stats.recurring}</p>
        </div>
      </div>

      {/* List View */}
      {activeTab === 'list' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search expenses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>

              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Payment Methods</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>

              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From Date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To Date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Expense No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Paid To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(expense => {
                    const category = categories.find(c => c.name === expense.category);
                    return (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {expense.expenseNo}
                          {expense.isRecurring && (
                            <Repeat className="w-3 h-3 inline ml-1 text-purple-600" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="px-2 py-1 text-xs rounded-full"
                            style={{ backgroundColor: `${category?.color}20`, color: category?.color }}
                          >
                            {category?.icon} {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                        <td className="px-6 py-4 text-sm font-bold text-red-600">
                          KES {expense.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{expense.paymentMethod}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{expense.paidTo}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(expense.status)}`}>
                            {expense.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedExpense(expense);
                                setModalType('view');
                                setShowModal(true);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(expense)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right font-bold text-gray-900">Total:</td>
                  <td className="px-6 py-3 text-sm font-bold text-red-600">
                    KES {filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* Add Expense View */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Add New Expense</h2>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.filter(c => c.isActive).map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the expense"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid To *</label>
                <input
                  type="text"
                  value={formData.paidTo}
                  onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                  placeholder="Vendor/Supplier name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference No</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Transaction reference"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt No</label>
                <input
                  type="text"
                  value={formData.receiptNo}
                  onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
                  placeholder="Receipt number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Recurring Expense */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                  This is a recurring expense
                </label>
              </div>

              {formData.isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <select
                      value={formData.recurringFrequency}
                      onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
                    <input
                      type="text"
                      value={calculateNextDueDate(formData.date, formData.recurringFrequency)}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes or comments..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCreateExpense}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Expense
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('list');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories View */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryStats.map(category => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
              style={{ borderTopColor: category.color, borderTopWidth: '3px' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openCategoryModal(category)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Spent:</span>
                  <span className="font-bold text-red-600">
                    KES {category.spent.toLocaleString()}
                  </span>
                </div>
                {category.budget && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium text-gray-900">
                        KES {category.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min((category.spent / category.budget) * 100, 100)}%`,
                          backgroundColor: category.spent > category.budget ? '#EF4444' : category.color
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {((category.spent / category.budget) * 100).toFixed(1)}% of budget
                    </p>
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transactions:</span>
                  <span className="font-medium text-gray-900">{category.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recurring Expenses View */}
      {activeTab === 'recurring' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Expense No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Next Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recurringExpenses.map(expense => {
                const category = categories.find(c => c.name === expense.category);
                return (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{expense.expenseNo}</td>
                    <td className="px-6 py-4">
                      <span 
                        className="px-2 py-1 text-xs rounded-full"
                        style={{ backgroundColor: `${category?.color}20`, color: category?.color }}
                      >
                        {category?.icon} {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600">
                      KES {expense.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {expense.recurringFrequency}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {expense.nextDueDate ? new Date(expense.nextDueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View/Edit Modal */}
      {showModal && (modalType === 'view' || modalType === 'edit') && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'view' ? 'Expense Details' : 'Edit Expense'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedExpense(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalType === 'view' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Expense No</p>
                    <p className="font-medium">{selectedExpense.expenseNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium">{selectedExpense.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-bold text-red-600">KES {selectedExpense.amount.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="font-medium">{selectedExpense.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium">{selectedExpense.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Paid To</p>
                    <p className="font-medium">{selectedExpense.paidTo}</p>
                  </div>
                  {selectedExpense.reference && (
                    <div>
                      <p className="text-sm text-gray-600">Reference</p>
                      <p className="font-medium">{selectedExpense.reference}</p>
                    </div>
                  )}
                  {selectedExpense.receiptNo && (
                    <div>
                      <p className="text-sm text-gray-600">Receipt No</p>
                      <p className="font-medium">{selectedExpense.receiptNo}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedExpense.status)}`}>
                      {selectedExpense.status}
                    </span>
                  </div>
                  {selectedExpense.isRecurring && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Recurring</p>
                        <p className="font-medium capitalize">{selectedExpense.recurringFrequency}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Next Due</p>
                        <p className="font-medium">
                          {selectedExpense.nextDueDate ? new Date(selectedExpense.nextDueDate).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </>
                  )}
                  {selectedExpense.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedExpense.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateExpense}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Expense
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedExpense(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showModal && modalType === 'category' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedCategory(null);
                  resetCategoryForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget (KES)</label>
                <input
                  type="number"
                  value={categoryForm.budget}
                  onChange={(e) => setCategoryForm({ ...categoryForm, budget: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={selectedCategory ? handleUpdateCategory : handleCreateCategory}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedCategory ? 'Update' : 'Create'} Category
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedCategory(null);
                    resetCategoryForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
