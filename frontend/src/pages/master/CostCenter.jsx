import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function CostCenter() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    costCenterName: '',
    costCenterCode: '',
    description: '',
    isActive: true,
  });

  const [tableData, setTableData] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    costCenterName: '',
    costCenterCode: '',
    description: '',
    isActive: '',
    createdUser: '',
    createdDate: '',
    lastModify: '',
    modifyDate: '',
  });

  const [currentPage, setCurrentPage] = useState(1);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
    
    if (!formData.costCenterName || !formData.costCenterCode) {
      toast.error('Cost Center Name and Cost Center Code are required!');
      return;
    }

    const newCostCenter = {
      id: tableData.length + 1,
      costCenterName: formData.costCenterName,
      costCenterCode: formData.costCenterCode,
      description: formData.description,
      isActive: formData.isActive ? 'Yes' : 'No',
      createdUser: 'admin',
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

    setTableData(prev => [...prev, newCostCenter]);
    setFormData({
      costCenterName: '',
      costCenterCode: '',
      description: '',
      isActive: true,
    });
    toast.success('Cost Center saved successfully!');
  };

  const handleRefresh = () => {
    setFormData({
      costCenterName: '',
      costCenterCode: '',
      description: '',
      isActive: true,
    });
    setSearchFilters({
      costCenterName: '',
      costCenterCode: '',
      description: '',
      isActive: '',
      createdUser: '',
      createdDate: '',
      lastModify: '',
      modifyDate: '',
    });
    toast.success('Page refreshed!');
  };

  const handleSearch = () => {
    toast.success('Search functionality coming soon!');
  };

  const handleEdit = (id) => {
    const item = tableData.find(item => item.id === id);
    if (item) {
      setFormData({
        costCenterName: item.costCenterName,
        costCenterCode: item.costCenterCode,
        description: item.description,
        isActive: item.isActive === 'Yes',
      });
      toast.success('Cost Center loaded for editing!');
    }
  };

  const filteredData = tableData.filter(item => {
    return (
      item.costCenterName.toLowerCase().includes(searchFilters.costCenterName.toLowerCase()) &&
      item.costCenterCode.toLowerCase().includes(searchFilters.costCenterCode.toLowerCase()) &&
      item.description.toLowerCase().includes(searchFilters.description.toLowerCase()) &&
      item.isActive.toLowerCase().includes(searchFilters.isActive.toLowerCase()) &&
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
          <h1 className="text-xl font-bold text-gray-800">Cost Center</h1>
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

      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost Center Name *</label>
            <input
              type="text"
              name="costCenterName"
              value={formData.costCenterName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter cost center name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost Center Code *</label>
            <input
              type="text"
              name="costCenterCode"
              value={formData.costCenterCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter cost center code"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description"
            />
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

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Export Dropdown */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Export as:</label>
            <select
              className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Select">Select</option>
              <option value="Excel">Excel</option>
              <option value="PDF">PDF</option>
              <option value="CSV">CSV</option>
            </select>
            <button
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
                    <span className="text-sm font-medium text-gray-700">Cost Center Name</span>
                    <input
                      type="text"
                      name="costCenterName"
                      value={searchFilters.costCenterName}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Cost Center Code</span>
                    <input
                      type="text"
                      name="costCenterCode"
                      value={searchFilters.costCenterCode}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Description</span>
                    <input
                      type="text"
                      name="description"
                      value={searchFilters.description}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Is Active</span>
                    <input
                      type="text"
                      name="isActive"
                      value={searchFilters.isActive}
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
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    No data available in table
                  </td>
                </tr>
              ) : (
                currentData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-sm">{item.costCenterName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{item.costCenterCode}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{item.description || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{item.isActive}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Showing {filteredData.length === 0 ? 0 : startIndex + 1} to {filteredData.length === 0 ? 0 : Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
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
              disabled={currentPage === totalPages || totalPages === 0}
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
