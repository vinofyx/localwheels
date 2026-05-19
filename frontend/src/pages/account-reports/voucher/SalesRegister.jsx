import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['ENTRY DATE', 'VOUCHER NO', 'PARTY', 'BRANCH'];

const COLS = [
  'Voucher No', 'Voucher Date', 'Party Name', 'Ledger',
  'Debit', 'Credit', 'Narration',
];

export default function SalesRegister() {
  return (
    <MRReportPage
      title="Sales Register"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
