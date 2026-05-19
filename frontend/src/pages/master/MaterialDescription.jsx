import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function MaterialDescription() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('customer-link');
  const [formData, setFormData] = useState({
    materialName: '',
    materialCode: '',
    hsnCode: '',
    materialType: '',
    materialGroup: '',
    unit: '',
    gstRate: '',
    cessRate: '',
    openingStock: '',
    openingRate: '',
    openingValue: '',
    minStock: '',
    maxStock: '',
    reorderLevel: '',
    description: '',
    isActive: true,
  });

  const [customerLink, setCustomerLink] = useState('');
  const [cartoonSize, setCartoonSize] = useState({
    length: '',
    width: '',
    height: '',
    weight: '',
  });
  const [otherDetails, setOtherDetails] = useState({
    manufacturer: '',
    brand: '',
    model: '',
    warranty: '',
    specifications: '',
  });
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
    if (!formData.materialName || !formData.materialCode) {
      toast.error('Material Name and Material Code are required!');
      return;
    }
    toast.success('Material Description saved successfully!');
  };

  const handleRefresh = () => {
    setFormData({
      materialName: '',
      materialCode: '',
      hsnCode: '',
      materialType: '',
      materialGroup: '',
      unit: '',
      gstRate: '',
      cessRate: '',
      openingStock: '',
      openingRate: '',
      openingValue: '',
      minStock: '',
      maxStock: '',
      reorderLevel: '',
      description: '',
      isActive: true,
    });
    toast.success('Page refreshed!');
  };

  const handleAddCustomer = () => {
    if (customerLink.trim()) {
      toast.success('Customer linked successfully!');
      setCustomerLink('');
    }
  };

  const handleCartoonSizeChange = (e) => {
    const { name, value } = e.target;
    setCartoonSize(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOtherDetailsChange = (e) => {
    const { name, value } = e.target;
    setOtherDetails(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleImportData = () => {
    if (importData.selectedFile) {
      toast.success('Data imported successfully!');
      setImportData({ selectedFile: null });
    } else {
      toast.error('Please select a file first');
    }
  };

  const tabs = [
    { id: 'customer-link', label: 'Customer Link' },
    { id: 'cartoon-size', label: 'Cartoon Size' },
    { id: 'other', label: 'Other' },
    { id: 'import-data', label: 'Import Data' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Material Description</h1>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
            <input
              type="text"
              name="materialName"
              value={formData.materialName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter material name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Code *</label>
            <input
              type="text"
              name="materialCode"
              value={formData.materialCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter material code"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
            <input
              type="text"
              name="hsnCode"
              value={formData.hsnCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter HSN code"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
            <select
              name="materialType"
              value={formData.materialType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select material type</option>
              <option value="Raw Material">Raw Material</option>
              <option value="Finished Goods">Finished Goods</option>
              <option value="Semi-Finished Goods">Semi-Finished Goods</option>
              <option value="Consumables">Consumables</option>
              <option value="Spares">Spares</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Group</label>
            <select
              name="materialGroup"
              value={formData.materialGroup}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select material group</option>
              <option value="Electrical">Electrical</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Chemical">Chemical</option>
              <option value="Electronics">Electronics</option>
              <option value="General">General</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select unit</option>
              <option value="KG">KG</option>
              <option value="LITERS">LITERS</option>
              <option value="METERS">METERS</option>
              <option value="PCS">PCS</option>
              <option value="BOX">BOX</option>
              <option value="BAG">BAG</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
            <input
              type="number"
              name="gstRate"
              value={formData.gstRate}
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter GST rate"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CESS Rate (%)</label>
            <input
              type="number"
              name="cessRate"
              value={formData.cessRate}
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter CESS rate"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Stock</label>
            <input
              type="number"
              name="openingStock"
              value={formData.openingStock}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter opening stock"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Rate</label>
            <input
              type="number"
              name="openingRate"
              value={formData.openingRate}
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter opening rate"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Value</label>
            <input
              type="number"
              name="openingValue"
              value={formData.openingValue}
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter opening value"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
            <input
              type="number"
              name="minStock"
              value={formData.minStock}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter minimum stock"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock</label>
            <input
              type="number"
              name="maxStock"
              value={formData.maxStock}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter maximum stock"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
            <input
              type="number"
              name="reorderLevel"
              value={formData.reorderLevel}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reorder level"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter material description"
          />
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
          {activeTab === 'customer-link' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Customer Link</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={customerLink}
                    onChange={(e) => setCustomerLink(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer name or code"
                  />
                  <button
                    onClick={handleAddCustomer}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 bg-gray-50 flex items-center justify-center text-gray-500">
                  Linked customers will appear here
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cartoon-size' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Cartoon Size</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label>
                  <input
                    type="number"
                    name="length"
                    value={cartoonSize.length}
                    onChange={handleCartoonSizeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter length"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
                  <input
                    type="number"
                    name="width"
                    value={cartoonSize.width}
                    onChange={handleCartoonSizeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter width"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={cartoonSize.height}
                    onChange={handleCartoonSizeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter height"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={cartoonSize.weight}
                    onChange={handleCartoonSizeChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter weight"
                  />
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Volume:</strong> {cartoonSize.length && cartoonSize.width && cartoonSize.height 
                    ? `${(parseFloat(cartoonSize.length) * parseFloat(cartoonSize.width) * parseFloat(cartoonSize.height) / 1000000).toFixed(4)} m³`
                    : '0 m³'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'other' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Other Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={otherDetails.manufacturer}
                    onChange={handleOtherDetailsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter manufacturer name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={otherDetails.brand}
                    onChange={handleOtherDetailsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter brand name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    name="model"
                    value={otherDetails.model}
                    onChange={handleOtherDetailsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter model number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty</label>
                  <input
                    type="text"
                    name="warranty"
                    value={otherDetails.warranty}
                    onChange={handleOtherDetailsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter warranty period"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
                <textarea
                  name="specifications"
                  value={otherDetails.specifications}
                  onChange={handleOtherDetailsChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter technical specifications"
                />
              </div>
            </div>
          )}

          {activeTab === 'import-data' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Import Data</h3>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
