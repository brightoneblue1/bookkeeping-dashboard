import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Clock, FileText, Calendar, Plus, Download, Eye } from 'lucide-react';
import { getSales, getPurchases, createTaxRecord, getTaxRecords } from '../utils/api';

export function TaxCompliance() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [taxRecords, setTaxRecords] = useState<any[]>([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFiling, setSelectedFiling] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [salesData, purchasesData, recordsData] = await Promise.all([
        getSales(),
        getPurchases(),
        getTaxRecords()
      ]);
      setSales(salesData);
      setPurchases(purchasesData);
      setTaxRecords(recordsData);
    } catch (error) {
      console.error('Failed to load tax data:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateCurrentMonthTax() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter current month data
    const currentSales = sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate.getMonth() === currentMonth && 
             saleDate.getFullYear() === currentYear &&
             s.status === 'Paid';
    });

    const currentPurchases = purchases.filter(p => {
      const purchaseDate = new Date(p.date);
      return purchaseDate.getMonth() === currentMonth && 
             purchaseDate.getFullYear() === currentYear &&
             p.status === 'Paid';
    });

    const totalSales = currentSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalPurchases = currentPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calculate VAT (16%)
    const vatOutput = totalSales * 0.16;
    const vatInput = totalPurchases * 0.16;
    const vatPayable = vatOutput - vatInput;

    // Calculate employment taxes
    const salaryExpenses = currentPurchases
      .filter(p => p.category === 'Salaries' || p.category === 'Wages')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const paye = salaryExpenses * 0.30; // Simplified PAYE estimate
    const nhif = salaryExpenses * 0.0175; // 1.75% estimate
    const nssf = salaryExpenses * 0.06; // 6% estimate

    return {
      totalSales,
      totalPurchases,
      vatOutput,
      vatInput,
      vatPayable,
      salaryExpenses,
      paye,
      nhif,
      nssf,
      turnoverTax: 0
    };
  }

  function generateFilingSchedule() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const schedule = [];
    
    // Generate last 3 months + current + next 2 months
    for (let i = -3; i <= 2; i++) {
      const date = new Date(currentYear, currentMonth + i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      const periodName = `${monthNames[month]} ${year}`;
      
      // VAT return due on 20th of following month
      const vatDueDate = new Date(year, month + 1, 20);
      
      // PAYE, SHIF, NSSF due on 9th of following month
      const employmentDueDate = new Date(year, month + 1, 9);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if filed
      const vatFiled = taxRecords.some(r => 
        r.type === 'VAT' && 
        r.period === periodName
      );
      
      const payeFiled = taxRecords.some(r => 
        r.type === 'PAYE' && 
        r.period === periodName
      );
      
      const nhifFiled = taxRecords.some(r => 
        r.type === 'SHIF' && 
        r.period === periodName
      );
      
      const nssfFiled = taxRecords.some(r => 
        r.type === 'NSSF' && 
        r.period === periodName
      );
      
      // Calculate days left/overdue
      const vatDaysLeft = Math.ceil((vatDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const employmentDaysLeft = Math.ceil((employmentDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // VAT
      if (vatDaysLeft >= -30) { // Show if due within 30 days or overdue by less than 30 days
        schedule.push({
          tax: 'VAT Return',
          period: periodName,
          dueDate: vatDueDate.toISOString().split('T')[0],
          status: vatFiled ? 'filed' : (vatDaysLeft < 0 ? 'overdue' : 'upcoming'),
          daysLeft: vatDaysLeft,
          filedDate: vatFiled ? taxRecords.find(r => r.type === 'VAT' && r.period === periodName)?.filedDate : null
        });
      }
      
      // PAYE
      if (employmentDaysLeft >= -30) {
        schedule.push({
          tax: 'PAYE',
          period: periodName,
          dueDate: employmentDueDate.toISOString().split('T')[0],
          status: payeFiled ? 'filed' : (employmentDaysLeft < 0 ? 'overdue' : 'upcoming'),
          daysLeft: employmentDaysLeft,
          filedDate: payeFiled ? taxRecords.find(r => r.type === 'PAYE' && r.period === periodName)?.filedDate : null
        });
      }
      
      // SHIF
      if (employmentDaysLeft >= -30) {
        schedule.push({
          tax: 'SHIF Contributions',
          period: periodName,
          dueDate: employmentDueDate.toISOString().split('T')[0],
          status: nhifFiled ? 'filed' : (employmentDaysLeft < 0 ? 'overdue' : 'upcoming'),
          daysLeft: employmentDaysLeft,
          filedDate: nhifFiled ? taxRecords.find(r => r.type === 'SHIF' && r.period === periodName)?.filedDate : null
        });
      }
      
      // NSSF
      if (employmentDaysLeft >= -30) {
        schedule.push({
          tax: 'NSSF Contributions',
          period: periodName,
          dueDate: employmentDueDate.toISOString().split('T')[0],
          status: nssfFiled ? 'filed' : (employmentDaysLeft < 0 ? 'overdue' : 'upcoming'),
          daysLeft: employmentDaysLeft,
          filedDate: nssfFiled ? taxRecords.find(r => r.type === 'NSSF' && r.period === periodName)?.filedDate : null
        });
      }
    }
    
    // Sort by due date (soonest first)
    return schedule.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  async function handleFileTax(filing: any) {
    setSelectedFiling(filing);
    setShowFileModal(true);
  }

  async function confirmFileTax() {
    if (!selectedFiling) return;
    
    try {
      const taxRecord = {
        type: selectedFiling.tax.includes('VAT') ? 'VAT' : 
              selectedFiling.tax.includes('PAYE') ? 'PAYE' :
              selectedFiling.tax.includes('SHIF') ? 'SHIF' : 'NSSF',
        period: selectedFiling.period,
        dueDate: selectedFiling.dueDate,
        filedDate: new Date().toISOString().split('T')[0],
        amount: 0, // Would be calculated based on type
        status: 'filed'
      };
      
      await createTaxRecord(taxRecord);
      await loadData(); // Reload to show updated status
      setShowFileModal(false);
      setSelectedFiling(null);
      alert(`${selectedFiling.tax} for ${selectedFiling.period} has been marked as filed!`);
    } catch (error) {
      console.error('Failed to file tax:', error);
      alert('Failed to file tax record. Please try again.');
    }
  }

  const taxSummary = calculateCurrentMonthTax();
  const filingSchedule = generateFilingSchedule();

  // Get next upcoming deadline
  const nextDeadline = filingSchedule.find(f => f.status === 'upcoming' || f.status === 'overdue');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-500">Loading tax data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax & Compliance (KRA)</h1>
        <p className="text-gray-600 mt-1">Manage Kenya tax obligations and compliance</p>
      </div>

      {/* Alert Banner */}
      {nextDeadline && (
        <div className={`border-l-4 rounded-lg p-4 ${
          nextDeadline.status === 'overdue' 
            ? 'bg-red-50 border-red-500' 
            : 'bg-blue-50 border-blue-500'
        }`}>
          <div className="flex items-start gap-3">
            {nextDeadline.status === 'overdue' ? (
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            )}
            <div>
              <h3 className={`font-semibold ${
                nextDeadline.status === 'overdue' ? 'text-red-900' : 'text-blue-900'
              }`}>
                {nextDeadline.status === 'overdue' ? 'Overdue Filing!' : 'Upcoming Filing Deadline'}
              </h3>
              <p className={`text-sm mt-1 ${
                nextDeadline.status === 'overdue' ? 'text-red-700' : 'text-blue-700'
              }`}>
                {nextDeadline.tax} for {nextDeadline.period} is {
                  nextDeadline.status === 'overdue' 
                    ? `overdue by ${Math.abs(nextDeadline.daysLeft)} days`
                    : `due in ${nextDeadline.daysLeft} days (${nextDeadline.dueDate})`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600 mb-1">VAT Output</p>
          <p className="text-xl font-bold text-blue-600">KES {Math.round(taxSummary.vatOutput).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Sales VAT collected</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600 mb-1">VAT Input</p>
          <p className="text-xl font-bold text-green-600">KES {Math.round(taxSummary.vatInput).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Purchases VAT paid</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600 mb-1">VAT Payable</p>
          <p className="text-xl font-bold text-orange-600">KES {Math.round(taxSummary.vatPayable).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Net amount due</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600 mb-1">PAYE (Staff)</p>
          <p className="text-xl font-bold text-purple-600">KES {Math.round(taxSummary.paye).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Employee income tax</p>
        </div>
      </div>

      {/* VAT Calculation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          VAT Calculation ({new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-gray-700">Total Sales (Inc. VAT @ 16%)</span>
            <span className="font-medium text-gray-900">KES {taxSummary.totalSales.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pl-4">
            <span className="text-gray-600">VAT on Sales (Output VAT)</span>
            <span className="font-medium text-blue-600">KES {Math.round(taxSummary.vatOutput).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b pt-2">
            <span className="text-gray-700">Total Purchases (Inc. VAT @ 16%)</span>
            <span className="font-medium text-gray-900">KES {taxSummary.totalPurchases.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pl-4">
            <span className="text-gray-600">VAT on Purchases (Input VAT)</span>
            <span className="font-medium text-green-600">KES {Math.round(taxSummary.vatInput).toLocaleString()}</span>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg mt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Net VAT Payable to KRA</span>
              <span className="text-xl font-bold text-orange-600">
                KES {Math.round(Math.max(0, taxSummary.vatPayable)).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Due Date: {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 20).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filing Schedule */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filing Schedule</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tax Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filingSchedule.map((filing, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{filing.tax}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{filing.period}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{filing.dueDate}</td>
                  <td className="px-6 py-4">
                    {filing.status === 'filed' ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Filed on {filing.filedDate}</span>
                      </div>
                    ) : filing.status === 'overdue' ? (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                          Overdue by {Math.abs(filing.daysLeft)} days
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                          Due in {filing.daysLeft} days
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {filing.status === 'filed' ? (
                      <button className="text-gray-600 hover:text-gray-700 text-sm">
                        View Receipt
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleFileTax(filing)}
                        className={`text-sm font-medium ${
                          filing.status === 'overdue' 
                            ? 'text-red-600 hover:text-red-700' 
                            : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        Mark as Filed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statutory Contributions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">PAYE</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600">KES {Math.round(taxSummary.paye).toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">Pay As You Earn (Staff Tax)</p>
          <p className="text-xs text-gray-500 mt-2">Due: 9th of every month</p>
          <a 
            href="https://itax.kra.go.ke" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 mt-3"
          >
            File on iTax
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">SHIF</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">KES {Math.round(taxSummary.nhif).toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">Social Health Insurance Fund</p>
          <p className="text-xs text-gray-500 mt-2">Due: 9th of every month</p>
          <a 
            href="https://sha.go.ke" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-3"
          >
            SHA Portal
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">NSSF</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">KES {Math.round(taxSummary.nssf).toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">National Social Security Fund</p>
          <p className="text-xs text-gray-500 mt-2">Due: 9th of every month</p>
          <a 
            href="https://www.nssfkenya.co.ke/services/employer-self-service-portal/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mt-3"
          >
            NSSF Portal
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Filing Confirmation Modal */}
      {showFileModal && selectedFiling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Tax Filing</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Tax Type:</span>
                <span className="font-semibold">{selectedFiling.tax}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Period:</span>
                <span className="font-semibold">{selectedFiling.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-semibold">{selectedFiling.dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Filing Date:</span>
                <span className="font-semibold">{new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              This will mark the {selectedFiling.tax} for {selectedFiling.period} as filed. Make sure you have completed the actual filing on iTax portal.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmFileTax}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm Filing
              </button>
              <button
                onClick={() => {
                  setShowFileModal(false);
                  setSelectedFiling(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">KRA iTax Portal</h3>
        <p className="text-sm text-blue-700 mb-4">
          File your returns and make payments through the official KRA portal
        </p>
        <a 
          href="https://itax.kra.go.ke" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Open iTax Portal
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}