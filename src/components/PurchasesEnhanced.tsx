import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Eye, FileText, Download, CheckCircle, Clock, XCircle, RefreshCw, Package, ShoppingCart, RotateCcw, AlertCircle } from 'lucide-react';
import { ExpenseManagement } from './ExpenseManagement';

interface PurchaseRequisition {
  id: string;
  requisitionNo: string;
  date: string;
  requestedBy: string;
  department: string;
  items: PurchaseItem[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  notes?: string;
  createdAt: string;
}

interface PurchaseOrder {
  id: string;
  orderNo: string;
  date: string;
  supplier: string;
  supplierContact?: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  discount: number;
  shippingCharge: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  paymentTerms?: string;
  deliveryDate?: string;
  notes?: string;
  requisitionId?: string;
  createdAt: string;
}

interface Purchase {
  id: string;
  purchaseNo: string;
  date: string;
  supplier: string;
  orderNo?: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  discount: number;
  shippingCharge: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  amountPaid: number;
  notes?: string;
  createdAt: string;
}

interface PurchaseReturn {
  id: string;
  returnNo: string;
  date: string;
  purchaseId: string;
  purchaseNo: string;
  supplier: string;
  items: PurchaseItem[];
  totalAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'completed';
  refundMethod?: string;
  notes?: string;
  createdAt: string;
}

interface PurchaseItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

export function PurchasesEnhanced() {
  const [activeTab, setActiveTab] = useState<'requisitions' | 'orders' | 'purchases' | 'returns' | 'expenses'>('purchases');
  
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'requisition' | 'order' | 'purchase' | 'return' | 'expense'>('purchase');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<PurchaseItem[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSupplier, setFilterSupplier] = useState('all');

  const [formData, setFormData] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    notes: '',
    paymentMethod: 'Cash',
    paymentStatus: 'unpaid',
    amountPaid: 0,
    discount: 0,
    tax: 0,
    shippingCharge: 0,
    requestedBy: '',
    department: '',
    reason: ''
  });

  const expenseCategories = [
    'Rent', 'Utilities', 'Salaries', 'Marketing', 'Transportation',
    'Office Supplies', 'Maintenance', 'Insurance', 'Legal', 'Other'
  ];

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    const storedProducts = localStorage.getItem('products');
    const storedSuppliers = localStorage.getItem('suppliers');
    const storedRequisitions = localStorage.getItem('purchase_requisitions');
    const storedOrders = localStorage.getItem('purchase_orders');
    const storedPurchases = localStorage.getItem('purchases');
    const storedReturns = localStorage.getItem('purchase_returns');
    const storedExpenses = localStorage.getItem('expenses');

    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedSuppliers) setSuppliers(JSON.parse(storedSuppliers));
    if (storedRequisitions) setRequisitions(JSON.parse(storedRequisitions));
    if (storedOrders) setOrders(JSON.parse(storedOrders));
    if (storedPurchases) setPurchases(JSON.parse(storedPurchases));
    if (storedReturns) setReturns(JSON.parse(storedReturns));
    if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
  }

  // Purchase Requisition Functions
  function handleCreateRequisition() {
    if (selectedItems.length === 0) {
      alert('Please add items to the requisition');
      return;
    }

    const totalAmount = selectedItems.reduce((sum, item) => sum + item.total, 0);

    const newRequisition: PurchaseRequisition = {
      id: `REQ-${Date.now()}`,
      requisitionNo: `PR-${Date.now()}`,
      date: formData.date,
      requestedBy: formData.requestedBy,
      department: formData.department,
      items: selectedItems,
      totalAmount,
      status: 'pending',
      notes: formData.notes,
      createdAt: new Date().toISOString()
    };

    const updated = [...requisitions, newRequisition];
    setRequisitions(updated);
    localStorage.setItem('purchase_requisitions', JSON.stringify(updated));

    resetForm();
    setShowModal(false);
    alert('Purchase requisition created successfully!');
  }

  function approveRequisition(id: string) {
    const updated = requisitions.map(req =>
      req.id === id ? { ...req, status: 'approved' as const } : req
    );
    setRequisitions(updated);
    localStorage.setItem('purchase_requisitions', JSON.stringify(updated));
  }

  function convertToOrder(requisition: PurchaseRequisition) {
    const newOrder: PurchaseOrder = {
      id: `ORD-${Date.now()}`,
      orderNo: `PO-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      items: requisition.items,
      subtotal: requisition.totalAmount,
      tax: 0,
      discount: 0,
      shippingCharge: 0,
      totalAmount: requisition.totalAmount,
      status: 'draft',
      requisitionId: requisition.id,
      createdAt: new Date().toISOString()
    };

    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    localStorage.setItem('purchase_orders', JSON.stringify(updatedOrders));

    const updatedReqs = requisitions.map(req =>
      req.id === requisition.id ? { ...req, status: 'converted' as const } : req
    );
    setRequisitions(updatedReqs);
    localStorage.setItem('purchase_requisitions', JSON.stringify(updatedReqs));

    alert('Converted to Purchase Order successfully!');
  }

  // Purchase Order Functions
  function handleCreateOrder() {
    if (selectedItems.length === 0) {
      alert('Please add items to the order');
      return;
    }

    if (!formData.supplier) {
      alert('Please select a supplier');
      return;
    }

    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * (formData.tax / 100);
    const totalAmount = subtotal + tax - formData.discount + formData.shippingCharge;

    const newOrder: PurchaseOrder = {
      id: `ORD-${Date.now()}`,
      orderNo: `PO-${Date.now()}`,
      date: formData.date,
      supplier: formData.supplier,
      items: selectedItems,
      subtotal,
      tax: formData.tax,
      discount: formData.discount,
      shippingCharge: formData.shippingCharge,
      totalAmount,
      status: 'draft',
      paymentTerms: formData.paymentTerms,
      deliveryDate: formData.deliveryDate,
      notes: formData.notes,
      createdAt: new Date().toISOString()
    };

    const updated = [...orders, newOrder];
    setOrders(updated);
    localStorage.setItem('purchase_orders', JSON.stringify(updated));

    resetForm();
    setShowModal(false);
    alert('Purchase order created successfully!');
  }

  function sendOrder(id: string) {
    const updated = orders.map(ord =>
      ord.id === id ? { ...ord, status: 'sent' as const } : ord
    );
    setOrders(updated);
    localStorage.setItem('purchase_orders', JSON.stringify(updated));
    alert('Purchase order sent to supplier!');
  }

  function receiveOrder(order: PurchaseOrder) {
    // Convert to purchase
    const newPurchase: Purchase = {
      id: `PUR-${Date.now()}`,
      purchaseNo: `PUR-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      supplier: order.supplier,
      orderNo: order.orderNo,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      shippingCharge: order.shippingCharge,
      totalAmount: order.totalAmount,
      paymentMethod: 'Cash',
      paymentStatus: 'unpaid',
      amountPaid: 0,
      createdAt: new Date().toISOString()
    };

    const updatedPurchases = [...purchases, newPurchase];
    setPurchases(updatedPurchases);
    localStorage.setItem('purchases', JSON.stringify(updatedPurchases));

    // Update inventory
    updateInventoryFromPurchase(order.items);

    // Update order status
    const updatedOrders = orders.map(ord =>
      ord.id === order.id ? { ...ord, status: 'received' as const } : ord
    );
    setOrders(updatedOrders);
    localStorage.setItem('purchase_orders', JSON.stringify(updatedOrders));

    alert('Order received and converted to purchase!');
  }

  // Purchase Functions
  function handleCreatePurchase() {
    if (selectedItems.length === 0) {
      alert('Please add items to the purchase');
      return;
    }

    if (!formData.supplier) {
      alert('Please select a supplier');
      return;
    }

    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * (formData.tax / 100);
    const totalAmount = subtotal + tax - formData.discount + formData.shippingCharge;

    const newPurchase: Purchase = {
      id: `PUR-${Date.now()}`,
      purchaseNo: `PUR-${Date.now()}`,
      date: formData.date,
      supplier: formData.supplier,
      items: selectedItems,
      subtotal,
      tax: formData.tax,
      discount: formData.discount,
      shippingCharge: formData.shippingCharge,
      totalAmount,
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentStatus,
      amountPaid: formData.amountPaid,
      notes: formData.notes,
      createdAt: new Date().toISOString()
    };

    const updated = [...purchases, newPurchase];
    setPurchases(updated);
    localStorage.setItem('purchases', JSON.stringify(updated));

    // Update inventory
    updateInventoryFromPurchase(selectedItems);

    resetForm();
    setShowModal(false);
    alert('Purchase recorded successfully!');
  }

  function updateInventoryFromPurchase(items: PurchaseItem[]) {
    const updatedProducts = products.map(product => {
      const purchaseItem = items.find(item => item.sku === product.sku);
      if (purchaseItem) {
        return {
          ...product,
          quantity: (product.quantity || 0) + purchaseItem.quantity,
          updatedAt: new Date().toISOString()
        };
      }
      return product;
    });

    setProducts(updatedProducts);
    localStorage.setItem('products', JSON.stringify(updatedProducts));
  }

  // Purchase Return Functions
  function handleCreateReturn() {
    if (selectedItems.length === 0) {
      alert('Please add items to return');
      return;
    }

    if (!formData.purchaseId || !formData.reason) {
      alert('Please select a purchase and provide a reason');
      return;
    }

    const totalAmount = selectedItems.reduce((sum, item) => sum + item.total, 0);

    const newReturn: PurchaseReturn = {
      id: `RET-${Date.now()}`,
      returnNo: `PR-${Date.now()}`,
      date: formData.date,
      purchaseId: formData.purchaseId,
      purchaseNo: formData.purchaseNo,
      supplier: formData.supplier,
      items: selectedItems,
      totalAmount,
      reason: formData.reason,
      status: 'pending',
      notes: formData.notes,
      createdAt: new Date().toISOString()
    };

    const updated = [...returns, newReturn];
    setReturns(updated);
    localStorage.setItem('purchase_returns', JSON.stringify(updated));

    // Reduce inventory
    const updatedProducts = products.map(product => {
      const returnItem = selectedItems.find(item => item.sku === product.sku);
      if (returnItem) {
        return {
          ...product,
          quantity: Math.max(0, (product.quantity || 0) - returnItem.quantity),
          updatedAt: new Date().toISOString()
        };
      }
      return product;
    });

    setProducts(updatedProducts);
    localStorage.setItem('products', JSON.stringify(updatedProducts));

    resetForm();
    setShowModal(false);
    alert('Purchase return created successfully!');
  }

  // Expense Functions
  function handleCreateExpense() {
    if (!formData.category || !formData.amount) {
      alert('Please fill in required fields');
      return;
    }

    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      date: formData.date,
      category: formData.category,
      description: formData.description,
      amount: formData.amount,
      paymentMethod: formData.paymentMethod,
      reference: formData.reference,
      notes: formData.notes
    };

    const updated = [...expenses, newExpense];
    setExpenses(updated);
    localStorage.setItem('expenses', JSON.stringify(updated));

    resetForm();
    setShowModal(false);
    alert('Expense recorded successfully!');
  }

  // Item Management
  function addItem() {
    const product = products.find(p => p.sku === formData.selectedProduct);
    if (!product) {
      alert('Please select a product');
      return;
    }

    if (!formData.quantity || formData.quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    const unitPrice = formData.unitPrice || product.buyingPrice;
    const total = formData.quantity * unitPrice;

    const newItem: PurchaseItem = {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: formData.quantity,
      unitPrice,
      total
    };

    setSelectedItems([...selectedItems, newItem]);
    setFormData({ ...formData, selectedProduct: '', quantity: 0, unitPrice: 0 });
  }

  function removeItem(index: number) {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  }

  function resetForm() {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      notes: '',
      paymentMethod: 'Cash',
      paymentStatus: 'unpaid',
      amountPaid: 0,
      discount: 0,
      tax: 0,
      shippingCharge: 0,
      requestedBy: '',
      department: '',
      reason: '',
      selectedProduct: '',
      quantity: 0,
      unitPrice: 0
    });
    setSelectedItems([]);
  }

  function openEditModal(type: any, item: any) {
    setModalType(type);
    setEditingItem(item);
    
    if (type === 'order' || type === 'purchase') {
      setFormData({
        ...formData,
        date: item.date,
        supplier: item.supplier,
        notes: item.notes,
        discount: item.discount,
        tax: item.tax,
        shippingCharge: item.shippingCharge,
        paymentMethod: item.paymentMethod || 'Cash',
        paymentStatus: item.paymentStatus || 'unpaid',
        amountPaid: item.amountPaid || 0
      });
      setSelectedItems(item.items);
    }
    
    setShowModal(true);
  }

  function handleExport() {
    let data: any[] = [];
    let filename = '';

    switch (activeTab) {
      case 'requisitions':
        data = requisitions;
        filename = 'purchase_requisitions';
        break;
      case 'orders':
        data = orders;
        filename = 'purchase_orders';
        break;
      case 'purchases':
        data = purchases;
        filename = 'purchases';
        break;
      case 'returns':
        data = returns;
        filename = 'purchase_returns';
        break;
      case 'expenses':
        data = expenses;
        filename = 'expenses';
        break;
    }

    const csvContent = JSON.stringify(data, null, 2);
    const blob = new Blob([csvContent], { type: 'text/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      converted: 'bg-blue-100 text-blue-700',
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      received: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      paid: 'bg-green-100 text-green-700',
      partial: 'bg-yellow-100 text-yellow-700',
      unpaid: 'bg-red-100 text-red-700',
      completed: 'bg-green-100 text-green-700'
    };

    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const stats = {
    requisitions: {
      total: requisitions.length,
      pending: requisitions.filter(r => r.status === 'pending').length,
      approved: requisitions.filter(r => r.status === 'approved').length
    },
    orders: {
      total: orders.length,
      draft: orders.filter(o => o.status === 'draft').length,
      sent: orders.filter(o => o.status === 'sent').length,
      totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0)
    },
    purchases: {
      total: purchases.length,
      totalValue: purchases.reduce((sum, p) => sum + p.totalAmount, 0),
      paid: purchases.filter(p => p.paymentStatus === 'paid').length,
      unpaid: purchases.filter(p => p.paymentStatus === 'unpaid').length
    },
    returns: {
      total: returns.length,
      totalValue: returns.reduce((sum, r) => sum + r.totalAmount, 0),
      pending: returns.filter(r => r.status === 'pending').length
    },
    expenses: {
      total: expenses.length,
      totalValue: expenses.reduce((sum, e) => sum + e.amount, 0)
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchases & Expenses</h1>
          <p className="text-gray-600 mt-1">Manage procurement and business expenses</p>
        </div>
        <div className="flex gap-2">
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
              setEditingItem(null);
              setModalType(
                activeTab === 'requisitions' ? 'requisition' :
                activeTab === 'orders' ? 'order' :
                activeTab === 'returns' ? 'return' :
                activeTab === 'expenses' ? 'expense' : 'purchase'
              );
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add New
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('requisitions')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'requisitions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Requisitions ({stats.requisitions.total})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'orders' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <ShoppingCart className="w-4 h-4 inline mr-2" />
          Purchase Orders ({stats.orders.total})
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'purchases' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Purchases ({stats.purchases.total})
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'returns' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <RotateCcw className="w-4 h-4 inline mr-2" />
          Returns ({stats.returns.total})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'expenses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <AlertCircle className="w-4 h-4 inline mr-2" />
          Expenses ({stats.expenses.total})
        </button>
      </div>

      {/* Stats Cards */}
      {activeTab === 'requisitions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Requisitions</p>
            <p className="text-2xl font-bold text-gray-900">{stats.requisitions.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.requisitions.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.requisitions.approved}</p>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.orders.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Draft</p>
            <p className="text-2xl font-bold text-gray-600">{stats.orders.draft}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Sent</p>
            <p className="text-2xl font-bold text-blue-600">{stats.orders.sent}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-green-600">
              KES {stats.orders.totalValue.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'purchases' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Purchases</p>
            <p className="text-2xl font-bold text-gray-900">{stats.purchases.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-blue-600">
              KES {stats.purchases.totalValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Paid</p>
            <p className="text-2xl font-bold text-green-600">{stats.purchases.paid}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Unpaid</p>
            <p className="text-2xl font-bold text-red-600">{stats.purchases.unpaid}</p>
          </div>
        </div>
      )}

      {activeTab === 'returns' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Returns</p>
            <p className="text-2xl font-bold text-gray-900">{stats.returns.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-red-600">
              KES {stats.returns.totalValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.returns.pending}</p>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900">{stats.expenses.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-red-600">
              KES {stats.expenses.totalValue.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'expenses' ? (
        <ExpenseManagement />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {/* Requisitions Table */}
            {activeTab === 'requisitions' && (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Requisition No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Requested By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requisitions.map(req => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.requisitionNo}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(req.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{req.requestedBy}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{req.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{req.items.length} items</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        KES {req.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {req.status === 'pending' && (
                            <button
                              onClick={() => approveRequisition(req.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {req.status === 'approved' && (
                            <button
                              onClick={() => convertToOrder(req)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Convert to Order"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {/* View details */}}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Orders Table */}
            {activeTab === 'orders' && (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Order No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNo}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{order.supplier}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.items.length} items</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        KES {order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {order.status === 'draft' && (
                            <button
                              onClick={() => sendOrder(order.id)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Send to Supplier"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {order.status === 'sent' && (
                            <button
                              onClick={() => receiveOrder(order)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Receive Order"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal('order', order)}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Purchases Table */}
            {activeTab === 'purchases' && (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Purchase No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {purchases.map(purchase => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{purchase.purchaseNo}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(purchase.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{purchase.supplier}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{purchase.items.length} items</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        KES {purchase.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(purchase.paymentStatus)}`}>
                          {purchase.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal('purchase', purchase)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {/* View details */}}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Returns Table */}
            {activeTab === 'returns' && (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Return No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Purchase No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {returns.map(ret => (
                    <tr key={ret.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{ret.returnNo}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(ret.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{ret.purchaseNo}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{ret.supplier}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{ret.items.length} items</td>
                      <td className="px-6 py-4 text-sm font-medium text-red-600">
                        KES {ret.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(ret.status)}`}>
                          {ret.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {/* View details */}}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'requisition' && 'Purchase Requisition'}
                {modalType === 'order' && 'Purchase Order'}
                {modalType === 'purchase' && 'Purchase'}
                {modalType === 'return' && 'Purchase Return'}
                {modalType === 'expense' && 'Expense'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalType === 'expense' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select category</option>
                      {expenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Cash">Cash</option>
                      <option value="M-Pesa">M-Pesa</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateExpense}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Expense
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Form fields for requisition/order/purchase/return */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  {modalType !== 'requisition' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                      <select
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select supplier</option>
                        {suppliers.map(sup => (
                          <option key={sup.id} value={sup.name}>{sup.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {modalType === 'requisition' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Requested By</label>
                        <input
                          type="text"
                          value={formData.requestedBy}
                          onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Items Section */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                  
                  {/* Add Item Form */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <select
                      value={formData.selectedProduct}
                      onChange={(e) => {
                        const product = products.find(p => p.sku === e.target.value);
                        setFormData({ 
                          ...formData, 
                          selectedProduct: e.target.value,
                          unitPrice: product?.buyingPrice || 0
                        });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select product</option>
                      {products.map(prod => (
                        <option key={prod.id} value={prod.sku}>
                          {prod.name} ({prod.sku})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Unit Price"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={addItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Unit Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Total</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">{item.name}</td>
                            <td className="px-4 py-2 text-sm">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm">KES {item.unitPrice.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm font-medium">KES {item.total.toLocaleString()}</td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:bg-red-50 p-1 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 text-right">
                    <p className="text-lg font-bold">
                      Total: KES {selectedItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <button
                  onClick={
                    modalType === 'requisition' ? handleCreateRequisition :
                    modalType === 'order' ? handleCreateOrder :
                    modalType === 'return' ? handleCreateReturn :
                    handleCreatePurchase
                  }
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}