import { useState } from 'react';
import { Download, Upload, Database, HardDrive, FileText, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';

export function DataManagement() {
  const [backupStatus, setBackupStatus] = useState<'idle' | 'backing-up' | 'success' | 'error'>('idle');
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'restoring' | 'success' | 'error'>('idle');

  function getAllData() {
    const data = {
      users: JSON.parse(localStorage.getItem('system_users') || '[]'),
      products: JSON.parse(localStorage.getItem('products') || '[]'),
      categories: JSON.parse(localStorage.getItem('product_categories') || '[]'),
      sales: JSON.parse(localStorage.getItem('sales') || '[]'),
      purchases: JSON.parse(localStorage.getItem('purchases') || '[]'),
      customers: JSON.parse(localStorage.getItem('customers') || '[]'),
      suppliers: JSON.parse(localStorage.getItem('suppliers') || '[]'),
      transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
      taxRecords: JSON.parse(localStorage.getItem('taxRecords') || '[]'),
      settings: JSON.parse(localStorage.getItem('settings') || '{}'),
      backupDate: new Date().toISOString(),
      version: '1.0.0'
    };
    return data;
  }

  function handleFullBackup() {
    try {
      setBackupStatus('backing-up');
      const data = getAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookkeeping_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setBackupStatus('success');
      setTimeout(() => setBackupStatus('idle'), 3000);
    } catch (error) {
      console.error('Backup error:', error);
      setBackupStatus('error');
      setTimeout(() => setBackupStatus('idle'), 3000);
    }
  }

  function handleExportCSV(dataType: string) {
    let data: any[] = [];
    let filename = '';
    
    switch (dataType) {
      case 'sales':
        data = JSON.parse(localStorage.getItem('sales') || '[]');
        filename = 'sales';
        break;
      case 'purchases':
        data = JSON.parse(localStorage.getItem('purchases') || '[]');
        filename = 'purchases';
        break;
      case 'products':
        data = JSON.parse(localStorage.getItem('products') || '[]');
        filename = 'products';
        break;
      case 'customers':
        data = JSON.parse(localStorage.getItem('customers') || '[]');
        filename = 'customers';
        break;
      case 'suppliers':
        data = JSON.parse(localStorage.getItem('suppliers') || '[]');
        filename = 'suppliers';
        break;
      case 'transactions':
        data = JSON.parse(localStorage.getItem('transactions') || '[]');
        filename = 'transactions';
        break;
    }

    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`${filename} exported successfully!`);
  }

  function handleRestore(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setRestoreStatus('restoring');
        const data = JSON.parse(e.target?.result as string);
        
        // Validate backup file
        if (!data.backupDate || !data.version) {
          throw new Error('Invalid backup file');
        }

        // Restore all data
        if (data.users) localStorage.setItem('system_users', JSON.stringify(data.users));
        if (data.products) localStorage.setItem('products', JSON.stringify(data.products));
        if (data.categories) localStorage.setItem('product_categories', JSON.stringify(data.categories));
        if (data.sales) localStorage.setItem('sales', JSON.stringify(data.sales));
        if (data.purchases) localStorage.setItem('purchases', JSON.stringify(data.purchases));
        if (data.customers) localStorage.setItem('customers', JSON.stringify(data.customers));
        if (data.suppliers) localStorage.setItem('suppliers', JSON.stringify(data.suppliers));
        if (data.transactions) localStorage.setItem('transactions', JSON.stringify(data.transactions));
        if (data.taxRecords) localStorage.setItem('taxRecords', JSON.stringify(data.taxRecords));
        if (data.settings) localStorage.setItem('settings', JSON.stringify(data.settings));

        setRestoreStatus('success');
        setTimeout(() => {
          alert('Data restored successfully! The page will reload.');
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('Restore error:', error);
        setRestoreStatus('error');
        alert('Failed to restore backup. Please check the file and try again.');
        setTimeout(() => setRestoreStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
  }

  function handleClearData(dataType: string) {
    if (!confirm(`Are you sure you want to delete all ${dataType}? This action cannot be undone.`)) {
      return;
    }

    const confirmText = prompt(`Type "DELETE" to confirm deletion of all ${dataType}:`);
    if (confirmText !== 'DELETE') {
      alert('Deletion cancelled');
      return;
    }

    switch (dataType) {
      case 'sales':
        localStorage.removeItem('sales');
        break;
      case 'purchases':
        localStorage.removeItem('purchases');
        break;
      case 'products':
        localStorage.removeItem('products');
        break;
      case 'customers':
        localStorage.removeItem('customers');
        break;
      case 'suppliers':
        localStorage.removeItem('suppliers');
        break;
      case 'transactions':
        localStorage.removeItem('transactions');
        break;
    }

    alert(`All ${dataType} have been deleted`);
  }

  const dataStats = {
    users: JSON.parse(localStorage.getItem('system_users') || '[]').length,
    products: JSON.parse(localStorage.getItem('products') || '[]').length,
    categories: JSON.parse(localStorage.getItem('product_categories') || '[]').length,
    sales: JSON.parse(localStorage.getItem('sales') || '[]').length,
    purchases: JSON.parse(localStorage.getItem('purchases') || '[]').length,
    customers: JSON.parse(localStorage.getItem('customers') || '[]').length,
    suppliers: JSON.parse(localStorage.getItem('suppliers') || '[]').length,
    transactions: JSON.parse(localStorage.getItem('transactions') || '[]').length,
    taxRecords: JSON.parse(localStorage.getItem('taxRecords') || '[]').length
  };

  const totalRecords = Object.values(dataStats).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
        <p className="text-gray-600 mt-1">Backup, export, and manage your business data</p>
      </div>

      {/* Data Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Users</p>
            <p className="text-2xl font-bold text-blue-600">{dataStats.users}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Products</p>
            <p className="text-2xl font-bold text-green-600">{dataStats.products}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Categories</p>
            <p className="text-2xl font-bold text-purple-600">{dataStats.categories}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600">Sales</p>
            <p className="text-2xl font-bold text-orange-600">{dataStats.sales}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Purchases</p>
            <p className="text-2xl font-bold text-red-600">{dataStats.purchases}</p>
          </div>
          <div className="p-4 bg-teal-50 rounded-lg">
            <p className="text-sm text-gray-600">Customers</p>
            <p className="text-2xl font-bold text-teal-600">{dataStats.customers}</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-gray-600">Suppliers</p>
            <p className="text-2xl font-bold text-indigo-600">{dataStats.suppliers}</p>
          </div>
          <div className="p-4 bg-pink-50 rounded-lg">
            <p className="text-sm text-gray-600">Transactions</p>
            <p className="text-2xl font-bold text-pink-600">{dataStats.transactions}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600">Tax Records</p>
            <p className="text-2xl font-bold text-yellow-600">{dataStats.taxRecords}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
            <p className="text-sm text-gray-600">Total Records</p>
            <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
          </div>
        </div>
      </div>

      {/* Full System Backup */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Full System Backup</h2>
            <p className="text-sm text-gray-600">Download a complete backup of all your data</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleFullBackup}
            disabled={backupStatus === 'backing-up'}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {backupStatus === 'backing-up' ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Backing up...
              </>
            ) : backupStatus === 'success' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Backup Complete!
              </>
            ) : backupStatus === 'error' ? (
              <>
                <AlertTriangle className="w-5 h-5" />
                Backup Failed
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Full Backup
              </>
            )}
          </button>

          <label className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer">
            {restoreStatus === 'restoring' ? (
              <>
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Restoring...
              </>
            ) : restoreStatus === 'success' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Restore Complete!
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Restore from Backup
              </>
            )}
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              className="hidden"
              disabled={restoreStatus === 'restoring'}
            />
          </label>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> Always keep your backups in a secure location. Restoring a backup will overwrite all current data.
          </p>
        </div>
      </div>

      {/* Export Data by Type */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-green-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Export Data (CSV)</h2>
            <p className="text-sm text-gray-600">Export specific data types to CSV format</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { type: 'sales', label: 'Sales', count: dataStats.sales, color: 'orange' },
            { type: 'purchases', label: 'Purchases', count: dataStats.purchases, color: 'red' },
            { type: 'products', label: 'Products', count: dataStats.products, color: 'green' },
            { type: 'customers', label: 'Customers', count: dataStats.customers, color: 'teal' },
            { type: 'suppliers', label: 'Suppliers', count: dataStats.suppliers, color: 'indigo' },
            { type: 'transactions', label: 'Transactions', count: dataStats.transactions, color: 'pink' }
          ].map(item => (
            <button
              key={item.type}
              onClick={() => handleExportCSV(item.type)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{item.label}</span>
                <span className={`text-sm font-bold text-${item.color}-600`}>{item.count}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Download className="w-4 h-4" />
                Export CSV
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Data Maintenance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <HardDrive className="w-6 h-6 text-red-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Data Maintenance</h2>
            <p className="text-sm text-gray-600">Clear or reset specific data types</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { type: 'sales', label: 'Clear All Sales' },
            { type: 'purchases', label: 'Clear All Purchases' },
            { type: 'products', label: 'Clear All Products' },
            { type: 'customers', label: 'Clear All Customers' },
            { type: 'suppliers', label: 'Clear All Suppliers' },
            { type: 'transactions', label: 'Clear All Transactions' }
          ].map(item => (
            <button
              key={item.type}
              onClick={() => handleClearData(item.type)}
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-400"
            >
              <Trash2 className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Warning:</strong> Clearing data is permanent and cannot be undone. Always create a backup before performing maintenance operations.
          </p>
        </div>
      </div>

      {/* Storage Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Storage Information</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Data Location:</strong> Browser Local Storage</p>
          <p><strong>Total Records:</strong> {totalRecords} items</p>
          <p><strong>Last Backup:</strong> Check your downloads folder</p>
          <p><strong>Backup Format:</strong> JSON (Full backup), CSV (Individual exports)</p>
        </div>
      </div>
    </div>
  );
}
