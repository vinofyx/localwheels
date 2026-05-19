import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function PartyCustomer() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('party-link');
  const [formData, setFormData] = useState({
    partyName: '',
    address: '',
    mobile: '',
    email: '',
    gstNo: '',
    panNo: '',
    creditLimit: '',
    creditDays: '',
    openingBalance: '',
    tcsPercent: '',
    transportMode: '',
    paymentMode: '',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    isActive: true,
  });

  const [branchLink, setBranchLink] = useState('');
  const [consigneeLink, setConsigneeLink] = useState('');
  const [materialLink, setMaterialLink] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Party saved successfully!');
    // Handle form submission here
  };

  const handleAddBranch = () => {
    if (branchLink.trim()) {
      toast.success('Branch linked successfully!');
      setBranchLink('');
    }
  };

  const handleAddConsignee = () => {
    if (consigneeLink.trim()) {
      toast.success('Consignee linked successfully!');
      setConsigneeLink('');
    }
  };

  const handleAddMaterial = () => {
    if (materialLink.trim()) {
      toast.success('Material linked successfully!');
      setMaterialLink('');
    }
  };

  const tabs = [
    { id: 'party-link', label: 'Party Link' },
    { id: 'auto-bill', label: 'Auto Bill Setting' },
    { id: 'billing-details', label: 'Billing Party Details' },
    { id: 'gst-details', label: 'GST Details' },
    { id: 'mail-sms', label: 'Mail/SMS Setting' },
    { id: 'import', label: 'Import Parties' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Party (customer)</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/master')}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party Name *</label>
            <input
              type="text"
              name="partyName"
              value={formData.partyName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter party name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter mobile number"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">PAN No</label>
            <input
              type="text"
              name="panNo"
              value={formData.panNo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter PAN number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
            <input
              type="number"
              name="creditLimit"
              value={formData.creditLimit}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter credit limit"
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
            <input
              type="number"
              name="openingBalance"
              value={formData.openingBalance}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter opening balance"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TCS %</label>
            <input
              type="number"
              name="tcsPercent"
              value={formData.tcsPercent}
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter TCS percentage"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode</label>
            <select
              name="transportMode"
              value={formData.transportMode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select transport mode</option>
              <option value="road">Road</option>
              <option value="rail">Rail</option>
              <option value="air">Air</option>
              <option value="sea">Sea</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select
              name="paymentMode"
              value={formData.paymentMode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select payment mode</option>
              <option value="cash">Cash</option>
              <option value="credit">Credit</option>
              <option value="advance">Advance</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Is Active</span>
          </label>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Bank Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
            <input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter bank name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
            <input
              type="text"
              name="bankAccount"
              value={formData.bankAccount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter account number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank IFSC</label>
            <input
              type="text"
              name="bankIfsc"
              value={formData.bankIfsc}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter IFSC code"
            />
          </div>
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
          {activeTab === 'party-link' && (
            <div className="space-y-6">
              {/* Branch Link */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Branch Link</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={branchLink}
                    onChange={(e) => setBranchLink(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter branch"
                  />
                  <button
                    onClick={handleAddBranch}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 bg-gray-50"></div>
              </div>

              {/* Consignee Link */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Consignee Link</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={consigneeLink}
                    onChange={(e) => setConsigneeLink(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter consignee"
                  />
                  <button
                    onClick={handleAddConsignee}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 bg-gray-50"></div>
              </div>

              {/* Material Link */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Material Link</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={materialLink}
                    onChange={(e) => setMaterialLink(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter material"
                  />
                  <button
                    onClick={handleAddMaterial}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 bg-gray-50"></div>
              </div>
            </div>
          )}

          {activeTab === 'auto-bill' && (
            <div>
              <p className="text-gray-600">Auto Bill Setting content will be implemented here...</p>
            </div>
          )}

          {activeTab === 'billing-details' && (
            <div>
              <p className="text-gray-600">Billing Party Details content will be implemented here...</p>
            </div>
          )}

          {activeTab === 'gst-details' && (
            <div>
              <p className="text-gray-600">GST Details content will be implemented here...</p>
            </div>
          )}

          {activeTab === 'mail-sms' && (
            <div>
              <p className="text-gray-600">Mail/SMS Setting content will be implemented here...</p>
            </div>
          )}

          {activeTab === 'import' && (
            <div>
              <p className="text-gray-600">Import Parties content will be implemented here...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
