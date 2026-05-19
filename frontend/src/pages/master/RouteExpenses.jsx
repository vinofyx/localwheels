import React, { useState } from 'react';
import RouteExpenseTable from '../../components/RouteExpenseTable';
import {
  saveRouteExpense,
  getRouteExpenses,
} from '../../services/routeExpensesAPI';

const defaultExpenses = [
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

export default function RouteExpenses() {
  const [formData, setFormData] = useState({
    routeName: '',
    loadType: '',
    transitPeriodDays: '',
    routeDiesel: '',
    routeAdvance: '',
    tollAmount: '',
    expenses: defaultExpenses.map((item) => ({
      routeCharge: item,
      amount: 0,
    })),
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAmountChange = (index, value) => {
    const updated = [...formData.expenses];

    updated[index].amount = value;

    setFormData({
      ...formData,
      expenses: updated,
    });
  };

  const handleSave = async () => {
    try {
      await saveRouteExpense(formData);

      alert('Saved Successfully');
    } catch (error) {
      console.log(error);
      alert('Save Failed');
    }
  };

  const handleSearch = async () => {
    try {
      const res = await getRouteExpenses();

      console.log(res.data);

      alert('Search Data Loaded');
    } catch (error) {
      console.log(error);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="container-fluid p-3 bg-light">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold">ROUTE EXPENSES</h3>

        <div>
          <button
            className="btn btn-success me-2"
            onClick={handleSave}
          >
            Save
          </button>

          <button
            className="btn btn-primary me-2"
            onClick={handleSearch}
          >
            Search
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="card p-3 mb-3">
        <div className="row">
          <div className="col-md-4">
            <label>Route Name</label>

            <input
              type="text"
              name="routeName"
              className="form-control"
              value={formData.routeName}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <label>Load Type</label>

            <select
              name="loadType"
              className="form-control"
              value={formData.loadType}
              onChange={handleChange}
            >
              <option value="">--Select--</option>
              <option value="FULL LOAD">FULL LOAD</option>
              <option value="PART LOAD">PART LOAD</option>
            </select>
          </div>

          <div className="col-md-4">
            <label>Transit Period(Days)</label>

            <input
              type="number"
              name="transitPeriodDays"
              className="form-control"
              value={formData.transitPeriodDays}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="card p-3 mb-3">
        <div className="row">
          <div className="col-md-4">
            <label>Route Diesel [In Litre]</label>

            <input
              type="number"
              name="routeDiesel"
              className="form-control"
              value={formData.routeDiesel}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <label>Route Advance</label>

            <input
              type="number"
              name="routeAdvance"
              className="form-control"
              value={formData.routeAdvance}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <label>Toll Amount</label>

            <input
              type="number"
              name="tollAmount"
              className="form-control"
              value={formData.tollAmount}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="card p-3">
        <h5 className="fw-bold">Route Expense</h5>

        <RouteExpenseTable
          expenses={formData.expenses}
          handleAmountChange={handleAmountChange}
        />
      </div>
    </div>
  );
}
