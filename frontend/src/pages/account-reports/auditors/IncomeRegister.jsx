import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['VCHDATE', 'BRANCH', 'INCOME LEDGER', 'GROUP NAME'];

const COLS = [
  'Voucher No', 'Voucher Date', 'Income Ledger', 'Group Name',
  'Branch', 'Debit', 'Credit', 'Narration',
];

export default function IncomeRegister() {
  return (
    <MRReportPage
      title="Income Register"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
