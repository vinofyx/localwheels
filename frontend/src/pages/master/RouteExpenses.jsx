import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import RouteExpenseTable from '../../components/RouteExpenseTable';
import {
  saveRouteExpense,
  getRouteExpenses,
  updateRouteExpense,
  deleteRouteExpense,
} from '../../services/routeExpensesAPI';

const DEFAULT_EXPENSE_CHARGES = [
  '2ND ATTEMPT CHARGES',
  'APPOINTMENT DELIVERY CHARGES',
  'DRIVER FOODING EXPENSE CHARGES',
  'DRIVER UNLOADING CHARGES',
  'DRIVER-LOADING CHARGES',
  'HELPER FOODING EXPENSE CHARGES',
  'LOADING CHARGES BY HAMALI',
  'OTHER EXPENSE CHARGES',
  'RE-ATTEMPT CHARGES',
  'THAI BAZAR CHARGES',
  'TOLL EXPENSE CHARGES',
  'TRIP UNLOADING CHARGES',
  'UNLOADING CHARGES BY HAMALI',
  'VECHILE BREAKDOWN EXPENSES',
];

const EMPTY_FORM = {
  routeName: '',
  loadType: '',
  transitPeriodDays: '',
  routeDiesel: '',
  routeAdvance: '',
  tollAmount: '',
  expenses: DEFAULT_EXPENSE_CHARGES.map(routeCharge => ({ routeCharge, amount: 0 })),
};

const inp = 'border border-gray-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-400 w-full bg-white';
const lbl = 'block text-[12px] font-semibold text-[#0b8fd3] mb-0.5';

export default function RouteExpenses() {
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [savedList, setSavedList]   = useState([]);
  const [editingId, setEditingId]   = useState(null);
  const [saving, setSaving]         = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  // Load all route expenses on mount
  useEffect(() => { fetchList(); }, []);

  async function fetchList() {
    setLoadingList(true);
    try {
      const res = await getRouteExpenses();
      setSavedList(res.data?.data || []);
    } catch {
      toast.error('Failed to load route expenses');
    } finally {
      setLoadingList(false);
    }
  }

  function handleChange(e) {
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleAmountChange(index, value) {
    setFormData(f => {
      const expenses = [...f.expenses];
      expenses[index] = { ...expenses[index], amount: value };
      return { ...f, expenses };
    });
  }

  async function handleSave() {
    if (!formData.routeName.trim())        return toast.error('Route Name is required');
    if (!formData.loadType)                return toast.error('Load Type is required');
    if (formData.transitPeriodDays === '') return toast.error('Transit Period (Days) is required');

    setSaving(true);
    try {
      if (editingId) {
        await updateRouteExpense(editingId, formData);
        toast.success('Route expense updated successfully');
      } else {
        await saveRouteExpense(formData);
        toast.success('Route expense saved successfully');
      }
      handleReset();
      fetchList();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setFormData(EMPTY_FORM);
    setEditingId(null);
  }

  function handleEdit(record) {
    setEditingId(record._id || record.id);
    setFormData({
      routeName:         record.routeName,
      loadType:          record.loadType,
      transitPeriodDays: record.transitPeriodDays,
      routeDiesel:       record.routeDiesel,
      routeAdvance:      record.routeAdvance,
      tollAmount:        record.tollAmount,
      expenses:          record.expenses?.length
        ? record.expenses
        : DEFAULT_EXPENSE_CHARGES.map(routeCharge => ({ routeCharge, amount: 0 })),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this route expense?')) return;
    try {
      await deleteRouteExpense(id);
      toast.success('Deleted successfully');
      fetchList();
      if (editingId === id) handleReset();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Delete failed');
    }
  }

  return (
    <div className="min-h-screen bg-[#dce9f5] text-[13px] pb-6">

      {/* ── Title ─────────────────────────────────────────────────── */}
      <div className="text-center py-2">
        <span className="font-bold text-[15px] tracking-wide text-gray-900" style={{ fontVariant: 'small-caps' }}>
          Route Expenses Master
        </span>
      </div>

      {/* ── Form card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm mx-2 px-4 py-3 mb-3">
        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className={lbl}>Route Name <span className="text-red-500">*</span></label>
            <input name="routeName" value={formData.routeName} onChange={handleChange}
              className={inp} placeholder="e.g. HYD-MUM" />
          </div>
          <div>
            <label className={lbl}>Load Type <span className="text-red-500">*</span></label>
            <select name="loadType" value={formData.loadType} onChange={handleChange} className={inp}>
              <option value="">-- Select --</option>
              <option value="FULL LOAD">FULL LOAD</option>
              <option value="PART LOAD">PART LOAD</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Transit Period (Days) <span className="text-red-500">*</span></label>
            <input name="transitPeriodDays" type="number" min="0" value={formData.transitPeriodDays}
              onChange={handleChange} className={inp} placeholder="e.g. 2" />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className={lbl}>Route Diesel (Litres)</label>
            <input name="routeDiesel" type="number" min="0" value={formData.routeDiesel}
              onChange={handleChange} className={inp} placeholder="0" />
          </div>
          <div>
            <label className={lbl}>Route Advance (₹)</label>
            <input name="routeAdvance" type="number" min="0" value={formData.routeAdvance}
              onChange={handleChange} className={inp} placeholder="0" />
          </div>
          <div>
            <label className={lbl}>Toll Amount (₹)</label>
            <input name="tollAmount" type="number" min="0" value={formData.tollAmount}
              onChange={handleChange} className={inp} placeholder="0" />
          </div>
        </div>

        {/* Expense table */}
        <div className="mb-4">
          <p className="font-semibold text-gray-700 mb-2">Route Expense Charges</p>
          <RouteExpenseTable
            expenses={formData.expenses}
            handleAmountChange={handleAmountChange}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-1.5 rounded text-[13px]"
          >
            {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
          </button>
          <button
            onClick={handleReset}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-1.5 rounded text-[13px]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Saved list ────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm mx-2 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-gray-700">Saved Route Expenses</p>
          <button
            onClick={fetchList}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] px-3 py-1 rounded"
          >
            Refresh
          </button>
        </div>

        {loadingList ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : savedList.length === 0 ? (
          <p className="text-center text-gray-400 py-6">No route expenses saved yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-[11px]">
                  <th className="px-3 py-2">Route Name</th>
                  <th className="px-3 py-2">Load Type</th>
                  <th className="px-3 py-2">Transit Days</th>
                  <th className="px-3 py-2">Diesel (L)</th>
                  <th className="px-3 py-2">Advance (₹)</th>
                  <th className="px-3 py-2">Toll (₹)</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedList.map(r => (
                  <tr key={r._id || r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{r.routeName}</td>
                    <td className="px-3 py-2">{r.loadType}</td>
                    <td className="px-3 py-2">{r.transitPeriodDays}</td>
                    <td className="px-3 py-2">{r.routeDiesel}</td>
                    <td className="px-3 py-2">{r.routeAdvance}</td>
                    <td className="px-3 py-2">{r.tollAmount}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleEdit(r)}
                        className="text-blue-600 hover:underline mr-3"
                      >Edit</button>
                      <button
                        onClick={() => handleDelete(r._id || r.id)}
                        className="text-red-500 hover:underline"
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
