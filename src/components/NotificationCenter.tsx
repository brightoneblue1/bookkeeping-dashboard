import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle, TrendingDown, Package, DollarSign, Users, ShoppingCart, Calendar, Filter, Search, Trash2, Settings, Eye, Archive } from 'lucide-react';

type NotificationType = 
  | 'low_stock'
  | 'out_of_stock'
  | 'sale_created'
  | 'payment_received'
  | 'payment_overdue'
  | 'expense_added'
  | 'purchase_created'
  | 'stock_adjustment'
  | 'customer_registered'
  | 'tax_reminder'
  | 'system_alert'
  | 'backup_reminder'
  | 'report_ready';

type NotificationPriority = 'high' | 'medium' | 'low';

interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isArchived: boolean;
  actionUrl?: string;
  metadata?: any;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    low_stock: true,
    out_of_stock: true,
    sale_created: true,
    payment_received: true,
    payment_overdue: true,
    expense_added: false,
    purchase_created: true,
    stock_adjustment: true,
    customer_registered: false,
    tax_reminder: true,
    system_alert: true,
    backup_reminder: true,
    report_ready: false
  });

  useEffect(() => {
    loadNotifications();
    checkAndGenerateNotifications();
    
    // Check for new notifications every 30 seconds
    const interval = setInterval(() => {
      checkAndGenerateNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  function loadNotifications() {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      setNotifications(JSON.parse(stored));
    }
    
    const storedSettings = localStorage.getItem('notification_settings');
    if (storedSettings) {
      setNotificationSettings(JSON.parse(storedSettings));
    }
  }

  function saveNotifications(notifs: Notification[]) {
    setNotifications(notifs);
    localStorage.setItem('notifications', JSON.stringify(notifs));
  }

  function checkAndGenerateNotifications() {
    const newNotifications: Notification[] = [];

    // Check inventory levels
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    products.forEach((product: any) => {
      if (product.quantity === 0 && notificationSettings.out_of_stock) {
        newNotifications.push(createNotification(
          'out_of_stock',
          'high',
          'Out of Stock',
          `${product.name} is out of stock`,
          { productId: product.id, sku: product.sku }
        ));
      } else if (product.quantity <= product.reorderLevel && product.quantity > 0 && notificationSettings.low_stock) {
        newNotifications.push(createNotification(
          'low_stock',
          'medium',
          'Low Stock Alert',
          `${product.name} has only ${product.quantity} units left`,
          { productId: product.id, sku: product.sku, quantity: product.quantity }
        ));
      }
    });

    // Check overdue payments
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const today = new Date();
    sales.forEach((sale: any) => {
      if (sale.paymentStatus === 'unpaid' && notificationSettings.payment_overdue) {
        const saleDate = new Date(sale.date);
        const daysDiff = Math.floor((today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 30) {
          newNotifications.push(createNotification(
            'payment_overdue',
            'high',
            'Payment Overdue',
            `Payment for sale ${sale.saleNo} is ${daysDiff} days overdue`,
            { saleId: sale.id, saleNo: sale.saleNo, daysDiff }
          ));
        }
      }
    });

    // Check for tax filing reminders
    const currentDate = new Date();
    const dayOfMonth = currentDate.getDate();
    if (dayOfMonth === 15 && notificationSettings.tax_reminder) {
      newNotifications.push(createNotification(
        'tax_reminder',
        'high',
        'Tax Filing Reminder',
        'VAT filing is due by the 20th of this month',
        { dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20).toISOString() }
      ));
    }

    // Check for backup reminder (every 7 days)
    const lastBackup = localStorage.getItem('last_backup_date');
    if (lastBackup && notificationSettings.backup_reminder) {
      const lastBackupDate = new Date(lastBackup);
      const daysSinceBackup = Math.floor((today.getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceBackup >= 7) {
        newNotifications.push(createNotification(
          'backup_reminder',
          'medium',
          'Backup Reminder',
          `Last backup was ${daysSinceBackup} days ago. Consider backing up your data.`,
          { daysSinceBackup }
        ));
      }
    }

    // Add new notifications (avoid duplicates)
    const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const today24h = new Date();
    today24h.setHours(today24h.getHours() - 24);

    newNotifications.forEach(notif => {
      const isDuplicate = existingNotifications.some((existing: Notification) => 
        existing.type === notif.type &&
        existing.title === notif.title &&
        new Date(existing.timestamp) > today24h
      );

      if (!isDuplicate) {
        existingNotifications.unshift(notif);
      }
    });

    // Keep only last 100 notifications
    const trimmed = existingNotifications.slice(0, 100);
    saveNotifications(trimmed);
  }

  function createNotification(
    type: NotificationType,
    priority: NotificationPriority,
    title: string,
    message: string,
    metadata?: any
  ): Notification {
    return {
      id: `NOTIF-${Date.now()}-${Math.random()}`,
      type,
      priority,
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      isArchived: false,
      metadata
    };
  }

  function addNotification(
    type: NotificationType,
    priority: NotificationPriority,
    title: string,
    message: string,
    metadata?: any
  ) {
    if (!notificationSettings[type]) return;

    const notification = createNotification(type, priority, title, message, metadata);
    const updated = [notification, ...notifications];
    saveNotifications(updated);
  }

  function markAsRead(id: string) {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    saveNotifications(updated);
  }

  function markAllAsRead() {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    saveNotifications(updated);
  }

  function archiveNotification(id: string) {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, isArchived: true } : n
    );
    saveNotifications(updated);
  }

  function deleteNotification(id: string) {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
  }

  function clearAll() {
    if (confirm('Are you sure you want to delete all notifications?')) {
      saveNotifications([]);
    }
  }

  function saveSettings() {
    localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
    setShowSettings(false);
    alert('Notification settings saved!');
  }

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread' && n.isRead) return false;
    if (activeTab === 'archived' && !n.isArchived) return false;
    if (activeTab !== 'archived' && n.isArchived) return false;
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (searchTerm && !n.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !n.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.isRead && !n.isArchived).length;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'low_stock':
      case 'out_of_stock':
        return <Package className="w-5 h-5" />;
      case 'sale_created':
        return <ShoppingCart className="w-5 h-5" />;
      case 'payment_received':
      case 'payment_overdue':
        return <DollarSign className="w-5 h-5" />;
      case 'expense_added':
        return <TrendingDown className="w-5 h-5" />;
      case 'customer_registered':
        return <Users className="w-5 h-5" />;
      case 'tax_reminder':
        return <Calendar className="w-5 h-5" />;
      case 'system_alert':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  const getPriorityDot = (priority: NotificationPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
    }
  };

  // Expose addNotification globally for other components
  useEffect(() => {
    (window as any).addNotification = addNotification;
  }, [notificationSettings]);

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {highPriorityCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* Notification Panel */}
      {showPanel && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setShowPanel(false)}
          />
          <div className="fixed right-4 top-16 w-full max-w-md bg-white rounded-lg shadow-2xl z-50 max-h-[calc(100vh-5rem)] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowPanel(false)}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    activeTab === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({notifications.filter(n => !n.isArchived).length})
                </button>
                <button
                  onClick={() => setActiveTab('unread')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    activeTab === 'unread' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setActiveTab('archived')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    activeTab === 'archived' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Archived
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search notifications..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="sale_created">Sales</option>
                  <option value="payment_received">Payments</option>
                  <option value="payment_overdue">Overdue</option>
                  <option value="expense_added">Expenses</option>
                  <option value="tax_reminder">Tax</option>
                  <option value="system_alert">System</option>
                </select>
              </div>

              {/* Quick Actions */}
              {filteredNotifications.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {activeTab !== 'archived' && unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                  <button
                    onClick={clearAll}
                    className="text-xs text-red-600 hover:text-red-700 font-medium ml-auto"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No notifications</p>
                  <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                          {getIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {notification.title}
                            </h3>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${getPriorityDot(notification.priority)}`} />
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                  title="Mark as read"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              {!notification.isArchived && (
                                <button
                                  onClick={() => archiveNotification(notification.id)}
                                  className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                                  title="Archive"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600">Choose which notifications you want to receive:</p>

              <div className="space-y-3">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label htmlFor={key} className="text-sm font-medium text-gray-900 cursor-pointer flex-1">
                      {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </label>
                    <input
                      id={key}
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        [key]: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveSettings}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Settings
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
