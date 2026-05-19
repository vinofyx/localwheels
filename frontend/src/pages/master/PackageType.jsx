import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function PackageType() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    packageType: '',
    perPackageQty: '',
    packageUnit: 'KG',
  });

  const [tableData, setTableData] = useState([]);

  const [searchFilters, setSearchFilters] = useState({
    packageType: '',
    perPackageQty: '',
    packageUnit: '',
    createdUser: '',
    createdDate: '',
    lastModify: '',
    modifyDate: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [exportOption, setExportOption] = useState('Select');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.packageType || !formData.perPackageQty || !formData.packageUnit) {
      toast.error('Please fill all compulsory fields');
      return;
    }

    const newPackage = {
      id: tableData.length + 1,
      packageType: formData.packageType,
      perPackageQty: formData.perPackageQty,
      packageUnit: formData.packageUnit,
      createdUser: 'admin', // This would come from auth context
      createdDate: new Date().toLocaleString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      }).replace(',', ''),
      lastModify: '',
      modifyDate: '',
    };

    setTableData(prev => [...prev, newPackage]);
    setFormData({ packageType: '', perPackageQty: '', packageUnit: 'KG' });
    toast.success('Package type saved successfully!');
  };

  const handleRefresh = () => {
    setFormData({ packageType: '', perPackageQty: '', packageUnit: 'KG' });
    setSearchFilters({
      packageType: '',
      perPackageQty: '',
      packageUnit: '',
      createdUser: '',
      createdDate: '',
      lastModify: '',
      modifyDate: '',
    });
    toast.success('Page refreshed!');
  };

  const handleEdit = (id) => {
    const item = tableData.find(item => item.id === id);
    if (item) {
      setFormData({
        packageType: item.packageType,
        perPackageQty: item.perPackageQty,
        packageUnit: item.packageUnit,
      });
      toast.success('Package type loaded for editing!');
    }
  };

  const handleExport = () => {
    if (exportOption === 'Select') {
      toast.error('Please select an export option');
      return;
    }
    toast.success(`Exporting as ${exportOption}...`);
  };

  const filteredData = tableData.filter(item => {
    return (
      item.packageType.toLowerCase().includes(searchFilters.packageType.toLowerCase()) &&
      item.perPackageQty.toLowerCase().includes(searchFilters.perPackageQty.toLowerCase()) &&
      item.packageUnit.toLowerCase().includes(searchFilters.packageUnit.toLowerCase()) &&
      item.createdUser.toLowerCase().includes(searchFilters.createdUser.toLowerCase()) &&
      item.createdDate.toLowerCase().includes(searchFilters.createdDate.toLowerCase()) &&
      item.lastModify.toLowerCase().includes(searchFilters.lastModify.toLowerCase()) &&
      item.modifyDate.toLowerCase().includes(searchFilters.modifyDate.toLowerCase())
    );
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">PACKAGE TYPE</h1>
            <p className="text-sm text-gray-600 mt-1">Mark fields are compulsory</p>
          </div>
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

      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="packageType"
              value={formData.packageType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter package type"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Per Package Qty <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="perPackageQty"
              value={formData.perPackageQty}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter per package quantity"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package Unit <span className="text-red-500">*</span>
            </label>
            <select
              name="packageUnit"
              value={formData.packageUnit}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="KG">KG</option>
              <option value="QTY">QTY</option>
              <option value="LITERS">LITERS</option>
              <option value="METERS">METERS</option>
              <option value="PCS">PCS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Export Dropdown */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Export as:</label>
            <select
              value={exportOption}
              onChange={(e) => setExportOption(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Select">Select</option>
              <option value="Excel">Excel</option>
              <option value="PDF">PDF</option>
              <option value="CSV">CSV</option>
            </select>
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Package Type</span>
                    <input
                      type="text"
                      name="packageType"
                      value={searchFilters.packageType}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Package Per QTY</span>
                    <input
                      type="text"
                      name="perPackageQty"
                      value={searchFilters.perPackageQty}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Package Type</span>
                    <input
                      type="text"
                      name="packageUnit"
                      value={searchFilters.packageUnit}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Created User</span>
                    <input
                      type="text"
                      name="createdUser"
                      value={searchFilters.createdUser}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Created Date</span>
                    <input
                      type="text"
                      name="createdDate"
                      value={searchFilters.createdDate}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Last Modify</span>
                    <input
                      type="text"
                      name="lastModify"
                      value={searchFilters.lastModify}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Modify Date</span>
                    <input
                      type="text"
                      name="modifyDate"
                      value={searchFilters.modifyDate}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-gray-700">Edit</span>
                    <input
                      type="text"
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 text-sm">{item.packageType}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{item.perPackageQty}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{item.packageUnit}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{item.createdUser}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{item.createdDate}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{item.lastModify || '-'}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{item.modifyDate || '-'}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button
                      onClick={() => handleEdit(item.id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              className="px-3 py-1 border border-blue-500 bg-blue-500 text-white rounded"
            >
              {currentPage}
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
