import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, Eye, EyeOff, X, CheckCircle, AlertCircle, Key, Smartphone, Mail, RefreshCw } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'bookkeeper' | 'manager' | 'sales_agent';
  password?: string;
  createdAt: string;
  lastLogin?: string;
  status: 'active' | 'inactive';
  permissions: string[];
  mfaEnabled?: boolean;
  mfaSecret?: string;
  commissionRate?: number;
}

const rolePermissions = {
  owner: [
    'dashboard.view',
    'todaysprofit.view',
    'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
    'pos.access',
    'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
    'cashbank.view', 'cashbank.create', 'cashbank.edit', 'cashbank.delete',
    'debtors.view', 'debtors.edit',
    'reports.view', 'reports.generate',
    'tax.view', 'tax.file',
    'settings.view', 'settings.edit',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'analytics.view',
    'productcategories.view',
    'datamanagement.view',
    'microinvestintegration.view',
    'contactsmanagement.view'
  ],
  bookkeeper: [
    'dashboard.view',
    'todaysprofit.view',
    'sales.view',
    'purchases.view', 'purchases.create', 'purchases.edit',
    'inventory.view',
    'cashbank.view', 'cashbank.create', 'cashbank.edit',
    'debtors.view',
    'reports.view', 'reports.generate',
    'tax.view', 'tax.file',
    'analytics.view',
    'productcategories.view',
    'microinvestintegration.view',
    'contactsmanagement.view'
  ],
  manager: [
    'dashboard.view',
    'todaysprofit.view',
    'sales.view', 'sales.create', 'sales.edit',
    'pos.access',
    'purchases.view', 'purchases.create',
    'inventory.view', 'inventory.edit',
    'cashbank.view',
    'debtors.view',
    'reports.view',
    'analytics.view',
    'productcategories.view',
    'contactsmanagement.view'
  ],
  sales_agent: [
    'dashboard.view',
    'sales.view', 'sales.create',
    'pos.access',
    'inventory.view',
    'debtors.view',
    'contactsmanagement.view'
  ]
};

const roleDescriptions = {
  owner: 'Full system access including user management and settings',
  bookkeeper: 'Financial management, reports, and tax compliance',
  manager: 'Sales, POS, inventory, and daily operations',
  sales_agent: 'Sales and POS access with commission tracking'
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'manager' as 'owner' | 'bookkeeper' | 'manager' | 'sales_agent',
    password: '',
    confirmPassword: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  function loadUsers() {
    const storedUsers = localStorage.getItem('system_users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      const defaultOwner: User = {
        id: 'USER-001',
        name: 'John Kamau',
        email: 'admin@store.co.ke',
        phone: '0712345678',
        role: 'owner',
        createdAt: new Date().toISOString(),
        status: 'active',
        permissions: rolePermissions.owner,
        mfaEnabled: false
      };
      setUsers([defaultOwner]);
      localStorage.setItem('system_users', JSON.stringify([defaultOwner]));
    }
  }

  function handleCreateUser() {
    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    // Check if email already exists
    if (users.some(u => u.email === formData.email)) {
      alert('Email already exists');
      return;
    }

    const newUser: User = {
      id: `USER-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      createdAt: new Date().toISOString(),
      status: 'active',
      permissions: rolePermissions[formData.role],
      mfaEnabled: false
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('system_users', JSON.stringify(updatedUsers));
    
    setShowModal(false);
    resetForm();
    alert(`User ${newUser.name} created successfully!\n\nLogin credentials:\nEmail: ${newUser.email}\nPassword: ${formData.password}\n\nPlease save these credentials securely.`);
  }

  function handleEditUser() {
    if (!editingUser) return;

    const updatedUsers = users.map(u => 
      u.id === editingUser.id 
        ? { 
            ...u, 
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            permissions: rolePermissions[formData.role]
          } 
        : u
    );

    setUsers(updatedUsers);
    localStorage.setItem('system_users', JSON.stringify(updatedUsers));
    
    setShowModal(false);
    setEditingUser(null);
    resetForm();
    alert('User updated successfully!');
  }

  function handleDeleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('system_users', JSON.stringify(updatedUsers));
    alert('User deleted successfully!');
  }

  function handleToggleStatus(userId: string) {
    const updatedUsers = users.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'active' ? 'inactive' as const : 'active' as const }
        : u
    );
    setUsers(updatedUsers);
    localStorage.setItem('system_users', JSON.stringify(updatedUsers));
  }

  function handlePasswordReset(userId: string) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newPassword = generateRandomPassword();
    
    if (confirm(`Reset password for ${user.name}?\n\nNew password will be: ${newPassword}\n\nPlease save this password and share it securely with the user.`)) {
      alert(`Password reset successfully!\n\nNew password: ${newPassword}\n\nUser: ${user.email}`);
    }
  }

  function handlePasswordChange() {
    if (!selectedUser) return;

    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Please fill in all fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    alert(`Password changed successfully for ${selectedUser.name}!`);
    setShowPasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  }

  function handleToggleMFA(userId: string) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const updatedUsers = users.map(u => 
      u.id === userId 
        ? { ...u, mfaEnabled: !u.mfaEnabled, mfaSecret: !u.mfaEnabled ? generateMFASecret() : undefined }
        : u
    );
    
    setUsers(updatedUsers);
    localStorage.setItem('system_users', JSON.stringify(updatedUsers));
    
    if (!user.mfaEnabled) {
      setSelectedUser(updatedUsers.find(u => u.id === userId) || null);
      setShowMFAModal(true);
    }
  }

  function generateRandomPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  function generateMFASecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    setShowModal(true);
  }

  function openPasswordModal(user: User) {
    setSelectedUser(user);
    setShowPasswordModal(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'manager',
      password: '',
      confirmPassword: ''
    });
  }

  function viewPermissions(user: User) {
    setSelectedUser(user);
    setShowPermissionsModal(true);
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'bookkeeper': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'manager': return 'bg-green-100 text-green-700 border-green-200';
      case 'sales_agent': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and access permissions</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Owners</p>
              <p className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'owner').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-orange-600">
                {users.filter(u => u.status === 'inactive').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">User Accounts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewPermissions(user)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Permissions"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {user.role !== 'owner' && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handlePasswordReset(user.id)}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleMFA(user.id)}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        title={user.mfaEnabled ? "Disable MFA" : "Enable MFA"}
                      >
                        {user.mfaEnabled ? <Smartphone className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0712345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manager">Manager</option>
                  <option value="bookkeeper">Bookkeeper</option>
                  <option value="owner">Owner</option>
                  <option value="sales_agent">Sales Agent</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {roleDescriptions[formData.role]}
                </p>
              </div>

              {!editingUser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingUser ? handleEditUser : handleCreateUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">User Permissions</h3>
                <p className="text-sm text-gray-600">{selectedUser.name} - {selectedUser.role}</p>
              </div>
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries({
                'Dashboard': selectedUser.permissions.filter(p => p.startsWith('dashboard')),
                'Sales': selectedUser.permissions.filter(p => p.startsWith('sales')),
                'POS': selectedUser.permissions.filter(p => p.startsWith('pos')),
                'Purchases & Expenses': selectedUser.permissions.filter(p => p.startsWith('purchases')),
                'Inventory': selectedUser.permissions.filter(p => p.startsWith('inventory')),
                'Cash & Bank': selectedUser.permissions.filter(p => p.startsWith('cashbank')),
                'Debtors & Creditors': selectedUser.permissions.filter(p => p.startsWith('debtors')),
                'Reports': selectedUser.permissions.filter(p => p.startsWith('reports')),
                'Tax Compliance': selectedUser.permissions.filter(p => p.startsWith('tax')),
                'Settings': selectedUser.permissions.filter(p => p.startsWith('settings')),
                'User Management': selectedUser.permissions.filter(p => p.startsWith('users')),
                'Analytics': selectedUser.permissions.filter(p => p.startsWith('analytics')),
                'Product Categories': selectedUser.permissions.filter(p => p.startsWith('productcategories')),
                'Data Management': selectedUser.permissions.filter(p => p.startsWith('datamanagement')),
                'Microinvest Integration': selectedUser.permissions.filter(p => p.startsWith('microinvestintegration')),
                'Contacts Management': selectedUser.permissions.filter(p => p.startsWith('contactsmanagement'))
              }).map(([section, perms]) => {
                if (perms.length === 0) return null;
                return (
                  <div key={section} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{section}</h4>
                    <div className="flex flex-wrap gap-2">
                      {perms.map(perm => (
                        <span
                          key={perm}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full"
                        >
                          {perm.split('.')[1]}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setShowPermissionsModal(false);
                setSelectedUser(null);
              }}
              className="w-full mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePasswordChange}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Change Password
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MFA Modal */}
      {showMFAModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Multi-Factor Authentication</h3>
              <button
                onClick={() => {
                  setShowMFAModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Multi-Factor Authentication (MFA) is now enabled for {selectedUser.name}.
              </p>
              <p className="text-sm text-gray-600">
                Please scan the QR code below with your authenticator app (e.g., Google Authenticator, Authy).
              </p>
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/Store%20Management:${selectedUser.email}?secret=${selectedUser.mfaSecret}&issuer=Store%20Management`}
                  alt="MFA QR Code"
                />
              </div>
              <p className="text-sm text-gray-600">
                Alternatively, you can enter the following secret key into your authenticator app:
              </p>
              <div className="flex justify-center">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-700">
                  {selectedUser.mfaSecret}
                </code>
              </div>
            </div>

            <button
              onClick={() => {
                setShowMFAModal(false);
                setSelectedUser(null);
              }}
              className="w-full mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Role Permissions Reference */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(roleDescriptions).map(([role, description]) => (
            <div key={role} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900 capitalize">{role}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">{description}</p>
              <div className="text-xs text-gray-500">
                {rolePermissions[role as keyof typeof rolePermissions].length} permissions
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}