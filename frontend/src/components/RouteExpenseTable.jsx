import React from 'react';

export default function RouteExpenseTable({ expenses, handleAmountChange }) {
  return (
    <div className="border rounded bg-white mt-3">
      <div className="bg-info text-white p-2 fw-bold d-flex">
        <div style={{ width: '70%' }}>Route Charge</div>
        <div style={{ width: '30%' }}>Route Expenses</div>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {expenses.map((item, index) => (
          <div
            key={index}
            className="d-flex border-bottom p-2 align-items-center"
          >
            <div style={{ width: '70%' }}>{item.routeCharge}</div>

            <div style={{ width: '30%' }}>
              <input
                type="number"
                className="form-control"
                value={item.amount}
                onChange={(e) =>
                  handleAmountChange(index, e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
