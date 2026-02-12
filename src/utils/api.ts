import { projectId, publicAnonKey } from './supabase/info';
import { saveOffline, getOffline, getAllOffline, queueForSync, isOnline as checkOnline } from './offlineStorage';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-412b6131`;

// In-memory fallback storage for when backend is not available
const localStorage = {
  products: [] as any[],
  sales: [] as any[],
  expenses: [] as any[],
  customers: [] as any[],
  suppliers: [] as any[],
  transactions: [] as any[],
  taxRecords: [] as any[],
  settings: {} as any,
};

let useLocalStorage = false;

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Check if we're offline
  if (!checkOnline()) {
    throw new Error('Offline - data will be synced when connection is restored');
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `Request failed: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }
      console.error(`API Error on ${endpoint}:`, errorMessage);
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    // Only switch to local storage mode if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Backend not available, using local storage fallback');
      useLocalStorage = true;
    }
    throw error;
  }
}

// ============ PRODUCTS ============

export async function getProducts() {
  // Try offline storage first
  const offlineData = getAllOffline('product:');
  if (offlineData.length > 0 || !checkOnline()) {
    return offlineData;
  }

  if (useLocalStorage) {
    return localStorage.products;
  }
  
  try {
    const data = await apiFetch('/products');
    // Cache in offline storage
    data.products.forEach((product: any) => {
      saveOffline(`product:${product.sku}`, product);
    });
    return data.products || [];
  } catch (error) {
    return offlineData.length > 0 ? offlineData : localStorage.products;
  }
}

export async function createProduct(product: any) {
  const productWithId = { ...product, sku: product.sku || `SKU-${Date.now()}` };
  
  // Save to offline storage immediately
  saveOffline(`product:${productWithId.sku}`, productWithId);
  
  // Queue for sync if offline
  if (!checkOnline()) {
    queueForSync('product', 'create', productWithId);
    return productWithId;
  }

  if (useLocalStorage) {
    localStorage.products.push(productWithId);
    return productWithId;
  }
  
  try {
    const data = await apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return data.product;
  } catch (error) {
    // Queue for later sync
    queueForSync('product', 'create', productWithId);
    localStorage.products.push(productWithId);
    return productWithId;
  }
}

export async function updateProduct(sku: string, updates: any) {
  const existingProduct = getOffline(`product:${sku}`);
  const productWithId = { ...existingProduct, ...updates, sku };
  
  // Save to offline storage immediately
  saveOffline(`product:${sku}`, productWithId);
  
  // Queue for sync if offline
  if (!checkOnline()) {
    queueForSync('product', 'update', productWithId);
    return productWithId;
  }

  if (useLocalStorage) {
    const index = localStorage.products.findIndex(p => p.sku === sku);
    if (index !== -1) {
      localStorage.products[index] = { ...localStorage.products[index], ...updates };
      return localStorage.products[index];
    }
    // If not found in memory, still return the updated product
    localStorage.products.push(productWithId);
    return productWithId;
  }
  
  try {
    const data = await apiFetch(`/products/${sku}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    // Update offline storage with server response
    saveOffline(`product:${sku}`, data.product);
    return data.product;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error updating product ${sku}:`, errorMessage);
    // Queue for later sync
    queueForSync('product', 'update', productWithId);
    const index = localStorage.products.findIndex(p => p.sku === sku);
    if (index !== -1) {
      localStorage.products[index] = { ...localStorage.products[index], ...updates };
      return localStorage.products[index];
    }
    // Still return the product even if update failed
    localStorage.products.push(productWithId);
    return productWithId;
  }
}

export async function deleteProduct(sku: string) {
  // Save to offline storage immediately
  saveOffline(`product:${sku}`, null);
  
  // Queue for sync if offline
  if (!checkOnline()) {
    queueForSync('product', 'delete', { sku });
    return;
  }

  if (useLocalStorage) {
    localStorage.products = localStorage.products.filter(p => p.sku !== sku);
    return;
  }
  
  try {
    await apiFetch(`/products/${sku}`, { method: 'DELETE' });
  } catch (error) {
    // Queue for later sync
    queueForSync('product', 'delete', { sku });
    localStorage.products = localStorage.products.filter(p => p.sku !== sku);
  }
}

// ============ SALES ============

export async function getSales() {
  // Try offline storage first
  const offlineData = getAllOffline('sale:');
  if (offlineData.length > 0 || !checkOnline()) {
    return offlineData;
  }

  if (useLocalStorage) {
    return localStorage.sales;
  }
  
  try {
    const data = await apiFetch('/sales');
    // Cache in offline storage
    if (data.sales && Array.isArray(data.sales)) {
      data.sales.forEach((sale: any) => {
        saveOffline(`sale:${sale.id}`, sale);
      });
    }
    return data.sales || [];
  } catch (error) {
    console.error('Error fetching sales:', error);
    return offlineData.length > 0 ? offlineData : localStorage.sales;
  }
}

export async function createSale(sale: any) {
  const saleWithId = {
    ...sale,
    id: sale.id || `INV-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  
  // Save to offline storage immediately
  saveOffline(`sale:${saleWithId.id}`, saleWithId);
  
  // Update product quantities locally
  if (sale.items && Array.isArray(sale.items)) {
    for (const item of sale.items) {
      const offlineProduct = getOffline(`product:${item.sku}`);
      if (offlineProduct) {
        offlineProduct.quantity = (offlineProduct.quantity || 0) - item.quantity;
        saveOffline(`product:${item.sku}`, offlineProduct);
      } else {
        // Also update in-memory storage
        const product = localStorage.products.find(p => p.sku === item.sku);
        if (product) {
          product.quantity = (product.quantity || 0) - item.quantity;
        }
      }
    }
  }
  
  // Queue for sync if offline
  if (!checkOnline()) {
    queueForSync('sale', 'create', saleWithId);
    return saleWithId;
  }

  if (useLocalStorage) {
    localStorage.sales.push(saleWithId);
    
    // Update product quantities in memory
    if (sale.items && Array.isArray(sale.items)) {
      for (const item of sale.items) {
        const product = localStorage.products.find(p => p.sku === item.sku);
        if (product) {
          product.quantity = (product.quantity || 0) - item.quantity;
        }
      }
    }
    
    return saleWithId;
  }
  
  try {
    const data = await apiFetch('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
    return data.sale;
  } catch (error) {
    console.error('Error creating sale:', error);
    // Queue for later sync
    queueForSync('sale', 'create', saleWithId);
    localStorage.sales.push(saleWithId);
    
    if (sale.items && Array.isArray(sale.items)) {
      for (const item of sale.items) {
        const product = localStorage.products.find(p => p.sku === item.sku);
        if (product) {
          product.quantity = (product.quantity || 0) - item.quantity;
        }
      }
    }
    
    return saleWithId;
  }
}

// ============ PURCHASES & EXPENSES ============

export async function getPurchases() {
  // Try offline storage first
  const offlineData = getAllOffline('purchase:');
  if (offlineData.length > 0 || !checkOnline()) {
    return offlineData;
  }

  if (useLocalStorage) {
    return localStorage.expenses;
  }
  
  try {
    const data = await apiFetch('/purchases');
    // Cache in offline storage
    if (data.purchases && Array.isArray(data.purchases)) {
      data.purchases.forEach((purchase: any) => {
        saveOffline(`purchase:${purchase.id}`, purchase);
      });
    }
    return data.purchases || [];
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return offlineData.length > 0 ? offlineData : localStorage.expenses;
  }
}

export async function createPurchase(purchase: any) {
  const purchaseWithId = {
    ...purchase,
    id: purchase.id || `EXP-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  
  // Save to offline storage immediately
  saveOffline(`purchase:${purchaseWithId.id}`, purchaseWithId);
  
  // Queue for sync if offline
  if (!checkOnline()) {
    queueForSync('purchase', 'create', purchaseWithId);
    return purchaseWithId;
  }

  if (useLocalStorage) {
    localStorage.expenses.push(purchaseWithId);
    return purchaseWithId;
  }

  try {
    const data = await apiFetch('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseWithId),
    });
    return data.purchase || purchaseWithId;
  } catch (error) {
    // Keep offline copy even if sync fails
    console.error('Failed to create purchase online, keeping offline copy:', error);
    queueForSync('purchase', 'create', purchaseWithId);
    return purchaseWithId;
  }
}

export async function updatePurchase(id: string, updates: any) {
  const updatedPurchase = { ...updates, id, updatedAt: new Date().toISOString() };
  
  // Update offline storage immediately
  saveOffline(`purchase:${id}`, updatedPurchase);
  
  // Queue for sync if offline
  if (!checkOnline()) {
    queueForSync('purchase', 'update', updatedPurchase);
    return updatedPurchase;
  }

  if (useLocalStorage) {
    const index = localStorage.expenses.findIndex(p => p.id === id);
    if (index >= 0) {
      localStorage.expenses[index] = updatedPurchase;
    }
    return updatedPurchase;
  }

  try {
    const data = await apiFetch(`/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.purchase || updatedPurchase;
  } catch (error) {
    console.error('Failed to update purchase online, keeping offline copy:', error);
    queueForSync('purchase', 'update', updatedPurchase);
    return updatedPurchase;
  }
}

export async function deletePurchase(id: string) {
  // Remove from offline storage
  const storageKey = `purchase:${id}`;
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(storageKey);
  }
  
  // Queue for sync if offline
  if (!checkOnline()) {
    queueForSync('purchase', 'delete', { id });
    return;
  }

  if (useLocalStorage) {
    localStorage.expenses = localStorage.expenses.filter(p => p.id !== id);
    return;
  }

  try {
    await apiFetch(`/purchases/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to delete purchase online:', error);
    queueForSync('purchase', 'delete', { id });
  }
}

// ============ CUSTOMERS ============

export async function getCustomers() {
  // Try offline storage first
  const offlineData = getAllOffline('customer:');
  if (offlineData.length > 0 || !checkOnline()) {
    return offlineData;
  }

  if (useLocalStorage) {
    return localStorage.customers;
  }
  
  try {
    const data = await apiFetch('/customers');
    // Cache in offline storage
    if (data.customers && Array.isArray(data.customers)) {
      data.customers.forEach((customer: any) => {
        saveOffline(`customer:${customer.id}`, customer);
      });
    }
    return data.customers || [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    return offlineData.length > 0 ? offlineData : localStorage.customers;
  }
}

export async function createCustomer(customer: any) {
  const customerWithId = {
    ...customer,
    id: customer.id || `CUST-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  
  // Save to offline storage immediately
  saveOffline(`customer:${customerWithId.id}`, customerWithId);
  
  // Queue for sync if offline
  if (!checkOnline()) {
    queueForSync('customer', 'create', customerWithId);
    return customerWithId;
  }

  if (useLocalStorage) {
    localStorage.customers.push(customerWithId);
    return customerWithId;
  }
  
  try {
    const data = await apiFetch('/customers', {
      method: 'POST',
      body: JSON.stringify(customerWithId),
    });
    // Update offline storage with server response
    if (data.customer) {
      saveOffline(`customer:${data.customer.id}`, data.customer);
      return data.customer;
    }
    return customerWithId;
  } catch (error) {
    console.error('Failed to save customer to server, stored locally:', error);
    localStorage.customers.push(customerWithId);
    return customerWithId;
  }
}

export async function updateCustomer(id: string, updates: any) {
  if (useLocalStorage) {
    const index = localStorage.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      localStorage.customers[index] = { ...localStorage.customers[index], ...updates };
      return localStorage.customers[index];
    }
    throw new Error('Customer not found');
  }
  
  try {
    const data = await apiFetch(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.customer;
  } catch (error) {
    const index = localStorage.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      localStorage.customers[index] = { ...localStorage.customers[index], ...updates };
      return localStorage.customers[index];
    }
    throw error;
  }
}

// ============ SUPPLIERS ============

export async function getSuppliers() {
  // Try offline storage first
  const offlineData = getAllOffline('supplier:');
  if (offlineData.length > 0 || !checkOnline()) {
    return offlineData;
  }

  if (useLocalStorage) {
    return localStorage.suppliers;
  }
  
  try {
    const data = await apiFetch('/suppliers');
    // Cache in offline storage
    if (data.suppliers && Array.isArray(data.suppliers)) {
      data.suppliers.forEach((supplier: any) => {
        saveOffline(`supplier:${supplier.id}`, supplier);
      });
    }
    return data.suppliers || [];
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return offlineData.length > 0 ? offlineData : localStorage.suppliers;
  }
}

export async function createSupplier(supplier: any) {
  const supplierWithId = {
    ...supplier,
    id: supplier.id || `SUP-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  
  // Save to offline storage immediately
  saveOffline(`supplier:${supplierWithId.id}`, supplierWithId);
  
  // Queue for sync if offline
  if (!checkOnline()) {
    queueForSync('supplier', 'create', supplierWithId);
    return supplierWithId;
  }

  if (useLocalStorage) {
    localStorage.suppliers.push(supplierWithId);
    return supplierWithId;
  }
  
  try {
    const data = await apiFetch('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierWithId),
    });
    // Update offline storage with server response
    if (data.supplier) {
      saveOffline(`supplier:${data.supplier.id}`, data.supplier);
      return data.supplier;
    }
    return supplierWithId;
  } catch (error) {
    console.error('Failed to save supplier to server, stored locally:', error);
    localStorage.suppliers.push(supplierWithId);
    return supplierWithId;
  }
}

export async function updateSupplier(id: string, updates: any) {
  if (useLocalStorage) {
    const index = localStorage.suppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      localStorage.suppliers[index] = { ...localStorage.suppliers[index], ...updates };
      return localStorage.suppliers[index];
    }
    throw new Error('Supplier not found');
  }
  
  try {
    const data = await apiFetch(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.supplier;
  } catch (error) {
    const index = localStorage.suppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      localStorage.suppliers[index] = { ...localStorage.suppliers[index], ...updates };
      return localStorage.suppliers[index];
    }
    throw error;
  }
}

// ============ TRANSACTIONS ============

export async function getTransactions() {
  // Try offline storage first
  const offlineData = getAllOffline('transaction:');
  if (offlineData.length > 0 || !checkOnline()) {
    return offlineData;
  }

  if (useLocalStorage) {
    return localStorage.transactions;
  }
  
  try {
    const data = await apiFetch('/transactions');
    // Cache in offline storage
    if (data.transactions) {
      data.transactions.forEach((txn: any) => {
        saveOffline(`transaction:${txn.id}`, txn);
      });
    }
    return data.transactions || [];
  } catch (error) {
    return offlineData.length > 0 ? offlineData : localStorage.transactions;
  }
}

export async function createTransaction(transaction: any) {
  const txnWithId = {
    ...transaction,
    id: transaction.id || `TXN-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  
  // Save to offline storage immediately
  saveOffline(`transaction:${txnWithId.id}`, txnWithId);
  
  // Queue for sync if offline
  if (!checkOnline()) {
    queueForSync('transaction', 'create', txnWithId);
    return txnWithId;
  }

  if (useLocalStorage) {
    localStorage.transactions.push(txnWithId);
    return txnWithId;
  }
  
  try {
    const data = await apiFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify(txnWithId),
    });
    // Update offline storage with server response
    if (data.transaction) {
      saveOffline(`transaction:${data.transaction.id}`, data.transaction);
      return data.transaction;
    }
    return txnWithId;
  } catch (error) {
    // Already saved to offline storage above
    console.error('Failed to save transaction to server, stored locally:', error);
    localStorage.transactions.push(txnWithId);
    return txnWithId;
  }
}

// ============ TAX RECORDS ============

export async function getTaxRecords() {
  if (useLocalStorage) {
    return localStorage.taxRecords;
  }
  
  try {
    const data = await apiFetch('/tax-records');
    return data.taxRecords || [];
  } catch (error) {
    return localStorage.taxRecords;
  }
}

export async function createTaxRecord(taxRecord: any) {
  if (useLocalStorage) {
    const recordWithId = {
      ...taxRecord,
      id: `tax:${taxRecord.period}:${taxRecord.type}`,
      createdAt: new Date().toISOString()
    };
    localStorage.taxRecords.push(recordWithId);
    return recordWithId;
  }
  
  try {
    const data = await apiFetch('/tax-records', {
      method: 'POST',
      body: JSON.stringify(taxRecord),
    });
    return data.taxRecord;
  } catch (error) {
    const recordWithId = {
      ...taxRecord,
      id: `tax:${taxRecord.period}:${taxRecord.type}`,
      createdAt: new Date().toISOString()
    };
    localStorage.taxRecords.push(recordWithId);
    return recordWithId;
  }
}

// ============ DASHBOARD ============

export async function getDashboardStats() {
  if (useLocalStorage) {
    const totalSales = localStorage.sales.reduce((sum: number, sale: any) => sum + (sale.amount || 0), 0);
    const totalExpenses = localStorage.expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    const totalDebt = localStorage.customers.reduce((sum: number, cust: any) => sum + (cust.totalDebt || 0), 0);
    const totalPayables = localStorage.suppliers.reduce((sum: number, sup: any) => sum + (sup.totalOwed || 0), 0);
    const stockValue = localStorage.products.reduce((sum: number, prod: any) => 
      sum + ((prod.buyPrice || 0) * (prod.quantity || 0)), 0);
    
    return {
      totalSales,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
      totalDebt,
      totalPayables,
      stockValue,
      totalProducts: localStorage.products.length,
      totalCustomers: localStorage.customers.length,
      totalSuppliers: localStorage.suppliers.length
    };
  }
  
  try {
    const data = await apiFetch('/dashboard-stats');
    return data.stats || {};
  } catch (error) {
    const totalSales = localStorage.sales.reduce((sum: number, sale: any) => sum + (sale.amount || 0), 0);
    const totalExpenses = localStorage.expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    const totalDebt = localStorage.customers.reduce((sum: number, cust: any) => sum + (cust.totalDebt || 0), 0);
    const totalPayables = localStorage.suppliers.reduce((sum: number, sup: any) => sum + (sup.totalOwed || 0), 0);
    const stockValue = localStorage.products.reduce((sum: number, prod: any) => 
      sum + ((prod.buyPrice || 0) * (prod.quantity || 0)), 0);
    
    return {
      totalSales,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
      totalDebt,
      totalPayables,
      stockValue,
      totalProducts: localStorage.products.length,
      totalCustomers: localStorage.customers.length,
      totalSuppliers: localStorage.suppliers.length
    };
  }
}

// ============ SETTINGS ============

export async function getSettings() {
  if (useLocalStorage) {
    return localStorage.settings;
  }
  
  try {
    const data = await apiFetch('/settings');
    return data.settings || {};
  } catch (error) {
    return localStorage.settings;
  }
}

export async function updateSettings(settings: any) {
  if (useLocalStorage) {
    localStorage.settings = settings;
    return settings;
  }
  
  try {
    const data = await apiFetch('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return data.settings;
  } catch (error) {
    localStorage.settings = settings;
    return settings;
  }
}

// ============ SEED DATA ============

export async function seedData() {
  if (useLocalStorage) {
    if (localStorage.products.length > 0) {
      throw new Error('Data already exists');
    }

    // Seed products
    localStorage.products = [
      { sku: 'SKU-001', name: 'Sugar 2kg', category: 'Dry Foods', buyPrice: 180, sellPrice: 230, quantity: 450, reorderLevel: 100 },
      { sku: 'SKU-002', name: 'Rice 5kg', category: 'Dry Foods', buyPrice: 520, sellPrice: 680, quantity: 85, reorderLevel: 100 },
      { sku: 'SKU-003', name: 'Cooking Oil 1L', category: 'Cooking', buyPrice: 280, sellPrice: 350, quantity: 32, reorderLevel: 50 },
      { sku: 'SKU-004', name: 'Wheat Flour 2kg', category: 'Dry Foods', buyPrice: 160, sellPrice: 210, quantity: 220, reorderLevel: 80 },
      { sku: 'SKU-005', name: 'Maize Flour 2kg', category: 'Dry Foods', buyPrice: 140, sellPrice: 185, quantity: 180, reorderLevel: 100 },
      { sku: 'SKU-006', name: 'Salt 500g', category: 'Spices', buyPrice: 25, sellPrice: 40, quantity: 15, reorderLevel: 40 },
      { sku: 'SKU-007', name: 'Tea Leaves 250g', category: 'Beverages', buyPrice: 120, sellPrice: 165, quantity: 95, reorderLevel: 60 },
      { sku: 'SKU-008', name: 'Milk 500ml', category: 'Dairy', buyPrice: 55, sellPrice: 75, quantity: 240, reorderLevel: 100 },
    ];

    // Seed customers
    localStorage.customers = [
      { id: 'CUST-001', name: 'Jane Mwangi', phone: '0712345678', totalDebt: 45000, creditLimit: 100000 },
      { id: 'CUST-002', name: 'Kamau Store', phone: '0723456789', totalDebt: 89000, creditLimit: 150000 },
      { id: 'CUST-003', name: 'Peter Ochieng', phone: '0734567890', totalDebt: 28500, creditLimit: 50000 },
      { id: 'CUST-004', name: 'Grace Njeri', phone: '0745678901', totalDebt: 12000, creditLimit: 30000 },
    ];

    // Seed suppliers
    localStorage.suppliers = [
      { id: 'SUP-001', name: 'ABC Wholesalers', phone: '0711222333', totalOwed: 125000 },
      { id: 'SUP-002', name: 'Kenya Suppliers Ltd', phone: '0722333444', totalOwed: 45000 },
      { id: 'SUP-003', name: 'Fresh Foods Distributors', phone: '0733444555', totalOwed: 32000 },
    ];

    // Seed business settings
    localStorage.settings = {
      businessName: 'Kamau Distributors Ltd',
      kraPin: 'A001234567X',
      phone: '0712345678',
      email: 'info@kamaudistributors.co.ke',
      address: 'Tom Mboya Street, Nairobi CBD',
      vatRegistered: true,
      currency: 'KES'
    };

    return { success: true, message: 'Sample data seeded successfully' };
  }
  
  try {
    const data = await apiFetch('/seed-data', { method: 'POST' });
    return data;
  } catch (error) {
    if (localStorage.products.length > 0) {
      throw new Error('Data already exists');
    }

    localStorage.products = [
      { sku: 'SKU-001', name: 'Sugar 2kg', category: 'Dry Foods', buyPrice: 180, sellPrice: 230, quantity: 450, reorderLevel: 100 },
      { sku: 'SKU-002', name: 'Rice 5kg', category: 'Dry Foods', buyPrice: 520, sellPrice: 680, quantity: 85, reorderLevel: 100 },
      { sku: 'SKU-003', name: 'Cooking Oil 1L', category: 'Cooking', buyPrice: 280, sellPrice: 350, quantity: 32, reorderLevel: 50 },
      { sku: 'SKU-004', name: 'Wheat Flour 2kg', category: 'Dry Foods', buyPrice: 160, sellPrice: 210, quantity: 220, reorderLevel: 80 },
      { sku: 'SKU-005', name: 'Maize Flour 2kg', category: 'Dry Foods', buyPrice: 140, sellPrice: 185, quantity: 180, reorderLevel: 100 },
      { sku: 'SKU-006', name: 'Salt 500g', category: 'Spices', buyPrice: 25, sellPrice: 40, quantity: 15, reorderLevel: 40 },
      { sku: 'SKU-007', name: 'Tea Leaves 250g', category: 'Beverages', buyPrice: 120, sellPrice: 165, quantity: 95, reorderLevel: 60 },
      { sku: 'SKU-008', name: 'Milk 500ml', category: 'Dairy', buyPrice: 55, sellPrice: 75, quantity: 240, reorderLevel: 100 },
    ];

    localStorage.customers = [
      { id: 'CUST-001', name: 'Jane Mwangi', phone: '0712345678', totalDebt: 45000, creditLimit: 100000 },
      { id: 'CUST-002', name: 'Kamau Store', phone: '0723456789', totalDebt: 89000, creditLimit: 150000 },
      { id: 'CUST-003', name: 'Peter Ochieng', phone: '0734567890', totalDebt: 28500, creditLimit: 50000 },
      { id: 'CUST-004', name: 'Grace Njeri', phone: '0745678901', totalDebt: 12000, creditLimit: 30000 },
    ];

    localStorage.suppliers = [
      { id: 'SUP-001', name: 'ABC Wholesalers', phone: '0711222333', totalOwed: 125000 },
      { id: 'SUP-002', name: 'Kenya Suppliers Ltd', phone: '0722333444', totalOwed: 45000 },
      { id: 'SUP-003', name: 'Fresh Foods Distributors', phone: '0733444555', totalOwed: 32000 },
    ];

    localStorage.settings = {
      businessName: 'Kamau Distributors Ltd',
      kraPin: 'A001234567X',
      phone: '0712345678',
      email: 'info@kamaudistributors.co.ke',
      address: 'Tom Mboya Street, Nairobi CBD',
      vatRegistered: true,
      currency: 'KES'
    };

    return { success: true, message: 'Sample data seeded successfully' };
  }
}