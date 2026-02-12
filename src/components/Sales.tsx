import { useState, useEffect } from 'react';
import { Plus, Filter, Download, Eye, CreditCard, Smartphone, Banknote, UserCheck, X, ShoppingCart, AlertTriangle, Receipt, FileText, Printer } from 'lucide-react';
import { getSales, createSale, getProducts, getCustomers, updateProduct } from '../utils/api';

export function Sales() {
  const [showNewSale, setShowNewSale] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [filterMethod, setFilterMethod] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSale, setEditedSale] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    customer: 'Walk-in Customer',
    items: [] as any[],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [salesData, productsData, customersData] = await Promise.all([
        getSales(),
        getProducts(),
        getCustomers()
      ]);
      setSales(salesData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function addItemToSale() {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    const product = products.find(p => p.sku === selectedProduct);
    if (!product) {
      alert('Product not found');
      return;
    }

    // Check stock availability
    if (product.quantity < saleQuantity) {
      alert(`Insufficient stock! Only ${product.quantity} units available.`);
      return;
    }

    // Check if product already in cart
    const existingItemIndex = formData.items.findIndex(item => item.sku === product.sku);
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...formData.items];
      const newQuantity = updatedItems[existingItemIndex].quantity + saleQuantity;
      
      if (product.quantity < newQuantity) {
        alert(`Cannot add more! Only ${product.quantity} units available.`);
        return;
      }
      
      updatedItems[existingItemIndex].quantity = newQuantity;
      setFormData({ ...formData, items: updatedItems });
    } else {
      // Add new item
      const newItem = {
        sku: product.sku,
        name: product.name,
        price: product.sellPrice,
        quantity: saleQuantity,
        availableStock: product.quantity
      };
      setFormData({ ...formData, items: [...formData.items, newItem] });
    }

    setSelectedProduct('');
    setSaleQuantity(1);
  }

  function removeItemFromSale(sku: string) {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.sku !== sku)
    });
  }

  function updateItemQuantity(sku: string, newQuantity: number) {
    const product = products.find(p => p.sku === sku);
    if (product && newQuantity > product.quantity) {
      alert(`Cannot exceed available stock (${product.quantity} units)`);
      return;
    }

    const updatedItems = formData.items.map(item => 
      item.sku === sku ? { ...item, quantity: Math.max(1, newQuantity) } : item
    );
    setFormData({ ...formData, items: updatedItems });
  }

  async function handleCreateSale() {
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    try {
      const total = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Create the sale - backend will handle inventory update
      await createSale({
        customer: formData.customer,
        method: paymentMethod,
        amount: total,
        items: formData.items,
        status: paymentMethod === 'credit' ? 'Pending' : 'Paid',
        date: new Date().toISOString().split('T')[0]
      });

      // Reset form
      setFormData({ customer: 'Walk-in Customer', items: [] });
      setPaymentMethod('cash');
      setShowNewSale(false);
      
      // Reload data to get updated inventory
      await loadData();
      alert('Sale recorded successfully! Inventory updated.');
    } catch (error) {
      console.error('Failed to create sale:', error);
      alert('Failed to record sale. Please try again.');
    }
  }

  function handleExportSales() {
    try {
      // Prepare CSV data
      const headers = ['Invoice #', 'Date', 'Customer', 'Items', 'Amount', 'Method', 'Status'];
      const csvRows = [headers.join(',')];

      const filteredSales = filterMethod === 'all' 
        ? sales 
        : sales.filter(sale => sale.method === filterMethod);

      filteredSales.forEach(sale => {
        const row = [
          sale.id,
          sale.date,
          `\"${sale.customer}\"`,
          sale.items?.length || 0,
          sale.amount || 0,
          sale.method,
          sale.status
        ];
        csvRows.push(row.join(','));
      });

      // Create CSV string
      const csvString = csvRows.join('\\n');

      // Create download link
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Sales data exported successfully!');
    } catch (error) {
      console.error('Failed to export sales:', error);
      alert('Failed to export sales data.');
    }
  }

  function handleEditSale() {
    setIsEditMode(true);
    setEditedSale({ ...selectedSale });
  }

  function handleCancelEdit() {
    setIsEditMode(false);
    setEditedSale(null);
  }

  function updateEditedItemQuantity(sku: string, newQuantity: number) {
    if (!editedSale) return;
    
    const updatedItems = editedSale.items.map((item: any) => 
      item.sku === sku ? { ...item, quantity: Math.max(1, newQuantity) } : item
    );
    
    const newAmount = updatedItems.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0);
    
    setEditedSale({ ...editedSale, items: updatedItems, amount: newAmount });
  }

  function removeEditedItem(sku: string) {
    if (!editedSale) return;
    
    const updatedItems = editedSale.items.filter((item: any) => item.sku !== sku);
    const newAmount = updatedItems.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0);
    
    setEditedSale({ ...editedSale, items: updatedItems, amount: newAmount });
  }

  async function handleSaveSale() {
    if (!editedSale || editedSale.items.length === 0) {
      alert('Sale must have at least one item');
      return;
    }

    try {
      // Update the sale in the sales array
      const updatedSales = sales.map(sale => 
        sale.id === editedSale.id ? editedSale : sale
      );
      setSales(updatedSales);

      // In a real application, you would call an API to update the sale
      // await updateSale(editedSale.id, editedSale);

      setIsEditMode(false);
      setShowSaleDetails(false);
      setEditedSale(null);
      alert('Sale updated successfully!');
    } catch (error) {
      console.error('Failed to update sale:', error);
      alert('Failed to update sale. Please try again.');
    }
  }

  function generateInvoice(sale: any) {
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${sale.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
          .company-info h1 { color: #2563eb; font-size: 28px; margin-bottom: 8px; }
          .company-info p { font-size: 13px; color: #666; line-height: 1.6; }
          .invoice-info { text-align: right; }
          .invoice-info h2 { font-size: 32px; color: #2563eb; margin-bottom: 8px; }
          .invoice-info p { font-size: 13px; color: #666; }
          .bill-to { margin-bottom: 30px; }
          .bill-to h3 { font-size: 14px; color: #666; margin-bottom: 8px; text-transform: uppercase; }
          .bill-to p { font-size: 15px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          thead { background-color: #f3f4f6; }
          th { padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
          td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          .text-right { text-align: right; }
          .summary { display: flex; justify-content: flex-end; margin-bottom: 30px; }
          .summary-box { width: 300px; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .summary-total { border-top: 2px solid #2563eb; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: bold; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
          .footer-info { font-size: 12px; color: #666; line-height: 1.8; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
          .status-paid { background-color: #d1fae5; color: #065f46; }
          .status-pending { background-color: #fed7aa; color: #92400e; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>Your Store Name</h1>
            <p>P.O. Box 12345, Nairobi, Kenya</p>
            <p>Phone: +254 700 000 000</p>
            <p>Email: info@yourstore.com</p>
            <p>PIN: P051234567X</p>
          </div>
          <div class="invoice-info">
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> ${sale.id}</p>
            <p><strong>Date:</strong> ${sale.date}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${sale.status.toLowerCase()}">${sale.status}</span></p>
          </div>
        </div>

        <div class="bill-to">
          <h3>Bill To:</h3>
          <p><strong>${sale.customer}</strong></p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th>SKU</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items?.map((item: any) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.sku}</td>
                <td class="text-right">KES ${item.price.toLocaleString()}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">KES ${(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-box">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>KES ${(sale.amount || 0).toLocaleString()}</span>
            </div>
            <div class="summary-row">
              <span>VAT (16%):</span>
              <span>KES ${Math.round((sale.amount || 0) * 0.16).toLocaleString()}</span>
            </div>
            <div class="summary-row summary-total">
              <span>Total:</span>
              <span>KES ${Math.round((sale.amount || 0) * 1.16).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="footer-info">
            <p><strong>Payment Method:</strong> ${sale.method.charAt(0).toUpperCase() + sale.method.slice(1)}</p>
            <p style="margin-top: 20px;"><strong>Terms & Conditions:</strong></p>
            <p>1. Payment is due within 30 days of invoice date.</p>
            <p>2. Please include the invoice number on your payment.</p>
            <p>3. Goods remain the property of the seller until paid for in full.</p>
            <p style="margin-top: 20px; text-align: center; font-style: italic;">Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
    invoiceWindow.focus();
    setTimeout(() => {
      invoiceWindow.print();
    }, 250);
  }

  function generateReceipt(sale: any) {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${sale.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; color: #000; }
          .receipt-header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
          .receipt-header h1 { font-size: 24px; margin-bottom: 5px; }
          .receipt-header p { font-size: 11px; line-height: 1.5; }
          .receipt-info { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .receipt-info p { font-size: 12px; margin: 3px 0; }
          .items-table { width: 100%; margin-bottom: 15px; }
          .items-table td { padding: 5px 0; font-size: 12px; }
          .item-name { font-weight: bold; }
          .item-details { font-size: 11px; color: #333; }
          .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
          .totals { margin-bottom: 15px; }
          .totals-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; }
          .total-final { font-weight: bold; font-size: 16px; border-top: 2px solid #000; margin-top: 8px; padding-top: 8px; }
          .footer { text-align: center; margin-top: 20px; border-top: 2px dashed #000; padding-top: 15px; }
          .footer p { font-size: 11px; margin: 5px 0; }
          .payment-status { display: inline-block; padding: 3px 8px; border: 1px solid #000; margin: 10px 0; font-size: 11px; font-weight: bold; }
          @media print { 
            body { padding: 10px; }
            @page { size: 80mm auto; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <h1>YOUR STORE NAME</h1>
          <p>P.O. Box 12345, Nairobi, Kenya</p>
          <p>Tel: +254 700 000 000</p>
          <p>PIN: P051234567X</p>
        </div>

        <div class="receipt-info">
          <p><strong>RECEIPT #${sale.id}</strong></p>
          <p>Date: ${sale.date} ${new Date().toLocaleTimeString()}</p>
          <p>Customer: ${sale.customer}</p>
          <p>Served by: Cashier</p>
        </div>

        <table class="items-table">
          ${sale.items?.map((item: any) => `
            <tr>
              <td colspan="3" class="item-name">${item.name}</td>
            </tr>
            <tr>
              <td class="item-details">  ${item.quantity} x KES ${item.price.toLocaleString()}</td>
              <td></td>
              <td align="right" class="item-details"><strong>KES ${(item.price * item.quantity).toLocaleString()}</strong></td>
            </tr>
          `).join('') || ''}
        </table>

        <div class="divider"></div>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>KES ${(sale.amount || 0).toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>VAT (16%):</span>
            <span>KES ${Math.round((sale.amount || 0) * 0.16).toLocaleString()}</span>
          </div>
          <div class="totals-row total-final">
            <span>TOTAL:</span>
            <span>KES ${Math.round((sale.amount || 0) * 1.16).toLocaleString()}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div style="text-align: center;">
          <p style="font-size: 12px; margin: 5px 0;"><strong>Payment Method: ${sale.method.toUpperCase()}</strong></p>
          <p class="payment-status">${sale.status.toUpperCase()}</p>
        </div>

        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>Goods once sold cannot be returned</p>
          <p>Please keep this receipt for your records</p>
          <p style="margin-top: 10px;">---</p>
          <p>Powered by Your POS System</p>
        </div>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
    receiptWindow.focus();
    setTimeout(() => {
      receiptWindow.print();
    }, 250);
  }

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date === today);
  const dailySummary = {
    totalSales: todaySales.reduce((sum, s) => sum + (s.amount || 0), 0),
    cash: todaySales.filter(s => s.method === 'cash').reduce((sum, s) => sum + (s.amount || 0), 0),
    mpesa: todaySales.filter(s => s.method === 'mpesa').reduce((sum, s) => sum + (s.amount || 0), 0),
    bank: todaySales.filter(s => s.method === 'bank').reduce((sum, s) => sum + (s.amount || 0), 0),
    cheque: todaySales.filter(s => s.method === 'cheque').reduce((sum, s) => sum + (s.amount || 0), 0),
    credit: todaySales.filter(s => s.method === 'credit').reduce((sum, s) => sum + (s.amount || 0), 0),
    transactions: todaySales.length
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sales data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600 mt-1">Record and track all sales transactions</p>
        </div>
        <button
          onClick={() => setShowNewSale(!showNewSale)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Sale
        </button>
      </div>

      {/* Daily Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Sales</p>
            <p className="text-xl font-bold text-gray-900">KES {dailySummary.totalSales.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Cash</p>
            <p className="text-xl font-bold text-green-600">KES {dailySummary.cash.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">M-Pesa</p>
            <p className="text-xl font-bold text-emerald-600">KES {dailySummary.mpesa.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Bank</p>
            <p className="text-xl font-bold text-blue-600">KES {dailySummary.bank.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Cheque</p>
            <p className="text-xl font-bold text-purple-600">KES {dailySummary.cheque.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Credit</p>
            <p className="text-xl font-bold text-orange-600">KES {dailySummary.credit.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Transactions</p>
            <p className="text-xl font-bold text-gray-900">{dailySummary.transactions}</p>
          </div>
        </div>
      </div>

      {/* New Sale Form */}
      {showNewSale && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Record New Sale</h2>
          
          {/* Customer Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
              <select 
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Walk-in Customer</option>
                {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: 'cash', icon: Banknote, label: 'Cash' },
                  { id: 'mpesa', icon: Smartphone, label: 'M-Pesa' },
                  { id: 'bank', icon: CreditCard, label: 'Bank' },
                  { id: 'cheque', icon: Receipt, label: 'Cheque' },
                  { id: 'credit', icon: UserCheck, label: 'Credit' }
                ].map(method => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        paymentMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto ${paymentMethod === method.id ? 'text-blue-600' : 'text-gray-600'}`} />
                      <p className="text-xs mt-1 text-gray-700">{method.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Product Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Products</label>
            <div className="flex gap-3">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a product...</option>
                {products.filter(p => p.quantity > 0).map(p => (
                  <option key={p.sku} value={p.sku}>
                    {p.name} - KES {p.sellPrice} (Stock: {p.quantity})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={saleQuantity}
                onChange={(e) => setSaleQuantity(parseInt(e.target.value) || 1)}
                placeholder="Qty"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addItemToSale}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="border border-gray-300 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Items ({formData.items.length})</h3>
            </div>
            
            {formData.items.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No items added yet</p>
            ) : (
              <div className="space-y-2">
                {formData.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">SKU: {item.sku} | Stock: {item.availableStock}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateItemQuantity(item.sku, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.sku, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => updateItemQuantity(item.sku, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 w-20">@ KES {item.price}</p>
                      <p className="font-semibold text-gray-900 w-32 text-right">
                        KES {(item.price * item.quantity).toLocaleString()}
                      </p>
                      <button
                        onClick={() => removeItemFromSale(item.sku)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="border-t-2 border-gray-300 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">KES {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Low Stock Warning */}
          {formData.items.some(item => {
            const product = products.find(p => p.sku === item.sku);
            return product && (product.quantity - item.quantity) <= product.reorderLevel;
          }) && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-900">Low Stock Warning</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Some items will fall below reorder level after this sale. Consider restocking soon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setShowNewSale(false);
                setFormData({ customer: 'Walk-in Customer', items: [] });
                setPaymentMethod('cash');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateSale}
              disabled={formData.items.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Sale - KES {totalAmount.toLocaleString()}
            </button>
          </div>
        </div>
      )}

      {/* Sales History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Sales History</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setFilterMethod('all');
                        setShowFilterMenu(false);
                      }}
                      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                        filterMethod === 'all' ? 'bg-gray-100' : ''
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setFilterMethod('cash');
                        setShowFilterMenu(false);
                      }}
                      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                        filterMethod === 'cash' ? 'bg-gray-100' : ''
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      onClick={() => {
                        setFilterMethod('mpesa');
                        setShowFilterMenu(false);
                      }}
                      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                        filterMethod === 'mpesa' ? 'bg-gray-100' : ''
                      }`}
                    >
                      M-Pesa
                    </button>
                    <button
                      onClick={() => {
                        setFilterMethod('bank');
                        setShowFilterMenu(false);
                      }}
                      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                        filterMethod === 'bank' ? 'bg-gray-100' : ''
                      }`}
                    >
                      Bank
                    </button>
                    <button
                      onClick={() => {
                        setFilterMethod('cheque');
                        setShowFilterMenu(false);
                      }}
                      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                        filterMethod === 'cheque' ? 'bg-gray-100' : ''
                      }`}
                    >
                      Cheque
                    </button>
                    <button
                      onClick={() => {
                        setFilterMethod('credit');
                        setShowFilterMenu(false);
                      }}
                      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                        filterMethod === 'credit' ? 'bg-gray-100' : ''
                      }`}
                    >
                      Credit
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={handleExportSales}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales
                .filter(sale => filterMethod === 'all' || sale.method === filterMethod)
                .slice(0, 10)
                .map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sale.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sale.customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sale.items?.length || 0} item{sale.items?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">KES {(sale.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{sale.method}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        sale.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setShowSaleDetails(true);
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

      {/* Sale Details Modal */}
      {showSaleDetails && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sale Details</h3>
              <button
                onClick={() => setShowSaleDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Invoice #:</p>
              <p className="text-sm font-medium text-gray-900">{selectedSale?.id}</p>
              <p className="text-sm text-gray-600">Date:</p>
              <p className="text-sm font-medium text-gray-900">{selectedSale?.date}</p>
              <p className="text-sm text-gray-600">Customer:</p>
              <p className="text-sm font-medium text-gray-900">{selectedSale?.customer}</p>
              <p className="text-sm text-gray-600">Items:</p>
              <ul className="list-disc list-inside">
                {selectedSale?.items?.map((item: any) => (
                  <li key={item.sku}>
                    {item.name} - KES {item.price} x {item.quantity}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-600">Amount:</p>
              <p className="text-sm font-medium text-gray-900">KES {(selectedSale?.amount || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600">Method:</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{selectedSale?.method}</p>
              <p className="text-sm text-gray-600">Status:</p>
              <p
                className={`text-sm font-medium ${
                  selectedSale?.status === 'Paid' ? 'text-green-700' : 'text-orange-700'
                }`}
              >
                {selectedSale?.status}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => generateInvoice(selectedSale)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FileText className="w-4 h-4" />
                Invoice
              </button>
              <button
                onClick={() => generateReceipt(selectedSale)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Printer className="w-4 h-4" />
                Receipt
              </button>
            </div>
            <div className="mt-2">
              <button
                onClick={handleEditSale}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Edit Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sale Modal */}
      {isEditMode && editedSale && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Sale - {editedSale.id}</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date:</p>
                  <p className="text-sm font-medium text-gray-900">{editedSale.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Customer:</p>
                  <select
                    value={editedSale.customer}
                    onChange={(e) => setEditedSale({ ...editedSale, customer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option>Walk-in Customer</option>
                    {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'cash', icon: Banknote, label: 'Cash' },
                    { id: 'mpesa', icon: Smartphone, label: 'M-Pesa' },
                    { id: 'bank', icon: CreditCard, label: 'Bank' },
                    { id: 'cheque', icon: Receipt, label: 'Cheque' },
                    { id: 'credit', icon: UserCheck, label: 'Credit' }
                  ].map(method => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setEditedSale({ ...editedSale, method: method.id })}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          editedSale.method === method.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mx-auto ${editedSale.method === method.id ? 'text-blue-600' : 'text-gray-600'}`} />
                        <p className="text-xs mt-1 text-gray-700">{method.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEditedSale({ ...editedSale, status: 'Paid' })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      editedSale.status === 'Paid'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`text-sm font-medium ${editedSale.status === 'Paid' ? 'text-green-700' : 'text-gray-700'}`}>
                      Paid
                    </p>
                  </button>
                  <button
                    onClick={() => setEditedSale({ ...editedSale, status: 'Pending' })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      editedSale.status === 'Pending'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`text-sm font-medium ${editedSale.status === 'Pending' ? 'text-orange-700' : 'text-gray-700'}`}>
                      Pending
                    </p>
                  </button>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                <div className="space-y-2">
                  {editedSale.items?.map((item: any) => (
                    <div key={item.sku} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">SKU: {item.sku} | KES {item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateEditedItemQuantity(item.sku, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateEditedItemQuantity(item.sku, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => updateEditedItemQuantity(item.sku, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          +
                        </button>
                        <p className="text-sm font-medium text-gray-900 w-24 text-right">
                          KES {(item.price * item.quantity).toLocaleString()}
                        </p>
                        <button
                          onClick={() => removeEditedItem(item.sku)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 border-gray-300 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    KES {(editedSale.amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSale}
                  disabled={!editedSale.items || editedSale.items.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}