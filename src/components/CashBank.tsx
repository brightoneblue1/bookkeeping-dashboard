import { useState, useEffect } from 'react';
import { Wallet, Smartphone, Building2, ArrowUpRight, ArrowDownRight, AlertCircle, Plus, FileText, Eye, Edit2, Trash2, Download, Filter, X, Bell, CreditCard, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getTransactions, createTransaction, getSales, getPurchases, getCustomers, createCustomer, getSuppliers, createSupplier } from '../utils/api';
import { getAllFinancialInstitutions, getInstitutionsByType, getInstitutionById } from '../utils/bankConfig';

export function CashBank() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'transactions' | 'cheques'>('accounts');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [showNewCheque, setShowNewCheque] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [editedTransaction, setEditedTransaction] = useState<any>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  // Get all available financial institutions
  const allInstitutions = getAllFinancialInstitutions();
  const banks = getInstitutionsByType('bank');
  const mobileMoney = getInstitutionsByType('mobile_money');
  const digitalWallets = getInstitutionsByType('digital_wallet');

  const [transactionForm, setTransactionForm] = useState({
    type: 'inflow',
    description: '',
    account: 'Cash',
    accountType: 'cash',
    institutionId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    reference: '',
    category: 'Sales'
  });

  const [chequeForm, setChequeForm] = useState({
    chequeNumber: '',
    payee: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    bank: 'kcb',
    bankName: 'KCB Bank Kenya',
    status: 'pending'
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-sync on initial load (after data is loaded)
  useEffect(() => {
    if (dataLoaded && !loading && lastSyncTime === 0) {
      // Initial sync on component mount
      handleAutoSync();
    }
  }, [dataLoaded, loading]);

  // Auto-sync every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSyncing) {
        handleAutoSync();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isSyncing]);

  // Auto-sync when tab becomes visible (user switches back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isSyncing) {
        // Only sync if last sync was more than 30 seconds ago (avoid rapid syncs)
        const now = Date.now();
        if (now - lastSyncTime > 30000) {
          handleAutoSync();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSyncing, lastSyncTime]);

  // Check alerts only after data is loaded
  useEffect(() => {
    if (dataLoaded && !loading) {
      checkAlerts();
    }
  }, [dataLoaded, loading, transactions.length, sales.length, purchases.length]);

  async function loadData() {
    try {
      setLoading(true);
      const [txnData, salesData, purchasesData] = await Promise.all([
        getTransactions(),
        getSales(),
        getPurchases()
      ]);
      setTransactions(txnData);
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

  function checkAlerts() {
    const newAlerts = [];
    
    // Cash balance alert
    const cashBalance = calculateAccountBalance('Cash');
    if (cashBalance < 100000 && cashBalance > 0) {
      newAlerts.push({
        id: 'cash-low',
        message: `Cash on hand is below recommended level (KES ${cashBalance.toLocaleString()})`,
        severity: 'warning',
        icon: Wallet
      });
    }

    // Pending cheques alert
    const pendingCheques = transactions.filter(t => t.paymentMethod === 'cheque' && t.status === 'pending');
    if (pendingCheques.length > 0) {
      newAlerts.push({
        id: 'cheques-pending',
        message: `${pendingCheques.length} cheque${pendingCheques.length > 1 ? 's' : ''} pending clearance`,
        severity: 'info',
        icon: FileText
      });
    }

    // Overdue cheques (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const overdueCheques = transactions.filter(t => 
      t.paymentMethod === 'cheque' && 
      t.status === 'pending' && 
      new Date(t.date) < sevenDaysAgo
    );
    if (overdueCheques.length > 0) {
      newAlerts.push({
        id: 'cheques-overdue',
        message: `${overdueCheques.length} cheque${overdueCheques.length > 1 ? 's' : ''} overdue for clearance`,
        severity: 'error',
        icon: AlertCircle
      });
    }

    // Large transaction alert (over 500k)
    const todayTransactions = transactions.filter(t => t.date === new Date().toISOString().split('T')[0]);
    const largeTransactions = todayTransactions.filter(t => t.amount > 500000);
    if (largeTransactions.length > 0) {
      newAlerts.push({
        id: 'large-txn',
        message: `${largeTransactions.length} large transaction${largeTransactions.length > 1 ? 's' : ''} today (over KES 500,000)`,
        severity: 'info',
        icon: AlertCircle
      });
    }

    setAlerts(newAlerts);
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    
    if (!transactionForm.description || transactionForm.amount <= 0) {
      alert('Please fill in all required fields with valid amounts');
      return;
    }

    try {
      const newTransaction = {
        ...transactionForm,
        id: `TXN-${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      await createTransaction(newTransaction);
      
      setTransactionForm({
        type: 'inflow',
        description: '',
        account: 'Cash',
        accountType: 'cash',
        institutionId: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        reference: '',
        category: 'Sales'
      });
      setShowNewTransaction(false);
      await loadData();
      alert('Transaction added successfully!');
    } catch (error) {
      console.error('Failed to add transaction:', error);
      alert('Failed to add transaction. Please try again.');
    }
  }

  async function handleAddCheque(e: React.FormEvent) {
    e.preventDefault();
    
    if (!chequeForm.chequeNumber || !chequeForm.payee || chequeForm.amount <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    const bankInfo = getInstitutionById(chequeForm.bank);

    try {
      await createTransaction({
        type: 'outflow',
        paymentMethod: 'cheque',
        description: `Cheque #${chequeForm.chequeNumber} - ${chequeForm.payee}`,
        account: bankInfo?.name || chequeForm.bankName,
        accountType: 'bank',
        institutionId: chequeForm.bank,
        amount: chequeForm.amount,
        date: chequeForm.date,
        status: chequeForm.status,
        chequeNumber: chequeForm.chequeNumber,
        payee: chequeForm.payee,
        bank: chequeForm.bank,
        bankName: bankInfo?.name || chequeForm.bankName,
        id: `CHQ-${Date.now()}`,
        createdAt: new Date().toISOString()
      });
      
      setChequeForm({
        chequeNumber: '',
        payee: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        bank: 'kcb',
        bankName: 'KCB Bank Kenya',
        status: 'pending'
      });
      setShowNewCheque(false);
      await loadData();
      alert('Cheque issued successfully!');
    } catch (error) {
      console.error('Failed to add cheque:', error);
      alert('Failed to issue cheque. Please try again.');
    }
  }

  async function handleAutoSync() {
    try {
      setIsSyncing(true);
      
      let salesSynced = 0;
      let purchasesSynced = 0;
      let expensesSynced = 0;
      let totalCreated = 0;
      let customersCreated = 0;
      let suppliersCreated = 0;
      const errors = [];

      // Get existing customers and suppliers
      const existingCustomers = await getCustomers();
      const existingSuppliers = await getSuppliers();
      const customerNames = new Set(existingCustomers.map((c: any) => c.name?.toLowerCase()));
      const supplierNames = new Set(existingSuppliers.map((s: any) => s.name?.toLowerCase()));

      // Auto-create customers from sales
      for (const sale of sales) {
        const customerName = sale.customer || sale.customerName;
        if (customerName && customerName !== 'Walk-in Customer' && !customerNames.has(customerName.toLowerCase())) {
          try {
            await createCustomer({
              name: customerName,
              phone: sale.customerPhone || '',
              email: sale.customerEmail || '',
              address: sale.customerAddress || '',
              creditLimit: 50000,
              totalDebt: 0
            });
            customerNames.add(customerName.toLowerCase());
            customersCreated++;
            console.log(`Auto-created customer: ${customerName}`);
          } catch (err) {
            console.error(`Failed to auto-create customer ${customerName}:`, err);
          }
        }
      }

      // Auto-create suppliers from purchases/expenses
      for (const purchase of purchases) {
        const supplierName = purchase.supplier || purchase.payee;
        if (supplierName && !supplierNames.has(supplierName.toLowerCase())) {
          try {
            await createSupplier({
              name: supplierName,
              phone: purchase.supplierPhone || '',
              email: purchase.supplierEmail || '',
              address: purchase.supplierAddress || '',
              totalOwed: 0,
              paymentTerms: '30'
            });
            supplierNames.add(supplierName.toLowerCase());
            suppliersCreated++;
            console.log(`Auto-created supplier: ${supplierName}`);
          } catch (err) {
            console.error(`Failed to auto-create supplier ${supplierName}:`, err);
          }
        }
      }

      // Get existing transaction references to avoid duplicates
      const existingRefs = new Set(transactions.map(t => t.reference).filter(Boolean));

      // Sync paid sales as inflow transactions
      const paidSales = sales.filter(s => s.status === 'Paid');
      
      for (const sale of paidSales) {
        const refId = `SALE-${sale.id}`;
        
        // Skip if already synced
        if (existingRefs.has(refId)) continue;

        try {
          let account = 'Cash';
          let accountType = 'cash';
          let institutionId = '';

          // Map payment method to account
          if (sale.method === 'mpesa') {
            account = 'M-Pesa';
            accountType = 'mobile';
            institutionId = 'mpesa';
          } else if (sale.method === 'bank') {
            account = 'Bank';
            accountType = 'bank';
            institutionId = '';
          } else if (sale.method === 'cheque') {
            account = 'Bank';
            accountType = 'bank';
            institutionId = '';
          }

          await createTransaction({
            type: 'inflow',
            description: `Sale: ${sale.customer || 'Walk-in Customer'} - ${sale.items?.map((i: any) => i.name).join(', ') || 'Items sold'}`,
            account,
            accountType,
            institutionId,
            amount: sale.amount || 0,
            date: sale.date,
            reference: refId,
            category: 'Sales',
            paymentMethod: sale.method,
            id: `TXN-SALE-${Date.now()}-${salesSynced}`,
            createdAt: new Date().toISOString(),
            syncedFrom: 'sales'
          });

          salesSynced++;
          totalCreated++;
        } catch (err) {
          console.error(`Failed to sync sale ${sale.id}:`, err);
          errors.push(`Sale ${sale.id}`);
        }
      }

      // Sync paid purchases & expenses as outflow transactions
      const paidPurchases = purchases.filter(p => p.status === 'Paid');
      
      for (const purchase of paidPurchases) {
        const refId = `PURCHASE-${purchase.id}`;
        
        // Skip if already synced
        if (existingRefs.has(refId)) continue;

        try {
          let account = 'Cash';
          let accountType = 'cash';
          let institutionId = '';

          // Map payment method to account
          if (purchase.paymentMethod === 'mpesa') {
            account = 'M-Pesa';
            accountType = 'mobile';
            institutionId = 'mpesa';
          } else if (purchase.paymentMethod === 'bank') {
            account = 'Bank';
            accountType = 'bank';
            institutionId = '';
          } else if (purchase.paymentMethod === 'cheque') {
            account = 'Bank';
            accountType = 'bank';
            institutionId = '';
          }

          // Determine if it's a purchase (inventory) or expense (operating)
          const isExpense = purchase.type === 'expense' || 
                           purchase.category === 'Rent' || 
                           purchase.category === 'Utilities' ||
                           purchase.category === 'Salaries' ||
                           purchase.category === 'Wages' ||
                           purchase.category === 'Transport' ||
                           purchase.category === 'Marketing' ||
                           purchase.category === 'Maintenance' ||
                           purchase.category === 'Insurance' ||
                           purchase.category === 'Other Expenses';

          const category = isExpense ? 'Expenses' : 'Purchases';
          const description = isExpense 
            ? `Expense: ${purchase.category || 'Operating expense'} - ${purchase.description || purchase.supplier || 'Payment'}`
            : `Purchase from ${purchase.supplier || 'Supplier'} - ${purchase.category || 'Items purchased'}`;

          await createTransaction({
            type: 'outflow',
            description,
            account,
            accountType,
            institutionId,
            amount: purchase.amount || 0,
            date: purchase.date,
            reference: refId,
            category,
            paymentMethod: purchase.paymentMethod,
            id: `TXN-${isExpense ? 'EXPENSE' : 'PURCHASE'}-${Date.now()}-${purchasesSynced}`,
            createdAt: new Date().toISOString(),
            syncedFrom: isExpense ? 'expenses' : 'purchases'
          });

          if (isExpense) {
            expensesSynced++;
          } else {
            purchasesSynced++;
          }
          totalCreated++;
        } catch (err) {
          console.error(`Failed to sync purchase/expense ${purchase.id}:`, err);
          errors.push(`Purchase/Expense ${purchase.id}`);
        }
      }

      // Small delay to ensure transactions are saved
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reload data to show new transactions
      await loadData();

      // Update last sync time
      setLastSyncTime(Date.now());

      // Show summary only if transactions were actually created (not on automatic syncs)
      if (totalCreated > 0 || customersCreated > 0 || suppliersCreated > 0) {
        console.log(`Auto-sync complete: ${customersCreated} customers, ${suppliersCreated} suppliers, ${salesSynced} sales, ${purchasesSynced} purchases, ${expensesSynced} expenses synced`);
        
        // Only show alert for manual sync or if there are errors
        if (errors.length > 0) {
          let message = `✅ Auto-Sync Complete!\n\n📊 Summary:\n• Customers created: ${customersCreated}\n• Suppliers created: ${suppliersCreated}\n• Sales synced: ${salesSynced}\n• Purchases synced: ${purchasesSynced}\n• Expenses synced: ${expensesSynced}\n• Total transactions created: ${totalCreated}\n\n`;
          message += `⚠️ ${errors.length} transaction(s) failed to sync.\n\n`;
          alert(message);
        }
      } else {
        console.log('Auto-sync: All transactions, customers, and suppliers already synced');
      }
    } catch (error) {
      console.error('Failed to auto-sync transactions:', error);
      // Only show error alert for critical failures
      if (lastSyncTime === 0) {
        alert('❌ Initial sync failed. Please try again or add transactions manually.');
      }
    } finally {
      setIsSyncing(false);
    }
  }

  function handleEditTransaction() {
    setIsEditMode(true);
    setEditedTransaction({ ...selectedTransaction });
  }

  function handleCancelEdit() {
    setIsEditMode(false);
    setEditedTransaction(null);
  }

  async function handleSaveTransaction() {
    if (!editedTransaction) return;

    try {
      const updatedTransactions = transactions.map(t => 
        t.id === editedTransaction.id ? editedTransaction : t
      );
      setTransactions(updatedTransactions);

      setIsEditMode(false);
      setShowTransactionDetails(false);
      setEditedTransaction(null);
      alert('Transaction updated successfully!');
    } catch (error) {
      console.error('Failed to update transaction:', error);
      alert('Failed to update transaction. Please try again.');
    }
  }

  async function handleDeleteTransaction() {
    if (!selectedTransaction) return;
    
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      setTransactions(transactions.filter(t => t.id !== selectedTransaction.id));
      setShowTransactionDetails(false);
      alert('Transaction deleted successfully!');
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('Failed to delete transaction. Please try again.');
    }
  }

  function handleExportTransactions() {
    try {
      const headers = ['ID', 'Date', 'Type', 'Account', 'Description', 'Amount', 'Category', 'Reference', 'Institution'];
      const csvRows = [headers.join(',')];

      const filteredTxns = getFilteredTransactions();

      filteredTxns.forEach(txn => {
        const institution = txn.institutionId ? getInstitutionById(txn.institutionId) : null;
        const row = [
          txn.id,
          txn.date,
          txn.type,
          txn.account,
          `"${txn.description}"`,
          txn.amount || 0,
          txn.category || '',
          txn.reference || '',
          institution?.name || ''
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Transactions exported successfully!');
    } catch (error) {
      console.error('Failed to export transactions:', error);
      alert('Failed to export transactions.');
    }
  }

  function calculateAccountBalance(account: string) {
    const txnBalance = transactions
      .filter(t => t.account === account)
      .reduce((sum, t) => sum + (t.type === 'inflow' ? (t.amount || 0) : -(t.amount || 0)), 0);

    let salesBalance = 0;
    if (account === 'Cash') {
      salesBalance = sales
        .filter(s => s.method === 'cash' && s.status === 'Paid')
        .reduce((sum, s) => sum + (s.amount || 0), 0);
    } else if (account === 'M-Pesa') {
      salesBalance = sales
        .filter(s => s.method === 'mpesa' && s.status === 'Paid')
        .reduce((sum, s) => sum + (s.amount || 0), 0);
    } else if (account.includes('Bank') || account === 'Bank') {
      salesBalance = sales
        .filter(s => s.method === 'bank' && s.status === 'Paid')
        .reduce((sum, s) => sum + (s.amount || 0), 0);
    }

    const expensesBalance = purchases
      .filter(p => {
        if (account === 'Cash') return p.paymentMethod === 'cash' && p.status === 'Paid';
        if (account === 'M-Pesa') return p.paymentMethod === 'mpesa' && p.status === 'Paid';
        if (account.includes('Bank') || account === 'Bank') return p.paymentMethod === 'bank' && p.status === 'Paid';
        return false;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return txnBalance + salesBalance - expensesBalance;
  }

  function getFilteredTransactions() {
    return transactions.filter(t => {
      const matchSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = filterType === 'all' || t.type === filterType;
      const matchAccount = filterAccount === 'all' || t.account === filterAccount;
      
      return matchSearch && matchType && matchAccount;
    });
  }

  function getWeeklyCashFlow() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weeklyData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];

      const dayInflow = transactions
        .filter(t => t.date === dateStr && t.type === 'inflow')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const dayOutflow = transactions
        .filter(t => t.date === dateStr && t.type === 'outflow')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const daySales = sales
        .filter(s => s.date === dateStr && s.status === 'Paid')
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const dayPurchases = purchases
        .filter(p => p.date === dateStr && p.status === 'Paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      weeklyData.push({
        day: dayName,
        inflow: dayInflow + daySales,
        outflow: dayOutflow + dayPurchases
      });
    }

    return weeklyData;
  }

  function getTimeSinceLastSync() {
    if (lastSyncTime === 0) return 'Never';
    const seconds = Math.floor((Date.now() - lastSyncTime) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  const accounts = [
    { name: 'Cash', label: 'Cash on Hand', balance: calculateAccountBalance('Cash'), icon: Wallet, color: 'purple' },
    { name: 'M-Pesa', label: 'M-Pesa Business', balance: calculateAccountBalance('M-Pesa'), icon: Smartphone, color: 'emerald' },
    { name: 'Bank', label: 'Bank Accounts', balance: calculateAccountBalance('Bank'), icon: Building2, color: 'blue' },
  ];

  const weeklyFlow = getWeeklyCashFlow();
  const cheques = transactions.filter((t: any) => t.paymentMethod === 'cheque');
  const filteredTransactions = getFilteredTransactions();

  const totalInflow = transactions.filter(t => t.type === 'inflow').reduce((sum, t) => sum + (t.amount || 0), 0) +
                      sales.filter(s => s.status === 'Paid').reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalOutflow = transactions.filter(t => t.type === 'outflow').reduce((sum, t) => sum + (t.amount || 0), 0) +
                       purchases.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (p.amount || 0), 0);
  const netCashFlow = totalInflow - totalOutflow;

  const getAccountColor = (color: string) => {
    const colors = {
      purple: 'bg-purple-50 text-purple-600',
      emerald: 'bg-emerald-50 text-emerald-600',
      blue: 'bg-blue-50 text-blue-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-500">Loading cash & bank data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash & Bank Management</h1>
          <p className="text-gray-600 mt-1">Monitor and reconcile all cash and bank accounts from sales, purchases & expenses</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
          <div className="flex gap-2">
            <button
              onClick={handleAutoSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={() => setShowNewTransaction(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Plus className="w-5 h-5" />
              Add Manual
            </button>
          </div>
          {lastSyncTime > 0 && (
            <p className="text-xs text-gray-500">
              Last synced: {getTimeSinceLastSync()}
            </p>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="w-5 h-5 text-green-600" />
            <p className="text-sm text-gray-600">Total Inflow</p>
          </div>
          <p className="text-3xl font-bold text-green-600">KES {totalInflow.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-5 h-5 text-red-600" />
            <p className="text-sm text-gray-600">Total Outflow</p>
          </div>
          <p className="text-3xl font-bold text-red-600">KES {totalOutflow.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-600">Net Cash Flow</p>
          </div>
          <p className={`text-3xl font-bold ${netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            KES {netCashFlow.toLocaleString()}
          </p>
        </div>
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
                      : alert.severity === 'warning'
                      ? 'bg-orange-50 border-orange-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 ${
                    alert.severity === 'error' 
                      ? 'text-red-600' 
                      : alert.severity === 'warning'
                      ? 'text-orange-600'
                      : 'text-blue-600'
                  }`} />
                  <p className="text-sm text-gray-900 flex-1">{alert.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'accounts'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Accounts Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'transactions'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('cheques')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'cheques'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Cheques
          </button>
        </nav>
      </div>

      {/* Accounts Overview Tab */}
      {activeTab === 'accounts' && (
        <>
          {/* Account Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {accounts.map((account, index) => {
              const Icon = account.icon;
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${getAccountColor(account.color)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-sm mb-1">{account.label}</h3>
                  <p className={`text-2xl font-bold ${account.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    KES {account.balance.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Weekly Cash Flow Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">7-Day Cash Flow</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number) => `KES ${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="inflow" fill="#10b981" name="Inflow" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" fill="#ef4444" name="Outflow" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Available Financial Institutions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Financial Institutions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Kenyan Banks ({banks.filter(b => b.country === 'Kenya').length})</h3>
                <div className="flex flex-wrap gap-2">
                  {banks.filter(b => b.country === 'Kenya').slice(0, 5).map(bank => (
                    <div key={bank.id} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {bank.icon} {bank.name}
                    </div>
                  ))}
                  {banks.filter(b => b.country === 'Kenya').length > 5 && (
                    <div className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      +{banks.filter(b => b.country === 'Kenya').length - 5} more
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Mobile Money ({mobileMoney.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {mobileMoney.slice(0, 5).map(provider => (
                    <div key={provider.id} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                      {provider.icon} {provider.name}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Digital Wallets ({digitalWallets.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {digitalWallets.slice(0, 5).map(wallet => (
                    <div key={wallet.id} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                      {wallet.icon} {wallet.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <>
          {showNewTransaction && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Transaction</h2>
              <form onSubmit={handleAddTransaction}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                    <select
                      value={transactionForm.type}
                      onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="inflow">Inflow (Money In)</option>
                      <option value="outflow">Outflow (Money Out)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Type *</label>
                    <select
                      value={transactionForm.accountType}
                      onChange={(e) => setTransactionForm({ ...transactionForm, accountType: e.target.value, account: '', institutionId: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Account</option>
                      <option value="mobile">Mobile Money</option>
                      <option value="digital">Digital Wallet</option>
                    </select>
                  </div>
                  {transactionForm.accountType === 'cash' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account *</label>
                      <input
                        type="text"
                        value="Cash on Hand"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                  )}
                  {transactionForm.accountType === 'bank' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Bank *</label>
                      <select
                        value={transactionForm.institutionId}
                        onChange={(e) => {
                          const bank = getInstitutionById(e.target.value);
                          setTransactionForm({ ...transactionForm, institutionId: e.target.value, account: bank?.name || '' });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select bank...</option>
                        {banks.map(bank => (
                          <option key={bank.id} value={bank.id}>{bank.icon} {bank.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {transactionForm.accountType === 'mobile' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Provider *</label>
                      <select
                        value={transactionForm.institutionId}
                        onChange={(e) => {
                          const provider = getInstitutionById(e.target.value);
                          setTransactionForm({ ...transactionForm, institutionId: e.target.value, account: provider?.name || '' });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select provider...</option>
                        {mobileMoney.map(provider => (
                          <option key={provider.id} value={provider.id}>{provider.icon} {provider.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {transactionForm.accountType === 'digital' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Wallet *</label>
                      <select
                        value={transactionForm.institutionId}
                        onChange={(e) => {
                          const wallet = getInstitutionById(e.target.value);
                          setTransactionForm({ ...transactionForm, institutionId: e.target.value, account: wallet?.name || '' });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select wallet...</option>
                        {digitalWallets.map(wallet => (
                          <option key={wallet.id} value={wallet.id}>{wallet.icon} {wallet.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KES) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm({ ...transactionForm, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      required
                      value={transactionForm.date}
                      onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={transactionForm.category}
                      onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Sales">Sales</option>
                      <option value="Purchases">Purchases</option>
                      <option value="Expenses">Expenses</option>
                      <option value="Transfer">Transfer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
                    <input
                      type="text"
                      value={transactionForm.reference}
                      onChange={(e) => setTransactionForm({ ...transactionForm, reference: e.target.value })}
                      placeholder="Invoice/Receipt #"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <input
                      type="text"
                      required
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                      placeholder="e.g., Customer Payment, Supplier Payment"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewTransaction(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Save Transaction
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">All Transactions</h2>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Type</div>
                          <button
                            onClick={() => { setFilterType('all'); setShowFilterMenu(false); }}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterType === 'all' ? 'bg-gray-100' : ''}`}
                          >
                            All
                          </button>
                          <button
                            onClick={() => { setFilterType('inflow'); setShowFilterMenu(false); }}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterType === 'inflow' ? 'bg-gray-100' : ''}`}
                          >
                            Inflow
                          </button>
                          <button
                            onClick={() => { setFilterType('outflow'); setShowFilterMenu(false); }}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterType === 'outflow' ? 'bg-gray-100' : ''}`}
                          >
                            Outflow
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleExportTransactions}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{txn.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{txn.date}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {txn.type === 'inflow' ? (
                              <>
                                <ArrowDownRight className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-600">Inflow</span>
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-red-600">Outflow</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{txn.description}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{txn.account}</td>
                        <td className={`px-6 py-4 text-sm font-medium ${txn.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                          {txn.type === 'inflow' ? '+' : '-'}KES {(txn.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedTransaction(txn);
                              setShowTransactionDetails(true);
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

      {/* Cheques Tab */}
      {activeTab === 'cheques' && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cheque Management</h2>
              <p className="text-sm text-gray-600 mt-1">Track issued and received cheques</p>
            </div>
            <button
              onClick={() => setShowNewCheque(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Issue Cheque
            </button>
          </div>

          {/* Cheque Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">Pending Clearance</p>
              <p className="text-3xl font-bold text-yellow-600">
                {cheques.filter(c => c.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">Cleared</p>
              <p className="text-3xl font-bold text-green-600">
                {cheques.filter(c => c.status === 'cleared').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">Bounced</p>
              <p className="text-3xl font-bold text-red-600">
                {cheques.filter(c => c.status === 'bounced').length}
              </p>
            </div>
          </div>

          {showNewCheque && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Issue New Cheque</h2>
              <form onSubmit={handleAddCheque}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cheque Number *</label>
                    <input
                      type="text"
                      required
                      value={chequeForm.chequeNumber}
                      onChange={(e) => setChequeForm({ ...chequeForm, chequeNumber: e.target.value })}
                      placeholder="CHQ-001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payee *</label>
                    <input
                      type="text"
                      required
                      value={chequeForm.payee}
                      onChange={(e) => setChequeForm({ ...chequeForm, payee: e.target.value })}
                      placeholder="Payee name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KES) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={chequeForm.amount}
                      onChange={(e) => setChequeForm({ ...chequeForm, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      required
                      value={chequeForm.date}
                      onChange={(e) => setChequeForm({ ...chequeForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account *</label>
                    <select
                      value={chequeForm.bank}
                      onChange={(e) => {
                        const bank = getInstitutionById(e.target.value);
                        setChequeForm({ ...chequeForm, bank: e.target.value, bankName: bank?.name || '' });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {banks.filter(b => b.supportsCheques).map(bank => (
                        <option key={bank.id} value={bank.id}>{bank.icon} {bank.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={chequeForm.status}
                      onChange={(e) => setChequeForm({ ...chequeForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="cleared">Cleared</option>
                      <option value="bounced">Bounced</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewCheque(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Issue Cheque
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Cheque Register</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cheque #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Bank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cheques.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        No cheques issued yet
                      </td>
                    </tr>
                  ) : (
                    cheques.map((cheque) => (
                      <tr key={cheque.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{cheque.chequeNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{cheque.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{cheque.payee}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{cheque.bankName || cheque.bank}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">KES {(cheque.amount || 0).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            cheque.status === 'cleared' 
                              ? 'bg-green-100 text-green-700' 
                              : cheque.status === 'bounced'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {cheque.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedTransaction(cheque);
                              setShowTransactionDetails(true);
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

      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && !isEditMode && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
              <button
                onClick={() => setShowTransactionDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Transaction ID:</p>
                <p className="text-sm font-medium text-gray-900">{selectedTransaction.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date:</p>
                <p className="text-sm font-medium text-gray-900">{selectedTransaction.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type:</p>
                <div className="flex items-center gap-2">
                  {selectedTransaction.type === 'inflow' ? (
                    <>
                      <ArrowDownRight className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Inflow</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">Outflow</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Account:</p>
                <p className="text-sm font-medium text-gray-900">{selectedTransaction.account}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount:</p>
                <p className={`text-lg font-bold ${selectedTransaction.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedTransaction.type === 'inflow' ? '+' : '-'}KES {(selectedTransaction.amount || 0).toLocaleString()}
                </p>
              </div>
              {selectedTransaction.category && (
                <div>
                  <p className="text-sm text-gray-600">Category:</p>
                  <p className="text-sm font-medium text-gray-900">{selectedTransaction.category}</p>
                </div>
              )}
              {selectedTransaction.reference && (
                <div>
                  <p className="text-sm text-gray-600">Reference:</p>
                  <p className="text-sm font-medium text-gray-900">{selectedTransaction.reference}</p>
                </div>
              )}
              {selectedTransaction.institutionId && (
                <div>
                  <p className="text-sm text-gray-600">Institution:</p>
                  <p className="text-sm font-medium text-gray-900">
                    {getInstitutionById(selectedTransaction.institutionId)?.name || 'N/A'}
                  </p>
                </div>
              )}
              {selectedTransaction.chequeNumber && (
                <div>
                  <p className="text-sm text-gray-600">Cheque Number:</p>
                  <p className="text-sm font-medium text-gray-900">{selectedTransaction.chequeNumber}</p>
                </div>
              )}
              {selectedTransaction.payee && (
                <div>
                  <p className="text-sm text-gray-600">Payee:</p>
                  <p className="text-sm font-medium text-gray-900">{selectedTransaction.payee}</p>
                </div>
              )}
              {selectedTransaction.status && (
                <div>
                  <p className="text-sm text-gray-600">Status:</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    selectedTransaction.status === 'cleared' 
                      ? 'bg-green-100 text-green-700' 
                      : selectedTransaction.status === 'bounced'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedTransaction.status}
                  </span>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Description:</p>
                <p className="text-sm text-gray-900">{selectedTransaction.description}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleEditTransaction}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDeleteTransaction}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {isEditMode && editedTransaction && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Transaction - {editedTransaction.id}</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={editedTransaction.type}
                  onChange={(e) => setEditedTransaction({ ...editedTransaction, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="inflow">Inflow</option>
                  <option value="outflow">Outflow</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
                <input
                  type="text"
                  value={editedTransaction.account}
                  onChange={(e) => setEditedTransaction({ ...editedTransaction, account: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KES)</label>
                <input
                  type="number"
                  value={editedTransaction.amount}
                  onChange={(e) => setEditedTransaction({ ...editedTransaction, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={editedTransaction.date}
                  onChange={(e) => setEditedTransaction({ ...editedTransaction, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={editedTransaction.category || ''}
                  onChange={(e) => setEditedTransaction({ ...editedTransaction, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
                <input
                  type="text"
                  value={editedTransaction.reference || ''}
                  onChange={(e) => setEditedTransaction({ ...editedTransaction, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {editedTransaction.status && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editedTransaction.status}
                    onChange={(e) => setEditedTransaction({ ...editedTransaction, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="cleared">Cleared</option>
                    <option value="bounced">Bounced</option>
                  </select>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={2}
                  value={editedTransaction.description || ''}
                  onChange={(e) => setEditedTransaction({ ...editedTransaction, description: e.target.value })}
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
                onClick={handleSaveTransaction}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
