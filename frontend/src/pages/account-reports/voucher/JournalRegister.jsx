import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['VOUCHAR DATE', 'BRANCH', 'LEDGER'];

const COLS = [
  'Voucher No', 'Voucher Date', 'Ledger', 'Debit', 'Credit', 'Narration',
];

export default function JournalRegister() {
  return (
    <MRReportPage
      title="Journal Register"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
