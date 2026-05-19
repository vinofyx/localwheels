import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Ledger() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ledgerName: '',
    ledgerCode: '',
    ledgerGroup: '',
    openingBalance: '',
    ledgerType: 'Debit',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    micrCode: '',
    remarks: '',
    isActive: true,
  });

  const [tableData, setTableData] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    ledgerName: '',
    ledgerCode: '',
    ledgerGroup: '',
    openingBalance: '',
    ledgerType: '',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    micrCode: '',
    remarks: '',
    isActive: '',
    createdUser: '',
    createdDate: '',
    lastModify: '',
    modifyDate: '',
  });

  const [currentPage, setCurrentPage] = useState(1);

  const ledgerTypeOptions = ['Debit', 'Credit'];
  const mainGroupOptions = [
    'ASSETS',
    'LIABILITIES',
    'EQUITY',
    'REVENUE',
    'EXPENSES',
    'INCOME',
  ];

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
    
    if (!formData.ledgerName || !formData.ledgerGroup) {
      toast.error('Ledger Name and Ledger Group are required!');
      return;
    }

    const newLedger = {
      id: tableData.length + 1,
      ledgerName: formData.ledgerName,
      ledgerCode: formData.ledgerCode,
      ledgerGroup: formData.ledgerGroup,
      openingBalance: formData.openingBalance,
      ledgerType: formData.ledgerType,
      bankName: formData.bankName,
      accountNo: formData.accountNo,
      ifscCode: formData.ifscCode,
      micrCode: formData.micrCode,
      remarks: formData.remarks,
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

    setTableData(prev => [...prev, newLedger]);
    setFormData({
      ledgerName: '',
      ledgerCode: '',
      ledgerGroup: '',
      openingBalance: '',
      ledgerType: 'Debit',
      bankName: '',
      accountNo: '',
      ifscCode: '',
      micrCode: '',
      remarks: '',
      isActive: true,
    });
    toast.success('Ledger saved successfully!');
  };

  const handleRefresh = () => {
    setFormData({
      ledgerName: '',
      ledgerCode: '',
      ledgerGroup: '',
      openingBalance: '',
      ledgerType: 'Debit',
      bankName: '',
      accountNo: '',
      ifscCode: '',
      micrCode: '',
      remarks: '',
      isActive: true,
    });
    setSearchFilters({
      ledgerName: '',
      ledgerCode: '',
      ledgerGroup: '',
      openingBalance: '',
      ledgerType: '',
      bankName: '',
      accountNo: '',
      ifscCode: '',
      micrCode: '',
      remarks: '',
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
        ledgerName: item.ledgerName,
        ledgerCode: item.ledgerCode,
        ledgerGroup: item.ledgerGroup,
        openingBalance: item.openingBalance,
        ledgerType: item.ledgerType,
        bankName: item.bankName,
        accountNo: item.accountNo,
        ifscCode: item.ifscCode,
        micrCode: item.micrCode,
        remarks: item.remarks,
        isActive: item.isActive === 'Yes',
      });
      toast.success('Ledger loaded for editing!');
    }
  };

  const filteredData = tableData.filter(item => {
    return (
      item.ledgerName.toLowerCase().includes(searchFilters.ledgerName.toLowerCase()) &&
      item.ledgerCode.toLowerCase().includes(searchFilters.ledgerCode.toLowerCase()) &&
      item.ledgerGroup.toLowerCase().includes(searchFilters.ledgerGroup.toLowerCase()) &&
      item.openingBalance.toLowerCase().includes(searchFilters.openingBalance.toLowerCase()) &&
      item.ledgerType.toLowerCase().includes(searchFilters.ledgerType.toLowerCase()) &&
      item.bankName.toLowerCase().includes(searchFilters.bankName.toLowerCase()) &&
      item.accountNo.toLowerCase().includes(searchFilters.accountNo.toLowerCase()) &&
      item.ifscCode.toLowerCase().includes(searchFilters.ifscCode.toLowerCase()) &&
      item.micrCode.toLowerCase().includes(searchFilters.micrCode.toLowerCase()) &&
      item.remarks.toLowerCase().includes(searchFilters.remarks.toLowerCase()) &&
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
          <h1 className="text-xl font-bold text-gray-800">Ledger</h1>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Ledger Name *</label>
            <input
              type="text"
              name="ledgerName"
              value={formData.ledgerName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter ledger name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ledger Code *</label>
            <input
              type="text"
              name="ledgerCode"
              value={formData.ledgerCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter ledger code"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ledger Group *</label>
            <select
              name="ledgerGroup"
              value={formData.ledgerGroup}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">--Select Group--</option>
              {mainGroupOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
            <input
              type="number"
              name="openingBalance"
              value={formData.openingBalance}
              onChange={handleInputChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter opening balance"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ledger Type</label>
            <select
              name="ledgerType"
              value={formData.ledgerType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ledgerTypeOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Account No</label>
            <input
              type="text"
              name="accountNo"
              value={formData.accountNo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter account number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
            <input
              type="text"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter IFSC code"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MICR Code</label>
            <input
              type="text"
              name="micrCode"
              value={formData.micrCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter MICR code"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter remarks"
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
                    <span className="text-sm font-medium text-gray-700">Ledger Name</span>
                    <input
                      type="text"
                      name="ledgerName"
                      value={searchFilters.ledgerName}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Ledger Code</span>
                    <input
                      type="text"
                      name="ledgerCode"
                      value={searchFilters.ledgerCode}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Ledger Group</span>
                    <input
                      type="text"
                      name="ledgerGroup"
                      value={searchFilters.ledgerGroup}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Opening Balance</span>
                    <input
                      type="text"
                      name="openingBalance"
                      value={searchFilters.openingBalance}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Ledger Type</span>
                    <input
                      type="text"
                      name="ledgerType"
                      value={searchFilters.ledgerType}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Bank Name</span>
                    <input
                      type="text"
                      name="bankName"
                      value={searchFilters.bankName}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Account No</span>
                    <input
                      type="text"
                      name="accountNo"
                      value={searchFilters.accountNo}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">IFSC Code</span>
                    <input
                      type="text"
                      name="ifscCode"
                      value={searchFilters.ifscCode}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">MICR Code</span>
                    <input
                      type="text"
                      name="micrCode"
                      value={searchFilters.micrCode}
                      onChange={handleSearchFilterChange}
                      className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Search..."
                    />
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Remarks</span>
                    <input
                      type="text"
                      name="remarks"
                      value={searchFilters.remarks}
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
                  <td colSpan="17" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    No data available in table
                  </td>
                </tr>
              ) : (
                currentData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-sm">{item.ledgerName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{item.ledgerCode}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{item.ledgerGroup}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">{item.openingBalance || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{item.ledgerType}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{item.bankName || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{item.accountNo || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{item.ifscCode || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{item.micrCode || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{item.remarks || '-'}</td>
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
