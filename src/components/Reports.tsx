import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, TrendingDown, DollarSign, Package, Users, Building, Receipt, Filter, Eye, X } from 'lucide-react';
import { getSales, getPurchases, getProducts, getCustomers, getSuppliers, getTransactions } from '../utils/api';

export function Reports() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [selectedReport, setSelectedReport] = useState('profit-loss');
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [reportFormat, setReportFormat] = useState('pdf');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [salesData, purchasesData, productsData, customersData, suppliersData, transactionsData] = await Promise.all([
        getSales(),
        getPurchases(),
        getProducts(),
        getCustomers(),
        getSuppliers(),
        getTransactions()
      ]);
      setSales(salesData);
      setPurchases(purchasesData);
      setProducts(productsData);
      setCustomers(customersData);
      setSuppliers(suppliersData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getFirstDayOfMonth() {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  }

  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  function filterByDateRange(items: any[]) {
    return items.filter(item => {
      const itemDate = new Date(item.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return itemDate >= start && itemDate <= end;
    });
  }

  function generateProfitLossReport() {
    const filteredSales = filterByDateRange(sales.filter(s => s.status === 'Paid'));
    const filteredPurchases = filterByDateRange(purchases.filter(p => p.status === 'Paid'));

    const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const costOfGoods = filteredPurchases
      .filter(p => p.type !== 'expense')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const expenses = filteredPurchases
      .filter(p => p.type === 'expense' || ['Rent', 'Utilities', 'Salaries', 'Wages', 'Transport', 'Marketing'].includes(p.category))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const grossProfit = totalRevenue - costOfGoods;
    const netProfit = grossProfit - expenses;

    return {
      totalRevenue,
      costOfGoods,
      grossProfit,
      expenses,
      netProfit,
      grossProfitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      netProfitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    };
  }

  function generateSalesReport() {
    const filteredSales = filterByDateRange(sales);
    
    const totalSales = filteredSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const paidSales = filteredSales.filter(s => s.status === 'Paid').reduce((sum, s) => sum + (s.amount || 0), 0);
    const pendingSales = filteredSales.filter(s => s.status === 'Pending').reduce((sum, s) => sum + (s.amount || 0), 0);
    
    const salesByMethod = {
      cash: filteredSales.filter(s => s.method === 'cash').reduce((sum, s) => sum + (s.amount || 0), 0),
      mpesa: filteredSales.filter(s => s.method === 'mpesa').reduce((sum, s) => sum + (s.amount || 0), 0),
      bank: filteredSales.filter(s => s.method === 'bank').reduce((sum, s) => sum + (s.amount || 0), 0),
      credit: filteredSales.filter(s => s.method === 'credit').reduce((sum, s) => sum + (s.amount || 0), 0)
    };

    const topCustomers = customers
      .map(customer => ({
        ...customer,
        totalPurchased: filteredSales
          .filter(s => s.customer === customer.name)
          .reduce((sum, s) => sum + (s.amount || 0), 0)
      }))
      .sort((a, b) => b.totalPurchased - a.totalPurchased)
      .slice(0, 5);

    return {
      totalSales,
      paidSales,
      pendingSales,
      salesCount: filteredSales.length,
      averageSale: filteredSales.length > 0 ? totalSales / filteredSales.length : 0,
      salesByMethod,
      topCustomers
    };
  }

  function generateExpenseReport() {
    const filteredExpenses = filterByDateRange(purchases.filter(p => 
      p.type === 'expense' || ['Rent', 'Utilities', 'Salaries', 'Wages', 'Transport', 'Marketing', 'Maintenance', 'Insurance', 'Other Expenses'].includes(p.category)
    ));

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const expensesByCategory: any = {};
    filteredExpenses.forEach(expense => {
      const category = expense.category || 'Other';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + (expense.amount || 0);
    });

    const expensesByMethod = {
      cash: filteredExpenses.filter(e => e.paymentMethod === 'cash').reduce((sum, e) => sum + (e.amount || 0), 0),
      mpesa: filteredExpenses.filter(e => e.paymentMethod === 'mpesa').reduce((sum, e) => sum + (e.amount || 0), 0),
      bank: filteredExpenses.filter(e => e.paymentMethod === 'bank').reduce((sum, e) => sum + (e.amount || 0), 0),
      cheque: filteredExpenses.filter(e => e.paymentMethod === 'cheque').reduce((sum, e) => sum + (e.amount || 0), 0)
    };

    return {
      totalExpenses,
      expenseCount: filteredExpenses.length,
      averageExpense: filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0,
      expensesByCategory,
      expensesByMethod
    };
  }

  function generateStockValuationReport() {
    const totalStockValue = products.reduce((sum, p) => sum + ((p.buyPrice || 0) * (p.quantity || 0)), 0);
    const totalRetailValue = products.reduce((sum, p) => sum + ((p.sellPrice || 0) * (p.quantity || 0)), 0);
    const potentialProfit = totalRetailValue - totalStockValue;

    const lowStockItems = products.filter(p => (p.quantity || 0) <= (p.reorderLevel || 0));
    const outOfStock = products.filter(p => (p.quantity || 0) === 0);

    const stockByCategory: any = {};
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      const value = (product.buyPrice || 0) * (product.quantity || 0);
      stockByCategory[category] = (stockByCategory[category] || 0) + value;
    });

    return {
      totalItems: products.length,
      totalStockValue,
      totalRetailValue,
      potentialProfit,
      profitMargin: totalStockValue > 0 ? (potentialProfit / totalStockValue) * 100 : 0,
      lowStockItems: lowStockItems.length,
      outOfStock: outOfStock.length,
      stockByCategory
    };
  }

  function generateCashFlowReport() {
    const filteredTransactions = filterByDateRange(transactions);
    const filteredSales = filterByDateRange(sales.filter(s => s.status === 'Paid'));
    const filteredPurchases = filterByDateRange(purchases.filter(p => p.status === 'Paid'));

    const totalInflow = filteredTransactions
      .filter(t => t.type === 'inflow')
      .reduce((sum, t) => sum + (t.amount || 0), 0) + 
      filteredSales.reduce((sum, s) => sum + (s.amount || 0), 0);

    const totalOutflow = filteredTransactions
      .filter(t => t.type === 'outflow')
      .reduce((sum, t) => sum + (t.amount || 0), 0) +
      filteredPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

    const netCashFlow = totalInflow - totalOutflow;

    const cashByAccount = {
      cash: {
        inflow: filteredTransactions.filter(t => t.type === 'inflow' && t.account === 'Cash').reduce((s, t) => s + (t.amount || 0), 0),
        outflow: filteredTransactions.filter(t => t.type === 'outflow' && t.account === 'Cash').reduce((s, t) => s + (t.amount || 0), 0)
      },
      mpesa: {
        inflow: filteredTransactions.filter(t => t.type === 'inflow' && t.account === 'M-Pesa').reduce((s, t) => s + (t.amount || 0), 0),
        outflow: filteredTransactions.filter(t => t.type === 'outflow' && t.account === 'M-Pesa').reduce((s, t) => s + (t.amount || 0), 0)
      },
      bank: {
        inflow: filteredTransactions.filter(t => t.type === 'inflow' && t.account === 'Bank').reduce((s, t) => s + (t.amount || 0), 0),
        outflow: filteredTransactions.filter(t => t.type === 'outflow' && t.account === 'Bank').reduce((s, t) => s + (t.amount || 0), 0)
      }
    };

    return {
      totalInflow,
      totalOutflow,
      netCashFlow,
      cashByAccount
    };
  }

  function generateDebtorsReport() {
    const filteredSales = filterByDateRange(sales.filter(s => s.status === 'Pending'));

    const debtorsWithData = customers.map(customer => {
      const customerSales = filteredSales.filter(s => s.customer === customer.name);
      const totalDebt = customerSales.reduce((sum, s) => sum + (s.amount || 0), 0);
      
      // Calculate aging
      const oldestSale = customerSales.reduce((oldest, sale) => {
        const saleDate = new Date(sale.date);
        const oldestDate = new Date(oldest?.date || new Date());
        return saleDate < oldestDate ? sale : oldest;
      }, customerSales[0]);

      const daysPending = oldestSale ? Math.floor((new Date().getTime() - new Date(oldestSale.date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      let aging = '0-30 days';
      if (daysPending > 90) aging = '>90 days';
      else if (daysPending > 60) aging = '60-90 days';
      else if (daysPending > 30) aging = '30-60 days';

      return {
        ...customer,
        totalDebt,
        aging,
        daysPending
      };
    }).filter(d => d.totalDebt > 0);

    const totalDebt = debtorsWithData.reduce((sum, d) => sum + d.totalDebt, 0);
    const current = debtorsWithData.filter(d => d.aging === '0-30 days').reduce((sum, d) => sum + d.totalDebt, 0);
    const overdue30 = debtorsWithData.filter(d => d.aging === '30-60 days').reduce((sum, d) => sum + d.totalDebt, 0);
    const overdue60 = debtorsWithData.filter(d => d.aging === '60-90 days').reduce((sum, d) => sum + d.totalDebt, 0);
    const overdue90 = debtorsWithData.filter(d => d.aging === '>90 days').reduce((sum, d) => sum + d.totalDebt, 0);

    return {
      totalDebt,
      debtorCount: debtorsWithData.length,
      current,
      overdue30,
      overdue60,
      overdue90,
      debtors: debtorsWithData.sort((a, b) => b.totalDebt - a.totalDebt)
    };
  }

  function generateCreditorsReport() {
    const filteredPurchases = filterByDateRange(purchases.filter(p => p.status === 'Pending'));

    const creditorsWithData = suppliers.map(supplier => {
      const supplierPurchases = filteredPurchases.filter(p => p.supplier === supplier.name);
      const totalOwed = supplierPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const oldestPurchase = supplierPurchases.reduce((oldest, purchase) => {
        const purchaseDate = new Date(purchase.date);
        const oldestDate = new Date(oldest?.date || new Date());
        return purchaseDate < oldestDate ? purchase : oldest;
      }, supplierPurchases[0]);

      const dueDate = oldestPurchase ? new Date(oldestPurchase.date) : new Date();
      dueDate.setDate(dueDate.getDate() + parseInt(supplier.paymentTerms || '30'));
      
      const daysToDue = Math.floor((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      let status = 'current';
      if (daysToDue < 0) status = 'overdue';
      else if (daysToDue <= 7) status = 'due-soon';

      return {
        ...supplier,
        totalOwed,
        dueDate: dueDate.toISOString().split('T')[0],
        daysToDue,
        status
      };
    }).filter(c => c.totalOwed > 0);

    const totalOwed = creditorsWithData.reduce((sum, c) => sum + c.totalOwed, 0);
    const current = creditorsWithData.filter(c => c.status === 'current').reduce((sum, c) => sum + c.totalOwed, 0);
    const dueSoon = creditorsWithData.filter(c => c.status === 'due-soon').reduce((sum, c) => sum + c.totalOwed, 0);
    const overdue = creditorsWithData.filter(c => c.status === 'overdue').reduce((sum, c) => sum + c.totalOwed, 0);

    return {
      totalOwed,
      creditorCount: creditorsWithData.length,
      current,
      dueSoon,
      overdue,
      creditors: creditorsWithData.sort((a, b) => b.totalOwed - a.totalOwed)
    };
  }

  function generateTaxReport() {
    const filteredSales = filterByDateRange(sales.filter(s => s.status === 'Paid'));
    const filteredPurchases = filterByDateRange(purchases);

    const totalSales = filteredSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const vatOnSales = totalSales * 0.16; // 16% VAT

    const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    const vatOnPurchases = totalPurchases * 0.16;

    const netVAT = vatOnSales - vatOnPurchases;

    // PAYE, NHIF, NSSF calculations (simplified)
    const salaryExpenses = filteredPurchases
      .filter(p => p.category === 'Salaries' || p.category === 'Wages')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const payeEstimate = salaryExpenses * 0.30; // Simplified PAYE estimate
    const nhifEstimate = salaryExpenses * 0.0175; // 1.75% estimate
    const nssfEstimate = salaryExpenses * 0.06; // 6% estimate

    return {
      totalSales,
      vatOnSales,
      totalPurchases,
      vatOnPurchases,
      netVAT,
      salaryExpenses,
      payeEstimate,
      nhifEstimate,
      nssfEstimate,
      totalTaxLiability: netVAT + payeEstimate + nhifEstimate + nssfEstimate
    };
  }

  function handleGenerateReport() {
    setShowPreview(true);
  }

  function handleDownloadReport() {
    let reportData: any;
    let reportTitle = '';

    switch (selectedReport) {
      case 'profit-loss':
        reportData = generateProfitLossReport();
        reportTitle = 'Profit & Loss Statement';
        break;
      case 'sales':
        reportData = generateSalesReport();
        reportTitle = 'Sales Report';
        break;
      case 'expenses':
        reportData = generateExpenseReport();
        reportTitle = 'Expense Report';
        break;
      case 'stock':
        reportData = generateStockValuationReport();
        reportTitle = 'Stock Valuation Report';
        break;
      case 'cashflow':
        reportData = generateCashFlowReport();
        reportTitle = 'Cash Flow Statement';
        break;
      case 'debtors':
        reportData = generateDebtorsReport();
        reportTitle = 'Debtors Summary';
        break;
      case 'creditors':
        reportData = generateCreditorsReport();
        reportTitle = 'Creditors Summary';
        break;
      case 'tax':
        reportData = generateTaxReport();
        reportTitle = 'Tax Report';
        break;
    }

    // Create CSV content
    const csvContent = generateCSV(reportData, reportTitle);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportTitle.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert(`${reportTitle} downloaded as CSV!`);
  }

  function generateCSV(data: any, title: string): string {
    let csv = `${title}\n`;
    csv += `Period: ${startDate} to ${endDate}\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Add data rows based on report type
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && !Array.isArray(value)) {
        csv += `\n${key}:\n`;
        Object.entries(value).forEach(([k, v]) => {
          csv += `${k},${v}\n`;
        });
      } else if (!Array.isArray(value)) {
        csv += `${key},${value}\n`;
      }
    });

    return csv;
  }

  const reportTypes = [
    { id: 'profit-loss', name: 'Profit & Loss Statement', icon: TrendingUp, description: 'Income and expenses summary' },
    { id: 'sales', name: 'Sales Report', icon: DollarSign, description: 'Detailed sales analysis' },
    { id: 'expenses', name: 'Expense Report', icon: TrendingDown, description: 'Complete expense breakdown' },
    { id: 'stock', name: 'Stock Valuation Report', icon: Package, description: 'Current inventory value' },
    { id: 'cashflow', name: 'Cash Flow Statement', icon: Receipt, description: 'Cash inflows and outflows' },
    { id: 'debtors', name: 'Debtors Summary', icon: Users, description: 'Customer debt aging report' },
    { id: 'creditors', name: 'Creditors Summary', icon: Building, description: 'Supplier payables report' },
    { id: 'tax', name: 'Tax Report', icon: FileText, description: 'VAT and tax compliance' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-500">Loading report data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Generation</h1>
        <p className="text-gray-600 mt-1">Generate comprehensive business reports and analytics</p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedReport === report.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${selectedReport === report.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-sm ${selectedReport === report.id ? 'text-blue-900' : 'text-gray-900'}`}>
                    {report.name}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">{report.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Report Generator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Report Generator</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {reportTypes.map(report => (
                <option key={report.id} value={report.id}>{report.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select
              value={reportFormat}
              onChange={(e) => setReportFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV/Excel</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Eye className="w-5 h-5" />
            Preview Report
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-5 h-5" />
            Download Report
          </button>
        </div>
      </div>

      {/* Report Preview */}
      {showPreview && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Report Preview</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profit & Loss Preview */}
          {selectedReport === 'profit-loss' && (() => {
            const data = generateProfitLossReport();
            return (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900">Profit & Loss Statement</h3>
                  <p className="text-sm text-gray-600">Period: {startDate} to {endDate}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Revenue</span>
                    <span className="text-lg font-bold text-green-600">KES {data.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pl-4">
                    <span className="text-gray-700">Cost of Goods Sold</span>
                    <span className="text-red-600">KES {data.costOfGoods.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold border-t pt-2">
                    <span className="text-gray-900">Gross Profit</span>
                    <span className="text-blue-600">KES {data.grossProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 pl-4">
                    <span>Gross Profit Margin</span>
                    <span>{data.grossProfitMargin.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center pl-4 mt-3">
                    <span className="text-gray-700">Operating Expenses</span>
                    <span className="text-red-600">KES {data.expenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold border-t-2 border-gray-300 pt-2 mt-2">
                    <span className="text-gray-900">Net Profit</span>
                    <span className={`text-xl ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      KES {data.netProfit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 pl-4">
                    <span>Net Profit Margin</span>
                    <span className={data.netProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {data.netProfitMargin.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Sales Report Preview */}
          {selectedReport === 'sales' && (() => {
            const data = generateSalesReport();
            return (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900">Sales Report</h3>
                  <p className="text-sm text-gray-600">Period: {startDate} to {endDate}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-blue-600">KES {data.totalSales.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Paid</p>
                    <p className="text-2xl font-bold text-green-600">KES {data.paidSales.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">KES {data.pendingSales.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Average Sale</p>
                    <p className="text-2xl font-bold text-purple-600">KES {data.averageSale.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Sales by Payment Method</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Cash</span>
                      <span className="font-semibold">KES {data.salesByMethod.cash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">M-Pesa</span>
                      <span className="font-semibold">KES {data.salesByMethod.mpesa.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Bank</span>
                      <span className="font-semibold">KES {data.salesByMethod.bank.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Credit</span>
                      <span className="font-semibold">KES {data.salesByMethod.credit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {data.topCustomers.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Top 5 Customers</h4>
                    <div className="space-y-2">
                      {data.topCustomers.map((customer, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-gray-700">{customer.name}</span>
                          <span className="font-semibold">KES {customer.totalPurchased.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Expense Report Preview */}
          {selectedReport === 'expenses' && (() => {
            const data = generateExpenseReport();
            return (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900">Expense Report</h3>
                  <p className="text-sm text-gray-600">Period: {startDate} to {endDate}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">KES {data.totalExpenses.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold text-blue-600">{data.expenseCount}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Average Expense</p>
                    <p className="text-2xl font-bold text-purple-600">KES {Math.round(data.averageExpense).toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Expenses by Category</h4>
                  <div className="space-y-2">
                    {Object.entries(data.expensesByCategory).map(([category, amount]: [string, any]) => (
                      <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-700">{category}</span>
                        <span className="font-semibold">KES {amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Stock Valuation Preview */}
          {selectedReport === 'stock' && (() => {
            const data = generateStockValuationReport();
            return (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900">Stock Valuation Report</h3>
                  <p className="text-sm text-gray-600">As of: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-blue-600">{data.totalItems}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Stock Value</p>
                    <p className="text-2xl font-bold text-green-600">KES {Math.round(data.totalStockValue).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Retail Value</p>
                    <p className="text-2xl font-bold text-purple-600">KES {Math.round(data.totalRetailValue).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Potential Profit</p>
                    <p className="text-2xl font-bold text-orange-600">KES {Math.round(data.potentialProfit).toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Stock by Category</h4>
                  <div className="space-y-2">
                    {Object.entries(data.stockByCategory).map(([category, value]: [string, any]) => (
                      <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-700">{category}</span>
                        <span className="font-semibold">KES {Math.round(value).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Cash Flow Preview */}
          {selectedReport === 'cashflow' && (() => {
            const data = generateCashFlowReport();
            return (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900">Cash Flow Statement</h3>
                  <p className="text-sm text-gray-600">Period: {startDate} to {endDate}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Inflow</p>
                    <p className="text-2xl font-bold text-green-600">KES {data.totalInflow.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Outflow</p>
                    <p className="text-2xl font-bold text-red-600">KES {data.totalOutflow.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Net Cash Flow</p>
                    <p className={`text-2xl font-bold ${data.netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      KES {data.netCashFlow.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Debtors Preview */}
          {selectedReport === 'debtors' && (() => {
            const data = generateDebtorsReport();
            return (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900">Debtors Summary</h3>
                  <p className="text-sm text-gray-600">Period: {startDate} to {endDate}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Debt</p>
                    <p className="text-xl font-bold text-blue-600">KES {data.totalDebt.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Current (0-30)</p>
                    <p className="text-xl font-bold text-green-600">KES {data.current.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">60-90 Days</p>
                    <p className="text-xl font-bold text-orange-600">KES {data.overdue60.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">&gt;90 Days</p>
                    <p className="text-xl font-bold text-red-600">KES {data.overdue90.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Creditors Preview */}
          {selectedReport === 'creditors' && (() => {
            const data = generateCreditorsReport();
            return (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900">Creditors Summary</h3>
                  <p className="text-sm text-gray-600">Period: {startDate} to {endDate}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Owed</p>
                    <p className="text-2xl font-bold text-orange-600">KES {data.totalOwed.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Current</p>
                    <p className="text-2xl font-bold text-green-600">KES {data.current.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Due Soon</p>
                    <p className="text-2xl font-bold text-yellow-600">KES {data.dueSoon.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">KES {data.overdue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Tax Report Preview */}
          {selectedReport === 'tax' && (() => {
            const data = generateTaxReport();
            return (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900">Tax Report (KRA)</h3>
                  <p className="text-sm text-gray-600">Period: {startDate} to {endDate}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">VAT Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>VAT on Sales (16%)</span>
                      <span className="font-bold">KES {data.vatOnSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT on Purchases (16%)</span>
                      <span className="font-bold">KES {data.vatOnPurchases.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t-2 pt-2">
                      <span className="font-bold">Net VAT Payable</span>
                      <span className="font-bold text-red-600">KES {data.netVAT.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-xl font-bold">Total Tax Liability</span>
                    <span className="text-2xl font-bold text-red-600">KES {data.totalTaxLiability.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}