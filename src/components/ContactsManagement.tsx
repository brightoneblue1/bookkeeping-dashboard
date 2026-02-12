import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, Search, Tag, Mail, Phone, MapPin } from 'lucide-react';

interface Contact {
  id: string;
  type: 'customer' | 'supplier';
  name: string;
  email: string;
  phone: string;
  address: string;
  group: string;
  taxNumber?: string;
  creditLimit?: number;
  balance: number;
  createdAt: string;
  status: 'active' | 'inactive';
}

interface ContactGroup {
  id: string;
  name: string;
  type: 'customer' | 'supplier';
  description: string;
  color: string;
  discount?: number;
  creditTerms?: number;
}

const colorOptions = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'green', label: 'Green', class: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'red', label: 'Red', class: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { value: 'teal', label: 'Teal', class: 'bg-teal-100 text-teal-700 border-teal-200' }
];

export function ContactsManagement() {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    group: '',
    taxNumber: '',
    creditLimit: 0
  });

  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    color: 'blue',
    discount: 0,
    creditTerms: 0
  });

  useEffect(() => {
    loadContacts();
    loadGroups();
  }, []);

  function loadContacts() {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    
    const allContacts = [
      ...customers.map((c: any) => ({ ...c, type: 'customer' as const })),
      ...suppliers.map((s: any) => ({ ...s, type: 'supplier' as const }))
    ];
    
    setContacts(allContacts);
  }

  function loadGroups() {
    const stored = localStorage.getItem('contact_groups');
    if (stored) {
      setGroups(JSON.parse(stored));
    } else {
      const defaultGroups: ContactGroup[] = [
        {
          id: 'CG-001',
          name: 'Retail Customers',
          type: 'customer',
          description: 'Walk-in retail customers',
          color: 'blue',
          discount: 0,
          creditTerms: 0
        },
        {
          id: 'CG-002',
          name: 'Wholesale Customers',
          type: 'customer',
          description: 'Wholesale bulk buyers',
          color: 'green',
          discount: 10,
          creditTerms: 30
        },
        {
          id: 'SG-001',
          name: 'Local Suppliers',
          type: 'supplier',
          description: 'Domestic suppliers',
          color: 'purple',
          creditTerms: 30
        },
        {
          id: 'SG-002',
          name: 'Import Suppliers',
          type: 'supplier',
          description: 'International suppliers',
          color: 'orange',
          creditTerms: 60
        }
      ];
      localStorage.setItem('contact_groups', JSON.stringify(defaultGroups));
      setGroups(defaultGroups);
    }
  }

  function handleCreateContact() {
    if (!contactForm.name || !contactForm.phone) {
      alert('Please fill in required fields');
      return;
    }

    const newContact: Contact = {
      id: `CONT-${Date.now()}`,
      type: activeTab === 'customers' ? 'customer' : 'supplier',
      name: contactForm.name,
      email: contactForm.email,
      phone: contactForm.phone,
      address: contactForm.address,
      group: contactForm.group,
      taxNumber: contactForm.taxNumber,
      creditLimit: contactForm.creditLimit,
      balance: 0,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    const updated = [...contacts, newContact];
    setContacts(updated);
    
    if (activeTab === 'customers') {
      const customers = updated.filter(c => c.type === 'customer');
      localStorage.setItem('customers', JSON.stringify(customers));
    } else {
      const suppliers = updated.filter(c => c.type === 'supplier');
      localStorage.setItem('suppliers', JSON.stringify(suppliers));
    }

    setShowContactModal(false);
    resetContactForm();
    alert(`${newContact.type === 'customer' ? 'Customer' : 'Supplier'} created successfully!`);
  }

  function handleEditContact() {
    if (!editingContact) return;

    const updated = contacts.map(c =>
      c.id === editingContact.id
        ? {
            ...c,
            name: contactForm.name,
            email: contactForm.email,
            phone: contactForm.phone,
            address: contactForm.address,
            group: contactForm.group,
            taxNumber: contactForm.taxNumber,
            creditLimit: contactForm.creditLimit
          }
        : c
    );

    setContacts(updated);
    
    const customers = updated.filter(c => c.type === 'customer');
    const suppliers = updated.filter(c => c.type === 'supplier');
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('suppliers', JSON.stringify(suppliers));

    setShowContactModal(false);
    setEditingContact(null);
    resetContactForm();
    alert('Contact updated successfully!');
  }

  function handleDeleteContact(contactId: string) {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    const updated = contacts.filter(c => c.id !== contactId);
    setContacts(updated);
    
    const customers = updated.filter(c => c.type === 'customer');
    const suppliers = updated.filter(c => c.type === 'supplier');
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('suppliers', JSON.stringify(suppliers));

    alert('Contact deleted successfully!');
  }

  function handleCreateGroup() {
    if (!groupForm.name) {
      alert('Please enter a group name');
      return;
    }

    const newGroup: ContactGroup = {
      id: `${activeTab === 'customers' ? 'CG' : 'SG'}-${Date.now()}`,
      name: groupForm.name,
      type: activeTab === 'customers' ? 'customer' : 'supplier',
      description: groupForm.description,
      color: groupForm.color,
      discount: groupForm.discount,
      creditTerms: groupForm.creditTerms
    };

    const updated = [...groups, newGroup];
    setGroups(updated);
    localStorage.setItem('contact_groups', JSON.stringify(updated));

    setShowGroupModal(false);
    resetGroupForm();
    alert('Group created successfully!');
  }

  function handleEditGroup() {
    if (!editingGroup) return;

    const updated = groups.map(g =>
      g.id === editingGroup.id
        ? {
            ...g,
            name: groupForm.name,
            description: groupForm.description,
            color: groupForm.color,
            discount: groupForm.discount,
            creditTerms: groupForm.creditTerms
          }
        : g
    );

    setGroups(updated);
    localStorage.setItem('contact_groups', JSON.stringify(updated));

    setShowGroupModal(false);
    setEditingGroup(null);
    resetGroupForm();
    alert('Group updated successfully!');
  }

  function handleDeleteGroup(groupId: string) {
    if (!confirm('Are you sure you want to delete this group?')) return;

    const updated = groups.filter(g => g.id !== groupId);
    setGroups(updated);
    localStorage.setItem('contact_groups', JSON.stringify(updated));

    alert('Group deleted successfully!');
  }

  function openContactEditModal(contact: Contact) {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      group: contact.group,
      taxNumber: contact.taxNumber || '',
      creditLimit: contact.creditLimit || 0
    });
    setShowContactModal(true);
  }

  function openGroupEditModal(group: ContactGroup) {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description,
      color: group.color,
      discount: group.discount || 0,
      creditTerms: group.creditTerms || 0
    });
    setShowGroupModal(true);
  }

  function resetContactForm() {
    setContactForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      group: '',
      taxNumber: '',
      creditLimit: 0
    });
  }

  function resetGroupForm() {
    setGroupForm({
      name: '',
      description: '',
      color: 'blue',
      discount: 0,
      creditTerms: 0
    });
  }

  function getColorClass(color: string) {
    return colorOptions.find(opt => opt.value === color)?.class || colorOptions[0].class;
  }

  const filteredContacts = contacts.filter(c => {
    const matchesType = c.type === (activeTab === 'customers' ? 'customer' : 'supplier');
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.phone.includes(searchTerm);
    return matchesType && matchesSearch;
  });

  const filteredGroups = groups.filter(g => g.type === (activeTab === 'customers' ? 'customer' : 'supplier'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts Management</h1>
          <p className="text-gray-600 mt-1">Manage customers, suppliers, and contact groups</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'customers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Customers
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'suppliers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Suppliers
        </button>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              resetGroupForm();
              setEditingGroup(null);
              setShowGroupModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Tag className="w-5 h-5" />
            Manage Groups
          </button>
          <button
            onClick={() => {
              resetContactForm();
              setEditingContact(null);
              setShowContactModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add {activeTab === 'customers' ? 'Customer' : 'Supplier'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Total {activeTab}</p>
          <p className="text-2xl font-bold text-gray-900">{filteredContacts.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {filteredContacts.filter(c => c.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Groups</p>
          <p className="text-2xl font-bold text-blue-600">{filteredGroups.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Total Balance</p>
          <p className="text-2xl font-bold text-purple-600">
            KES {filteredContacts.reduce((sum, c) => sum + c.balance, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeTab === 'customers' ? 'Customers' : 'Suppliers'} List
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Group</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContacts.map((contact) => {
                const group = groups.find(g => g.name === contact.group);
                return (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        <p className="text-sm text-gray-600">{contact.address}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900 flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </p>
                        {contact.email && (
                          <p className="text-gray-600 flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {group ? (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getColorClass(group.color)}`}>
                          {group.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">No group</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${contact.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        KES {contact.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        contact.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openContactEditModal(contact)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Edit Contact"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingContact ? 'Edit' : 'Add'} {activeTab === 'customers' ? 'Customer' : 'Supplier'}
              </h3>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setEditingContact(null);
                  resetContactForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contact name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0712345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={contactForm.address}
                  onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Physical address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                <select
                  value={contactForm.group}
                  onChange={(e) => setContactForm({ ...contactForm, group: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select group</option>
                  {filteredGroups.map(group => (
                    <option key={group.id} value={group.name}>{group.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Number</label>
                <input
                  type="text"
                  value={contactForm.taxNumber}
                  onChange={(e) => setContactForm({ ...contactForm, taxNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="KRA PIN"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (KES)</label>
                <input
                  type="number"
                  value={contactForm.creditLimit}
                  onChange={(e) => setContactForm({ ...contactForm, creditLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingContact ? handleEditContact : handleCreateContact}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingContact ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setEditingContact(null);
                  resetContactForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Management Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Manage {activeTab === 'customers' ? 'Customer' : 'Supplier'} Groups
              </h3>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setEditingGroup(null);
                  resetGroupForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create/Edit Group Form */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., VIP Customers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <select
                    value={groupForm.color}
                    onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {colorOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Brief description"
                  />
                </div>

                {activeTab === 'customers' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                    <input
                      type="number"
                      value={groupForm.discount}
                      onChange={(e) => setGroupForm({ ...groupForm, discount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit Terms (days)</label>
                  <input
                    type="number"
                    value={groupForm.creditTerms}
                    onChange={(e) => setGroupForm({ ...groupForm, creditTerms: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <button
                onClick={editingGroup ? handleEditGroup : handleCreateGroup}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingGroup ? 'Update Group' : 'Create Group'}
              </button>
            </div>

            {/* Groups List */}
            <h4 className="font-semibold text-gray-900 mb-4">Existing Groups</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGroups.map((group) => (
                <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getColorClass(group.color)}`}>
                      {group.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openGroupEditModal(group)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Edit Group"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete Group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    {activeTab === 'customers' && (
                      <span className="text-gray-500">Discount: {group.discount}%</span>
                    )}
                    <span className="text-gray-500">Credit: {group.creditTerms} days</span>
                    <span className="font-medium text-gray-900">
                      {contacts.filter(c => c.group === group.name).length} contacts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
