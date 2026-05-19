import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function LRMaster() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    consignorAny: false,
    consignorName: '',
    consigneeAny: false,
    consigneeName: '',
    billingPaymentParty: '',
    deliveryType: 'Direct Delivery',
    payType: 'TBB',
    collectionType: 'Direct Collection',
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
    toast.success('LR Master saved successfully!');
  };

  const handleSearch = () => {
    toast.success('Search functionality coming soon!');
  };

  const handleRefresh = () => {
    setFormData({
      consignorAny: false,
      consignorName: '',
      consigneeAny: false,
      consigneeName: '',
      billingPaymentParty: '',
      deliveryType: 'Direct Delivery',
      payType: 'TBB',
      collectionType: 'Direct Collection',
    });
    toast.success('Page refreshed!');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">LR MASTER</h1>
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Consignor/Consignee Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Consignor Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="consignorAny"
                  checked={formData.consignorAny}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Any</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consignor Name</label>
              <input
                type="text"
                name="consignorName"
                value={formData.consignorName}
                onChange={handleInputChange}
                disabled={formData.consignorAny}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter consignor name"
              />
            </div>
          </div>

          {/* Consignee Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="consigneeAny"
                  checked={formData.consigneeAny}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Any</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consignee Name</label>
              <input
                type="text"
                name="consigneeName"
                value={formData.consigneeName}
                onChange={handleInputChange}
                disabled={formData.consigneeAny}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter consignee name"
              />
            </div>
          </div>
        </div>

        {/* LR Default Value Section */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">LR Default Value</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing/Payment Party</label>
              <input
                type="text"
                name="billingPaymentParty"
                value={formData.billingPaymentParty}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter billing/payment party"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Type</label>
              <select
                name="deliveryType"
                value={formData.deliveryType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Direct Delivery">Direct Delivery</option>
                <option value="Godown Delivery">Godown Delivery</option>
                <option value="Door Delivery">Door Delivery</option>
                <option value="Office Delivery">Office Delivery</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay Type</label>
              <select
                name="payType"
                value={formData.payType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TBB">TBB</option>
                <option value="TOPAY">TOPAY</option>
                <option value="PAID">PAID</option>
                <option value="COD">COD</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection Type</label>
              <select
                name="collectionType"
                value={formData.collectionType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Direct Collection">Direct Collection</option>
                <option value="Agent Collection">Agent Collection</option>
                <option value="Branch Collection">Branch Collection</option>
                <option value="Office Collection">Office Collection</option>
              </select>
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Weight (kg)</label>
              <input
                type="number"
                name="defaultWeight"
                value={formData.defaultWeight || ''}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter default weight"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Rate</label>
              <input
                type="number"
                name="defaultRate"
                value={formData.defaultRate || ''}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter default rate"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default GST Rate (%)</label>
              <input
                type="number"
                name="defaultGstRate"
                value={formData.defaultGstRate || ''}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter GST rate"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Required</label>
              <select
                name="insuranceRequired"
                value={formData.insuranceRequired || 'No'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Optional">Optional</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
              <select
                name="priorityLevel"
                value={formData.priorityLevel || 'Normal'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
                <option value="Express">Express</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select
                name="serviceType"
                value={formData.serviceType || 'Standard'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Standard">Standard</option>
                <option value="Express">Express</option>
                <option value="Economy">Economy</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes & Remarks</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
              <textarea
                name="internalNotes"
                value={formData.internalNotes || ''}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter internal notes (not visible to customers)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Public Remarks</label>
              <textarea
                name="publicRemarks"
                value={formData.publicRemarks || ''}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter public remarks (visible to customers)"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons (Bottom) */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="flex justify-end gap-2">
            <button
              onClick={handleRefresh}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save LR Master
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
