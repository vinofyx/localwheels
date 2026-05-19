import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function VendorAgent() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account-details');
  const [formData, setFormData] = useState({
    vendorType: 'Trip Vendor',
    vendorCode: 'LOCALWHEELS',
    vendorNo: '17',
    name: '',
    address1: '',
    address2: '',
    panNo: '',
    linkLedger: '',
    gstNo: '',
    contactPerson: '',
    phoneNo: '',
    msmeNumber: '',
    state: '',
    effectiveDate: '',
    email: '',
    creditDays: '',
    isPaymentAgainstBill: false,
    deActive: false,
    coLoader: false,
    isPodCompulsory: false,
  });

  const [accountDetails, setAccountDetails] = useState({
    tdsApplicable: 'YES',
    advancePercent: '',
  });

  const [bankDetails, setBankDetails] = useState({
    beneficiaryName: '',
    bankBranch: '',
    accountNo: '',
    bankName: '',
    ifscCode: '',
  });

  const [billingDetails, setBillingDetails] = useState({
    reverseCharges: false,
    igstPercent: '',
    igstLedger: '',
    cgstPercent: '',
    cgstLedger: '',
    sgstPercent: '',
    sgstLedger: '',
    expenseLedger: '',
  });

  const [documentUpload, setDocumentUpload] = useState({
    documentName: '',
    selectedFile: null,
  });

  const [routes, setRoutes] = useState([
    { id: 1, name: 'ATPR-KNL-MBNR-HYD', linked: false },
    { id: 2, name: 'CDPH-KNL-MBNR-HYD', linked: false },
    { id: 3, name: 'HYD-GNTR-ONGL', linked: false },
    { id: 4, name: 'HYD-GNTR-ONGL-NLR-TPT-CDP', linked: false },
    { id: 5, name: 'HYD-KMM-HYD', linked: false },
  ]);

  const [importData, setImportData] = useState({
    selectedFile: null,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Vendor/Agent saved successfully!');
  };

  const handleSearch = () => {
    toast.success('Search functionality coming soon!');
  };

  const handleRefresh = () => {
    toast.success('Page refreshed!');
  };

  const handleFileUpload = () => {
    if (documentUpload.selectedFile) {
      toast.success('Document uploaded successfully!');
      setDocumentUpload({ documentName: '', selectedFile: null });
    } else {
      toast.error('Please select a file to upload');
    }
  };

  const handleDocumentFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentUpload(prev => ({
        ...prev,
        selectedFile: file
      }));
    }
  };

  const handleRouteToggle = (routeId) => {
    setRoutes(prev => prev.map(route =>
      route.id === routeId ? { ...route, linked: !route.linked } : route
    ));
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportData(prev => ({
        ...prev,
        selectedFile: file
      }));
    }
  };

  const handleShowData = () => {
    if (importData.selectedFile) {
      toast.success('Data preview functionality coming soon!');
    } else {
      toast.error('Please select a file first');
    }
  };

  const handleImportData = () => {
    if (importData.selectedFile) {
      toast.success('Data imported successfully!');
      setImportData({ selectedFile: null });
    } else {
      toast.error('Please select a file first');
    }
  };

  const tabs = [
    { id: 'account-details', label: 'Account Details' },
    { id: 'document-upload', label: 'Document Upload' },
    { id: 'bank-details', label: 'Bank Account Details' },
    { id: 'link-route', label: 'Link Route' },
    { id: 'billing-details', label: 'Billing Details' },
    { id: 'import-vendor', label: 'Import Vendor' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">VENDOR/AGENT</h1>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Search
            </button>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Type</label>
            <select
              name="vendorType"
              value={formData.vendorType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Trip Vendor">Trip Vendor</option>
              <option value="Regular Vendor">Regular Vendor</option>
              <option value="Contract Vendor">Contract Vendor</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Code</label>
            <input
              type="text"
              name="vendorCode"
              value={formData.vendorCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor No</label>
            <input
              type="text"
              name="vendorNo"
              value={formData.vendorNo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter vendor name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address1 *</label>
            <input
              type="text"
              name="address1"
              value={formData.address1}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter address 1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address2 *</label>
            <input
              type="text"
              name="address2"
              value={formData.address2}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter address 2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PAN No *</label>
            <input
              type="text"
              name="panNo"
              value={formData.panNo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter PAN number"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkLedger *</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="linkLedger"
                value={formData.linkLedger}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                placeholder="Select ledger"
                required
              />
              <button
                type="button"
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                +
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST No</label>
            <input
              type="text"
              name="gstNo"
              value={formData.gstNo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter GST number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter contact person"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone No</label>
            <input
              type="tel"
              name="phoneNo"
              value={formData.phoneNo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MSME Number</label>
            <input
              type="text"
              name="msmeNumber"
              value={formData.msmeNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter MSME number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
            <select
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">--Select--</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Telangana">Telangana</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
            <input
              type="date"
              name="effectiveDate"
              value={formData.effectiveDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Days</label>
            <input
              type="number"
              name="creditDays"
              value={formData.creditDays}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter credit days"
            />
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isPaymentAgainstBill"
              checked={formData.isPaymentAgainstBill}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Is Payment Against Bill</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              name="deActive"
              checked={formData.deActive}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">DeActive</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              name="coLoader"
              checked={formData.coLoader}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Co-Loader</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isPodCompulsory"
              checked={formData.isPodCompulsory}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Is POD Compulsory For VendorBill/Balance Payment</span>
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'account-details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">TDS Applicable</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tdsApplicable"
                      value="YES"
                      checked={accountDetails.tdsApplicable === 'YES'}
                      onChange={(e) => setAccountDetails(prev => ({ ...prev, tdsApplicable: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-sm">YES</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tdsApplicable"
                      value="NO"
                      checked={accountDetails.tdsApplicable === 'NO'}
                      onChange={(e) => setAccountDetails(prev => ({ ...prev, tdsApplicable: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-sm">NO</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance(%)</label>
                <input
                  type="number"
                  value={accountDetails.advancePercent}
                  onChange={(e) => setAccountDetails(prev => ({ ...prev, advancePercent: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter advance percentage"
                />
              </div>
            </div>
          )}

          {activeTab === 'document-upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
                <input
                  type="text"
                  value={documentUpload.documentName}
                  onChange={(e) => setDocumentUpload(prev => ({ ...prev, documentName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter document name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Choose File</label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    onChange={handleDocumentFileChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleFileUpload}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Upload File
                  </button>
                </div>
                {documentUpload.selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">Selected: {documentUpload.selectedFile.name}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'bank-details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary Name</label>
                <input
                  type="text"
                  value={bankDetails.beneficiaryName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, beneficiaryName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter beneficiary name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Branch</label>
                <input
                  type="text"
                  value={bankDetails.bankBranch}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, bankBranch: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter bank branch"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account No</label>
                <input
                  type="text"
                  value={bankDetails.accountNo}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountNo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter account number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter bank name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter IFSC code"
                />
              </div>
            </div>
          )}

          {activeTab === 'link-route' && (
            <div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm font-medium text-gray-700">Edit</span>
                </label>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Route Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map(route => (
                      <tr key={route.id}>
                        <td className="border border-gray-300 px-4 py-2 text-sm">{route.name}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={route.linked}
                            onChange={() => handleRouteToggle(route.id)}
                            className="mx-auto"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'billing-details' && (
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={billingDetails.reverseCharges}
                  onChange={(e) => setBillingDetails(prev => ({ ...prev, reverseCharges: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Reverse Charges(RCM)</span>
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IGST(%)</label>
                  <input
                    type="number"
                    value={billingDetails.igstPercent}
                    onChange={(e) => setBillingDetails(prev => ({ ...prev, igstPercent: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter IGST percentage"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link IGST Ledger</label>
                  <input
                    type="text"
                    value={billingDetails.igstLedger}
                    onChange={(e) => setBillingDetails(prev => ({ ...prev, igstLedger: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Link IGST ledger"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CGST(%)</label>
                  <input
                    type="number"
                    value={billingDetails.cgstPercent}
                    onChange={(e) => setBillingDetails(prev => ({ ...prev, cgstPercent: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter CGST percentage"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link CGST Ledger</label>
                  <input
                    type="text"
                    value={billingDetails.cgstLedger}
                    onChange={(e) => setBillingDetails(prev => ({ ...prev, cgstLedger: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Link CGST ledger"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SGST(%)</label>
                  <input
                    type="number"
                    value={billingDetails.sgstPercent}
                    onChange={(e) => setBillingDetails(prev => ({ ...prev, sgstPercent: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter SGST percentage"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link SGST Ledger</label>
                  <input
                    type="text"
                    value={billingDetails.sgstLedger}
                    onChange={(e) => setBillingDetails(prev => ({ ...prev, sgstLedger: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Link SGST ledger"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expense Ledger</label>
                  <input
                    type="text"
                    value={billingDetails.expenseLedger}
                    onChange={(e) => setBillingDetails(prev => ({ ...prev, expenseLedger: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter expense ledger"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import-vendor' && (
            <div className="space-y-4">
              <div>
                <a href="#" className="text-blue-600 hover:text-blue-800 underline mb-4 inline-block">
                  Download Sample Excel Template
                </a>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Excel File</label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportFileChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {importData.selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">Selected: {importData.selectedFile.name}</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleShowData}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Show Data
                </button>
                <button
                  onClick={handleImportData}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Import Data
                </button>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
