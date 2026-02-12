import { useState, useEffect, useRef } from 'react';
import { Search, Barcode, Trash2, ShoppingCart, CreditCard, Smartphone, Banknote, UserCheck, Receipt, Printer, X, Plus, Minus } from 'lucide-react';
import { getProducts, getCustomers, createSale } from '../utils/api';

export function POS() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [amountReceived, setAmountReceived] = useState(0);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    // Focus barcode input on mount
    barcodeInputRef.current?.focus();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [productsData, customersData] = await Promise.all([
        getProducts(),
        getCustomers()
      ]);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleBarcodeInput(e: React.FormEvent) {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    // Find product by SKU (barcode)
    const product = products.find(p => p.sku === barcodeInput.trim());
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      alert('Product not found with barcode: ' + barcodeInput);
      setBarcodeInput('');
    }
  }

  function addToCart(product: any, quantity: number = 1) {
    if (product.quantity < 1) {
      alert('Product out of stock!');
      return;
    }

    const existingIndex = cart.findIndex(item => item.sku === product.sku);
    
    if (existingIndex >= 0) {
      const newCart = [...cart];
      const newQuantity = newCart[existingIndex].quantity + quantity;
      
      if (newQuantity > product.quantity) {
        alert(`Only ${product.quantity} units available!`);
        return;
      }
      
      newCart[existingIndex].quantity = newQuantity;
      setCart(newCart);
    } else {
      setCart([...cart, {
        ...product,
        cartQuantity: quantity,
        price: product.sellPrice
      }]);
    }
  }

  function updateCartQuantity(sku: string, newQuantity: number) {
    if (newQuantity < 1) {
      removeFromCart(sku);
      return;
    }

    const product = products.find(p => p.sku === sku);
    if (product && newQuantity > product.quantity) {
      alert(`Only ${product.quantity} units available!`);
      return;
    }

    setCart(cart.map(item => 
      item.sku === sku ? { ...item, cartQuantity: newQuantity } : item
    ));
  }

  function removeFromCart(sku: string) {
    setCart(cart.filter(item => item.sku !== sku));
  }

  function clearCart() {
    if (confirm('Clear all items from cart?')) {
      setCart([]);
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.cartQuantity || 1)), 0);
  const vat = subtotal * 0.16;
  const total = subtotal + vat;
  const change = amountReceived - total;

  async function handleCompleteSale() {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    if (paymentMethod === 'cash' && amountReceived < total) {
      alert('Insufficient amount received!');
      return;
    }

    try {
      const saleData = {
        customer: selectedCustomer,
        method: paymentMethod,
        amount: subtotal,
        items: cart.map(item => ({
          sku: item.sku,
          name: item.name,
          price: item.price,
          quantity: item.cartQuantity || 1
        })),
        status: paymentMethod === 'credit' ? 'Pending' : 'Paid',
        date: new Date().toISOString().split('T')[0]
      };

      await createSale(saleData);

      // Generate receipt
      generateReceipt({
        ...saleData,
        id: 'INV-' + Date.now(),
        subtotal,
        vat,
        total,
        amountReceived: paymentMethod === 'cash' ? amountReceived : total,
        change: paymentMethod === 'cash' ? change : 0
      });

      // Reset
      setCart([]);
      setSelectedCustomer('Walk-in Customer');
      setPaymentMethod('cash');
      setAmountReceived(0);
      setShowPayment(false);
      
      await loadData();
      alert('Sale completed successfully!');
    } catch (error) {
      console.error('Failed to complete sale:', error);
      alert('Failed to complete sale. Please try again.');
    }
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
          .payment-info { margin: 15px 0; padding: 10px; background: #f0f0f0; }
          .footer { text-align: center; margin-top: 20px; border-top: 2px dashed #000; padding-top: 15px; }
          .footer p { font-size: 11px; margin: 5px 0; }
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
          <p>Cashier: POS Terminal</p>
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
            <span>KES ${sale.subtotal.toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>VAT (16%):</span>
            <span>KES ${Math.round(sale.vat).toLocaleString()}</span>
          </div>
          <div class="totals-row total-final">
            <span>TOTAL:</span>
            <span>KES ${Math.round(sale.total).toLocaleString()}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="payment-info">
          <div class="totals-row">
            <span>Payment Method:</span>
            <span><strong>${sale.method.toUpperCase()}</strong></span>
          </div>
          ${sale.method === 'cash' ? `
          <div class="totals-row">
            <span>Amount Received:</span>
            <span>KES ${Math.round(sale.amountReceived).toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>Change:</span>
            <span><strong>KES ${Math.round(sale.change).toLocaleString()}</strong></span>
          </div>
          ` : ''}
          <div class="totals-row">
            <span>Status:</span>
            <span><strong>${sale.status.toUpperCase()}</strong></span>
          </div>
        </div>

        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>Goods once sold cannot be returned</p>
          <p>Please keep this receipt for your records</p>
          <p style="margin-top: 10px;">VAT Included in Total</p>
          <p>---</p>
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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading POS System...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">POS Terminal</h1>
              <p className="text-blue-100 text-sm">Point of Sale System</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-sm text-blue-100">Time: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Panel - Products */}
          <div className="lg:col-span-2 space-y-4">
            {/* Barcode Scanner */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <form onSubmit={handleBarcodeInput} className="flex gap-2">
                <div className="flex-1 relative">
                  <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan barcode or enter SKU..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product.sku}
                    onClick={() => addToCart(product)}
                    disabled={product.quantity < 1}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      product.quantity < 1
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-500 hover:shadow-md'
                    }`}
                  >
                    <p className="font-semibold text-sm text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                    <p className="text-lg font-bold text-blue-600 mt-2">KES {product.sellPrice}</p>
                    <p className={`text-xs mt-1 ${product.quantity < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                      Stock: {product.quantity}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Cart & Payment */}
          <div className="lg:col-span-1 space-y-4">
            {/* Cart */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Cart ({cart.length})</h2>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Cart is empty</p>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">KES {item.price}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.sku)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQuantity(item.sku, (item.cartQuantity || 1) - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-medium">{item.cartQuantity || 1}</span>
                          <button
                            onClick={() => updateCartQuantity(item.sku, (item.cartQuantity || 1) + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="font-bold text-blue-600">
                          KES {((item.price * (item.cartQuantity || 1))).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Customer Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Walk-in Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Summary */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">KES {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT (16%):</span>
                  <span className="font-medium">KES {Math.round(vat).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span className="text-blue-600">KES {Math.round(total).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={() => setShowPayment(true)}
                disabled={cart.length === 0}
                className="w-full mt-4 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
              <button
                onClick={() => setShowPayment(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Total Display */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-blue-600">KES {Math.round(total).toLocaleString()}</p>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cash', icon: Banknote, label: 'Cash' },
                  { id: 'mpesa', icon: Smartphone, label: 'M-Pesa' },
                  { id: 'bank', icon: CreditCard, label: 'Bank' },
                  { id: 'credit', icon: UserCheck, label: 'Credit' }
                ].map(method => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        paymentMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-1 ${paymentMethod === method.id ? 'text-blue-600' : 'text-gray-600'}`} />
                      <p className="text-xs font-medium text-gray-700">{method.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Payment */}
            {paymentMethod === 'cash' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Received</label>
                <input
                  type="number"
                  value={amountReceived || ''}
                  onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                />
                {amountReceived > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Change:</span>
                      <span className="text-lg font-bold text-green-600">
                        KES {Math.max(0, Math.round(change)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Complete Sale Button */}
            <button
              onClick={handleCompleteSale}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Complete Sale & Print Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
