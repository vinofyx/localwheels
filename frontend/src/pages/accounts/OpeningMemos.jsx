import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function OpeningMemos() {

  const [formData, setFormData] = useState({
    vendorName: '',
    branch: '',
    memoNo: '',
    memoDate: '',
    memoFreight: '',
    memoAdvance: '',
    memoDiesel: '',
    balanceAmount: '',
    vehicleNo: '',
    fromLocation: '',
    toLocation: '',
  });

  const [tableData, setTableData] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.vendorName || !formData.branch || !formData.memoNo || !formData.memoDate) {
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

    handleRefresh();
  };

  const handleRefresh = () => {
    setFormData({
      vendorName: '',
      branch: '',
      memoNo: '',
      memoDate: '',
      memoFreight: '',
      memoAdvance: '',
      memoDiesel: '',
      balanceAmount: '',
      vehicleNo: '',
      fromLocation: '',
      toLocation: '',
    });
  };

  return (
    <div className="p-4 bg-gray-200 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-red-600 text-sm">* Marked Fields are Compulsory</span>
        <h2 className="font-bold text-lg">Opening Memos</h2>
        <div className="flex gap-2">
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-1 rounded">Save</button>
          <button className="bg-green-600 text-white px-4 py-1 rounded">Search</button>
          <button onClick={handleRefresh} className="bg-gray-600 text-white px-4 py-1 rounded">Refresh</button>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white border rounded p-4">

        <div className="grid grid-cols-4 gap-4">

          <div>
            <label className="text-sm">* Vendor Name</label>
            <input name="vendorName" value={formData.vendorName} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div>
            <label className="text-sm">* Branch</label>
            <input name="branch" value={formData.branch} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div>
            <label className="text-sm">* Memo No</label>
            <input name="memoNo" value={formData.memoNo} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div>
            <label className="text-sm">* Memo Date</label>
            <input type="date" name="memoDate" value={formData.memoDate} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div>
            <label className="text-sm">* Memo Freight</label>
            <input name="memoFreight" value={formData.memoFreight} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div>
            <label className="text-sm">Memo Advance</label>
            <input name="memoAdvance" value={formData.memoAdvance} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div>
            <label className="text-sm">Memo Diesel</label>
            <input name="memoDiesel" value={formData.memoDiesel} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div>
            <label className="text-sm">* Balance Amount</label>
            <input name="balanceAmount" value={formData.balanceAmount} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div>
            <label className="text-sm">Vehicle No</label>
            <input name="vehicleNo" value={formData.vehicleNo} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div>
            <label className="text-sm">From Location</label>
            <input name="fromLocation" value={formData.fromLocation} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div>
            <label className="text-sm">To Location</label>
            <input name="toLocation" value={formData.toLocation} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

        </div>
      </div>

      {/* IMPORT SECTION */}
      <div className="bg-white border rounded p-4 mt-4">

        <div className="flex items-center gap-4 mb-3">
          <button className="text-blue-600 underline">Download Sample Excel Template</button>

          <span>Select Import File</span>
          <input type="file" />

          <button className="bg-blue-500 text-white px-3 py-1 rounded">Show Data</button>
          <button className="bg-blue-500 text-white px-3 py-1 rounded">Import Data</button>
          <button className="bg-blue-500 text-white px-3 py-1 rounded">Refresh</button>
        </div>

        <div className="text-sm font-semibold">Total Count</div>

      </div>

    </div>
  );
}