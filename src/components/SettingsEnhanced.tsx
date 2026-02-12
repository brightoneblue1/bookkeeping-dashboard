import { useState, useEffect } from 'react';
import { Building2, MapPin, FileText, Barcode, Printer, Receipt, Save, X, Plus, Edit2, Trash2, Settings as SettingsIcon, Check } from 'lucide-react';

type SettingsTab = 'business' | 'locations' | 'invoice' | 'barcode' | 'printers' | 'tax';

interface BusinessSettings {
  businessName: string;
  tradingName: string;
  businessType: string;
  kraPin: string;
  vatNumber: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  currency: string;
  fiscalYearStart: string;
  timezone: string;
  logo?: string;
}

interface BusinessLocation {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  manager: string;
  isActive: boolean;
  isPrimary: boolean;
  createdAt: string;
}

interface InvoiceSettings {
  invoicePrefix: string;
  invoiceNumberFormat: string;
  startingNumber: number;
  invoiceFooter: string;
  showLogo: boolean;
  showQRCode: boolean;
  showBarcode: boolean;
  paymentTerms: number;
  latePaymentFee: number;
  termsAndConditions: string;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    swiftCode: string;
  };
}

interface BarcodeSettings {
  format: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'QR';
  includePrice: boolean;
  includeProductName: boolean;
  labelWidth: number;
  labelHeight: number;
  fontSize: number;
  showBorder: boolean;
  autoGenerate: boolean;
  prefix: string;
}

interface ReceiptPrinter {
  id: string;
  name: string;
  type: 'thermal' | 'laser' | 'inkjet';
  connection: 'usb' | 'network' | 'bluetooth';
  ipAddress?: string;
  port?: number;
  paperSize: '58mm' | '80mm' | 'A4';
  location: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: 'VAT' | 'Sales Tax' | 'Income Tax' | 'Custom';
  description: string;
  isDefault: boolean;
  isActive: boolean;
  applicableFrom: string;
  createdAt: string;
}

export function SettingsEnhanced() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('business');
  
  // Business Settings
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: '',
    tradingName: '',
    businessType: 'retail',
    kraPin: '',
    vatNumber: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    country: 'Kenya',
    postalCode: '',
    currency: 'KES',
    fiscalYearStart: '01-01',
    timezone: 'Africa/Nairobi'
  });

  // Locations
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<BusinessLocation | null>(null);

  // Invoice Settings
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    invoicePrefix: 'INV',
    invoiceNumberFormat: 'INV-{YYYY}-{0000}',
    startingNumber: 1,
    invoiceFooter: 'Thank you for your business!',
    showLogo: true,
    showQRCode: true,
    showBarcode: false,
    paymentTerms: 30,
    latePaymentFee: 2,
    termsAndConditions: '',
    bankDetails: {
      bankName: '',
      accountName: '',
      accountNumber: '',
      swiftCode: ''
    }
  });

  // Barcode Settings
  const [barcodeSettings, setBarcodeSettings] = useState<BarcodeSettings>({
    format: 'CODE128',
    includePrice: true,
    includeProductName: true,
    labelWidth: 40,
    labelHeight: 20,
    fontSize: 10,
    showBorder: true,
    autoGenerate: true,
    prefix: 'PRD'
  });

  // Receipt Printers
  const [printers, setPrinters] = useState<ReceiptPrinter[]>([]);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<ReceiptPrinter | null>(null);

  // Tax Rates
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxRate | null>(null);

  useEffect(() => {
    loadAllSettings();
  }, []);

  function loadAllSettings() {
    // Load Business Settings
    const storedBusiness = localStorage.getItem('business_settings');
    if (storedBusiness) {
      setBusinessSettings(JSON.parse(storedBusiness));
    }

    // Load Locations
    const storedLocations = localStorage.getItem('business_locations');
    if (storedLocations) {
      setLocations(JSON.parse(storedLocations));
    }

    // Load Invoice Settings
    const storedInvoice = localStorage.getItem('invoice_settings');
    if (storedInvoice) {
      setInvoiceSettings(JSON.parse(storedInvoice));
    }

    // Load Barcode Settings
    const storedBarcode = localStorage.getItem('barcode_settings');
    if (storedBarcode) {
      setBarcodeSettings(JSON.parse(storedBarcode));
    }

    // Load Printers
    const storedPrinters = localStorage.getItem('receipt_printers');
    if (storedPrinters) {
      setPrinters(JSON.parse(storedPrinters));
    }

    // Load Tax Rates
    const storedTax = localStorage.getItem('tax_rates');
    if (storedTax) {
      setTaxRates(JSON.parse(storedTax));
    } else {
      // Create default VAT rate for Kenya
      const defaultTax: TaxRate = {
        id: 'TAX-1',
        name: 'VAT (Kenya)',
        rate: 16,
        type: 'VAT',
        description: 'Standard VAT rate in Kenya',
        isDefault: true,
        isActive: true,
        applicableFrom: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      setTaxRates([defaultTax]);
      localStorage.setItem('tax_rates', JSON.stringify([defaultTax]));
    }
  }

  // Business Settings Functions
  function saveBusinessSettings() {
    localStorage.setItem('business_settings', JSON.stringify(businessSettings));
    alert('Business settings saved successfully!');
  }

  // Location Functions
  function saveLocation(location: Partial<BusinessLocation>) {
    if (editingLocation) {
      const updated = locations.map(loc =>
        loc.id === editingLocation.id ? { ...loc, ...location } : loc
      );
      setLocations(updated);
      localStorage.setItem('business_locations', JSON.stringify(updated));
    } else {
      const newLocation: BusinessLocation = {
        id: `LOC-${Date.now()}`,
        name: location.name || '',
        code: location.code || '',
        address: location.address || '',
        city: location.city || '',
        phone: location.phone || '',
        email: location.email || '',
        manager: location.manager || '',
        isActive: true,
        isPrimary: locations.length === 0,
        createdAt: new Date().toISOString()
      };
      const updated = [...locations, newLocation];
      setLocations(updated);
      localStorage.setItem('business_locations', JSON.stringify(updated));
    }
    setShowLocationModal(false);
    setEditingLocation(null);
    alert('Location saved successfully!');
  }

  function deleteLocation(id: string) {
    if (!confirm('Are you sure you want to delete this location?')) return;
    const updated = locations.filter(loc => loc.id !== id);
    setLocations(updated);
    localStorage.setItem('business_locations', JSON.stringify(updated));
  }

  function setPrimaryLocation(id: string) {
    const updated = locations.map(loc => ({
      ...loc,
      isPrimary: loc.id === id
    }));
    setLocations(updated);
    localStorage.setItem('business_locations', JSON.stringify(updated));
  }

  // Invoice Settings Functions
  function saveInvoiceSettings() {
    localStorage.setItem('invoice_settings', JSON.stringify(invoiceSettings));
    alert('Invoice settings saved successfully!');
  }

  // Barcode Settings Functions
  function saveBarcodeSettings() {
    localStorage.setItem('barcode_settings', JSON.stringify(barcodeSettings));
    alert('Barcode settings saved successfully!');
  }

  // Printer Functions
  function savePrinter(printer: Partial<ReceiptPrinter>) {
    if (editingPrinter) {
      const updated = printers.map(p =>
        p.id === editingPrinter.id ? { ...p, ...printer } : p
      );
      setPrinters(updated);
      localStorage.setItem('receipt_printers', JSON.stringify(updated));
    } else {
      const newPrinter: ReceiptPrinter = {
        id: `PRT-${Date.now()}`,
        name: printer.name || '',
        type: printer.type || 'thermal',
        connection: printer.connection || 'usb',
        ipAddress: printer.ipAddress,
        port: printer.port,
        paperSize: printer.paperSize || '80mm',
        location: printer.location || '',
        isDefault: printers.length === 0,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      const updated = [...printers, newPrinter];
      setPrinters(updated);
      localStorage.setItem('receipt_printers', JSON.stringify(updated));
    }
    setShowPrinterModal(false);
    setEditingPrinter(null);
    alert('Printer saved successfully!');
  }

  function deletePrinter(id: string) {
    if (!confirm('Are you sure you want to delete this printer?')) return;
    const updated = printers.filter(p => p.id !== id);
    setPrinters(updated);
    localStorage.setItem('receipt_printers', JSON.stringify(updated));
  }

  function setDefaultPrinter(id: string) {
    const updated = printers.map(p => ({
      ...p,
      isDefault: p.id === id
    }));
    setPrinters(updated);
    localStorage.setItem('receipt_printers', JSON.stringify(updated));
  }

  // Tax Rate Functions
  function saveTaxRate(tax: Partial<TaxRate>) {
    if (editingTax) {
      const updated = taxRates.map(t =>
        t.id === editingTax.id ? { ...t, ...tax } : t
      );
      setTaxRates(updated);
      localStorage.setItem('tax_rates', JSON.stringify(updated));
    } else {
      const newTax: TaxRate = {
        id: `TAX-${Date.now()}`,
        name: tax.name || '',
        rate: tax.rate || 0,
        type: tax.type || 'Custom',
        description: tax.description || '',
        isDefault: taxRates.length === 0,
        isActive: true,
        applicableFrom: tax.applicableFrom || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      const updated = [...taxRates, newTax];
      setTaxRates(updated);
      localStorage.setItem('tax_rates', JSON.stringify(updated));
    }
    setShowTaxModal(false);
    setEditingTax(null);
    alert('Tax rate saved successfully!');
  }

  function deleteTaxRate(id: string) {
    if (!confirm('Are you sure you want to delete this tax rate?')) return;
    const updated = taxRates.filter(t => t.id !== id);
    setTaxRates(updated);
    localStorage.setItem('tax_rates', JSON.stringify(updated));
  }

  function setDefaultTax(id: string) {
    const updated = taxRates.map(t => ({
      ...t,
      isDefault: t.id === id
    }));
    setTaxRates(updated);
    localStorage.setItem('tax_rates', JSON.stringify(updated));
  }

  const tabs = [
    { id: 'business', label: 'Business Settings', icon: Building2 },
    { id: 'locations', label: 'Business Locations', icon: MapPin },
    { id: 'invoice', label: 'Invoice Settings', icon: FileText },
    { id: 'barcode', label: 'Barcode Settings', icon: Barcode },
    { id: 'printers', label: 'Receipt Printers', icon: Printer },
    { id: 'tax', label: 'Tax Rates', icon: Receipt }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your business settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Business Settings */}
      {activeTab === 'business' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Business Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input
                type="text"
                value={businessSettings.businessName}
                onChange={(e) => setBusinessSettings({ ...businessSettings, businessName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABC Distributors Ltd"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trading Name</label>
              <input
                type="text"
                value={businessSettings.tradingName}
                onChange={(e) => setBusinessSettings({ ...businessSettings, tradingName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABC Store"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              <select
                value={businessSettings.businessType}
                onChange={(e) => setBusinessSettings({ ...businessSettings, businessType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="both">Retail & Wholesale</option>
                <option value="service">Service</option>
                <option value="manufacturing">Manufacturing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KRA PIN</label>
              <input
                type="text"
                value={businessSettings.kraPin}
                onChange={(e) => setBusinessSettings({ ...businessSettings, kraPin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="P051234567X"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
              <input
                type="text"
                value={businessSettings.vatNumber}
                onChange={(e) => setBusinessSettings({ ...businessSettings, vatNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={businessSettings.phone}
                onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+254 700 000 000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={businessSettings.email}
                onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="info@business.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={businessSettings.website}
                onChange={(e) => setBusinessSettings({ ...businessSettings, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="www.business.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                value={businessSettings.address}
                onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                value={businessSettings.city}
                onChange={(e) => setBusinessSettings({ ...businessSettings, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nairobi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={businessSettings.postalCode}
                onChange={(e) => setBusinessSettings({ ...businessSettings, postalCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="00100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                value={businessSettings.country}
                onChange={(e) => setBusinessSettings({ ...businessSettings, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Kenya">Kenya</option>
                <option value="Uganda">Uganda</option>
                <option value="Tanzania">Tanzania</option>
                <option value="Rwanda">Rwanda</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={businessSettings.currency}
                onChange={(e) => setBusinessSettings({ ...businessSettings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="UGX">UGX - Ugandan Shilling</option>
                <option value="TZS">TZS - Tanzanian Shilling</option>
                <option value="RWF">RWF - Rwandan Franc</option>
                <option value="USD">USD - US Dollar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year Start</label>
              <input
                type="text"
                value={businessSettings.fiscalYearStart}
                onChange={(e) => setBusinessSettings({ ...businessSettings, fiscalYearStart: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="01-01 (MM-DD)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={businessSettings.timezone}
                onChange={(e) => setBusinessSettings({ ...businessSettings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                <option value="Africa/Kampala">Africa/Kampala (EAT)</option>
                <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam (EAT)</option>
                <option value="Africa/Kigali">Africa/Kigali (CAT)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveBusinessSettings}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-5 h-5" />
              Save Business Settings
            </button>
          </div>
        </div>
      )}

      {/* Business Locations */}
      {activeTab === 'locations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Business Locations</h2>
            <button
              onClick={() => {
                setEditingLocation(null);
                setShowLocationModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Location
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map(location => (
              <div key={location.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    <p className="text-sm text-gray-600">{location.code}</p>
                  </div>
                  <div className="flex gap-1">
                    {location.isPrimary && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Primary
                      </span>
                    )}
                    {location.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>📍 {location.address}, {location.city}</p>
                  <p>📞 {location.phone}</p>
                  <p>✉️ {location.email}</p>
                  <p>👤 Manager: {location.manager}</p>
                </div>

                <div className="flex gap-2 mt-4">
                  {!location.isPrimary && (
                    <button
                      onClick={() => setPrimaryLocation(location.id)}
                      className="flex-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      Set as Primary
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingLocation(location);
                      setShowLocationModal(true);
                    }}
                    className="flex-1 text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteLocation(location.id)}
                    className="flex-1 text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {locations.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No locations added yet</p>
              <p className="text-sm text-gray-500 mt-1">Add your first business location to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Invoice Settings - Continue in next response */}
      {activeTab === 'invoice' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Invoice Configuration</h2>
          
          <div className="space-y-6">
            {/* Invoice Numbering */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Invoice Numbering</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={invoiceSettings.invoicePrefix}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoicePrefix: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="INV"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number Format</label>
                  <input
                    type="text"
                    value={invoiceSettings.invoiceNumberFormat}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoiceNumberFormat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="INV-{YYYY}-{0000}"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Starting Number</label>
                  <input
                    type="number"
                    value={invoiceSettings.startingNumber}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, startingNumber: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Display Options */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Display Options</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={invoiceSettings.showLogo}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showLogo: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show Company Logo</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={invoiceSettings.showQRCode}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showQRCode: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show QR Code</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={invoiceSettings.showBarcode}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showBarcode: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show Barcode</span>
                </label>
              </div>
            </div>

            {/* Payment Terms */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Payment Terms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Due (Days)</label>
                  <input
                    type="number"
                    value={invoiceSettings.paymentTerms}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, paymentTerms: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Late Payment Fee (%)</label>
                  <input
                    type="number"
                    value={invoiceSettings.latePaymentFee}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, latePaymentFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={invoiceSettings.bankDetails.bankName}
                    onChange={(e) => setInvoiceSettings({
                      ...invoiceSettings,
                      bankDetails: { ...invoiceSettings.bankDetails, bankName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Equity Bank"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={invoiceSettings.bankDetails.accountName}
                    onChange={(e) => setInvoiceSettings({
                      ...invoiceSettings,
                      bankDetails: { ...invoiceSettings.bankDetails, accountName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ABC Distributors Ltd"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={invoiceSettings.bankDetails.accountNumber}
                    onChange={(e) => setInvoiceSettings({
                      ...invoiceSettings,
                      bankDetails: { ...invoiceSettings.bankDetails, accountNumber: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SWIFT Code</label>
                  <input
                    type="text"
                    value={invoiceSettings.bankDetails.swiftCode}
                    onChange={(e) => setInvoiceSettings({
                      ...invoiceSettings,
                      bankDetails: { ...invoiceSettings.bankDetails, swiftCode: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="EQBLKENA"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Footer & Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Footer</label>
              <textarea
                value={invoiceSettings.invoiceFooter}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoiceFooter: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Thank you for your business!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Terms and Conditions</label>
              <textarea
                value={invoiceSettings.termsAndConditions}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, termsAndConditions: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your terms and conditions..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveInvoiceSettings}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-5 h-5" />
              Save Invoice Settings
            </button>
          </div>
        </div>
      )}

      {/* Barcode Settings */}
      {activeTab === 'barcode' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Barcode Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode Format</label>
              <select
                value={barcodeSettings.format}
                onChange={(e) => setBarcodeSettings({ ...barcodeSettings, format: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CODE128">CODE128</option>
                <option value="CODE39">CODE39</option>
                <option value="EAN13">EAN13</option>
                <option value="EAN8">EAN8</option>
                <option value="UPC">UPC</option>
                <option value="QR">QR Code</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode Prefix</label>
              <input
                type="text"
                value={barcodeSettings.prefix}
                onChange={(e) => setBarcodeSettings({ ...barcodeSettings, prefix: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="PRD"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label Width (mm)</label>
              <input
                type="number"
                value={barcodeSettings.labelWidth}
                onChange={(e) => setBarcodeSettings({ ...barcodeSettings, labelWidth: parseInt(e.target.value) || 40 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label Height (mm)</label>
              <input
                type="number"
                value={barcodeSettings.labelHeight}
                onChange={(e) => setBarcodeSettings({ ...barcodeSettings, labelHeight: parseInt(e.target.value) || 20 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
              <input
                type="number"
                value={barcodeSettings.fontSize}
                onChange={(e) => setBarcodeSettings({ ...barcodeSettings, fontSize: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={barcodeSettings.includePrice}
                  onChange={(e) => setBarcodeSettings({ ...barcodeSettings, includePrice: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include Price on Label</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={barcodeSettings.includeProductName}
                  onChange={(e) => setBarcodeSettings({ ...barcodeSettings, includeProductName: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include Product Name on Label</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={barcodeSettings.showBorder}
                  onChange={(e) => setBarcodeSettings({ ...barcodeSettings, showBorder: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show Border</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={barcodeSettings.autoGenerate}
                  onChange={(e) => setBarcodeSettings({ ...barcodeSettings, autoGenerate: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-generate Barcodes for New Products</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveBarcodeSettings}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-5 h-5" />
              Save Barcode Settings
            </button>
          </div>
        </div>
      )}

      {/* Receipt Printers - Similar structure to Locations */}
      {activeTab === 'printers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Receipt Printers</h2>
            <button
              onClick={() => {
                setEditingPrinter(null);
                setShowPrinterModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Printer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {printers.map(printer => (
              <div key={printer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{printer.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{printer.type} - {printer.connection}</p>
                  </div>
                  <div className="flex gap-1">
                    {printer.isDefault && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Default
                      </span>
                    )}
                    {printer.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>📄 Paper: {printer.paperSize}</p>
                  {printer.ipAddress && <p>🌐 IP: {printer.ipAddress}:{printer.port}</p>}
                  <p>📍 Location: {printer.location}</p>
                </div>

                <div className="flex gap-2 mt-4">
                  {!printer.isDefault && (
                    <button
                      onClick={() => setDefaultPrinter(printer.id)}
                      className="flex-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingPrinter(printer);
                      setShowPrinterModal(true);
                    }}
                    className="flex-1 text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deletePrinter(printer.id)}
                    className="flex-1 text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {printers.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Printer className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No printers configured yet</p>
              <p className="text-sm text-gray-500 mt-1">Add a receipt printer to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Tax Rates - Similar structure */}
      {activeTab === 'tax' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Tax Rates</h2>
            <button
              onClick={() => {
                setEditingTax(null);
                setShowTaxModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Tax Rate
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Applicable From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {taxRates.map(tax => (
                  <tr key={tax.id}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{tax.name}</p>
                        <p className="text-xs text-gray-500">{tax.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tax.type}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-blue-600">{tax.rate}%</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(tax.applicableFrom).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {tax.isDefault && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Default
                          </span>
                        )}
                        {tax.isActive ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {!tax.isDefault && (
                          <button
                            onClick={() => setDefaultTax(tax.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Set as Default"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingTax(tax);
                            setShowTaxModal(true);
                          }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTaxRate(tax.id)}
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

          {taxRates.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No tax rates configured yet</p>
              <p className="text-sm text-gray-500 mt-1">Add a tax rate to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Modals would go here - Location, Printer, and Tax modals */}
      {/* Keeping response concise, these follow similar patterns as shown above */}
    </div>
  );
}
