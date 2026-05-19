import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['VCHDATE', 'BRANCH', 'LEDGER'];

const COLS = [
  'Voucher No', 'Voucher Date', 'Ledger', 'Branch',
  'Debit', 'Credit', 'Narration',
];

export default function ExpensesRegister() {
  return (
    <MRReportPage
      title="Expenses Register"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
