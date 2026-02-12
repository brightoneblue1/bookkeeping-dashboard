import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Health check endpoint
app.get('/make-server-412b6131/health', (c) => {
  return c.json({ success: true, message: 'Server is running' });
});

// Setup endpoint to create the KV table
app.post('/make-server-412b6131/setup', async (c) => {
  try {
    const { error } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS kv_store_412b6131 (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (error) {
      // Try alternative method
      console.log('Direct table creation failed, attempting via query...');
      return c.json({ 
        success: false, 
        message: 'Please create the table manually in Supabase dashboard',
        sql: `
CREATE TABLE IF NOT EXISTS kv_store_412b6131 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
        `
      });
    }
    
    return c.json({ success: true, message: 'Database table created successfully' });
  } catch (error) {
    console.log('Setup error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============ PRODUCTS / INVENTORY ============

app.get('/make-server-412b6131/products', async (c) => {
  try {
    const products = await kv.getByPrefix('product');
    return c.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.post('/make-server-412b6131/products', async (c) => {
  try {
    const product = await c.req.json();
    const productId = product.sku || `SKU-${Date.now()}`;
    const productData = { ...product, sku: productId };
    await kv.set(`product:${productId}`, productData);
    return c.json({ success: true, product: productData });
  } catch (error) {
    console.error('Error creating product:', error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.put('/make-server-412b6131/products/:sku', async (c) => {
  try {
    const sku = c.req.param('sku');
    const updates = await c.req.json();
    const existing = await kv.get(`product:${sku}`);
    if (!existing) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }
    const updated = { ...existing, ...updates };
    await kv.set(`product:${sku}`, updated);
    return c.json({ success: true, product: updated });
  } catch (error) {
    console.error('Error updating product:', error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.delete('/make-server-412b6131/products/:sku', async (c) => {
  try {
    const sku = c.req.param('sku');
    await kv.del(`product:${sku}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

// ============ SALES ============

app.get('/make-server-412b6131/sales', async (c) => {
  try {
    const sales = await kv.getByPrefix('sale');
    return c.json({ success: true, sales });
  } catch (error) {
    console.log('Error fetching sales:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post('/make-server-412b6131/sales', async (c) => {
  try {
    const sale = await c.req.json();
    const saleId = sale.id || `INV-${Date.now()}`;
    const saleData = {
      ...sale,
      id: saleId,
      createdAt: new Date().toISOString()
    };
    await kv.set(`sale:${saleId}`, saleData);
    
    // Update product quantities
    if (sale.items && Array.isArray(sale.items)) {
      for (const item of sale.items) {
        const product = await kv.get(`product:${item.sku}`);
        if (product) {
          product.quantity = (product.quantity || 0) - item.quantity;
          await kv.set(`product:${item.sku}`, product);
        }
      }
    }
    
    return c.json({ success: true, sale: saleData });
  } catch (error) {
    console.error('Error creating sale:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

// ============ EXPENSES / PURCHASES ============

app.get('/make-server-412b6131/expenses', async (c) => {
  try {
    const expenses = await kv.getByPrefix('expense');
    return c.json({ success: true, expenses });
  } catch (error) {
    console.log('Error fetching expenses:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post('/make-server-412b6131/expenses', async (c) => {
  try {
    const expense = await c.req.json();
    const expenseId = expense.id || `EXP-${Date.now()}`;
    const expenseData = {
      ...expense,
      id: expenseId,
      createdAt: new Date().toISOString()
    };
    await kv.set(`expense:${expenseId}`, expenseData);
    
    // If it's a stock purchase, update inventory
    if (expense.category === 'Stock Purchases' && expense.items && Array.isArray(expense.items)) {
      for (const item of expense.items) {
        const product = await kv.get(`product:${item.sku}`);
        if (product) {
          product.quantity = (product.quantity || 0) + item.quantity;
          await kv.set(`product:${item.sku}`, product);
        }
      }
    }
    
    return c.json({ success: true, expense: expenseData });
  } catch (error) {
    console.log('Error creating expense:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Alias for purchases (same as expenses)
app.get('/make-server-412b6131/purchases', async (c) => {
  try {
    const purchases = await kv.getByPrefix('purchase');
    return c.json({ success: true, purchases });
  } catch (error) {
    console.log('Error fetching purchases:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post('/make-server-412b6131/purchases', async (c) => {
  try {
    const purchase = await c.req.json();
    const purchaseId = purchase.id || `EXP-${Date.now()}`;
    const purchaseData = {
      ...purchase,
      id: purchaseId,
      createdAt: new Date().toISOString()
    };
    await kv.set(`purchase:${purchaseId}`, purchaseData);
    
    // If it's a stock purchase, update inventory
    if (purchase.items && Array.isArray(purchase.items)) {
      for (const item of purchase.items) {
        const product = await kv.get(`product:${item.sku}`);
        if (product) {
          product.quantity = (product.quantity || 0) + item.quantity;
          await kv.set(`product:${item.sku}`, product);
        }
      }
    }
    
    return c.json({ success: true, purchase: purchaseData });
  } catch (error) {
    console.log('Error creating purchase:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.put('/make-server-412b6131/purchases/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existing = await kv.get(`purchase:${id}`);
    if (!existing) {
      return c.json({ success: false, error: 'Purchase not found' }, 404);
    }
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`purchase:${id}`, updated);
    return c.json({ success: true, purchase: updated });
  } catch (error) {
    console.log('Error updating purchase:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.delete('/make-server-412b6131/purchases/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`purchase:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting purchase:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============ CUSTOMERS (DEBTORS) ============

app.get('/make-server-412b6131/customers', async (c) => {
  try {
    const customers = await kv.getByPrefix('customer');
    return c.json({ success: true, customers });
  } catch (error) {
    console.log('Error fetching customers:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post('/make-server-412b6131/customers', async (c) => {
  try {
    const customer = await c.req.json();
    const customerId = customer.id || `CUST-${Date.now()}`;
    const customerData = { ...customer, id: customerId };
    await kv.set(`customer:${customerId}`, customerData);
    return c.json({ success: true, customer: customerData });
  } catch (error) {
    console.log('Error creating customer:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.put('/make-server-412b6131/customers/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existing = await kv.get(`customer:${id}`);
    if (!existing) {
      return c.json({ success: false, error: 'Customer not found' }, 404);
    }
    const updated = { ...existing, ...updates };
    await kv.set(`customer:${id}`, updated);
    return c.json({ success: true, customer: updated });
  } catch (error) {
    console.log('Error updating customer:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============ SUPPLIERS (CREDITORS) ============

app.get('/make-server-412b6131/suppliers', async (c) => {
  try {
    const suppliers = await kv.getByPrefix('supplier');
    return c.json({ success: true, suppliers });
  } catch (error) {
    console.log('Error fetching suppliers:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post('/make-server-412b6131/suppliers', async (c) => {
  try {
    const supplier = await c.req.json();
    const supplierId = supplier.id || `SUP-${Date.now()}`;
    const supplierData = { ...supplier, id: supplierId };
    await kv.set(`supplier:${supplierId}`, supplierData);
    return c.json({ success: true, supplier: supplierData });
  } catch (error) {
    console.log('Error creating supplier:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.put('/make-server-412b6131/suppliers/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existing = await kv.get(`supplier:${id}`);
    if (!existing) {
      return c.json({ success: false, error: 'Supplier not found' }, 404);
    }
    const updated = { ...existing, ...updates };
    await kv.set(`supplier:${id}`, updated);
    return c.json({ success: true, supplier: updated });
  } catch (error) {
    console.log('Error updating supplier:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============ TRANSACTIONS (CASH/BANK) ============

app.get('/make-server-412b6131/transactions', async (c) => {
  try {
    const transactions = await kv.getByPrefix('transaction');
    return c.json({ success: true, transactions });
  } catch (error) {
    console.log('Error fetching transactions:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post('/make-server-412b6131/transactions', async (c) => {
  try {
    const transaction = await c.req.json();
    const txnId = transaction.id || `TXN-${Date.now()}`;
    const txnData = {
      ...transaction,
      id: txnId,
      createdAt: new Date().toISOString()
    };
    await kv.set(`transaction:${txnId}`, txnData);
    return c.json({ success: true, transaction: txnData });
  } catch (error) {
    console.log('Error creating transaction:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============ TAX RECORDS ============

app.get('/make-server-412b6131/tax-records', async (c) => {
  try {
    const taxRecords = await kv.getByPrefix('tax');
    return c.json({ success: true, taxRecords });
  } catch (error) {
    console.log('Error fetching tax records:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post('/make-server-412b6131/tax-records', async (c) => {
  try {
    const taxRecord = await c.req.json();
    const recordId = `tax:${taxRecord.period}:${taxRecord.type}`;
    const taxData = { ...taxRecord, id: recordId, createdAt: new Date().toISOString() };
    await kv.set(recordId, taxData);
    return c.json({ success: true, taxRecord: taxData });
  } catch (error) {
    console.log('Error creating tax record:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============ DASHBOARD STATS ============

app.get('/make-server-412b6131/dashboard-stats', async (c) => {
  try {
    const sales = await kv.getByPrefix('sale');
    const products = await kv.getByPrefix('product');
    const expenses = await kv.getByPrefix('expense');
    const customers = await kv.getByPrefix('customer');
    const suppliers = await kv.getByPrefix('supplier');
    
    // Calculate stats
    const totalSales = sales.reduce((sum: number, sale: any) => sum + (sale.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    const totalDebt = customers.reduce((sum: number, cust: any) => sum + (cust.totalDebt || 0), 0);
    const totalPayables = suppliers.reduce((sum: number, sup: any) => sum + (sup.totalOwed || 0), 0);
    const stockValue = products.reduce((sum: number, prod: any) => 
      sum + ((prod.buyPrice || 0) * (prod.quantity || 0)), 0);
    
    return c.json({
      success: true,
      stats: {
        totalSales,
        totalExpenses,
        netProfit: totalSales - totalExpenses,
        totalDebt,
        totalPayables,
        stockValue,
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalSuppliers: suppliers.length
      }
    });
  } catch (error) {
    console.log('Error calculating dashboard stats:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============ SETTINGS ============

app.get('/make-server-412b6131/settings', async (c) => {
  try {
    const settings = await kv.get('business:settings') || {};
    return c.json({ success: true, settings });
  } catch (error) {
    console.log('Error fetching settings:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.put('/make-server-412b6131/settings', async (c) => {
  try {
    const settings = await c.req.json();
    await kv.set('business:settings', settings);
    return c.json({ success: true, settings });
  } catch (error) {
    console.log('Error updating settings:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============ SEED DATA (for initial setup) ============

app.post('/make-server-412b6131/seed-data', async (c) => {
  try {
    // Check if data already exists
    const existingProducts = await kv.getByPrefix('product');
    if (existingProducts.length > 0) {
      return c.json({ success: false, error: 'Data already exists' }, 400);
    }

    // Seed products
    const products = [
      { sku: 'SKU-001', name: 'Sugar 2kg', category: 'Dry Foods', buyPrice: 180, sellPrice: 230, quantity: 450, reorderLevel: 100 },
      { sku: 'SKU-002', name: 'Rice 5kg', category: 'Dry Foods', buyPrice: 520, sellPrice: 680, quantity: 85, reorderLevel: 100 },
      { sku: 'SKU-003', name: 'Cooking Oil 1L', category: 'Cooking', buyPrice: 280, sellPrice: 350, quantity: 32, reorderLevel: 50 },
      { sku: 'SKU-004', name: 'Wheat Flour 2kg', category: 'Dry Foods', buyPrice: 160, sellPrice: 210, quantity: 220, reorderLevel: 80 },
      { sku: 'SKU-005', name: 'Maize Flour 2kg', category: 'Dry Foods', buyPrice: 140, sellPrice: 185, quantity: 180, reorderLevel: 100 },
      { sku: 'SKU-006', name: 'Salt 500g', category: 'Spices', buyPrice: 25, sellPrice: 40, quantity: 15, reorderLevel: 40 },
      { sku: 'SKU-007', name: 'Tea Leaves 250g', category: 'Beverages', buyPrice: 120, sellPrice: 165, quantity: 95, reorderLevel: 60 },
      { sku: 'SKU-008', name: 'Milk 500ml', category: 'Dairy', buyPrice: 55, sellPrice: 75, quantity: 240, reorderLevel: 100 },
    ];

    for (const product of products) {
      await kv.set(`product:${product.sku}`, product);
    }

    // Seed customers
    const customers = [
      { id: 'CUST-001', name: 'Jane Mwangi', phone: '0712345678', totalDebt: 45000, creditLimit: 100000 },
      { id: 'CUST-002', name: 'Kamau Store', phone: '0723456789', totalDebt: 89000, creditLimit: 150000 },
      { id: 'CUST-003', name: 'Peter Ochieng', phone: '0734567890', totalDebt: 28500, creditLimit: 50000 },
      { id: 'CUST-004', name: 'Grace Njeri', phone: '0745678901', totalDebt: 12000, creditLimit: 30000 },
    ];

    for (const customer of customers) {
      await kv.set(`customer:${customer.id}`, customer);
    }

    // Seed suppliers
    const suppliers = [
      { id: 'SUP-001', name: 'ABC Wholesalers', phone: '0711222333', totalOwed: 125000 },
      { id: 'SUP-002', name: 'Kenya Suppliers Ltd', phone: '0722333444', totalOwed: 45000 },
      { id: 'SUP-003', name: 'Fresh Foods Distributors', phone: '0733444555', totalOwed: 32000 },
    ];

    for (const supplier of suppliers) {
      await kv.set(`supplier:${supplier.id}`, supplier);
    }

    // Seed business settings
    await kv.set('business:settings', {
      businessName: 'Kamau Distributors Ltd',
      kraPin: 'A001234567X',
      phone: '0712345678',
      email: 'info@kamaudistributors.co.ke',
      address: 'Tom Mboya Street, Nairobi CBD',
      vatRegistered: true,
      currency: 'KES'
    });

    return c.json({ success: true, message: 'Sample data seeded successfully' });
  } catch (error) {
    console.log('Error seeding data:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);