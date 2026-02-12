import { useState, useEffect } from 'react';
import { Users, Building, Clock, CheckCircle, AlertTriangle, Plus, X, Eye, Edit2, Trash2, Download, DollarSign, FileText, Bell, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getCustomers, createCustomer, updateCustomer, getSuppliers, createSupplier, updateSupplier, getSales, getPurchases } from '../utils/api';

export function DebtorsCreditors() {
  const [activeTab, setActiveTab] = useState<'debtors' | 'creditors'>('debtors');
  const [debtors, setDebtors] = useState<any[]>([]);
  const [creditors, setCreditors] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showNewDebtor, setShowNewDebtor] = useState(false);
  const [showNewCreditor, setShowNewCreditor] = useState(false);
  const [showDebtorDetails, setShowDebtorDetails] = useState(false);
  const [showCreditorDetails, setShowCreditorDetails] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null);
  const [selectedCreditor, setSelectedCreditor] = useState<any>(null);
  const [editedDebtor, setEditedDebtor] = useState<any>(null);
  const [editedCreditor, setEditedCreditor] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'debtor' | 'creditor'>('debtor');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);

  const [debtorForm, setDebtorForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 0,
    totalDebt: 0
  });

  const [creditorForm, setCreditorForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    totalOwed: 0,
    paymentTerms: '30'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (dataLoaded && !loading) {
      checkAlerts();
    }
  }, [dataLoaded, loading, debtors.length, creditors.length, sales.length, purchases.length]);

  async function loadData() {
    try {
      setLoading(true);
      const [customersData, suppliersData, salesData, purchasesData] = await Promise.all([
        getCustomers(),
        getSuppliers(),
        getSales(),
        getPurchases()
      ]);
      
      // Calculate debt from credit sales
      const debtorsWithCalculatedDebt = customersData.map(customer => {
        const creditSales = salesData.filter(
          s => s.customer === customer.name && s.status === 'Pending'
        );
        const calculatedDebt = creditSales.reduce((sum, s) => sum + (s.amount || 0), 0);
        
        // Calculate aging
        const aging = calculateAging(creditSales);
        const overdue = calculateOverdue(creditSales);
        
        return {
          ...customer,
          totalDebt: calculatedDebt || customer.totalDebt || 0,
          creditSales,
          aging,
          overdue
        };
      });

      // Calculate payables from pending purchases
      const creditorsWithCalculatedOwed = suppliersData.map(supplier => {
        const pendingPurchases = purchasesData.filter(
          p => p.supplier === supplier.name && p.status === 'Pending'
        );
        const calculatedOwed = pendingPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Calculate due date
        const dueDate = calculateDueDate(pendingPurchases, supplier.paymentTerms || '30');
        
        return {
          ...supplier,
          totalOwed: calculatedOwed || supplier.totalOwed || 0,
          pendingPurchases,
          dueDate,
          status: getDueStatus(dueDate)
        };
      });

      setDebtors(debtorsWithCalculatedDebt);
      setCreditors(creditorsWithCalculatedOwed);
      setSales(salesData);
      setPurchases(purchasesData);
      setDataLoaded(true);
    } catch (error) {
      console.error('Failed to load data:', error);
      setDataLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  function calculateAging(creditSales: any[]) {
    if (!creditSales || creditSales.length === 0) return '0-30 days';
    
    const oldestSale = creditSales.reduce((oldest, sale) => {
      const saleDate = new Date(sale.date);
      const oldestDate = new Date(oldest.date);
      return saleDate < oldestDate ? sale : oldest;
    }, creditSales[0]);

    const daysDiff = Math.floor((new Date().getTime() - new Date(oldestSale.date).getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 30) return '0-30 days';
    if (daysDiff <= 60) return '30-60 days';
    if (daysDiff <= 90) return '60-90 days';
    return '>90 days';
  }

  function calculateOverdue(creditSales: any[]) {
    if (!creditSales || creditSales.length === 0) return 0;
    
    const overdueSales = creditSales.filter(sale => {
      const daysDiff = Math.floor((new Date().getTime() - new Date(sale.date).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 30;
    });

    return overdueSales.reduce((sum, s) => sum + (s.amount || 0), 0);
  }

  function calculateDueDate(pendingPurchases: any[], paymentTerms: string) {
    if (!pendingPurchases || pendingPurchases.length === 0) return 'N/A';
    
    const oldestPurchase = pendingPurchases.reduce((oldest, purchase) => {
      const purchaseDate = new Date(purchase.date);
      const oldestDate = new Date(oldest.date);
      return purchaseDate < oldestDate ? purchase : oldest;
    }, pendingPurchases[0]);

    const dueDate = new Date(oldestPurchase.date);
    dueDate.setDate(dueDate.getDate() + parseInt(paymentTerms || '30'));
    
    return dueDate.toISOString().split('T')[0];
  }

  function getDueStatus(dueDate: string) {
    if (dueDate === 'N/A') return 'current';
    
    const due = new Date(dueDate);
    const today = new Date();
    const daysDiff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) return 'overdue';
    if (daysDiff <= 7) return 'due-soon';
    return 'current';
  }

  function checkAlerts() {
    const newAlerts = [];

    // High debt customers
    const highDebtCustomers = debtors.filter(d => (d.totalDebt || 0) > (d.creditLimit || 0) * 0.8);
    if (highDebtCustomers.length > 0) {
      newAlerts.push({
        id: 'high-debt',
        message: `${highDebtCustomers.length} customer${highDebtCustomers.length > 1 ? 's' : ''} near credit limit`,
        severity: 'warning',
        icon: AlertTriangle
      });
    }

    // Overdue debtors
    const overdueDebtors = debtors.filter(d => (d.overdue || 0) > 0);
    if (overdueDebtors.length > 0) {
      newAlerts.push({
        id: 'overdue-debt',
        message: `${overdueDebtors.length} customer${overdueDebtors.length > 1 ? 's have' : ' has'} overdue payments`,
        severity: 'error',
        icon: Clock
      });
    }

    // Overdue suppliers
    const overdueSuppliers = creditors.filter(c => c.status === 'overdue');
    if (overdueSuppliers.length > 0) {
      newAlerts.push({
        id: 'overdue-payables',
        message: `${overdueSuppliers.length} supplier payment${overdueSuppliers.length > 1 ? 's' : ''} overdue`,
        severity: 'error',
        icon: AlertTriangle
      });
    }

    // Suppliers due soon
    const dueSoonSuppliers = creditors.filter(c => c.status === 'due-soon');
    if (dueSoonSuppliers.length > 0) {
      newAlerts.push({
        id: 'due-soon',
        message: `${dueSoonSuppliers.length} supplier payment${dueSoonSuppliers.length > 1 ? 's' : ''} due within 7 days`,
        severity: 'warning',
        icon: Calendar
      });
    }

    setAlerts(newAlerts);
  }

  async function handleAddDebtor(e: React.FormEvent) {
    e.preventDefault();
    
    if (!debtorForm.name || !debtorForm.phone) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createCustomer({
        ...debtorForm,
        id: `CUST-${Date.now()}`
      });
      
      setDebtorForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        creditLimit: 0,
        totalDebt: 0
      });
      setShowNewDebtor(false);
      await loadData();
      alert('Customer added successfully!');
    } catch (error) {
      console.error('Failed to add customer:', error);
      alert('Failed to add customer. Please try again.');
    }
  }

  async function handleAddCreditor(e: React.FormEvent) {
    e.preventDefault();
    
    if (!creditorForm.name || !creditorForm.phone) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createSupplier({
        ...creditorForm,
        id: `SUP-${Date.now()}`
      });
      
      setCreditorForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        totalOwed: 0,
        paymentTerms: '30'
      });
      setShowNewCreditor(false);
      await loadData();
      alert('Supplier added successfully!');
    } catch (error) {
      console.error('Failed to add supplier:', error);
      alert('Failed to add supplier. Please try again.');
    }
  }

  function handleEditDebtor() {
    setIsEditMode(true);
    setEditedDebtor({ ...selectedDebtor });
  }

  function handleEditCreditor() {
    setIsEditMode(true);
    setEditedCreditor({ ...selectedCreditor });
  }

  function handleCancelEdit() {
    setIsEditMode(false);
    setEditedDebtor(null);
    setEditedCreditor(null);
  }

  async function handleSaveDebtor() {
    if (!editedDebtor) return;

    try {
      await updateCustomer(editedDebtor.id, editedDebtor);
      
      const updatedDebtors = debtors.map(d => 
        d.id === editedDebtor.id ? editedDebtor : d
      );
      setDebtors(updatedDebtors);

      setIsEditMode(false);
      setShowDebtorDetails(false);
      setEditedDebtor(null);
      alert('Customer updated successfully!');
    } catch (error) {
      console.error('Failed to update customer:', error);
      alert('Failed to update customer. Please try again.');
    }
  }

  async function handleSaveCreditor() {
    if (!editedCreditor) return;

    try {
      await updateSupplier(editedCreditor.id, editedCreditor);
      
      const updatedCreditors = creditors.map(c => 
        c.id === editedCreditor.id ? editedCreditor : c
      );
      setCreditors(updatedCreditors);

      setIsEditMode(false);
      setShowCreditorDetails(false);
      setEditedCreditor(null);
      alert('Supplier updated successfully!');
    } catch (error) {
      console.error('Failed to update supplier:', error);
      alert('Failed to update supplier. Please try again.');
    }
  }

  async function handleRecordPayment() {
    if (paymentAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      if (paymentType === 'debtor' && selectedDebtor) {
        // Update sales to mark as paid
        const updatedSales = sales.map(s => {
          if (s.customer === selectedDebtor.name && s.status === 'Pending') {
            return { ...s, status: 'Paid' };
          }
          return s;
        });
        setSales(updatedSales);

        // Update debtor
        const updatedDebtor = {
          ...selectedDebtor,
          totalDebt: Math.max(0, (selectedDebtor.totalDebt || 0) - paymentAmount)
        };
        await updateCustomer(selectedDebtor.id, updatedDebtor);
      } else if (paymentType === 'creditor' && selectedCreditor) {
        // Update purchases to mark as paid
        const updatedPurchases = purchases.map(p => {
          if (p.supplier === selectedCreditor.name && p.status === 'Pending') {
            return { ...p, status: 'Paid' };
          }
          return p;
        });
        setPurchases(updatedPurchases);

        // Update creditor
        const updatedCreditor = {
          ...selectedCreditor,
          totalOwed: Math.max(0, (selectedCreditor.totalOwed || 0) - paymentAmount)
        };
        await updateSupplier(selectedCreditor.id, updatedCreditor);
      }

      setShowPaymentModal(false);
      setPaymentAmount(0);
      setPaymentNotes('');
      await loadData();
      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert('Failed to record payment. Please try again.');
    }
  }

  function handleExportDebtors() {
    try {
      const headers = ['Customer ID', 'Name', 'Phone', 'Email', 'Address', 'Total Debt', 'Overdue', 'Credit Limit', 'Aging'];
      const csvRows = [headers.join(',')];

      debtors.forEach(debtor => {
        const row = [
          debtor.id,
          `"${debtor.name}"`,
          debtor.phone,
          debtor.email || '',
          `"${debtor.address || ''}"`,
          debtor.totalDebt || 0,
          debtor.overdue || 0,
          debtor.creditLimit || 0,
          debtor.aging || 'Current'
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debtors-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Debtors data exported successfully!');
    } catch (error) {
      console.error('Failed to export debtors:', error);
      alert('Failed to export debtors data.');
    }
  }

  function handleExportCreditors() {
    try {
      const headers = ['Supplier ID', 'Name', 'Phone', 'Email', 'Address', 'Amount Owed', 'Due Date', 'Status', 'Payment Terms'];
      const csvRows = [headers.join(',')];

      creditors.forEach(creditor => {
        const row = [
          creditor.id,
          `"${creditor.name}"`,
          creditor.phone,
          creditor.email || '',
          `"${creditor.address || ''}"`,
          creditor.totalOwed || 0,
          creditor.dueDate || 'N/A',
          creditor.status || 'current',
          creditor.paymentTerms || '30'
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `creditors-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Creditors data exported successfully!');
    } catch (error) {
      console.error('Failed to export creditors:', error);
      alert('Failed to export creditors data.');
    }
  }

  const debtorSummary = {
    totalDebtors: debtors.length,
    totalDebt: debtors.reduce((sum, d) => sum + (d.totalDebt || 0), 0),
    overdueAmount: debtors.reduce((sum, d) => sum + (d.overdue || 0), 0),
    currentAmount: debtors.reduce((sum, d) => sum + ((d.totalDebt || 0) - (d.overdue || 0)), 0),
  };

  const creditorSummary = {
    totalSuppliers: creditors.length,
    totalOwed: creditors.reduce((sum, c) => sum + (c.totalOwed || 0), 0),
    overdue: creditors.filter(c => c.status === 'overdue').reduce((sum, c) => sum + (c.totalOwed || 0), 0),
    dueSoon: creditors.filter(c => c.status === 'due-soon').reduce((sum, c) => sum + (c.totalOwed || 0), 0),
    current: creditors.filter(c => c.status === 'current').reduce((sum, c) => sum + (c.totalOwed || 0), 0),
  };

  // Aging breakdown for debtors
  const agingBreakdown = [
    { name: '0-30 days', value: debtors.filter(d => d.aging === '0-30 days').reduce((s, d) => s + (d.totalDebt || 0), 0), color: '#10b981' },
    { name: '30-60 days', value: debtors.filter(d => d.aging === '30-60 days').reduce((s, d) => s + (d.totalDebt || 0), 0), color: '#f59e0b' },
    { name: '60-90 days', value: debtors.filter(d => d.aging === '60-90 days').reduce((s, d) => s + (d.totalDebt || 0), 0), color: '#ef4444' },
    { name: '>90 days', value: debtors.filter(d => d.aging === '>90 days').reduce((s, d) => s + (d.totalDebt || 0), 0), color: '#991b1b' },
  ].filter(item => item.value > 0);

  const getAgingColor = (aging: string) => {
    if (aging?.includes('60-90') || aging?.includes('>90')) return 'text-red-600 bg-red-50';
    if (aging?.includes('30-60')) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-500">Loading debtors & creditors data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Debtors & Creditors Management</h1>
          <p className="text-gray-600 mt-1">Track customer debts and supplier payables</p>
        </div>
        <button
          onClick={() => activeTab === 'debtors' ? setShowNewDebtor(true) : setShowNewCreditor(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          {activeTab === 'debtors' ? 'Add Customer' : 'Add Supplier'}
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Alerts & Notifications</h2>
            <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded-full">
              {alerts.length} Active
            </span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 flex items-start gap-3 ${
                    alert.severity === 'error'
                      ? 'bg-red-50 border-red-500'
                      : 'bg-orange-50 border-orange-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 ${
                    alert.severity === 'error' ? 'text-red-600' : 'text-orange-600'
                  }`} />
                  <p className="text-sm text-gray-900 flex-1">{alert.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('debtors')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'debtors'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Debtors (Customers)
          </div>
        </button>
        <button
          onClick={() => setActiveTab('creditors')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'creditors'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Creditors (Suppliers)
          </div>
        </button>
      </div>

      {/* Debtors Section */}
      {activeTab === 'debtors' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600 mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{debtorSummary.totalDebtors}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600 mb-1">Total Debt</p>
              <p className="text-2xl font-bold text-blue-600">KES {debtorSummary.totalDebt.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600 mb-1">Overdue Amount</p>
              <p className="text-2xl font-bold text-red-600">KES {debtorSummary.overdueAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600 mb-1">Current Amount</p>
              <p className="text-2xl font-bold text-green-600">KES {debtorSummary.currentAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Aging Analysis Chart */}
          {agingBreakdown.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Debt Aging Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={agingBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.name}`}
                    >
                      {agingBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col justify-center space-y-3">
                  {agingBreakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">KES {item.value.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          {debtorSummary.totalDebt > 0 ? ((item.value / debtorSummary.totalDebt) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Add Debtor Form */}
          {showNewDebtor && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Add New Customer</h2>
                <button onClick={() => setShowNewDebtor(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddDebtor}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={debtorForm.name}
                      onChange={(e) => setDebtorForm({ ...debtorForm, name: e.target.value })}
                      placeholder="e.g., Jane Mwangi"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={debtorForm.phone}
                      onChange={(e) => setDebtorForm({ ...debtorForm, phone: e.target.value })}
                      placeholder="0712345678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={debtorForm.email}
                      onChange={(e) => setDebtorForm({ ...debtorForm, email: e.target.value })}
                      placeholder="customer@email.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Credit Limit (KES)</label>
                    <input
                      type="number"
                      min="0"
                      value={debtorForm.creditLimit}
                      onChange={(e) => setDebtorForm({ ...debtorForm, creditLimit: parseFloat(e.target.value) || 0 })}
                      placeholder="100000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={debtorForm.address}
                      onChange={(e) => setDebtorForm({ ...debtorForm, address: e.target.value })}
                      placeholder="Physical address or location"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewDebtor(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Add Customer
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Debtors Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Customer Accounts</h2>
                <button
                  onClick={handleExportDebtors}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Debt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Overdue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Credit Limit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Aging</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {debtors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No customers found
                      </td>
                    </tr>
                  ) : (
                    debtors.map((debtor) => (
                      <tr key={debtor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{debtor.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{debtor.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{debtor.phone}</td>
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">KES {(debtor.totalDebt || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-medium text-red-600">KES {(debtor.overdue || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">KES {(debtor.creditLimit || 0).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getAgingColor(debtor.aging || '0-30 days')}`}>
                            {debtor.aging || 'Current'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedDebtor(debtor);
                              setShowDebtorDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Creditors Section */}
      {activeTab === 'creditors' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600 mb-1">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{creditorSummary.totalSuppliers}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600 mb-1">Total Owed</p>
              <p className="text-2xl font-bold text-orange-600">KES {creditorSummary.totalOwed.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600 mb-1">Overdue</p>
              <p className="text-2xl font-bold text-red-600">KES {creditorSummary.overdue.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-600 mb-1">Due Soon</p>
              <p className="text-2xl font-bold text-yellow-600">KES {creditorSummary.dueSoon.toLocaleString()}</p>
            </div>
          </div>

          {/* Add Creditor Form */}
          {showNewCreditor && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Add New Supplier</h2>
                <button onClick={() => setShowNewCreditor(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddCreditor}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name *</label>
                    <input
                      type="text"
                      required
                      value={creditorForm.name}
                      onChange={(e) => setCreditorForm({ ...creditorForm, name: e.target.value })}
                      placeholder="e.g., ABC Wholesalers"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={creditorForm.phone}
                      onChange={(e) => setCreditorForm({ ...creditorForm, phone: e.target.value })}
                      placeholder="0711222333"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={creditorForm.email}
                      onChange={(e) => setCreditorForm({ ...creditorForm, email: e.target.value })}
                      placeholder="supplier@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms (Days)</label>
                    <select
                      value={creditorForm.paymentTerms}
                      onChange={(e) => setCreditorForm({ ...creditorForm, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="7">7 Days</option>
                      <option value="14">14 Days</option>
                      <option value="30">30 Days</option>
                      <option value="60">60 Days</option>
                      <option value="90">90 Days</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={creditorForm.address}
                      onChange={(e) => setCreditorForm({ ...creditorForm, address: e.target.value })}
                      placeholder="Physical address or location"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewCreditor(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Add Supplier
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Creditors Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Supplier Accounts</h2>
                <button
                  onClick={handleExportCreditors}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Supplier ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount Owed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payment Terms</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {creditors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No suppliers found
                      </td>
                    </tr>
                  ) : (
                    creditors.map((creditor) => (
                      <tr key={creditor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{creditor.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{creditor.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{creditor.phone}</td>
                        <td className="px-6 py-4 text-sm font-medium text-orange-600">KES {(creditor.totalOwed || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{creditor.dueDate || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{creditor.paymentTerms || '30'} Days</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            creditor.status === 'overdue'
                              ? 'bg-red-100 text-red-700'
                              : creditor.status === 'due-soon'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {creditor.status === 'overdue' ? 'Overdue' : creditor.status === 'due-soon' ? 'Due Soon' : 'Current'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedCreditor(creditor);
                              setShowCreditorDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Debtor Details Modal */}
      {showDebtorDetails && selectedDebtor && !isEditMode && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
              <button
                onClick={() => setShowDebtorDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Customer ID:</p>
                <p className="text-sm font-medium text-gray-900">{selectedDebtor.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Name:</p>
                <p className="text-sm font-medium text-gray-900">{selectedDebtor.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone:</p>
                <p className="text-sm font-medium text-gray-900">{selectedDebtor.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email:</p>
                <p className="text-sm font-medium text-gray-900">{selectedDebtor.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Debt:</p>
                <p className="text-lg font-bold text-blue-600">KES {(selectedDebtor.totalDebt || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue Amount:</p>
                <p className="text-lg font-bold text-red-600">KES {(selectedDebtor.overdue || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Credit Limit:</p>
                <p className="text-sm font-medium text-gray-900">KES {(selectedDebtor.creditLimit || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Aging:</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getAgingColor(selectedDebtor.aging || '0-30 days')}`}>
                  {selectedDebtor.aging || 'Current'}
                </span>
              </div>
              {selectedDebtor.address && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Address:</p>
                  <p className="text-sm text-gray-900">{selectedDebtor.address}</p>
                </div>
              )}
            </div>

            {/* Credit Sales */}
            {selectedDebtor.creditSales && selectedDebtor.creditSales.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Pending Credit Sales</h4>
                <div className="space-y-2">
                  {selectedDebtor.creditSales.map((sale: any) => (
                    <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sale.id}</p>
                        <p className="text-xs text-gray-600">{sale.date}</p>
                      </div>
                      <p className="font-bold text-blue-600">KES {(sale.amount || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPaymentType('debtor');
                  setPaymentAmount(selectedDebtor.totalDebt || 0);
                  setShowPaymentModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={(selectedDebtor.totalDebt || 0) === 0}
              >
                <DollarSign className="w-4 h-4" />
                Record Payment
              </button>
              <button
                onClick={handleEditDebtor}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creditor Details Modal */}
      {showCreditorDetails && selectedCreditor && !isEditMode && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Supplier Details</h3>
              <button
                onClick={() => setShowCreditorDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Supplier ID:</p>
                <p className="text-sm font-medium text-gray-900">{selectedCreditor.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Name:</p>
                <p className="text-sm font-medium text-gray-900">{selectedCreditor.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone:</p>
                <p className="text-sm font-medium text-gray-900">{selectedCreditor.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email:</p>
                <p className="text-sm font-medium text-gray-900">{selectedCreditor.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount Owed:</p>
                <p className="text-lg font-bold text-orange-600">KES {(selectedCreditor.totalOwed || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date:</p>
                <p className="text-sm font-medium text-gray-900">{selectedCreditor.dueDate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Terms:</p>
                <p className="text-sm font-medium text-gray-900">{selectedCreditor.paymentTerms || '30'} Days</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status:</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  selectedCreditor.status === 'overdue'
                    ? 'bg-red-100 text-red-700'
                    : selectedCreditor.status === 'due-soon'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {selectedCreditor.status === 'overdue' ? 'Overdue' : selectedCreditor.status === 'due-soon' ? 'Due Soon' : 'Current'}
                </span>
              </div>
              {selectedCreditor.address && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Address:</p>
                  <p className="text-sm text-gray-900">{selectedCreditor.address}</p>
                </div>
              )}
            </div>

            {/* Pending Purchases */}
            {selectedCreditor.pendingPurchases && selectedCreditor.pendingPurchases.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Pending Purchases</h4>
                <div className="space-y-2">
                  {selectedCreditor.pendingPurchases.map((purchase: any) => (
                    <div key={purchase.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{purchase.id}</p>
                        <p className="text-xs text-gray-600">{purchase.date}</p>
                      </div>
                      <p className="font-bold text-orange-600">KES {(purchase.amount || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPaymentType('creditor');
                  setPaymentAmount(selectedCreditor.totalOwed || 0);
                  setShowPaymentModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={(selectedCreditor.totalOwed || 0) === 0}
              >
                <DollarSign className="w-4 h-4" />
                Record Payment
              </button>
              <button
                onClick={handleEditCreditor}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Debtor Modal */}
      {isEditMode && editedDebtor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Customer - {editedDebtor.id}</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editedDebtor.name}
                  onChange={(e) => setEditedDebtor({ ...editedDebtor, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={editedDebtor.phone}
                  onChange={(e) => setEditedDebtor({ ...editedDebtor, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editedDebtor.email || ''}
                  onChange={(e) => setEditedDebtor({ ...editedDebtor, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Credit Limit (KES)</label>
                <input
                  type="number"
                  value={editedDebtor.creditLimit || 0}
                  onChange={(e) => setEditedDebtor({ ...editedDebtor, creditLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={editedDebtor.address || ''}
                  onChange={(e) => setEditedDebtor({ ...editedDebtor, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                onClick={handleSaveDebtor}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Creditor Modal */}
      {isEditMode && editedCreditor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Supplier - {editedCreditor.id}</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editedCreditor.name}
                  onChange={(e) => setEditedCreditor({ ...editedCreditor, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={editedCreditor.phone}
                  onChange={(e) => setEditedCreditor({ ...editedCreditor, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editedCreditor.email || ''}
                  onChange={(e) => setEditedCreditor({ ...editedCreditor, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms (Days)</label>
                <select
                  value={editedCreditor.paymentTerms || '30'}
                  onChange={(e) => setEditedCreditor({ ...editedCreditor, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={editedCreditor.address || ''}
                  onChange={(e) => setEditedCreditor({ ...editedCreditor, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                onClick={handleSaveCreditor}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KES)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Optional payment notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
