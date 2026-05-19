import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function BankRecoOpening() {

  const [formData, setFormData] = useState({
    voucherType: '',
    chequeNo: '',
    accountName: '',
    amount: '',
    amountType: 'CR',
    voucherDate: '',
    chequeDate: '',
    bankName: '',
    remark: ''
  });

  const [tableData, setTableData] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.voucherType || !formData.amount) {
      toast.error("Required fields missing");
      return;
    }

    const newRow = {
      id: Date.now(),
      ...formData,
      createdUser: 'admin',
      createdDate: new Date().toLocaleString()
    };

    setTableData(prev => [...prev, newRow]);
    toast.success("Saved successfully");

    setFormData({
      voucherType: '',
      chequeNo: '',
      accountName: '',
      amount: '',
      amountType: 'CR',
      voucherDate: '',
      chequeDate: '',
      bankName: '',
      remark: ''
    });
  };

  const handleRefresh = () => {
    setFormData({
      voucherType: '',
      chequeNo: '',
      accountName: '',
      amount: '',
      amountType: 'CR',
      voucherDate: '',
      chequeDate: '',
      bankName: '',
      remark: ''
    });
  };

  return (
    <div className="p-4 bg-gray-200 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-lg">BankRecoOpening</h2>
        <div className="flex gap-2">
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-1 rounded">Save</button>
          <button onClick={handleRefresh} className="bg-gray-600 text-white px-4 py-1 rounded">Refresh</button>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white border rounded p-4">

        <div className="grid grid-cols-2 gap-x-10 gap-y-3">

          <div className="flex items-center">
            <label className="w-40 text-sm">* Voucher Type</label>
            <select name="voucherType" value={formData.voucherType} onChange={handleInputChange} className="border w-full px-2 py-1">
              <option value="">--Select--</option>
              <option>Receipt</option>
              <option>Payment</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="w-40 text-sm">* Voucher Date</label>
            <input type="date" name="voucherDate" value={formData.voucherDate} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div className="flex items-center">
            <label className="w-40 text-sm">* Cheque No</label>
            <input name="chequeNo" value={formData.chequeNo} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div className="flex items-center">
            <label className="w-40 text-sm">Cheque Date</label>
            <input type="date" name="chequeDate" value={formData.chequeDate} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div className="flex items-center">
            <label className="w-40 text-sm">* Account Name</label>
            <input name="accountName" value={formData.accountName} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div className="flex items-center">
            <label className="w-40 text-sm">* Bank Name</label>
            <input name="bankName" value={formData.bankName} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div className="flex items-center">
            <label className="w-40 text-sm">* Amount</label>
            <input name="amount" value={formData.amount} onChange={handleInputChange} className="border w-full px-2 py-1 mr-2" />
            <select name="amountType" value={formData.amountType} onChange={handleInputChange} className="border px-2 py-1">
              <option>CR</option>
              <option>DR</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="w-40 text-sm">Remark</label>
            <input name="remark" value={formData.remark} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white border rounded p-4 mt-4">

        {/* TOP BAR */}
        <div className="flex justify-between mb-2">
          <div>
            Show 
            <select className="border mx-2 px-1 py-1">
              <option>10</option>
              <option>25</option>
            </select>
            entries
          </div>

          <div>
            Search: <input className="border px-2 py-1 ml-2" />
          </div>
        </div>

        {/* TABLE */}
        <table className="w-full border">
          <thead className="bg-blue-500 text-white text-sm">
            <tr>
              <th className="p-2">Voucher Type</th>
              <th>Voucher Date</th>
              <th>Cheque No</th>
              <th>Cheque Date</th>
              <th>Account Name</th>
              <th>Bank Name</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Remark</th>
              <th>Created User</th>
              <th>Created Date</th>
              <th>Edit</th>
            </tr>
          </thead>

          <tbody>
            {tableData.length === 0 ? (
              <tr>
                <td colSpan="12" className="text-center py-4">
                  No data available in table
                </td>
              </tr>
            ) : (
              tableData.map(row => (
                <tr key={row.id}>
                  <td className="border p-2">{row.voucherType}</td>
                  <td className="border p-2">{row.voucherDate}</td>
                  <td className="border p-2">{row.chequeNo}</td>
                  <td className="border p-2">{row.chequeDate}</td>
                  <td className="border p-2">{row.accountName}</td>
                  <td className="border p-2">{row.bankName}</td>
                  <td className="border p-2">{row.amount}</td>
                  <td className="border p-2">{row.amountType}</td>
                  <td className="border p-2">{row.remark}</td>
                  <td className="border p-2">{row.createdUser}</td>
                  <td className="border p-2">{row.createdDate}</td>
                  <td className="border p-2 text-center">✏️</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="flex justify-between mt-2 text-sm">
          <div>Showing 0 to 0 of {tableData.length} entries</div>
          <div>
            Previous &nbsp; Next
          </div>
        </div>

      </div>

    </div>
  );
}