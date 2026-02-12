import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, X, CheckCircle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  productCount?: number;
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
  { value: 'teal', label: 'Teal', class: 'bg-teal-100 text-teal-700 border-teal-200' },
  { value: 'gray', label: 'Gray', class: 'bg-gray-100 text-gray-700 border-gray-200' }
];

export function ProductCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  function loadCategories() {
    const stored = localStorage.getItem('product_categories');
    if (stored) {
      const cats = JSON.parse(stored);
      // Count products in each category
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      const categoriesWithCount = cats.map((cat: Category) => ({
        ...cat,
        productCount: products.filter((p: any) => p.category === cat.name).length
      }));
      setCategories(categoriesWithCount);
    } else {
      // Create default categories
      const defaultCategories: Category[] = [
        {
          id: 'CAT-001',
          name: 'Dry Foods',
          description: 'Rice, flour, sugar, and other dry goods',
          color: 'blue',
          createdAt: new Date().toISOString()
        },
        {
          id: 'CAT-002',
          name: 'Beverages',
          description: 'Soft drinks, juices, water, tea, coffee',
          color: 'green',
          createdAt: new Date().toISOString()
        },
        {
          id: 'CAT-003',
          name: 'Dairy',
          description: 'Milk, cheese, yogurt, butter',
          color: 'purple',
          createdAt: new Date().toISOString()
        },
        {
          id: 'CAT-004',
          name: 'Cooking',
          description: 'Cooking oil, spices, condiments',
          color: 'orange',
          createdAt: new Date().toISOString()
        },
        {
          id: 'CAT-005',
          name: 'Spices',
          description: 'Salt, pepper, and various spices',
          color: 'red',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('product_categories', JSON.stringify(defaultCategories));
      setCategories(defaultCategories);
    }
  }

  function handleCreate() {
    if (!formData.name) {
      alert('Please enter a category name');
      return;
    }

    // Check for duplicate name
    if (categories.some(c => c.name.toLowerCase() === formData.name.toLowerCase())) {
      alert('A category with this name already exists');
      return;
    }

    const newCategory: Category = {
      id: `CAT-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      color: formData.color,
      createdAt: new Date().toISOString(),
      productCount: 0
    };

    const updated = [...categories, newCategory];
    setCategories(updated);
    localStorage.setItem('product_categories', JSON.stringify(updated));
    
    setShowModal(false);
    resetForm();
    alert(`Category "${newCategory.name}" created successfully!`);
  }

  function handleEdit() {
    if (!editingCategory) return;

    if (!formData.name) {
      alert('Please enter a category name');
      return;
    }

    // Check for duplicate name (excluding current category)
    if (categories.some(c => 
      c.id !== editingCategory.id && 
      c.name.toLowerCase() === formData.name.toLowerCase()
    )) {
      alert('A category with this name already exists');
      return;
    }

    const oldName = editingCategory.name;
    const updated = categories.map(c =>
      c.id === editingCategory.id
        ? { ...c, name: formData.name, description: formData.description, color: formData.color }
        : c
    );

    setCategories(updated);
    localStorage.setItem('product_categories', JSON.stringify(updated));

    // Update products with this category
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = products.map((p: any) =>
      p.category === oldName ? { ...p, category: formData.name } : p
    );
    localStorage.setItem('products', JSON.stringify(updatedProducts));

    setShowModal(false);
    setEditingCategory(null);
    resetForm();
    alert(`Category "${formData.name}" updated successfully!`);
  }

  function handleDelete(categoryId: string) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    if (category.productCount && category.productCount > 0) {
      if (!confirm(`This category has ${category.productCount} products. Are you sure you want to delete it? Products will be set to "Uncategorized".`)) {
        return;
      }
    } else {
      if (!confirm(`Delete category "${category.name}"?`)) {
        return;
      }
    }

    // Remove category from products
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = products.map((p: any) =>
      p.category === category.name ? { ...p, category: 'Uncategorized' } : p
    );
    localStorage.setItem('products', JSON.stringify(updatedProducts));

    // Delete category
    const updated = categories.filter(c => c.id !== categoryId);
    setCategories(updated);
    localStorage.setItem('product_categories', JSON.stringify(updated));
    
    alert(`Category "${category.name}" deleted successfully!`);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      color: 'blue'
    });
  }

  function getColorClass(color: string) {
    return colorOptions.find(opt => opt.value === color)?.class || colorOptions[0].class;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Categories</h1>
          <p className="text-gray-600 mt-1">Organize your inventory with categories</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Categorized Products</p>
              <p className="text-2xl font-bold text-green-600">
                {categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Most Used</p>
              <p className="text-xl font-bold text-purple-600">
                {categories.sort((a, b) => (b.productCount || 0) - (a.productCount || 0))[0]?.name || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getColorClass(category.color)}`}>
                {category.name}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(category)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                  title="Edit Category"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              {category.description || 'No description'}
            </p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Products:</span>
              <span className="font-semibold text-gray-900">{category.productCount || 0}</span>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Created: {new Date(category.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCategory(null);
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
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Beverages"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Brief description of this category"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Tag
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({ ...formData, color: option.value })}
                      className={`px-3 py-2 text-xs rounded-lg border-2 ${
                        formData.color === option.value
                          ? 'border-blue-500 ' + option.class
                          : 'border-gray-200 ' + option.class
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingCategory ? handleEdit : handleCreate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCategory(null);
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

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">About Categories</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Categories help organize your products for easier management</li>
          <li>• Each product can be assigned to one category</li>
          <li>• Deleting a category won't delete products - they'll be set to "Uncategorized"</li>
          <li>• Color tags make it easy to visually identify categories</li>
        </ul>
      </div>
    </div>
  );
}
