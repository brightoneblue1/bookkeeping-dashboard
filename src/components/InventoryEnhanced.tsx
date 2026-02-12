import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Package, Search, Edit2, Download, Filter, X, Eye, Trash2, FileText, Upload, Tag, Printer, RefreshCw, Grid, List, Barcode, Award, Shield, TrendingUp, TrendingDown } from 'lucide-react';
import { StockAdjustment } from './StockAdjustment';

interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  unit: string;
  buyingPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderLevel: number;
  supplier?: string;
  variations?: ProductVariation[];
  sellingPriceGroups?: SellingPriceGroup[];
  warranty?: string;
  warrantyPeriod?: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductVariation {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  buyingPrice: number;
  sellingPrice: number;
  quantity: number;
}

interface SellingPriceGroup {
  groupName: string;
  price: number;
  description?: string;
}

export function InventoryEnhanced() {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'import' | 'prices' | 'units' | 'brands' | 'warranties' | 'adjustments'>('list');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'price' | 'variations' | 'labels'>('add');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    brand: '',
    unit: 'Piece',
    buyingPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    reorderLevel: 0,
    description: '',
    supplier: '',
    warranty: '',
    warrantyPeriod: 0
  });

  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [sellingPriceGroups, setSellingPriceGroups] = useState<SellingPriceGroup[]>([]);
  const [priceGroupForm, setPriceGroupForm] = useState({ groupName: '', price: 0, description: '' });

  const defaultUnits = ['Piece', 'Kg', 'Gram', 'Litre', 'Ml', 'Box', 'Carton', 'Pack', 'Dozen', 'Bag'];
  const defaultWarranties = [
    { id: 'W1', name: '1 Month Warranty', period: 30 },
    { id: 'W2', name: '3 Months Warranty', period: 90 },
    { id: 'W3', name: '6 Months Warranty', period: 180 },
    { id: 'W4', name: '1 Year Warranty', period: 365 },
    { id: 'W5', name: '2 Years Warranty', period: 730 }
  ];

  useEffect(() => {
    loadInventoryData();
  }, []);

  function loadInventoryData() {
    const storedProducts = localStorage.getItem('products');
    const storedCategories = localStorage.getItem('product_categories');
    const storedBrands = localStorage.getItem('product_brands');
    const storedUnits = localStorage.getItem('product_units');
    const storedWarranties = localStorage.getItem('product_warranties');

    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedCategories) {
      const cats = JSON.parse(storedCategories);
      setCategories(cats.map((c: any) => c.name));
    } else {
      setCategories(['Dry Foods', 'Cooking', 'Spices', 'Beverages', 'Dairy', 'Household', 'Personal Care']);
    }
    
    if (storedBrands) setBrands(JSON.parse(storedBrands));
    if (storedUnits) setUnits(JSON.parse(storedUnits));
    else setUnits(defaultUnits);
    
    if (storedWarranties) setWarranties(JSON.parse(storedWarranties));
    else setWarranties(defaultWarranties);
  }

  function handleAddProduct() {
    if (!formData.name || !formData.sku) {
      alert('Please fill in required fields');
      return;
    }

    const newProduct: Product = {
      id: `PROD-${Date.now()}`,
      sku: formData.sku,
      barcode: formData.barcode,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      brand: formData.brand,
      unit: formData.unit,
      buyingPrice: formData.buyingPrice,
      sellingPrice: formData.sellingPrice,
      quantity: formData.quantity,
      reorderLevel: formData.reorderLevel,
      supplier: formData.supplier,
      variations: variations.length > 0 ? variations : undefined,
      sellingPriceGroups: sellingPriceGroups.length > 0 ? sellingPriceGroups : undefined,
      warranty: formData.warranty,
      warrantyPeriod: formData.warrantyPeriod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...products, newProduct];
    setProducts(updated);
    localStorage.setItem('products', JSON.stringify(updated));

    resetForm();
    setShowModal(false);
    alert('Product added successfully!');
  }

  function handleUpdateProduct() {
    if (!selectedProduct) return;

    const updated = products.map(p =>
      p.id === selectedProduct.id
        ? {
            ...p,
            ...formData,
            variations,
            sellingPriceGroups,
            updatedAt: new Date().toISOString()
          }
        : p
    );

    setProducts(updated);
    localStorage.setItem('products', JSON.stringify(updated));

    resetForm();
    setShowModal(false);
    setSelectedProduct(null);
    alert('Product updated successfully!');
  }

  function handleDeleteProduct(productId: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    localStorage.setItem('products', JSON.stringify(updated));
    alert('Product deleted successfully!');
  }

  function handleUpdatePrice(productId: string, newPrice: number) {
    const updated = products.map(p =>
      p.id === productId
        ? { ...p, sellingPrice: newPrice, updatedAt: new Date().toISOString() }
        : p
    );

    setProducts(updated);
    localStorage.setItem('products', JSON.stringify(updated));
  }

  function handleBulkPriceUpdate(percentage: number, type: 'increase' | 'decrease') {
    const updated = products.map(p => {
      const change = type === 'increase' 
        ? p.sellingPrice * (percentage / 100)
        : -p.sellingPrice * (percentage / 100);
      
      return {
        ...p,
        sellingPrice: Math.round((p.sellingPrice + change) * 100) / 100,
        updatedAt: new Date().toISOString()
      };
    });

    setProducts(updated);
    localStorage.setItem('products', JSON.stringify(updated));
    alert(`Prices ${type}d by ${percentage}%`);
  }

  function handlePrintLabels(product: Product) {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Product Label - ${product.name}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
          }
          .label {
            width: 80mm;
            height: 40mm;
            border: 2px dashed #333;
            padding: 10px;
            margin: 10px;
            page-break-after: always;
            font-family: Arial, sans-serif;
          }
          .product-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .barcode { font-size: 24px; font-family: 'Courier New'; text-align: center; margin: 10px 0; }
          .price { font-size: 20px; font-weight: bold; text-align: right; }
          .sku { font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="product-name">${product.name}</div>
          <div class="sku">SKU: ${product.sku}</div>
          ${product.barcode ? `<div class="barcode">*${product.barcode}*</div>` : ''}
          <div class="price">KES ${product.sellingPrice.toLocaleString()}</div>
        </div>
        <script>window.print(); window.close();</script>
      </body>
      </html>
    `);
  }

  function handleImportProducts(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      const imported: Product[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const product: Product = {
          id: `PROD-${Date.now()}-${i}`,
          sku: values[0] || `SKU-${Date.now()}-${i}`,
          name: values[1] || 'Unnamed Product',
          category: values[2] || 'Other',
          buyingPrice: parseFloat(values[3]) || 0,
          sellingPrice: parseFloat(values[4]) || 0,
          quantity: parseInt(values[5]) || 0,
          reorderLevel: parseInt(values[6]) || 0,
          unit: values[7] || 'Piece',
          brand: values[8] || '',
          barcode: values[9] || '',
          description: values[10] || '',
          supplier: values[11] || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        imported.push(product);
      }

      const updated = [...products, ...imported];
      setProducts(updated);
      localStorage.setItem('products', JSON.stringify(updated));
      alert(`${imported.length} products imported successfully!`);
    };

    reader.readAsText(file);
  }

  function handleImportOpeningStock(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      
      let updatedCount = 0;
      const updated = products.map(product => {
        for (let i = 1; i < lines.length; i++) {
          const [sku, quantity] = lines[i].split(',');
          if (product.sku === sku.trim()) {
            updatedCount++;
            return {
              ...product,
              quantity: parseInt(quantity) || 0,
              updatedAt: new Date().toISOString()
            };
          }
        }
        return product;
      });

      setProducts(updated);
      localStorage.setItem('products', JSON.stringify(updated));
      alert(`Opening stock updated for ${updatedCount} products!`);
    };

    reader.readAsText(file);
  }

  function handleExportProducts() {
    const headers = ['SKU', 'Name', 'Category', 'Brand', 'Unit', 'Buying Price', 'Selling Price', 'Quantity', 'Reorder Level', 'Barcode', 'Description', 'Supplier'];
    const csvRows = [headers.join(',')];

    filteredProducts.forEach(product => {
      const row = [
        product.sku,
        `"${product.name}"`,
        product.category,
        product.brand || '',
        product.unit,
        product.buyingPrice,
        product.sellingPrice,
        product.quantity,
        product.reorderLevel,
        product.barcode || '',
        `"${product.description || ''}"`,
        product.supplier || ''
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function addVariation() {
    const newVariation: ProductVariation = {
      id: `VAR-${Date.now()}`,
      name: '',
      sku: '',
      barcode: '',
      buyingPrice: 0,
      sellingPrice: 0,
      quantity: 0
    };
    setVariations([...variations, newVariation]);
  }

  function updateVariation(index: number, field: string, value: any) {
    const updated = variations.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    setVariations(updated);
  }

  function removeVariation(index: number) {
    setVariations(variations.filter((_, i) => i !== index));
  }

  function addPriceGroup() {
    if (!priceGroupForm.groupName || priceGroupForm.price === 0) {
      alert('Please fill in group name and price');
      return;
    }

    setSellingPriceGroups([...sellingPriceGroups, { ...priceGroupForm }]);
    setPriceGroupForm({ groupName: '', price: 0, description: '' });
  }

  function removePriceGroup(index: number) {
    setSellingPriceGroups(sellingPriceGroups.filter((_, i) => i !== index));
  }

  function resetForm() {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category: '',
      brand: '',
      unit: 'Piece',
      buyingPrice: 0,
      sellingPrice: 0,
      quantity: 0,
      reorderLevel: 0,
      description: '',
      supplier: '',
      warranty: '',
      warrantyPeriod: 0
    });
    setVariations([]);
    setSellingPriceGroups([]);
  }

  function openEditModal(product: Product) {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      category: product.category,
      brand: product.brand || '',
      unit: product.unit,
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      reorderLevel: product.reorderLevel,
      description: product.description || '',
      supplier: product.supplier || '',
      warranty: product.warranty || '',
      warrantyPeriod: product.warrantyPeriod || 0
    });
    setVariations(product.variations || []);
    setSellingPriceGroups(product.sellingPriceGroups || []);
    setModalType('edit');
    setShowModal(true);
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       p.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchBrand = filterBrand === 'all' || p.brand === filterBrand;
    
    const matchStatus = filterStatus === 'all' || 
                       (filterStatus === 'out' && p.quantity === 0) ||
                       (filterStatus === 'low' && p.quantity > 0 && p.quantity <= p.reorderLevel) ||
                       (filterStatus === 'good' && p.quantity > p.reorderLevel);
    
    return matchSearch && matchCategory && matchBrand && matchStatus;
  });

  const stockSummary = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.buyingPrice * p.quantity), 0),
    totalSellValue: products.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0),
    lowStock: products.filter(p => p.quantity > 0 && p.quantity <= p.reorderLevel).length,
    outOfStock: products.filter(p => p.quantity === 0).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Complete inventory control and management</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              resetForm();
              setSelectedProduct(null);
              setModalType('add');
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          List Products
        </button>
        <button
          onClick={() => setActiveTab('prices')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'prices' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Tag className="w-4 h-4 inline mr-2" />
          Price Groups
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'import' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Import
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'units' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Grid className="w-4 h-4 inline mr-2" />
          Units
        </button>
        <button
          onClick={() => setActiveTab('brands')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'brands' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Award className="w-4 h-4 inline mr-2" />
          Brands
        </button>
        <button
          onClick={() => setActiveTab('warranties')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'warranties' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Warranties
        </button>
        <button
          onClick={() => setActiveTab('adjustments')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'adjustments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Adjustments
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{stockSummary.totalProducts}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Stock Value (Buy)</p>
          <p className="text-2xl font-bold text-blue-600">
            KES {stockSummary.totalValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Stock Value (Sell)</p>
          <p className="text-2xl font-bold text-green-600">
            KES {stockSummary.totalSellValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600">{stockSummary.lowStock}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{stockSummary.outOfStock}</p>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'list' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, SKU, or barcode..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="good">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {viewMode === 'table' ? <Grid className="w-5 h-5" /> : <List className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleExportProducts}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Products Table/Grid */}
          {viewMode === 'table' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Brand</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Buy Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Sell Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.sku}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.barcode && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Barcode className="w-3 h-3" />
                              {product.barcode}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.brand || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.unit}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        KES {product.buyingPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        KES {product.sellingPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.quantity === 0
                            ? 'bg-red-100 text-red-700'
                            : product.quantity <= product.reorderLevel
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {product.quantity} {product.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintLabels(product)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Print Label"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
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
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-xs text-gray-500">{product.sku}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.quantity === 0
                        ? 'bg-red-100 text-red-700'
                        : product.quantity <= product.reorderLevel
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {product.quantity}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{product.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Brand:</span>
                      <span className="font-medium">{product.brand || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-bold text-green-600">
                        KES {product.sellingPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handlePrintLabels(product)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'import' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Products</h3>
            <p className="text-sm text-gray-600 mb-4">
              Import products from CSV file. Download the template first.
            </p>
            
            <div className="space-y-4">
              <a
                href="data:text/csv;charset=utf-8,SKU,Name,Category,Buying Price,Selling Price,Quantity,Reorder Level,Unit,Brand,Barcode,Description,Supplier%0ASKU-001,Sample Product,Dry Foods,100,150,50,10,Piece,BrandA,123456789,Description,Supplier"
                download="products_template.csv"
                className="block w-full px-4 py-2 text-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
              >
                <Download className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                Download Template
              </a>

              <label className="block">
                <span className="sr-only">Choose file</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportProducts}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Opening Stock</h3>
            <p className="text-sm text-gray-600 mb-4">
              Update stock quantities for existing products.
            </p>
            
            <div className="space-y-4">
              <a
                href="data:text/csv;charset=utf-8,SKU,Quantity%0ASKU-001,100%0ASKU-002,50"
                download="opening_stock_template.csv"
                className="block w-full px-4 py-2 text-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
              >
                <Download className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                Download Template
              </a>

              <label className="block">
                <span className="sr-only">Choose file</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportOpeningStock}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prices' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Price Update</h3>
            <div className="flex gap-4">
              <input
                type="number"
                placeholder="Percentage"
                className="px-4 py-2 border border-gray-300 rounded-lg"
                id="bulk-percentage"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('bulk-percentage') as HTMLInputElement;
                  const percentage = parseFloat(input.value);
                  if (percentage > 0) {
                    handleBulkPriceUpdate(percentage, 'increase');
                  }
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Increase All Prices
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('bulk-percentage') as HTMLInputElement;
                  const percentage = parseFloat(input.value);
                  if (percentage > 0) {
                    handleBulkPriceUpdate(percentage, 'decrease');
                  }
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Decrease All Prices
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selling Price Groups</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create different pricing tiers for wholesale, retail, etc.
            </p>
            <div className="text-gray-600">
              Add price groups when creating or editing products.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'units' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Units</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {units.map((unit, index) => (
              <div key={index} className="px-4 py-2 bg-gray-100 rounded-lg text-center">
                {unit}
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <input
              type="text"
              placeholder="Add new unit"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              id="new-unit"
            />
            <button
              onClick={() => {
                const input = document.getElementById('new-unit') as HTMLInputElement;
                if (input.value.trim()) {
                  const newUnits = [...units, input.value.trim()];
                  setUnits(newUnits);
                  localStorage.setItem('product_units', JSON.stringify(newUnits));
                  input.value = '';
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Unit
            </button>
          </div>
        </div>
      )}

      {activeTab === 'brands' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Brands</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {brands.map((brand, index) => (
              <div key={index} className="px-4 py-2 bg-gray-100 rounded-lg text-center">
                {brand}
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <input
              type="text"
              placeholder="Add new brand"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              id="new-brand"
            />
            <button
              onClick={() => {
                const input = document.getElementById('new-brand') as HTMLInputElement;
                if (input.value.trim()) {
                  const newBrands = [...brands, input.value.trim()];
                  setBrands(newBrands);
                  localStorage.setItem('product_brands', JSON.stringify(newBrands));
                  input.value = '';
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Brand
            </button>
          </div>
        </div>
      )}

      {activeTab === 'warranties' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Warranties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warranties.map(warranty => (
              <div key={warranty.id} className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900">{warranty.name}</h4>
                <p className="text-sm text-gray-600">{warranty.period} days</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'adjustments' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Adjustments</h3>
          <p className="text-sm text-gray-600 mb-4">
            Adjust stock quantities for products.
          </p>
          <StockAdjustment />
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'edit' ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                  setSelectedProduct(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <select
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select brand</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Pricing & Stock</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buying Price (KES) *
                    </label>
                    <input
                      type="number"
                      value={formData.buyingPrice}
                      onChange={(e) => setFormData({ ...formData, buyingPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price (KES) *
                    </label>
                    <input
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      value={formData.reorderLevel}
                      onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Variations */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Product Variations</h4>
                  <button
                    onClick={addVariation}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add Variation
                  </button>
                </div>
                {variations.map((variation, index) => (
                  <div key={variation.id} className="grid grid-cols-6 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={variation.name}
                      onChange={(e) => updateVariation(index, 'name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="SKU"
                      value={variation.sku}
                      onChange={(e) => updateVariation(index, 'sku', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Buy Price"
                      value={variation.buyingPrice}
                      onChange={(e) => updateVariation(index, 'buyingPrice', parseFloat(e.target.value) || 0)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Sell Price"
                      value={variation.sellingPrice}
                      onChange={(e) => updateVariation(index, 'sellingPrice', parseFloat(e.target.value) || 0)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={variation.quantity}
                      onChange={(e) => updateVariation(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={() => removeVariation(index)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Selling Price Groups */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Selling Price Groups</h4>
                <div className="space-y-2">
                  {sellingPriceGroups.map((group, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="flex-1 font-medium">{group.groupName}</span>
                      <span className="text-green-600">KES {group.price.toLocaleString()}</span>
                      <button
                        onClick={() => removePriceGroup(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Group name"
                      value={priceGroupForm.groupName}
                      onChange={(e) => setPriceGroupForm({ ...priceGroupForm, groupName: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={priceGroupForm.price}
                      onChange={(e) => setPriceGroupForm({ ...priceGroupForm, price: parseFloat(e.target.value) || 0 })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={priceGroupForm.description}
                      onChange={(e) => setPriceGroupForm({ ...priceGroupForm, description: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={addPriceGroup}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Other Details */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier
                    </label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warranty
                    </label>
                    <select
                      value={formData.warranty}
                      onChange={(e) => {
                        const warranty = warranties.find(w => w.name === e.target.value);
                        setFormData({ 
                          ...formData, 
                          warranty: e.target.value,
                          warrantyPeriod: warranty?.period || 0
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No warranty</option>
                      {warranties.map(w => (
                        <option key={w.id} value={w.name}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={modalType === 'edit' ? handleUpdateProduct : handleAddProduct}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {modalType === 'edit' ? 'Update Product' : 'Add Product'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                  setSelectedProduct(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}