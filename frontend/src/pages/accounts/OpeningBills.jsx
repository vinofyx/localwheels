import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function OpeningBills() {

  const [formData, setFormData] = useState({
    branch_id: '',
    ledger_id: '',
    reference_id: '',
    reference_date: '',
    bill_no: '',
    amount: '',
    amount_type: 'DR',
    submit_date: '',
    billing_party: '',
  });

  const [branches, setBranches] = useState([]);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgers, setLedgers] = useState([]);
  const [showLedgerDropdown, setShowLedgerDropdown] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [importedData, setImportedData] = useState([]);

  // ================= FETCH =================
  useEffect(() => {
    api.get('/branches')
      .then(res => setBranches(res.data))
      .catch(() => {
        setBranches([
          { id: 1, branch_name: 'HYDERABAD' },
          { id: 2, branch_name: 'ADILABAD' }
        ]);
      });
  }, []);

  useEffect(() => {
    if (ledgerSearch) {
      api.get(`/ledgers?search=${ledgerSearch}`)
        .then(res => setLedgers(res.data))
        .catch(() => {
          setLedgers([
            { id: 1, ledger_name: 'SUNDRY CREDITORS' },
            { id: 2, ledger_name: 'CASH IN HAND' }
          ]);
        });
    }
  }, [ledgerSearch]);

  // ================= HANDLERS =================

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLedgerInputChange = (e) => {
    const value = e.target.value;
    setLedgerSearch(value);
    setShowLedgerDropdown(true);
  };

  const handleLedgerSelect = (ledger) => {
    setFormData(prev => ({ ...prev, ledger_id: ledger.id }));
    setLedgerSearch(ledger.ledger_name);
    setShowLedgerDropdown(false);
  };

  const handleSubmit = () => {
    if (!formData.branch_id || !formData.ledger_id) {
      toast.error("Required fields missing");
      return;
    }

    api.post('/opening-bills', formData)
      .then(() => toast.success("Saved"))
      .catch(() => toast.error("Error saving"));
  };

  const handleRefresh = () => {
    setFormData({
      branch_id: '',
      ledger_id: '',
      reference_id: '',
      reference_date: '',
      bill_no: '',
      amount: '',
      amount_type: 'DR',
      submit_date: '',
      billing_party: '',
    });
    setLedgerSearch('');
    setSelectedFile(null);
    setImportedData([]);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleShowData = () => {
    if (!selectedFile) return toast.error("Select file");

    const fileData = new FormData();
    fileData.append("file", selectedFile);

    api.post('/opening-bills/preview', fileData)
      .then(res => setImportedData(res.data))
      .catch(() => toast.error("Preview failed"));
  };

  const handleImportData = () => {
    if (!selectedFile) return toast.error("Select file");

    const fileData = new FormData();
    fileData.append("file", selectedFile);

    api.post('/opening-bills/import', fileData)
      .then(res => toast.success(`Imported ${res.data.total_records}`))
      .catch(() => toast.error("Import failed"));
  };

  const handleDownloadTemplate = () => {
    api.get('/opening-bills/template', { responseType: 'blob' })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template.xlsx';
        a.click();
      });
  };

  // ================= UI =================

  return (
    <div className="p-4 bg-gray-200 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-lg">Opening Bills</h2>
        <div className="flex gap-2">
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-1 rounded">Save</button>
          <button onClick={handleRefresh} className="bg-gray-600 text-white px-4 py-1 rounded">Refresh</button>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white border p-4 rounded">

        <div className="grid grid-cols-2 gap-x-10 gap-y-3">

          <div className="flex items-center">
            <label className="w-40 text-sm">* Branch</label>
            <select name="branch_id" value={formData.branch_id} onChange={handleInputChange} className="border w-full px-2 py-1">
              <option value="">--Select--</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
            </select>
          </div>

          <div className="flex items-center relative">
            <label className="w-40 text-sm">* Ledger</label>
            <input value={ledgerSearch} onChange={handleLedgerInputChange} className="border w-full px-2 py-1" />
            {showLedgerDropdown && (
              <div className="absolute top-full left-40 bg-white border w-[70%]">
                {ledgers.map(l => (
                  <div key={l.id} onClick={() => handleLedgerSelect(l)} className="p-1 hover:bg-gray-100 cursor-pointer">
                    {l.ledger_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <label className="w-40 text-sm">* Reference ID</label>
            <input name="reference_id" value={formData.reference_id} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div className="flex items-center">
            <label className="w-40 text-sm">* Reference Date</label>
            <input type="date" name="reference_date" value={formData.reference_date} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div className="flex items-center">
            <label className="w-40 text-sm">* Bill No</label>
            <input name="bill_no" value={formData.bill_no} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div className="flex items-center">
            <label className="w-40 text-sm">* Amount</label>
            <input name="amount" value={formData.amount} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div className="flex items-center">
            <label className="w-40 text-sm">* Amount Type</label>
            <select name="amount_type" value={formData.amount_type} onChange={handleInputChange} className="border w-full px-2 py-1">
              <option value="DR">DR</option>
              <option value="CR">CR</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="w-40 text-sm">Submit Date</label>
            <input type="date" name="submit_date" value={formData.submit_date} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

          <div className="flex items-center col-span-2">
            <label className="w-40 text-sm">Billing Party</label>
            <input name="billing_party" value={formData.billing_party} onChange={handleInputChange} className="border w-full px-2 py-1" />
          </div>

        </div>
      </div>

      {/* IMPORT */}
      <div className="bg-white border p-4 mt-4 rounded">

        <div className="flex items-center gap-3">
          <button onClick={handleDownloadTemplate} className="text-blue-600 underline">
            Download Sample Excel Template
          </button>

          <span>Select Import File</span>

          <input type="file" onChange={handleFileChange} />

          <button onClick={handleShowData} className="bg-blue-500 text-white px-3 py-1 rounded">Show Data</button>
          <button onClick={handleImportData} className="bg-green-600 text-white px-3 py-1 rounded">Import Data</button>
          <button onClick={handleRefresh} className="bg-teal-500 text-white px-3 py-1 rounded">Refresh</button>
        </div>

        <div className="mt-2 font-semibold text-sm">
          Total Count: {importedData.length}
        </div>

      </div>

    </div>
  );
}