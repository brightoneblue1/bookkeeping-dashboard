import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, RefreshCw, Download } from 'lucide-react';

interface ProfitData {
  openingStockByPurchase: number;
  openingStockBySale: number;
  closingStockByPurchase: number;
  closingStockBySale: number;
  totalPurchase: number;
  totalSales: number;
  totalStockAdjustment: number;
  totalExpense: number;
  totalPurchaseShipping: number;
  purchaseAdditionalExpenses: number;
  totalTransferShipping: number;
  totalSellDiscount: number;
  totalCustomerReward: number;
  totalSellReturn: number;
  totalSellShipping: number;
  sellAdditionalExpenses: number;
  totalStockRecovered: number;
  totalPurchaseReturn: number;
  totalPurchaseDiscount: number;
  totalSellRoundOff: number;
}

export function TodaysProfit() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [profitData, setProfitData] = useState<ProfitData>({
    openingStockByPurchase: 0,
    openingStockBySale: 0,
    closingStockByPurchase: 0,
    closingStockBySale: 0,
    totalPurchase: 0,
    totalSales: 0,
    totalStockAdjustment: 0,
    totalExpense: 0,
    totalPurchaseShipping: 0,
    purchaseAdditionalExpenses: 0,
    totalTransferShipping: 0,
    totalSellDiscount: 0,
    totalCustomerReward: 0,
    totalSellReturn: 0,
    totalSellShipping: 0,
    sellAdditionalExpenses: 0,
    totalStockRecovered: 0,
    totalPurchaseReturn: 0,
    totalPurchaseDiscount: 0,
    totalSellRoundOff: 0
  });

  const [grossProfit, setGrossProfit] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  useEffect(() => {
    calculateProfitData();
  }, [selectedDate]);

  function calculateProfitData() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');

    const today = new Date(selectedDate);
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Calculate opening stock (using previous day's closing stock)
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let openingStockByPurchase = 0;
    let openingStockBySale = 0;
    
    products.forEach((product: any) => {
      const qty = product.quantity || 0;
      openingStockByPurchase += qty * (product.buyingPrice || 0);
      openingStockBySale += qty * (product.sellingPrice || 0);
    });

    // Calculate closing stock (current stock)
    let closingStockByPurchase = 0;
    let closingStockBySale = 0;
    
    products.forEach((product: any) => {
      const qty = product.quantity || 0;
      closingStockByPurchase += qty * (product.buyingPrice || 0);
      closingStockBySale += qty * (product.sellingPrice || 0);
    });

    // Filter today's sales
    const todaysSales = sales.filter((sale: any) => {
      const saleDate = new Date(sale.date);
      return saleDate >= startOfDay && saleDate <= endOfDay;
    });

    // Filter today's purchases
    const todaysPurchases = purchases.filter((purchase: any) => {
      const purchaseDate = new Date(purchase.date);
      return purchaseDate >= startOfDay && purchaseDate <= endOfDay;
    });

    // Calculate total sales
    const totalSales = todaysSales.reduce((sum: number, sale: any) => {
      return sum + (sale.totalAmount || sale.total || 0);
    }, 0);

    // Calculate total purchases
    const totalPurchase = todaysPurchases.reduce((sum: number, purchase: any) => {
      if (purchase.type === 'purchase') {
        return sum + (purchase.amount || 0);
      }
      return sum;
    }, 0);

    // Calculate total expenses
    const totalExpense = todaysPurchases.reduce((sum: number, purchase: any) => {
      if (purchase.type === 'expense') {
        return sum + (purchase.amount || 0);
      }
      return sum;
    }, 0);

    // Calculate discounts and adjustments
    const totalSellDiscount = todaysSales.reduce((sum: number, sale: any) => {
      return sum + (sale.discount || 0);
    }, 0);

    const totalPurchaseDiscount = todaysPurchases.reduce((sum: number, purchase: any) => {
      return sum + (purchase.discount || 0);
    }, 0);

    // Calculate shipping charges
    const totalPurchaseShipping = todaysPurchases.reduce((sum: number, purchase: any) => {
      return sum + (purchase.shippingCharge || 0);
    }, 0);

    const totalSellShipping = todaysSales.reduce((sum: number, sale: any) => {
      return sum + (sale.shippingCharge || 0);
    }, 0);

    // Calculate additional expenses
    const purchaseAdditionalExpenses = todaysPurchases.reduce((sum: number, purchase: any) => {
      return sum + (purchase.additionalExpenses || 0);
    }, 0);

    const sellAdditionalExpenses = todaysSales.reduce((sum: number, sale: any) => {
      return sum + (sale.additionalExpenses || 0);
    }, 0);

    // Calculate returns
    const totalSellReturn = todaysSales.reduce((sum: number, sale: any) => {
      if (sale.isReturn) {
        return sum + (sale.totalAmount || 0);
      }
      return sum;
    }, 0);

    const totalPurchaseReturn = todaysPurchases.reduce((sum: number, purchase: any) => {
      if (purchase.isReturn) {
        return sum + (purchase.amount || 0);
      }
      return sum;
    }, 0);

    // Calculate customer rewards
    const totalCustomerReward = todaysSales.reduce((sum: number, sale: any) => {
      return sum + (sale.rewardPoints || 0) * 0.1; // Assuming 1 point = KES 0.1
    }, 0);

    // Calculate round off
    const totalSellRoundOff = todaysSales.reduce((sum: number, sale: any) => {
      return sum + (sale.roundOff || 0);
    }, 0);

    // Stock adjustments from transactions
    const todaysTransactions = transactions.filter((txn: any) => {
      const txnDate = new Date(txn.date);
      return txnDate >= startOfDay && txnDate <= endOfDay && txn.type === 'stock_adjustment';
    });

    const totalStockAdjustment = todaysTransactions.reduce((sum: number, txn: any) => {
      return sum + Math.abs(txn.amount || 0);
    }, 0);

    // Transfer shipping
    const totalTransferShipping = todaysTransactions.reduce((sum: number, txn: any) => {
      if (txn.type === 'transfer') {
        return sum + (txn.shippingCharge || 0);
      }
      return sum;
    }, 0);

    // Stock recovered
    const totalStockRecovered = todaysTransactions.reduce((sum: number, txn: any) => {
      if (txn.type === 'stock_recovered') {
        return sum + (txn.amount || 0);
      }
      return sum;
    }, 0);

    const calculatedData: ProfitData = {
      openingStockByPurchase,
      openingStockBySale,
      closingStockByPurchase,
      closingStockBySale,
      totalPurchase,
      totalSales,
      totalStockAdjustment,
      totalExpense,
      totalPurchaseShipping,
      purchaseAdditionalExpenses,
      totalTransferShipping,
      totalSellDiscount,
      totalCustomerReward,
      totalSellReturn,
      totalSellShipping,
      sellAdditionalExpenses,
      totalStockRecovered,
      totalPurchaseReturn,
      totalPurchaseDiscount,
      totalSellRoundOff
    };

    setProfitData(calculatedData);
    calculateProfit(calculatedData);
  }

  function calculateProfit(data: ProfitData) {
    // Gross Profit = (Opening Stock + Purchases) - (Closing Stock + Returns)
    const costOfGoodsSold = 
      data.openingStockByPurchase + 
      data.totalPurchase - 
      data.closingStockByPurchase - 
      data.totalPurchaseReturn;

    const grossRevenue = 
      data.totalSales - 
      data.totalSellReturn - 
      data.totalSellDiscount;

    const calculatedGrossProfit = grossRevenue - costOfGoodsSold;

    // Net Profit = Gross Profit - Expenses + Adjustments
    const calculatedNetProfit = 
      calculatedGrossProfit - 
      data.totalExpense - 
      data.totalPurchaseShipping - 
      data.purchaseAdditionalExpenses - 
      data.totalTransferShipping - 
      data.totalCustomerReward - 
      data.sellAdditionalExpenses +
      data.totalSellShipping +
      data.totalStockRecovered +
      data.totalPurchaseDiscount +
      data.totalSellRoundOff;

    setGrossProfit(calculatedGrossProfit);
    setNetProfit(calculatedNetProfit);
  }

  function formatCurrency(amount: number): string {
    return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function handleExportReport() {
    const reportData = {
      date: selectedDate,
      ...profitData,
      grossProfit,
      netProfit
    };

    const csvContent = Object.entries(reportData)
      .map(([key, value]) => `${key},${value}`)
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit_report_${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today's Profit</h1>
          <p className="text-gray-600 mt-1">Daily profit and loss statement</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={calculateProfitData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Profit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Gross Profit</h3>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(grossProfit)}</p>
          <p className="text-sm opacity-90 mt-2">Revenue - Cost of Goods Sold</p>
        </div>

        <div className={`rounded-lg shadow-lg p-6 text-white ${
          netProfit >= 0 
            ? 'bg-gradient-to-br from-green-500 to-green-600' 
            : 'bg-gradient-to-br from-red-500 to-red-600'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Net Profit</h3>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(netProfit)}</p>
          <p className="text-sm opacity-90 mt-2">Gross Profit - Expenses</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Profit Margin</h3>
          </div>
          <p className="text-3xl font-bold">
            {profitData.totalSales > 0 
              ? ((netProfit / profitData.totalSales) * 100).toFixed(2) 
              : '0.00'}%
          </p>
          <p className="text-sm opacity-90 mt-2">Net Profit / Total Sales</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Opening & Purchases */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Opening Stock & Purchases</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Opening Stock</p>
                <p className="text-xs text-gray-500">(By purchase price)</p>
              </div>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.openingStockByPurchase)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Opening Stock</p>
                <p className="text-xs text-gray-500">(By sale price)</p>
              </div>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.openingStockBySale)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Total purchase:</p>
                <p className="text-xs text-gray-500">(Exc. tax, Discount)</p>
              </div>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.totalPurchase)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <p className="font-medium text-gray-900">Total Stock Adjustment:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.totalStockAdjustment)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <p className="font-medium text-gray-900">Total Expense:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.totalExpense)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <p className="font-medium text-gray-900">Total purchase shipping charge:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.totalPurchaseShipping)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <p className="font-medium text-gray-900">Purchase additional expenses:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.purchaseAdditionalExpenses)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <p className="font-medium text-gray-900">Total transfer shipping charge:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.totalTransferShipping)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <p className="font-medium text-gray-900">Total Sell discount:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.totalSellDiscount)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <p className="font-medium text-gray-900">Total customer reward:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.totalCustomerReward)}</p>
            </div>

            <div className="flex justify-between items-center py-2">
              <p className="font-medium text-gray-900">Total Sell Return:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.totalSellReturn)}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Closing & Sales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Closing Stock & Sales</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Closing stock</p>
                <p className="text-xs text-gray-500">(By purchase price)</p>
              </div>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.closingStockByPurchase)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Closing stock</p>
                <p className="text-xs text-gray-500">(By sale price)</p>
              </div>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.closingStockBySale)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Total Sales:</p>
                <p className="text-xs text-gray-500">(Exc. tax, Discount)</p>
              </div>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.totalSales)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <p className="font-medium text-gray-900">Total sell shipping charge:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.totalSellShipping)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <p className="font-medium text-gray-900">Sell additional expenses:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.sellAdditionalExpenses)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <p className="font-medium text-gray-900">Total Stock Recovered:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.totalStockRecovered)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <p className="font-medium text-gray-900">Total Purchase Return:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.totalPurchaseReturn)}</p>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <p className="font-medium text-gray-900">Total Purchase discount:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.totalPurchaseDiscount)}</p>
            </div>

            <div className="flex justify-between items-center py-2">
              <p className="font-medium text-gray-900">Total sell round off:</p>
              <p className="font-semibold text-gray-900">{formatCurrency(profitData.totalSellRoundOff)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Formula Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Profit Calculation Formula</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Gross Profit =</strong> Total Sales - Cost of Goods Sold</p>
          <p><strong>Cost of Goods Sold =</strong> Opening Stock + Purchases - Closing Stock - Purchase Returns</p>
          <p><strong>Net Profit =</strong> Gross Profit - Total Expenses + Income Adjustments</p>
          <p className="text-xs text-blue-600 mt-2">* All figures exclude tax and include applicable discounts</p>
        </div>
      </div>
    </div>
  );
}
