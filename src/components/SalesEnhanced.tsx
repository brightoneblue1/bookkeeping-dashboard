import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Eye, Download, CheckCircle, Clock, Package, Truck, Tag, Upload, FileText, Copy, ShoppingCart, DollarSign } from 'lucide-react';

interface Sale {
  id: string;
  saleNo: string;
  date: string;
  customer: string;
  customerContact?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  shippingCharge: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  amountPaid: number;
  source: 'manual' | 'pos' | 'quotation' | 'draft';
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  createdAt: string;
}

interface Draft {
  id: string;
  draftNo: string;
  date: string;
  customer: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

interface Quotation {
  id: string;
  quotationNo: string;
  date: string;
  validUntil: string;
  customer: string;
  customerContact?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  shippingCharge: number;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'converted';
  terms?: string;
  notes?: string;
  createdAt: string;
}

interface SaleReturn {
  id: string;
  returnNo: string;
  date: string;
  saleId: string;
  saleNo: string;
  customer: string;
  items: SaleItem[];
  totalAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'completed';
  refundMethod?: string;
  notes?: string;
  createdAt: string;
}

interface Shipment {
  id: string;
  shipmentNo: string;
  saleId: string;
  saleNo: string;
  date: string;
  customer: string;
  deliveryAddress: string;
  items: SaleItem[];
  shippingMethod: string;
  trackingNumber?: string;
  status: 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled';
  estimatedDelivery?: string;
  actualDelivery?: string;
  notes?: string;
  createdAt: string;
}

interface DiscountRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'bulk';
  value: number;
  minQuantity?: number;
  minAmount?: number;
  validFrom: string;
  validUntil: string;
  applicableProducts?: string[];
  status: 'active' | 'inactive';
}

interface SaleItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export function SalesEnhanced() {
  const [activeTab, setActiveTab] = useState<'all' | 'pos' | 'drafts' | 'quotations' | 'returns' | 'shipments' | 'discounts'>('all');
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'sale' | 'draft' | 'quotation' | 'return' | 'shipment' | 'discount'>('sale');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');

  const [formData, setFormData] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    customer: '',
    customerContact: '',
    notes: '',
    paymentMethod: 'Cash',
    paymentStatus: 'unpaid',
    amountPaid: 0,
    discount: 0,
    tax: 16, // Default VAT
    shippingCharge: 0,
    validUntil: '',
    reason: '',
    deliveryAddress: '',
    shippingMethod: 'Standard',
    trackingNumber: '',
    selectedProduct: '',
    quantity: 0,
    unitPrice: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    const storedProducts = localStorage.getItem('products');
    const storedCustomers = localStorage.getItem('customers');
    const storedSales = localStorage.getItem('sales');
    const storedDrafts = localStorage.getItem('sales_drafts');
    const storedQuotations = localStorage.getItem('sales_quotations');
    const storedReturns = localStorage.getItem('sales_returns');
    const storedShipments = localStorage.getItem('shipments');
    const storedDiscounts = localStorage.getItem('discount_rules');

    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
    if (storedSales) setSales(JSON.parse(storedSales));
    if (storedDrafts) setDrafts(JSON.parse(storedDrafts));
    if (storedQuotations) setQuotations(JSON.parse(storedQuotations));
    if (storedReturns) setReturns(JSON.parse(storedReturns));
    if (storedShipments) setShipments(JSON.parse(storedShipments));
    if (storedDiscounts) setDiscountRules(JSON.parse(storedDiscounts));
  }

  // Sale Functions
  function handleCreateSale() {
    if (selectedItems.length === 0) {
      alert('Please add items to the sale');
      return;
    }

    if (!formData.customer) {
      alert('Please select a customer');
      return;
    }

    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (formData.tax / 100);
    const totalAmount = subtotal + taxAmount - formData.discount + formData.shippingCharge;

    const newSale: Sale = {
      id: `SALE-${Date.now()}`,
      saleNo: `S-${Date.now()}`,
      date: formData.date,
      customer: formData.customer,
      customerContact: formData.customerContact,
      items: selectedItems,
      subtotal,
      tax: formData.tax,
      discount: formData.discount,
      shippingCharge: formData.shippingCharge,
      totalAmount,
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentStatus,
      amountPaid: formData.amountPaid,
      source: 'manual',
      status: 'completed',
      notes: formData.notes,
      createdAt: new Date().toISOString()
    };

    const updated = [...sales, newSale];
    setSales(updated);
    localStorage.setItem('sales', JSON.stringify(updated));

    // Update inventory
    updateInventoryFromSale(selectedItems);

    resetForm();
    setShowModal(false);
    alert('Sale created successfully!');
  }

  function updateInventoryFromSale(items: SaleItem[]) {
    const updatedProducts = products.map(product => {
      const saleItem = items.find(item => item.sku === product.sku);
      if (saleItem) {
        return {
          ...product,
          quantity: Math.max(0, (product.quantity || 0) - saleItem.quantity),
          updatedAt: new Date().toISOString()
        };
      }
      return product;
    });

    setProducts(updatedProducts);
    localStorage.setItem('products', JSON.stringify(updatedProducts));
  }

  // Draft Functions
  function handleCreateDraft() {
    if (selectedItems.length === 0) {
      alert('Please add items to the draft');
      return;
    }

    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = subtotal - formData.discount;

    const newDraft: Draft = {
      id: `DRF-${Date.now()}`,
      draftNo: `D-${Date.now()}`,
      date: formData.date,
      customer: formData.customer,
      items: selectedItems,
      subtotal,
      discount: formData.discount,
      totalAmount,
      notes: formData.notes,
      createdBy: 'Current User',
      createdAt: new Date().toISOString()
    };

    const updated = [...drafts, newDraft];
    setDrafts(updated);
    localStorage.setItem('sales_drafts', JSON.stringify(updated));

    resetForm();
    setShowModal(false);
    alert('Draft saved successfully!');
  }

  function convertDraftToSale(draft: Draft) {
    const newSale: Sale = {
      id: `SALE-${Date.now()}`,
      saleNo: `S-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      customer: draft.customer,
      items: draft.items,
      subtotal: draft.subtotal,
      tax: 16,
      discount: draft.discount,
      shippingCharge: 0,
      totalAmount: draft.totalAmount * 1.16,
      paymentMethod: 'Cash',
      paymentStatus: 'unpaid',
      amountPaid: 0,
      source: 'draft',
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    const updatedSales = [...sales, newSale];
    setSales(updatedSales);
    localStorage.setItem('sales', JSON.stringify(updatedSales));

    // Remove draft
    const updatedDrafts = drafts.filter(d => d.id !== draft.id);
    setDrafts(updatedDrafts);
    localStorage.setItem('sales_drafts', JSON.stringify(updatedDrafts));

    // Update inventory
    updateInventoryFromSale(draft.items);

    alert('Draft converted to sale successfully!');
  }

  // Quotation Functions
  function handleCreateQuotation() {
    if (selectedItems.length === 0) {
      alert('Please add items to the quotation');
      return;
    }

    if (!formData.customer || !formData.validUntil) {
      alert('Please fill in required fields');
      return;
    }

    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (formData.tax / 100);
    const totalAmount = subtotal + taxAmount - formData.discount + formData.shippingCharge;

    const newQuotation: Quotation = {
      id: `QUO-${Date.now()}`,
      quotationNo: `Q-${Date.now()}`,
      date: formData.date,
      validUntil: formData.validUntil,
      customer: formData.customer,
      customerContact: formData.customerContact,
      items: selectedItems,
      subtotal,
      tax: formData.tax,
      discount: formData.discount,
      shippingCharge: formData.shippingCharge,
      totalAmount,
      status: 'pending',
      terms: formData.terms,
      notes: formData.notes,
      createdAt: new Date().toISOString()
    };

    const updated = [...quotations, newQuotation];
    setQuotations(updated);
    localStorage.setItem('sales_quotations', JSON.stringify(updated));

    resetForm();
    setShowModal(false);
    alert('Quotation created successfully!');
  }

  function convertQuotationToSale(quotation: Quotation) {
    const newSale: Sale = {
      id: `SALE-${Date.now()}`,
      saleNo: `S-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      customer: quotation.customer,
      customerContact: quotation.customerContact,
      items: quotation.items,
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      discount: quotation.discount,
      shippingCharge: quotation.shippingCharge,
      totalAmount: quotation.totalAmount,
      paymentMethod: 'Cash',
      paymentStatus: 'unpaid',
      amountPaid: 0,
      source: 'quotation',
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    const updatedSales = [...sales, newSale];
    setSales(updatedSales);
    localStorage.setItem('sales', JSON.stringify(updatedSales));

    // Update quotation status
    const updatedQuotations = quotations.map(q =>
      q.id === quotation.id ? { ...q, status: 'converted' as const } : q
    );
    setQuotations(updatedQuotations);
    localStorage.setItem('sales_quotations', JSON.stringify(updatedQuotations));

    // Update inventory
    updateInventoryFromSale(quotation.items);

    alert('Quotation converted to sale successfully!');
  }

  // Return Functions
  function handleCreateReturn() {
    if (selectedItems.length === 0) {
      alert('Please add items to return');
      return;
    }

    if (!formData.saleId || !formData.reason) {
      alert('Please select a sale and provide a reason');
      return;
    }

    const totalAmount = selectedItems.reduce((sum, item) => sum + item.total, 0);

    const newReturn: SaleReturn = {
      id: `RET-${Date.now()}`,
      returnNo: `SR-${Date.now()}`,
      date: formData.date,
      saleId: formData.saleId,
      saleNo: formData.saleNo,
      customer: formData.customer,
      items: selectedItems,
      totalAmount,
      reason: formData.reason,
      status: 'pending',
      notes: formData.notes,
      createdAt: new Date().toISOString()
    };

    const updated = [...returns, newReturn];
    setReturns(updated);
    localStorage.setItem('sales_returns', JSON.stringify(updated));

    // Add inventory back
    const updatedProducts = products.map(product => {
      const returnItem = selectedItems.find(item => item.sku === product.sku);
      if (returnItem) {
        return {
          ...product,
          quantity: (product.quantity || 0) + returnItem.quantity,
          updatedAt: new Date().toISOString()
        };
      }
      return product;
    });

    setProducts(updatedProducts);
    localStorage.setItem('products', JSON.stringify(updatedProducts));

    resetForm();
    setShowModal(false);
    alert('Return created successfully!');
  }

  // Shipment Functions
  function handleCreateShipment() {
    if (!formData.saleId || !formData.deliveryAddress) {
      alert('Please fill in required fields');
      return;
    }

    const sale = sales.find(s => s.id === formData.saleId);
    if (!sale) {
      alert('Sale not found');
      return;
    }

    const newShipment: Shipment = {
      id: `SHIP-${Date.now()}`,
      shipmentNo: `SH-${Date.now()}`,
      saleId: sale.id,
      saleNo: sale.saleNo,
      date: formData.date,
      customer: sale.customer,
      deliveryAddress: formData.deliveryAddress,
      items: sale.items,
      shippingMethod: formData.shippingMethod,
      trackingNumber: formData.trackingNumber,
      status: 'pending',
      estimatedDelivery: formData.estimatedDelivery,
      notes: formData.notes,
      createdAt: new Date().toISOString()
    };

    const updated = [...shipments, newShipment];
    setShipments(updated);
    localStorage.setItem('shipments', JSON.stringify(updated));

    resetForm();
    setShowModal(false);
    alert('Shipment created successfully!');
  }

  function updateShipmentStatus(id: string, status: Shipment['status']) {
    const updated = shipments.map(ship =>
      ship.id === id ? { 
        ...ship, 
        status,
        actualDelivery: status === 'delivered' ? new Date().toISOString() : ship.actualDelivery
      } : ship
    );
    setShipments(updated);
    localStorage.setItem('shipments', JSON.stringify(updated));
  }

  // Discount Functions
  function handleCreateDiscount() {
    if (!formData.discountName || !formData.discountValue) {
      alert('Please fill in required fields');
      return;
    }

    const newDiscount: DiscountRule = {
      id: `DISC-${Date.now()}`,
      name: formData.discountName,
      type: formData.discountType,
      value: formData.discountValue,
      minQuantity: formData.minQuantity,
      minAmount: formData.minAmount,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
      status: 'active'
    };

    const updated = [...discountRules, newDiscount];
    setDiscountRules(updated);
    localStorage.setItem('discount_rules', JSON.stringify(updated));

    resetForm();
    setShowModal(false);
    alert('Discount rule created successfully!');
  }

  // Import Sales
  function handleImportSales(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      
      const imported: Sale[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        
        // Simple import structure
        const sale: Sale = {
          id: `SALE-${Date.now()}-${i}`,
          saleNo: values[0] || `S-${Date.now()}-${i}`,
          date: values[1] || new Date().toISOString().split('T')[0],
          customer: values[2] || 'Walk-in Customer',
          items: [], // Would need to parse items
          subtotal: parseFloat(values[3]) || 0,
          tax: parseFloat(values[4]) || 16,
          discount: parseFloat(values[5]) || 0,
          shippingCharge: parseFloat(values[6]) || 0,
          totalAmount: parseFloat(values[7]) || 0,
          paymentMethod: values[8] || 'Cash',
          paymentStatus: (values[9] as any) || 'paid',
          amountPaid: parseFloat(values[10]) || 0,
          source: 'manual',
          status: 'completed',
          createdAt: new Date().toISOString()
        };
        
        imported.push(sale);
      }

      const updated = [...sales, ...imported];
      setSales(updated);
      localStorage.setItem('sales', JSON.stringify(updated));
      alert(`${imported.length} sales imported successfully!`);
    };

    reader.readAsText(file);
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

    if (formData.quantity > product.quantity) {
      alert(`Only ${product.quantity} units available in stock`);
      return;
    }

    const unitPrice = formData.unitPrice || product.sellingPrice;
    const itemTotal = formData.quantity * unitPrice;
    const discount = formData.itemDiscount || 0;
    const tax = (itemTotal - discount) * (formData.tax / 100);
    const total = itemTotal - discount;

    const newItem: SaleItem = {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: formData.quantity,
      unitPrice,
      discount,
      tax,
      total
    };

    setSelectedItems([...selectedItems, newItem]);
    setFormData({ 
      ...formData, 
      selectedProduct: '', 
      quantity: 0, 
      unitPrice: 0,
      itemDiscount: 0
    });
  }

  function removeItem(index: number) {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  }

  function resetForm() {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      customer: '',
      customerContact: '',
      notes: '',
      paymentMethod: 'Cash',
      paymentStatus: 'unpaid',
      amountPaid: 0,
      discount: 0,
      tax: 16,
      shippingCharge: 0,
      validUntil: '',
      reason: '',
      deliveryAddress: '',
      shippingMethod: 'Standard',
      trackingNumber: '',
      selectedProduct: '',
      quantity: 0,
      unitPrice: 0,
      itemDiscount: 0
    });
    setSelectedItems([]);
  }

  function handleExport() {
    let data: any[] = [];
    let filename = '';

    switch (activeTab) {
      case 'all':
        data = sales;
        filename = 'sales';
        break;
      case 'pos':
        data = sales.filter(s => s.source === 'pos');
        filename = 'pos_sales';
        break;
      case 'drafts':
        data = drafts;
        filename = 'sales_drafts';
        break;
      case 'quotations':
        data = quotations;
        filename = 'quotations';
        break;
      case 'returns':
        data = returns;
        filename = 'sales_returns';
        break;
      case 'shipments':
        data = shipments;
        filename = 'shipments';
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
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-700',
      converted: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      paid: 'bg-green-100 text-green-700',
      partial: 'bg-yellow-100 text-yellow-700',
      unpaid: 'bg-red-100 text-red-700',
      approved: 'bg-green-100 text-green-700',
      shipped: 'bg-blue-100 text-blue-700',
      in_transit: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700'
    };

    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const stats = {
    sales: {
      total: sales.length,
      totalValue: sales.reduce((sum, s) => sum + s.totalAmount, 0),
      paid: sales.filter(s => s.paymentStatus === 'paid').length,
      unpaid: sales.filter(s => s.paymentStatus === 'unpaid').length
    },
    pos: {
      total: sales.filter(s => s.source === 'pos').length,
      totalValue: sales.filter(s => s.source === 'pos').reduce((sum, s) => sum + s.totalAmount, 0)
    },
    drafts: {
      total: drafts.length,
      totalValue: drafts.reduce((sum, d) => sum + d.totalAmount, 0)
    },
    quotations: {
      total: quotations.length,
      pending: quotations.filter(q => q.status === 'pending').length,
      totalValue: quotations.reduce((sum, q) => sum + q.totalAmount, 0)
    },
    returns: {
      total: returns.length,
      totalValue: returns.reduce((sum, r) => sum + r.totalAmount, 0),
      pending: returns.filter(r => r.status === 'pending').length
    },
    shipments: {
      total: shipments.length,
      pending: shipments.filter(s => s.status === 'pending').length,
      delivered: shipments.filter(s => s.status === 'delivered').length
    }
  };

  const posSales = sales.filter(s => s.source === 'pos');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600 mt-1">Complete sales and customer transaction management</p>
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
                activeTab === 'drafts' ? 'draft' :
                activeTab === 'quotations' ? 'quotation' :
                activeTab === 'returns' ? 'return' :
                activeTab === 'shipments' ? 'shipment' :
                activeTab === 'discounts' ? 'discount' : 'sale'
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
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <ShoppingCart className="w-4 h-4 inline mr-2" />
          All Sales ({stats.sales.total})
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'pos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          POS ({stats.pos.total})
        </button>
        <button
          onClick={() => setActiveTab('drafts')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'drafts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Drafts ({stats.drafts.total})
        </button>
        <button
          onClick={() => setActiveTab('quotations')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'quotations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Copy className="w-4 h-4 inline mr-2" />
          Quotations ({stats.quotations.total})
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'returns' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <X className="w-4 h-4 inline mr-2" />
          Returns ({stats.returns.total})
        </button>
        <button
          onClick={() => setActiveTab('shipments')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'shipments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Truck className="w-4 h-4 inline mr-2" />
          Shipments ({stats.shipments.total})
        </button>
        <button
          onClick={() => setActiveTab('discounts')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'discounts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Tag className="w-4 h-4 inline mr-2" />
          Discounts
        </button>
      </div>

      {/* Stats Cards */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900">{stats.sales.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              KES {stats.sales.totalValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Paid</p>
            <p className="text-2xl font-bold text-green-600">{stats.sales.paid}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Unpaid</p>
            <p className="text-2xl font-bold text-red-600">{stats.sales.unpaid}</p>
          </div>
        </div>
      )}

      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total POS Sales</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pos.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-green-600">
              KES {stats.pos.totalValue.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'quotations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Quotations</p>
            <p className="text-2xl font-bold text-gray-900">{stats.quotations.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.quotations.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-blue-600">
              KES {stats.quotations.totalValue.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Import Sales Option */}
      {activeTab === 'all' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Upload className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Import Sales Data</h3>
                <p className="text-sm text-blue-700">Upload CSV file to import bulk sales</p>
              </div>
            </div>
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              <Upload className="w-4 h-4 inline mr-2" />
              Import
              <input
                type="file"
                accept=".csv"
                onChange={handleImportSales}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Content Tables */}
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
          {/* All Sales Table */}
          {activeTab === 'all' && (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Sale No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.saleNo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sale.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sale.customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sale.items.length} items</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      KES {sale.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(sale.paymentStatus)}`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{sale.source}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {/* View details */}}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {/* Edit */}}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
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

          {/* POS Sales Table */}
          {activeTab === 'pos' && (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Sale No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {posSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.saleNo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sale.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sale.customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sale.items.length} items</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      KES {sale.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(sale.paymentStatus)}`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {/* View details */}}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
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

          {/* Drafts Table */}
          {activeTab === 'drafts' && (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Draft No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {drafts.map(draft => (
                  <tr key={draft.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{draft.draftNo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(draft.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{draft.customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{draft.items.length} items</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      KES {draft.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{draft.createdBy}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => convertDraftToSale(draft)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Convert to Sale"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {/* Edit */}}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {/* Delete */}}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Quotations Table */}
          {activeTab === 'quotations' && (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Quote No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Valid Until</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotations.map(quote => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{quote.quotationNo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(quote.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(quote.validUntil).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{quote.customer}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      KES {quote.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {quote.status === 'pending' && (
                          <button
                            onClick={() => convertQuotationToSale(quote)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Convert to Sale"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {/* View/Edit */}}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Sale No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reason</th>
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
                    <td className="px-6 py-4 text-sm text-gray-600">{ret.saleNo}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{ret.customer}</td>
                    <td className="px-6 py-4 text-sm font-medium text-red-600">
                      KES {ret.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ret.reason}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(ret.status)}`}>
                        {ret.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {/* View details */}}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
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

          {/* Shipments Table */}
          {activeTab === 'shipments' && (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Shipment No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Sale No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tracking</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shipments.map(ship => (
                  <tr key={ship.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{ship.shipmentNo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(ship.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ship.saleNo}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{ship.customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ship.shippingMethod}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ship.trackingNumber || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(ship.status)}`}>
                        {ship.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {ship.status !== 'delivered' && ship.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              const statuses: Shipment['status'][] = ['pending', 'shipped', 'in_transit', 'delivered'];
                              const currentIndex = statuses.indexOf(ship.status);
                              if (currentIndex < statuses.length - 1) {
                                updateShipmentStatus(ship.id, statuses[currentIndex + 1]);
                              }
                            }}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Update Status"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {/* View details */}}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
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

          {/* Discounts Table */}
          {activeTab === 'discounts' && (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Min Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Valid From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Valid Until</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {discountRules.map(discount => (
                  <tr key={discount.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{discount.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{discount.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {discount.type === 'percentage' ? `${discount.value}%` : `KES ${discount.value}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{discount.minQuantity || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(discount.validFrom).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(discount.validUntil).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(discount.status)}`}>
                        {discount.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {/* Edit */}}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {/* Delete */}}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'sale' && 'Add Sale'}
                {modalType === 'draft' && 'Save Draft'}
                {modalType === 'quotation' && 'Create Quotation'}
                {modalType === 'return' && 'Process Return'}
                {modalType === 'shipment' && 'Create Shipment'}
                {modalType === 'discount' && 'Add Discount Rule'}
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

            {modalType === 'discount' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Name *</label>
                    <input
                      type="text"
                      value={formData.discountName}
                      onChange={(e) => setFormData({ ...formData, discountName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="bulk">Bulk Discount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity</label>
                    <input
                      type="number"
                      value={formData.minQuantity}
                      onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                    <input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateDiscount}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Discount
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Common fields for sale/draft/quotation */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                    <select
                      value={formData.customer}
                      onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select customer</option>
                      {customers.map(cust => (
                        <option key={cust.id} value={cust.name}>{cust.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Items Section */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                  
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    <select
                      value={formData.selectedProduct}
                      onChange={(e) => {
                        const product = products.find(p => p.sku === e.target.value);
                        setFormData({ 
                          ...formData, 
                          selectedProduct: e.target.value,
                          unitPrice: product?.sellingPrice || 0
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
                    <input
                      type="number"
                      placeholder="Discount"
                      value={formData.itemDiscount}
                      onChange={(e) => setFormData({ ...formData, itemDiscount: parseFloat(e.target.value) || 0 })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={addItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Qty</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Price</th>
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

                  <div className="mt-4 text-right space-y-1">
                    <p className="text-sm">
                      Subtotal: <span className="font-bold">KES {selectedItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()}</span>
                    </p>
                    <p className="text-lg font-bold">
                      Total: KES {(selectedItems.reduce((sum, item) => sum + item.total, 0) * 1.16).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Cash">Cash</option>
                      <option value="M-Pesa">M-Pesa</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  onClick={
                    modalType === 'sale' ? handleCreateSale :
                    modalType === 'draft' ? handleCreateDraft :
                    modalType === 'quotation' ? handleCreateQuotation :
                    modalType === 'return' ? handleCreateReturn :
                    handleCreateShipment
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
