import { useState, useEffect } from 'react';
import { FileText, Download, Search, Calendar, TrendingUp, TrendingDown, DollarSign, Package, Users, Activity, BarChart3, PieChart, FileSpreadsheet } from 'lucide-react';

type ReportType = 
  | 'profit-loss'
  | 'purchase-sale'
  | 'tax'
  | 'supplier-customer'
  | 'customer-groups'
  | 'stock'
  | 'stock-adjustment'
  | 'trending-products'
  | 'items'
  | 'product-purchase'
  | 'product-sell'
  | 'purchase-payment'
  | 'sell-payment'
  | 'expense'
  | 'register'
  | 'sales-rep'
  | 'activity-log';

export function ReportsEnhanced() {
  const [activeReport, setActiveReport] = useState<ReportType>('profit-loss');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');

  // Data from localStorage
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  function loadAllData() {
    // Load all data from localStorage
    const storedSales = localStorage.getItem('sales');
    const storedPurchases = localStorage.getItem('purchases');
    const storedExpenses = localStorage.getItem('expenses');
    const storedProducts = localStorage.getItem('products');
    const storedCustomers = localStorage.getItem('customers');
    const storedSuppliers = localStorage.getItem('suppliers');
    const storedAdjustments = localStorage.getItem('stock_adjustments');
    const storedActivities = localStorage.getItem('activity_log');

    if (storedSales) setSales(JSON.parse(storedSales));
    if (storedPurchases) setPurchases(JSON.parse(storedPurchases));
    if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
    if (storedSuppliers) setSuppliers(JSON.parse(storedSuppliers));
    if (storedAdjustments) setStockAdjustments(JSON.parse(storedAdjustments));
    if (storedActivities) setActivityLog(JSON.parse(storedActivities));
  }

  // Filter data by date range
  function filterByDateRange(data: any[], dateField: string = 'date') {
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      return itemDate >= from && itemDate <= to;
    });
  }

  // Profit & Loss Report
  function generateProfitLossReport() {
    const filteredSales = filterByDateRange(sales);
    const filteredPurchases = filterByDateRange(purchases);
    const filteredExpenses = filterByDateRange(expenses);

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalCOGS = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      totalExpenses,
      netProfit,
      profitMargin,
      salesCount: filteredSales.length,
      purchasesCount: filteredPurchases.length,
      expensesCount: filteredExpenses.length
    };
  }

  // Purchase & Sale Report
  function generatePurchaseSaleReport() {
    const filteredSales = filterByDateRange(sales);
    const filteredPurchases = filterByDateRange(purchases);

    return {
      sales: {
        count: filteredSales.length,
        total: filteredSales.reduce((sum, s) => sum + s.totalAmount, 0),
        items: filteredSales.reduce((sum, s) => sum + (s.items?.length || 0), 0)
      },
      purchases: {
        count: filteredPurchases.length,
        total: filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0),
        items: filteredPurchases.reduce((sum, p) => sum + (p.items?.length || 0), 0)
      },
      difference: filteredSales.reduce((sum, s) => sum + s.totalAmount, 0) - 
                  filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0)
    };
  }

  // Tax Report
  function generateTaxReport() {
    const filteredSales = filterByDateRange(sales);
    const filteredPurchases = filterByDateRange(purchases);

    const salesTax = filteredSales.reduce((sum, sale) => {
      const taxAmount = sale.subtotal * (sale.tax / 100);
      return sum + taxAmount;
    }, 0);

    const purchasesTax = filteredPurchases.reduce((sum, purchase) => {
      const taxAmount = purchase.subtotal * (purchase.tax / 100);
      return sum + taxAmount;
    }, 0);

    return {
      salesTax,
      purchasesTax,
      netTax: salesTax - purchasesTax,
      vatRate: 16,
      salesCount: filteredSales.length,
      purchasesCount: filteredPurchases.length
    };
  }

  // Supplier & Customer Report
  function generateSupplierCustomerReport() {
    const filteredSales = filterByDateRange(sales);
    const filteredPurchases = filterByDateRange(purchases);

    const customerStats = customers.map(customer => {
      const customerSales = filteredSales.filter(s => s.customer === customer.name);
      return {
        name: customer.name,
        type: 'customer',
        transactionCount: customerSales.length,
        totalAmount: customerSales.reduce((sum, s) => sum + s.totalAmount, 0),
        lastTransaction: customerSales.length > 0 
          ? new Date(Math.max(...customerSales.map(s => new Date(s.date).getTime())))
          : null
      };
    });

    const supplierStats = suppliers.map(supplier => {
      const supplierPurchases = filteredPurchases.filter(p => p.supplier === supplier.name);
      return {
        name: supplier.name,
        type: 'supplier',
        transactionCount: supplierPurchases.length,
        totalAmount: supplierPurchases.reduce((sum, p) => sum + p.totalAmount, 0),
        lastTransaction: supplierPurchases.length > 0
          ? new Date(Math.max(...supplierPurchases.map(p => new Date(p.date).getTime())))
          : null
      };
    });

    return { customers: customerStats, suppliers: supplierStats };
  }

  // Customer Groups Report
  function generateCustomerGroupsReport() {
    const customerGroups = [...new Set(customers.map(c => c.group || 'Ungrouped'))];
    
    return customerGroups.map(group => {
      const groupCustomers = customers.filter(c => (c.group || 'Ungrouped') === group);
      const groupSales = sales.filter(s => 
        groupCustomers.some(c => c.name === s.customer)
      );

      return {
        groupName: group,
        customerCount: groupCustomers.length,
        totalSales: groupSales.reduce((sum, s) => sum + s.totalAmount, 0),
        transactionCount: groupSales.length,
        averagePerCustomer: groupCustomers.length > 0 
          ? groupSales.reduce((sum, s) => sum + s.totalAmount, 0) / groupCustomers.length
          : 0
      };
    });
  }

  // Stock Report
  function generateStockReport() {
    return products.map(product => ({
      sku: product.sku,
      name: product.name,
      category: product.category,
      currentStock: product.quantity || 0,
      reorderLevel: product.reorderLevel || 0,
      unitCost: product.buyingPrice || 0,
      stockValue: (product.quantity || 0) * (product.buyingPrice || 0),
      sellingPrice: product.sellingPrice || 0,
      potentialValue: (product.quantity || 0) * (product.sellingPrice || 0),
      status: product.quantity === 0 ? 'Out of Stock' : 
              product.quantity <= product.reorderLevel ? 'Low Stock' : 'In Stock'
    }));
  }

  // Stock Adjustment Report
  function generateStockAdjustmentReport() {
    const filtered = filterByDateRange(stockAdjustments);
    
    return {
      adjustments: filtered,
      totalIncrease: filtered
        .filter(a => a.adjustmentType === 'increase')
        .reduce((sum, a) => sum + a.totalQuantity, 0),
      totalDecrease: filtered
        .filter(a => a.adjustmentType === 'decrease')
        .reduce((sum, a) => sum + a.totalQuantity, 0),
      totalValue: filtered.reduce((sum, a) => sum + a.totalValue, 0),
      count: filtered.length
    };
  }

  // Trending Products Report
  function generateTrendingProductsReport() {
    const filteredSales = filterByDateRange(sales);
    
    const productSales: any = {};
    filteredSales.forEach(sale => {
      sale.items?.forEach((item: any) => {
        if (!productSales[item.sku]) {
          productSales[item.sku] = {
            sku: item.sku,
            name: item.name,
            quantitySold: 0,
            revenue: 0,
            transactionCount: 0
          };
        }
        productSales[item.sku].quantitySold += item.quantity;
        productSales[item.sku].revenue += item.total;
        productSales[item.sku].transactionCount += 1;
      });
    });

    return Object.values(productSales)
      .sort((a: any, b: any) => b.quantitySold - a.quantitySold)
      .slice(0, 20);
  }

  // Product Purchase Report
  function generateProductPurchaseReport() {
    const filteredPurchases = filterByDateRange(purchases);
    
    const productPurchases: any = {};
    filteredPurchases.forEach(purchase => {
      purchase.items?.forEach((item: any) => {
        if (!productPurchases[item.sku]) {
          productPurchases[item.sku] = {
            sku: item.sku,
            name: item.name,
            quantityPurchased: 0,
            totalCost: 0,
            averagePrice: 0,
            purchaseCount: 0
          };
        }
        productPurchases[item.sku].quantityPurchased += item.quantity;
        productPurchases[item.sku].totalCost += item.total;
        productPurchases[item.sku].purchaseCount += 1;
      });
    });

    Object.values(productPurchases).forEach((p: any) => {
      p.averagePrice = p.totalCost / p.quantityPurchased;
    });

    return Object.values(productPurchases);
  }

  // Product Sell Report
  function generateProductSellReport() {
    const filteredSales = filterByDateRange(sales);
    
    const productSells: any = {};
    filteredSales.forEach(sale => {
      sale.items?.forEach((item: any) => {
        if (!productSells[item.sku]) {
          productSells[item.sku] = {
            sku: item.sku,
            name: item.name,
            quantitySold: 0,
            totalRevenue: 0,
            averagePrice: 0,
            salesCount: 0
          };
        }
        productSells[item.sku].quantitySold += item.quantity;
        productSells[item.sku].totalRevenue += item.total;
        productSells[item.sku].salesCount += 1;
      });
    });

    Object.values(productSells).forEach((p: any) => {
      p.averagePrice = p.totalRevenue / p.quantitySold;
    });

    return Object.values(productSells);
  }

  // Purchase Payment Report
  function generatePurchasePaymentReport() {
    const filteredPurchases = filterByDateRange(purchases);
    
    return {
      total: filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0),
      paid: filteredPurchases
        .filter(p => p.paymentStatus === 'paid')
        .reduce((sum, p) => sum + p.totalAmount, 0),
      unpaid: filteredPurchases
        .filter(p => p.paymentStatus === 'unpaid')
        .reduce((sum, p) => sum + p.totalAmount, 0),
      partial: filteredPurchases
        .filter(p => p.paymentStatus === 'partial')
        .reduce((sum, p) => sum + p.amountPaid, 0),
      purchases: filteredPurchases
    };
  }

  // Sell Payment Report
  function generateSellPaymentReport() {
    const filteredSales = filterByDateRange(sales);
    
    return {
      total: filteredSales.reduce((sum, s) => sum + s.totalAmount, 0),
      paid: filteredSales
        .filter(s => s.paymentStatus === 'paid')
        .reduce((sum, s) => sum + s.totalAmount, 0),
      unpaid: filteredSales
        .filter(s => s.paymentStatus === 'unpaid')
        .reduce((sum, s) => sum + s.totalAmount, 0),
      partial: filteredSales
        .filter(s => s.paymentStatus === 'partial')
        .reduce((sum, s) => sum + s.amountPaid, 0),
      sales: filteredSales
    };
  }

  // Expense Report
  function generateExpenseReport() {
    const filteredExpenses = filterByDateRange(expenses);
    
    const byCategory: any = {};
    filteredExpenses.forEach(expense => {
      if (!byCategory[expense.category]) {
        byCategory[expense.category] = {
          category: expense.category,
          count: 0,
          total: 0
        };
      }
      byCategory[expense.category].count += 1;
      byCategory[expense.category].total += expense.amount;
    });

    return {
      total: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
      count: filteredExpenses.length,
      byCategory: Object.values(byCategory),
      expenses: filteredExpenses
    };
  }

  // Sales Representative Report
  function generateSalesRepReport() {
    const filteredSales = filterByDateRange(sales);
    
    const repStats: any = {};
    filteredSales.forEach(sale => {
      const rep = sale.createdBy || 'Unknown';
      if (!repStats[rep]) {
        repStats[rep] = {
          name: rep,
          salesCount: 0,
          totalRevenue: 0,
          totalItems: 0
        };
      }
      repStats[rep].salesCount += 1;
      repStats[rep].totalRevenue += sale.totalAmount;
      repStats[rep].totalItems += sale.items?.length || 0;
    });

    return Object.values(repStats);
  }

  function handleExport(reportName: string, data: any) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName}-${dateFrom}-to-${dateTo}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const reports = [
    { id: 'profit-loss', name: 'Profit / Loss Report', icon: TrendingUp, color: 'text-green-600' },
    { id: 'purchase-sale', name: 'Purchase & Sale', icon: BarChart3, color: 'text-blue-600' },
    { id: 'tax', name: 'Tax Report', icon: FileText, color: 'text-purple-600' },
    { id: 'supplier-customer', name: 'Supplier & Customer Report', icon: Users, color: 'text-orange-600' },
    { id: 'customer-groups', name: 'Customer Groups Report', icon: Users, color: 'text-pink-600' },
    { id: 'stock', name: 'Stock Report', icon: Package, color: 'text-indigo-600' },
    { id: 'stock-adjustment', name: 'Stock Adjustment Report', icon: Activity, color: 'text-yellow-600' },
    { id: 'trending-products', name: 'Trending Products', icon: TrendingUp, color: 'text-red-600' },
    { id: 'items', name: 'Items Report', icon: Package, color: 'text-cyan-600' },
    { id: 'product-purchase', name: 'Product Purchase Report', icon: FileSpreadsheet, color: 'text-teal-600' },
    { id: 'product-sell', name: 'Product Sell Report', icon: FileSpreadsheet, color: 'text-lime-600' },
    { id: 'purchase-payment', name: 'Purchase Payment Report', icon: DollarSign, color: 'text-amber-600' },
    { id: 'sell-payment', name: 'Sell Payment Report', icon: DollarSign, color: 'text-emerald-600' },
    { id: 'expense', name: 'Expense Report', icon: TrendingDown, color: 'text-rose-600' },
    { id: 'register', name: 'Register Report', icon: FileText, color: 'text-violet-600' },
    { id: 'sales-rep', name: 'Sales Representative Report', icon: Users, color: 'text-fuchsia-600' },
    { id: 'activity-log', name: 'Activity Log', icon: Activity, color: 'text-sky-600' }
  ];

  // Render report content based on active report
  function renderReportContent() {
    switch (activeReport) {
      case 'profit-loss': {
        const data = generateProfitLossReport();
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <p className="text-sm text-green-700">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  KES {data.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">{data.salesCount} sales</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                <p className="text-sm text-red-700">Total Expenses</p>
                <p className="text-2xl font-bold text-red-900">
                  KES {(data.totalCOGS + data.totalExpenses).toLocaleString()}
                </p>
                <p className="text-xs text-red-600 mt-1">COGS + Expenses</p>
              </div>
              <div className={`${data.netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border rounded-lg p-5`}>
                <p className={`text-sm ${data.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Net Profit</p>
                <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                  KES {data.netProfit.toLocaleString()}
                </p>
                <p className={`text-xs ${data.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'} mt-1`}>
                  {data.profitMargin.toFixed(2)}% margin
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Item</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Revenue</td>
                    <td className="px-6 py-4 text-right text-green-600 font-semibold">
                      {data.totalRevenue.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Cost of Goods Sold</td>
                    <td className="px-6 py-4 text-right text-red-600">
                      ({data.totalCOGS.toLocaleString()})
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">Gross Profit</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {data.grossProfit.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Operating Expenses</td>
                    <td className="px-6 py-4 text-right text-red-600">
                      ({data.totalExpenses.toLocaleString()})
                    </td>
                  </tr>
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="px-6 py-4 font-bold text-gray-900">Net Profit</td>
                    <td className={`px-6 py-4 text-right font-bold text-xl ${data.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {data.netProfit.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'purchase-sale': {
        const data = generatePurchaseSaleReport();
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">
                  KES {data.sales.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{data.sales.count} transactions</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-blue-600">
                  KES {data.purchases.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{data.purchases.count} transactions</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm text-gray-600">Difference</p>
                <p className={`text-2xl font-bold ${data.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  KES {data.difference.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Sales - Purchases</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transactions:</span>
                    <span className="font-semibold">{data.sales.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-semibold">{data.sales.items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Sale:</span>
                    <span className="font-semibold">
                      KES {data.sales.count > 0 ? (data.sales.total / data.sales.count).toLocaleString() : 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transactions:</span>
                    <span className="font-semibold">{data.purchases.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-semibold">{data.purchases.items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Purchase:</span>
                    <span className="font-semibold">
                      KES {data.purchases.count > 0 ? (data.purchases.total / data.purchases.count).toLocaleString() : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'tax': {
        const data = generateTaxReport();
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm text-gray-600">Sales Tax Collected</p>
                <p className="text-2xl font-bold text-green-600">
                  KES {data.salesTax.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">From {data.salesCount} sales</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm text-gray-600">Purchase Tax Paid</p>
                <p className="text-2xl font-bold text-blue-600">
                  KES {data.purchasesTax.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">From {data.purchasesCount} purchases</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm text-gray-600">Net Tax Liability</p>
                <p className={`text-2xl font-bold ${data.netTax >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  KES {Math.abs(data.netTax).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{data.netTax >= 0 ? 'Payable' : 'Receivable'}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">VAT Rate:</span>
                  <span className="font-bold text-xl">{data.vatRate}%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Output VAT (Sales):</span>
                  <span className="font-semibold text-green-700">KES {data.salesTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">Input VAT (Purchases):</span>
                  <span className="font-semibold text-blue-700">KES {data.purchasesTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border-t-2 border-red-200">
                  <span className="font-bold text-gray-900">Net VAT Liability:</span>
                  <span className="font-bold text-xl text-red-700">KES {data.netTax.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'stock': {
        const stockData = generateStockReport();
        const totalValue = stockData.reduce((sum, item) => sum + item.stockValue, 0);
        const outOfStock = stockData.filter(item => item.status === 'Out of Stock').length;
        const lowStock = stockData.filter(item => item.status === 'Low Stock').length;

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stockData.length}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm text-gray-600">Stock Value</p>
                <p className="text-2xl font-bold text-blue-600">
                  KES {totalValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{lowStock}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Stock</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Unit Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Stock Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stockData.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.sku}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold">{item.currentStock}</td>
                      <td className="px-6 py-4 text-sm text-right">KES {item.unitCost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-blue-600">
                        KES {item.stockValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'Out of Stock' ? 'bg-red-100 text-red-700' :
                          item.status === 'Low Stock' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'trending-products': {
        const trendingData = generateTrendingProductsReport();
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 20 Trending Products</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Qty Sold</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {trendingData.map((item: any, index: number) => (
                      <tr key={index} className={index < 3 ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${
                            index === 0 ? 'text-yellow-600' :
                            index === 1 ? 'text-gray-500' :
                            index === 2 ? 'text-orange-600' :
                            'text-gray-900'
                          }`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.sku}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-blue-600">
                          {item.quantitySold}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                          KES {item.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">{item.transactionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }

      case 'expense': {
        const expenseData = generateExpenseReport();
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  KES {expenseData.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{expenseData.count} transactions</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm text-gray-600">Average Expense</p>
                <p className="text-2xl font-bold text-gray-900">
                  KES {expenseData.count > 0 ? (expenseData.total / expenseData.count).toLocaleString() : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per transaction</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-900 p-6 border-b">Expenses by Category</h3>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Count</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenseData.byCategory.map((cat: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.category}</td>
                      <td className="px-6 py-4 text-sm text-right">{cat.count}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-red-600">
                        KES {cat.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        {((cat.total / expenseData.total) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'sales-rep': {
        const repData = generateSalesRepReport();
        const totalRevenue = repData.reduce((sum: number, rep: any) => sum + rep.totalRevenue, 0);
        
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-900 p-6 border-b">Sales by Representative</h3>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Representative</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Sales Count</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Total Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Avg Sale</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {repData.map((rep: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{rep.name}</td>
                      <td className="px-6 py-4 text-sm text-right">{rep.salesCount}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                        KES {rep.totalRevenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        KES {(rep.totalRevenue / rep.salesCount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        {totalRevenue > 0 ? ((rep.totalRevenue / totalRevenue) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Report: {reports.find(r => r.id === activeReport)?.name}
            </h3>
            <p className="text-gray-600">This report is under development</p>
          </div>
        );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive business intelligence and reporting</p>
        </div>
        <button
          onClick={() => handleExport(activeReport, renderReportContent())}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                const today = new Date();
                setDateFrom(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
                setDateTo(today.toISOString().split('T')[0]);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              This Month
            </button>
            <button
              onClick={() => {
                const today = new Date();
                setDateFrom(new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]);
                setDateTo(today.toISOString().split('T')[0]);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              This Year
            </button>
          </div>
        </div>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id as ReportType)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                activeReport === report.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Icon className={`w-6 h-6 ${activeReport === report.id ? 'text-blue-600' : report.color} mb-2`} />
              <h3 className={`font-semibold text-sm ${activeReport === report.id ? 'text-blue-900' : 'text-gray-900'}`}>
                {report.name}
              </h3>
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      <div className="bg-gray-50 rounded-lg p-6">
        {renderReportContent()}
      </div>
    </div>
  );
}
