import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StationaryAllocation() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    docType: '',
    seriesTo: '',
    isActive: true,
    finYear: '',
    partyName: '',
  });

  const docTypeOptions = [
    'Lorry Receipt(LR)',
    'Memo(Manifest)',
    'LCM',
    'LDM/DRS',
    'LHS',
    'VAR',
    'Billing(against LR)',
    'Billing(without LR)',
    'MoneyReceipt(MR)',
    'Loading Sheet',
    'ICM Book Send',
    'Bill Submission',
    'Bill Send',
    'POD Send',
    'Branch Voucher',
    'Vendor Bill',
    'Delivery Challan',
    'Gate Pass',
    'Weight Slip',
    'Fuel Receipt',
    'Toll Receipt',
    'Permit Document',
    'Insurance Policy',
    'Vehicle Registration',
    'Driver License',
    'Pollution Certificate',
    'Fitness Certificate',
    'Road Tax Receipt',
    'Other Documents',
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.docType || !formData.seriesTo) {
      toast.error('DocType and Series To are required!');
      return;
    }

    toast.success('Stationary Allocation saved successfully!');
  };

  const handleRefresh = () => {
    setFormData({
      docType: '',
      seriesTo: '',
      isActive: true,
      finYear: '',
      partyName: '',
    });
    toast.success('Page refreshed!');
  };

  const handleSearch = () => {
    toast.success('Search functionality coming soon!');
  };

  const getCurrentFinancialYear = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // Months are 0-indexed
    
    // Financial year starts from April (month 4)
    if (currentMonth >= 4) {
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Stationary Allocation</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DocType *</label>
            <select
              name="docType"
              value={formData.docType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select DocType</option>
              {docTypeOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Series To *</label>
            <input
              type="text"
              name="seriesTo"
              value={formData.seriesTo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter series to"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fin.Year</label>
            <input
              type="text"
              name="finYear"
              value={formData.finYear || getCurrentFinancialYear()}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter financial year"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
            <input
              type="text"
              name="partyName"
              value={formData.partyName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter party name"
            />
          </div>
          
          <div className="flex items-center">
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
      </div>

      {/* Additional Information Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Additional Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Starting Number</label>
            <input
              type="number"
              name="startingNumber"
              value={formData.startingNumber || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter starting number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ending Number</label>
            <input
              type="number"
              name="endingNumber"
              value={formData.endingNumber || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter ending number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Number</label>
            <input
              type="number"
              name="currentNumber"
              value={formData.currentNumber || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter current number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
            <input
              type="text"
              name="prefix"
              value={formData.prefix || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter prefix"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suffix</label>
            <input
              type="text"
              name="suffix"
              value={formData.suffix || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter suffix"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reset Frequency</label>
            <select
              name="resetFrequency"
              value={formData.resetFrequency || 'Never'}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Never">Never</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Branch Allocation Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Branch Allocation</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
            <select
              name="branchName"
              value={formData.branchName || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Branch</option>
              <option value="HYDERABAD-HEAD OFFICE">HYDERABAD-HEAD OFFICE</option>
              <option value="ADILABAD">ADILABAD</option>
              <option value="WARANGAL">WARANGAL</option>
              <option value="NIZAMABAD">NIZAMABAD</option>
              <option value="KARIMNAGAR">KARIMNAGAR</option>
              <option value="NALGONDA">NALGONDA</option>
              <option value="KHAMMAM">KHAMMAM</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allocation Date</label>
            <input
              type="date"
              name="allocationDate"
              value={formData.allocationDate || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes & Remarks</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            name="remarks"
            value={formData.remarks || ''}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter any additional remarks or notes"
          />
        </div>
        
        <div className="mt-4 flex justify-end gap-2">
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
            Save Allocation
          </button>
        </div>
      </div>
    </div>
  );
}
