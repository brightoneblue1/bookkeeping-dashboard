import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Eye, Download, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, RefreshCw, FileText, Printer } from 'lucide-react';

interface StockAdjustment {
  id: string;
  adjustmentNo: string;
  date: string;
  adjustmentType: 'increase' | 'decrease';
  reason: string;
  items: AdjustmentItem[];
  totalQuantity: number;
  totalValue: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdBy: string;
  approvedBy?: string;
  approvedDate?: string;
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

interface AdjustmentItem {
  productId: string;
  sku: string;
  name: string;
  currentStock: number;
  adjustmentQuantity: number;
  newStock: number;
  unitCost: number;
  totalCost: number;
  reason?: string;
}

export function StockAdjustment() {
  const [activeView, setActiveView] = useState<'list' | 'add'>('list');
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'approve'>('view');
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustment | null>(null);
  const [selectedItems, setSelectedItems] = useState<AdjustmentItem[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterReason, setFilterReason] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [formData, setFormData] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    adjustmentType: 'increase',
    reason: '',
    notes: '',
    selectedProduct: '',
    adjustmentQuantity: 0,
    itemReason: ''
  });

  const adjustmentReasons = {
    increase: [
      'Stock Count - Found Extra',
      'Supplier Bonus',
      'Return from Customer',
      'Manufacturing Yield',
      'Transfer In',
      'Correction - System Error',
      'Other - Increase'
    ],
    decrease: [
      'Stock Count - Missing',
      'Damaged Goods',
      'Expired Products',
      'Theft/Loss',
      'Samples Given',
      'Staff Use',
      'Transfer Out',
      'Correction - System Error',
      'Other - Decrease'
    ]
  };

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    const storedProducts = localStorage.getItem('products');
    const storedAdjustments = localStorage.getItem('stock_adjustments');

    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedAdjustments) setAdjustments(JSON.parse(storedAdjustments));
  }

  function handleCreateAdjustment() {
    if (selectedItems.length === 0) {
      alert('Please add items to adjust');
      return;
    }

    if (!formData.reason) {
      alert('Please select a reason for adjustment');
      return;
    }

    const totalQuantity = selectedItems.reduce((sum, item) => sum + Math.abs(item.adjustmentQuantity), 0);
    const totalValue = selectedItems.reduce((sum, item) => sum + item.totalCost, 0);

    const newAdjustment: StockAdjustment = {
      id: `ADJ-${Date.now()}`,
      adjustmentNo: `SA-${Date.now()}`,
      date: formData.date,
      adjustmentType: formData.adjustmentType,
      reason: formData.reason,
      items: selectedItems,
      totalQuantity,
      totalValue,
      status: 'approved', // Auto-approve for now, can add approval workflow
      createdBy: 'Current User',
      approvedBy: 'Current User',
      approvedDate: new Date().toISOString(),
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...adjustments, newAdjustment];
    setAdjustments(updated);
    localStorage.setItem('stock_adjustments', JSON.stringify(updated));

    // Apply adjustment to inventory
    applyAdjustmentToInventory(selectedItems, formData.adjustmentType);

    resetForm();
    setActiveView('list');
    alert('Stock adjustment created and applied successfully!');
  }

  function applyAdjustmentToInventory(items: AdjustmentItem[], type: 'increase' | 'decrease') {
    const updatedProducts = products.map(product => {
      const adjustmentItem = items.find(item => item.sku === product.sku);
      if (adjustmentItem) {
        const newQuantity = type === 'increase' 
          ? (product.quantity || 0) + adjustmentItem.adjustmentQuantity
          : Math.max(0, (product.quantity || 0) - adjustmentItem.adjustmentQuantity);

        return {
          ...product,
          quantity: newQuantity,
          updatedAt: new Date().toISOString()
        };
      }
      return product;
    });

    setProducts(updatedProducts);
    localStorage.setItem('products', JSON.stringify(updatedProducts));
  }

  function reverseAdjustment(adjustment: StockAdjustment) {
    if (!confirm('Are you sure you want to reverse this adjustment? This will restore the previous stock levels.')) {
      return;
    }

    // Reverse the adjustment by applying opposite type
    const reverseType = adjustment.adjustmentType === 'increase' ? 'decrease' : 'increase';
    applyAdjustmentToInventory(adjustment.items, reverseType);

    // Update adjustment status
    const updated = adjustments.map(adj =>
      adj.id === adjustment.id 
        ? { ...adj, status: 'rejected' as const, updatedAt: new Date().toISOString() }
        : adj
    );

    setAdjustments(updated);
    localStorage.setItem('stock_adjustments', JSON.stringify(updated));

    alert('Adjustment reversed successfully!');
  }

  function deleteAdjustment(id: string) {
    if (!confirm('Are you sure you want to delete this adjustment? This action cannot be undone.')) {
      return;
    }

    const updated = adjustments.filter(adj => adj.id !== id);
    setAdjustments(updated);
    localStorage.setItem('stock_adjustments', JSON.stringify(updated));
    alert('Adjustment deleted successfully!');
  }

  function addItem() {
    const product = products.find(p => p.sku === formData.selectedProduct);
    if (!product) {
      alert('Please select a product');
      return;
    }

    if (!formData.adjustmentQuantity || formData.adjustmentQuantity === 0) {
      alert('Please enter adjustment quantity');
      return;
    }

    // Check if decreasing more than available
    if (formData.adjustmentType === 'decrease' && formData.adjustmentQuantity > product.quantity) {
      if (!confirm(`Only ${product.quantity} units available. Continue with adjustment of ${formData.adjustmentQuantity}? This will result in negative stock.`)) {
        return;
      }
    }

    const newStock = formData.adjustmentType === 'increase'
      ? (product.quantity || 0) + formData.adjustmentQuantity
      : (product.quantity || 0) - formData.adjustmentQuantity;

    const unitCost = product.buyingPrice || 0;
    const totalCost = Math.abs(formData.adjustmentQuantity) * unitCost;

    const newItem: AdjustmentItem = {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      currentStock: product.quantity || 0,
      adjustmentQuantity: formData.adjustmentQuantity,
      newStock,
      unitCost,
      totalCost,
      reason: formData.itemReason
    };

    setSelectedItems([...selectedItems, newItem]);
    setFormData({ 
      ...formData, 
      selectedProduct: '', 
      adjustmentQuantity: 0,
      itemReason: ''
    });
  }

  function removeItem(index: number) {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  }

  function resetForm() {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      adjustmentType: 'increase',
      reason: '',
      notes: '',
      selectedProduct: '',
      adjustmentQuantity: 0,
      itemReason: ''
    });
    setSelectedItems([]);
  }

  function handleExport() {
    const filteredData = getFilteredAdjustments();
    
    const headers = ['Adjustment No', 'Date', 'Type', 'Reason', 'Items', 'Total Qty', 'Total Value', 'Status', 'Created By'];
    const csvRows = [headers.join(',')];

    filteredData.forEach(adj => {
      const row = [
        adj.adjustmentNo,
        new Date(adj.date).toLocaleDateString(),
        adj.adjustmentType,
        `"${adj.reason}"`,
        adj.items.length,
        adj.totalQuantity,
        adj.totalValue,
        adj.status,
        adj.createdBy
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-adjustments-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printAdjustment(adjustment: StockAdjustment) {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stock Adjustment - ${adjustment.adjustmentNo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info { margin-bottom: 20px; }
          .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; text-align: right; }
          .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature { text-align: center; }
          .signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Stock Adjustment</h1>
          <h2>${adjustment.adjustmentNo}</h2>
        </div>
        
        <div class="info">
          <div class="info-row">
            <span><strong>Date:</strong> ${new Date(adjustment.date).toLocaleDateString()}</span>
            <span><strong>Type:</strong> ${adjustment.adjustmentType.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span><strong>Reason:</strong> ${adjustment.reason}</span>
            <span><strong>Status:</strong> ${adjustment.status.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span><strong>Created By:</strong> ${adjustment.createdBy}</span>
            <span><strong>Date Created:</strong> ${new Date(adjustment.createdAt).toLocaleString()}</span>
          </div>
          ${adjustment.approvedBy ? `
            <div class="info-row">
              <span><strong>Approved By:</strong> ${adjustment.approvedBy}</span>
              <span><strong>Date Approved:</strong> ${new Date(adjustment.approvedDate!).toLocaleString()}</span>
            </div>
          ` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Current Stock</th>
              <th>Adjustment</th>
              <th>New Stock</th>
              <th>Unit Cost</th>
              <th>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            ${adjustment.items.map(item => `
              <tr>
                <td>${item.sku}</td>
                <td>${item.name}</td>
                <td>${item.currentStock}</td>
                <td>${adjustment.adjustmentType === 'increase' ? '+' : '-'}${item.adjustmentQuantity}</td>
                <td>${item.newStock}</td>
                <td>KES ${item.unitCost.toLocaleString()}</td>
                <td>KES ${item.totalCost.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="total">Total Items: ${adjustment.items.length}</td>
              <td class="total">Total Qty: ${adjustment.totalQuantity}</td>
              <td colspan="2" class="total">Total Value:</td>
              <td class="total">KES ${adjustment.totalValue.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        ${adjustment.notes ? `
          <div class="info">
            <strong>Notes:</strong><br>
            ${adjustment.notes}
          </div>
        ` : ''}

        <div class="signatures">
          <div class="signature">
            <div class="signature-line">Prepared By</div>
          </div>
          <div class="signature">
            <div class="signature-line">Approved By</div>
          </div>
          <div class="signature">
            <div class="signature-line">Received By</div>
          </div>
        </div>

        <script>window.print(); window.close();</script>
      </body>
      </html>
    `);
  }

  function getFilteredAdjustments() {
    return adjustments.filter(adj => {
      const matchSearch = adj.adjustmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adj.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adj.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = filterType === 'all' || adj.adjustmentType === filterType;
      const matchStatus = filterStatus === 'all' || adj.status === filterStatus;
      const matchReason = filterReason === 'all' || adj.reason === filterReason;
      
      const matchDateFrom = !dateFrom || new Date(adj.date) >= new Date(dateFrom);
      const matchDateTo = !dateTo || new Date(adj.date) <= new Date(dateTo);
      
      return matchSearch && matchType && matchStatus && matchReason && matchDateFrom && matchDateTo;
    });
  }

  const getStatusBadge = (status: string) => {
    const badges: any = {
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const stats = {
    total: adjustments.length,
    totalIncrease: adjustments.filter(a => a.adjustmentType === 'increase' && a.status === 'approved').reduce((sum, a) => sum + a.totalQuantity, 0),
    totalDecrease: adjustments.filter(a => a.adjustmentType === 'decrease' && a.status === 'approved').reduce((sum, a) => sum + a.totalQuantity, 0),
    totalValue: adjustments.filter(a => a.status === 'approved').reduce((sum, a) => sum + a.totalValue, 0),
    pending: adjustments.filter(a => a.status === 'pending').length,
    approved: adjustments.filter(a => a.status === 'approved').length,
    thisMonth: adjustments.filter(a => {
      const adjDate = new Date(a.date);
      const now = new Date();
      return adjDate.getMonth() === now.getMonth() && adjDate.getFullYear() === now.getFullYear();
    }).length
  };

  const filteredAdjustments = getFilteredAdjustments();

  // Get unique reasons for filter
  const allReasons = [...new Set(adjustments.map(a => a.reason))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Adjustments</h1>
          <p className="text-gray-600 mt-1">Manage inventory adjustments and stock corrections</p>
        </div>
        <div className="flex gap-2">
          {activeView === 'list' && (
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
                  setActiveView('add');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add Adjustment
              </button>
            </>
          )}
          {activeView === 'add' && (
            <button
              onClick={() => {
                resetForm();
                setActiveView('list');
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Total Adjustments</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Increase</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalIncrease}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Decrease</p>
              <p className="text-2xl font-bold text-red-600">{stats.totalDecrease}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-blue-600">
            KES {stats.totalValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">This Month</p>
          <p className="text-2xl font-bold text-purple-600">{stats.thisMonth}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
      </div>

      {/* Alert for pending adjustments */}
      {stats.pending > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">Pending Approvals</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {stats.pending} adjustment{stats.pending !== 1 ? 's' : ''} waiting for approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {activeView === 'list' && (
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
                  placeholder="Search adjustments..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Reasons</option>
                {allReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
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

          {/* Adjustments Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Adjustment No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      No adjustments found
                    </td>
                  </tr>
                ) : (
                  filteredAdjustments.map(adjustment => (
                    <tr key={adjustment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {adjustment.adjustmentNo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(adjustment.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {adjustment.adjustmentType === 'increase' ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-600 font-medium">Increase</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-4 h-4 text-red-600" />
                              <span className="text-sm text-red-600 font-medium">Decrease</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{adjustment.reason}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{adjustment.items.length}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {adjustment.adjustmentType === 'increase' ? '+' : '-'}{adjustment.totalQuantity}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        KES {adjustment.totalValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(adjustment.status)}`}>
                          {adjustment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{adjustment.createdBy}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedAdjustment(adjustment);
                              setModalType('view');
                              setShowModal(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => printAdjustment(adjustment)}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                            title="Print"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {adjustment.status === 'approved' && (
                            <button
                              onClick={() => reverseAdjustment(adjustment)}
                              className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                              title="Reverse Adjustment"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          {adjustment.status === 'draft' && (
                            <button
                              onClick={() => deleteAdjustment(adjustment.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add View */}
      {activeView === 'add' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Create Stock Adjustment</h2>

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type *</label>
                <select
                  value={formData.adjustmentType}
                  onChange={(e) => {
                    setFormData({ ...formData, adjustmentType: e.target.value, reason: '' });
                    setSelectedItems([]);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="increase">Stock Increase</option>
                  <option value="decrease">Stock Decrease</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select reason</option>
                  {adjustmentReasons[formData.adjustmentType].map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add Items Section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Add Products</h3>
              
              <div className="grid grid-cols-4 gap-3 mb-4">
                <select
                  value={formData.selectedProduct}
                  onChange={(e) => setFormData({ ...formData, selectedProduct: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select product</option>
                  {products.map(prod => (
                    <option key={prod.id} value={prod.sku}>
                      {prod.name} ({prod.sku}) - Stock: {prod.quantity || 0}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Adjustment Quantity"
                  value={formData.adjustmentQuantity}
                  onChange={(e) => setFormData({ ...formData, adjustmentQuantity: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="text"
                  placeholder="Item reason (optional)"
                  value={formData.itemReason}
                  onChange={(e) => setFormData({ ...formData, itemReason: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  onClick={addItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Item
                </button>
              </div>

              {/* Items List */}
              {selectedItems.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">SKU</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Current Stock</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Adjustment</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">New Stock</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Unit Cost</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Total Cost</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm font-medium">{item.sku}</td>
                          <td className="px-4 py-2 text-sm">{item.name}</td>
                          <td className="px-4 py-2 text-sm">{item.currentStock}</td>
                          <td className="px-4 py-2 text-sm font-bold">
                            <span className={formData.adjustmentType === 'increase' ? 'text-green-600' : 'text-red-600'}>
                              {formData.adjustmentType === 'increase' ? '+' : '-'}{item.adjustmentQuantity}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">{item.newStock}</td>
                          <td className="px-4 py-2 text-sm">KES {item.unitCost.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm font-medium">KES {item.totalCost.toLocaleString()}</td>
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
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-sm font-bold text-right">Totals:</td>
                        <td className="px-4 py-2 text-sm font-bold">
                          {selectedItems.reduce((sum, item) => sum + item.adjustmentQuantity, 0)}
                        </td>
                        <td colSpan={2}></td>
                        <td className="px-4 py-2 text-sm font-bold">
                          KES {selectedItems.reduce((sum, item) => sum + item.totalCost, 0).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
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
                onClick={handleCreateAdjustment}
                disabled={selectedItems.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create & Apply Adjustment
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setActiveView('list');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showModal && selectedAdjustment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Adjustment Details - {selectedAdjustment.adjustmentNo}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedAdjustment(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(selectedAdjustment.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <div className="flex items-center gap-1">
                    {selectedAdjustment.adjustmentType === 'increase' ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-600">Increase</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-600">Decrease</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reason</p>
                  <p className="font-medium">{selectedAdjustment.reason}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedAdjustment.status)}`}>
                    {selectedAdjustment.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created By</p>
                  <p className="font-medium">{selectedAdjustment.createdBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created Date</p>
                  <p className="font-medium">{new Date(selectedAdjustment.createdAt).toLocaleString()}</p>
                </div>
                {selectedAdjustment.approvedBy && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Approved By</p>
                      <p className="font-medium">{selectedAdjustment.approvedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Approved Date</p>
                      <p className="font-medium">{new Date(selectedAdjustment.approvedDate!).toLocaleString()}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Adjustment Items</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">SKU</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Previous Stock</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Adjustment</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">New Stock</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedAdjustment.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm font-medium">{item.sku}</td>
                          <td className="px-4 py-2 text-sm">{item.name}</td>
                          <td className="px-4 py-2 text-sm">{item.currentStock}</td>
                          <td className="px-4 py-2 text-sm font-bold">
                            <span className={selectedAdjustment.adjustmentType === 'increase' ? 'text-green-600' : 'text-red-600'}>
                              {selectedAdjustment.adjustmentType === 'increase' ? '+' : '-'}{item.adjustmentQuantity}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">{item.newStock}</td>
                          <td className="px-4 py-2 text-sm">KES {item.totalCost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="text-lg font-bold">{selectedAdjustment.items.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Quantity</p>
                    <p className="text-lg font-bold">{selectedAdjustment.totalQuantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-lg font-bold text-blue-600">
                      KES {selectedAdjustment.totalValue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedAdjustment.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedAdjustment.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => printAdjustment(selectedAdjustment)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Printer className="w-4 h-4 inline mr-2" />
                  Print
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedAdjustment(null);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
