import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Package, Search, Edit2, TrendingDown, TrendingUp, Download, Filter, X, Eye, Trash2, FileText } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct, getSales } from '../utils/api';

export function Inventory() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [editedProduct, setEditedProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('summary');
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    buyPrice: 0,
    sellPrice: 0,
    quantity: 0,
    reorderLevel: 0,
    description: '',
    supplier: ''
  });

  const categories = ['Dry Foods', 'Cooking', 'Spices', 'Beverages', 'Dairy', 'Household', 'Personal Care', 'Frozen Foods', 'Snacks', 'Other'];

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const [productsData, salesData] = await Promise.all([
        getProducts(),
        getSales()
      ]);
      setProducts(productsData);
      setSales(salesData);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name || !formData.sku || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createProduct(formData);
      setFormData({
        name: '',
        sku: '',
        category: '',
        buyPrice: 0,
        sellPrice: 0,
        quantity: 0,
        reorderLevel: 0,
        description: '',
        supplier: ''
      });
      setShowAddProduct(false);
      await loadProducts();
      alert('Product added successfully!');
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Failed to add product. Please try again.');
    }
  }

  function handleEditProduct() {
    setIsEditMode(true);
    setEditedProduct({ ...selectedProduct });
  }

  function handleCancelEdit() {
    setIsEditMode(false);
    setEditedProduct(null);
  }

  async function handleSaveProduct() {
    if (!editedProduct) return;

    try {
      await updateProduct(editedProduct.sku, editedProduct);
      
      const updatedProducts = products.map(p => 
        p.sku === editedProduct.sku ? editedProduct : p
      );
      setProducts(updatedProducts);

      setIsEditMode(false);
      setShowProductDetails(false);
      setEditedProduct(null);
      alert('Product updated successfully!');
    } catch (error) {
      console.error('Failed to update product:', error);
      alert('Failed to update product. Please try again.');
    }
  }

  async function handleDeleteProduct() {
    if (!selectedProduct) return;
    
    if (!confirm(`Are you sure you want to delete "${selectedProduct.name}"?`)) return;

    try {
      await deleteProduct(selectedProduct.sku);
      setProducts(products.filter(p => p.sku !== selectedProduct.sku));
      setShowProductDetails(false);
      alert('Product deleted successfully!');
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    }
  }

  function handleExportProducts() {
    try {
      const headers = ['SKU', 'Name', 'Category', 'Buy Price', 'Sell Price', 'Margin %', 'Quantity', 'Reorder Level', 'Status', 'Value'];
      const csvRows = [headers.join(',')];

      const filteredProducts = getFilteredProducts();

      filteredProducts.forEach(product => {
        const margin = product.sellPrice > 0 ? Math.round(((product.sellPrice - product.buyPrice) / product.buyPrice) * 100) : 0;
        const status = getStatusBadge(product).label;
        const value = product.buyPrice * product.quantity;
        
        const row = [
          product.sku,
          `"${product.name}"`,
          product.category,
          product.buyPrice || 0,
          product.sellPrice || 0,
          margin,
          product.quantity || 0,
          product.reorderLevel || 0,
          status,
          value
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Inventory data exported successfully!');
    } catch (error) {
      console.error('Failed to export inventory:', error);
      alert('Failed to export inventory data.');
    }
  }

  function getStatusBadge(product: any) {
    if (product.quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700', status: 'critical' };
    if (product.quantity <= product.reorderLevel) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-700', status: 'low' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-700', status: 'good' };
  }

  function getFilteredProducts() {
    return products.filter(p => {
      const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = filterStatus === 'all' || 
                         (filterStatus === 'out' && p.quantity === 0) ||
                         (filterStatus === 'low' && p.quantity > 0 && p.quantity <= p.reorderLevel) ||
                         (filterStatus === 'good' && p.quantity > p.reorderLevel);
      
      const matchCategory = filterCategory === 'all' || p.category === filterCategory;
      
      return matchSearch && matchStatus && matchCategory;
    });
  }

  // Calculate product movements from sales
  function getProductMovements() {
    const movements: any[] = [];
    
    sales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          movements.push({
            date: sale.date || sale.createdAt,
            sku: item.sku,
            productName: item.name,
            type: 'sale',
            quantity: item.quantity,
            reference: sale.id,
            customer: sale.customer
          });
        });
      }
    });

    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Get top selling products
  function getTopSellingProducts() {
    const productSales: any = {};

    sales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          if (!productSales[item.sku]) {
            productSales[item.sku] = {
              sku: item.sku,
              name: item.name,
              totalQuantity: 0,
              totalRevenue: 0
            };
          }
          productSales[item.sku].totalQuantity += item.quantity;
          productSales[item.sku].totalRevenue += item.price * item.quantity;
        });
      }
    });

    return Object.values(productSales)
      .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);
  }

  const stockSummary = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.buyPrice * p.quantity), 0),
    totalSellValue: products.reduce((sum, p) => sum + (p.sellPrice * p.quantity), 0),
    lowStock: products.filter(p => p.quantity > 0 && p.quantity <= p.reorderLevel).length,
    outOfStock: products.filter(p => p.quantity === 0).length,
    categories: new Set(products.map(p => p.category)).size
  };

  const filteredProducts = getFilteredProducts();
  const movements = getProductMovements();
  const topSelling = getTopSellingProducts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage your stock levels</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <FileText className="w-5 h-5" />
            Reports
          </button>
          <button
            onClick={() => setShowAddProduct(!showAddProduct)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600 mb-1">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{stockSummary.totalProducts}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600 mb-1">Stock Value (Buy)</p>
          <p className="text-2xl font-bold text-blue-600">KES {stockSummary.totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600 mb-1">Stock Value (Sell)</p>
          <p className="text-2xl font-bold text-green-600">KES {stockSummary.totalSellValue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600 mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600">{stockSummary.lowStock}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{stockSummary.outOfStock}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600 mb-1">Categories</p>
          <p className="text-2xl font-bold text-gray-900">{stockSummary.categories}</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {(stockSummary.lowStock > 0 || stockSummary.outOfStock > 0) && (
        <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900">Stock Alert</h3>
              <p className="text-sm text-orange-700 mt-1">
                {stockSummary.lowStock} product{stockSummary.lowStock !== 1 ? 's' : ''} running low on stock. 
                {stockSummary.outOfStock > 0 && ` ${stockSummary.outOfStock} product${stockSummary.outOfStock !== 1 ? 's' : ''} out of stock.`}
                {' '}Consider reordering soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Form */}
      {showAddProduct && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Product</h2>
          <form onSubmit={handleAddProduct}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sugar 2kg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-XXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select 
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buying Price (KES) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.buyPrice}
                  onChange={(e) => setFormData({ ...formData, buyPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price (KES) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.sellPrice}
                  onChange={(e) => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Opening Stock *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Level</label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Supplier name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddProduct(false);
                  setFormData({
                    name: '',
                    sku: '',
                    category: '',
                    buyPrice: 0,
                    sellPrice: 0,
                    quantity: 0,
                    reorderLevel: 0,
                    description: '',
                    supplier: ''
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Product List</h2>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Status</div>
                      <button
                        onClick={() => { setFilterStatus('all'); setShowFilterMenu(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterStatus === 'all' ? 'bg-gray-100' : ''}`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => { setFilterStatus('good'); setShowFilterMenu(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterStatus === 'good' ? 'bg-gray-100' : ''}`}
                      >
                        In Stock
                      </button>
                      <button
                        onClick={() => { setFilterStatus('low'); setShowFilterMenu(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterStatus === 'low' ? 'bg-gray-100' : ''}`}
                      >
                        Low Stock
                      </button>
                      <button
                        onClick={() => { setFilterStatus('out'); setShowFilterMenu(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterStatus === 'out' ? 'bg-gray-100' : ''}`}
                      >
                        Out of Stock
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleExportProducts}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Buy Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Sell Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Margin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const margin = product.sellPrice > 0 ? Math.round(((product.sellPrice - product.buyPrice) / product.buyPrice) * 100) : 0;
                const badge = getStatusBadge(product);
                return (
                  <tr key={product.sku} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">KES {product.buyPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">KES {product.sellPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-green-600">{margin}%</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={badge.status === 'good' ? 'text-gray-900 font-medium' : 'text-red-600 font-bold'}>
                          {product.quantity}
                        </span>
                        {badge.status !== 'good' && <TrendingDown className="w-4 h-4 text-red-600" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowProductDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Movements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Stock Movements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Customer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {movements.slice(0, 10).map((movement, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(movement.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{movement.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{movement.productName}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-gray-600 capitalize">{movement.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-red-600">-{movement.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{movement.reference}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{movement.customer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top 10 Selling Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Quantity Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topSelling.map((product, idx) => (
                <tr key={product.sku} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">#{idx + 1}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">{product.totalQuantity}</td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">KES {product.totalRevenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && !isEditMode && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
              <button
                onClick={() => setShowProductDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">SKU:</p>
                <p className="text-sm font-medium text-gray-900">{selectedProduct.sku}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Product Name:</p>
                <p className="text-sm font-medium text-gray-900">{selectedProduct.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category:</p>
                <p className="text-sm font-medium text-gray-900">{selectedProduct.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Buying Price:</p>
                <p className="text-lg font-bold text-gray-900">KES {selectedProduct.buyPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Selling Price:</p>
                <p className="text-lg font-bold text-green-600">KES {selectedProduct.sellPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Profit Margin:</p>
                <p className="text-lg font-bold text-blue-600">
                  {selectedProduct.sellPrice > 0 ? Math.round(((selectedProduct.sellPrice - selectedProduct.buyPrice) / selectedProduct.buyPrice) * 100) : 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Stock:</p>
                <p className="text-lg font-bold text-gray-900">{selectedProduct.quantity} units</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reorder Level:</p>
                <p className="text-sm font-medium text-gray-900">{selectedProduct.reorderLevel} units</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stock Value (Buy):</p>
                <p className="text-sm font-medium text-gray-900">
                  KES {(selectedProduct.buyPrice * selectedProduct.quantity).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stock Value (Sell):</p>
                <p className="text-sm font-medium text-green-600">
                  KES {(selectedProduct.sellPrice * selectedProduct.quantity).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status:</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedProduct).color}`}>
                  {getStatusBadge(selectedProduct).label}
                </span>
              </div>
              {selectedProduct.supplier && (
                <div>
                  <p className="text-sm text-gray-600">Supplier:</p>
                  <p className="text-sm font-medium text-gray-900">{selectedProduct.supplier}</p>
                </div>
              )}
              {selectedProduct.description && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Description:</p>
                  <p className="text-sm text-gray-900">{selectedProduct.description}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleEditProduct}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit2 className="w-4 h-4" />
                Edit Product
              </button>
              <button
                onClick={handleDeleteProduct}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditMode && editedProduct && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Product - {editedProduct.sku}</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  value={editedProduct.name}
                  onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                <input
                  type="text"
                  value={editedProduct.sku}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={editedProduct.category}
                  onChange={(e) => setEditedProduct({ ...editedProduct, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buying Price (KES)</label>
                <input
                  type="number"
                  value={editedProduct.buyPrice}
                  onChange={(e) => setEditedProduct({ ...editedProduct, buyPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price (KES)</label>
                <input
                  type="number"
                  value={editedProduct.sellPrice}
                  onChange={(e) => setEditedProduct({ ...editedProduct, sellPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock</label>
                <input
                  type="number"
                  value={editedProduct.quantity}
                  onChange={(e) => setEditedProduct({ ...editedProduct, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Level</label>
                <input
                  type="number"
                  value={editedProduct.reorderLevel}
                  onChange={(e) => setEditedProduct({ ...editedProduct, reorderLevel: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                <input
                  type="text"
                  value={editedProduct.supplier || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={2}
                  value={editedProduct.description || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
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
                onClick={handleSaveProduct}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Inventory Reports</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setReportType('summary')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    reportType === 'summary' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setReportType('stock')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    reportType === 'stock' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'
                  }`}
                >
                  Stock Status
                </button>
                <button
                  onClick={() => setReportType('valuation')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    reportType === 'valuation' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'
                  }`}
                >
                  Valuation
                </button>
              </div>
            </div>

            {reportType === 'summary' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Inventory Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Products</p>
                    <p className="text-2xl font-bold text-blue-600">{stockSummary.totalProducts}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Value (Buy)</p>
                    <p className="text-xl font-bold text-green-600">KES {stockSummary.totalValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Value (Sell)</p>
                    <p className="text-xl font-bold text-purple-600">KES {stockSummary.totalSellValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-orange-600">{stockSummary.lowStock}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600">{stockSummary.outOfStock}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Categories</p>
                    <p className="text-2xl font-bold text-gray-900">{stockSummary.categories}</p>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'stock' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Stock Status Report</h4>
                <div className="space-y-2">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-red-900 mb-2">Out of Stock ({stockSummary.outOfStock})</h5>
                    <div className="space-y-1">
                      {products.filter(p => p.quantity === 0).map(p => (
                        <p key={p.sku} className="text-sm text-red-700">{p.sku} - {p.name}</p>
                      ))}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-orange-900 mb-2">Low Stock ({stockSummary.lowStock})</h5>
                    <div className="space-y-1">
                      {products.filter(p => p.quantity > 0 && p.quantity <= p.reorderLevel).map(p => (
                        <p key={p.sku} className="text-sm text-orange-700">{p.sku} - {p.name} ({p.quantity} units)</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'valuation' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Stock Valuation by Category</h4>
                <div className="space-y-2">
                  {Array.from(new Set(products.map(p => p.category))).map(category => {
                    const categoryProducts = products.filter(p => p.category === category);
                    const buyValue = categoryProducts.reduce((sum, p) => sum + (p.buyPrice * p.quantity), 0);
                    const sellValue = categoryProducts.reduce((sum, p) => sum + (p.sellPrice * p.quantity), 0);
                    return (
                      <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{category}</p>
                          <p className="text-xs text-gray-500">{categoryProducts.length} products</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Buy: KES {buyValue.toLocaleString()}</p>
                          <p className="text-sm font-bold text-green-600">Sell: KES {sellValue.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  handleExportProducts();
                  setShowReportModal(false);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
