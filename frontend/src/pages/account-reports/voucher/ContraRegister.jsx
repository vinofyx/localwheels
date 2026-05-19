import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['VOUCHAR DATE', 'BRANCH', 'LEDGER'];

const COLS = [
  'Voucher No', 'Voucher Date', 'From A/c', 'To A/c', 'Amount', 'Narration',
];

export default function ContraRegister() {
  return (
    <MRReportPage
      title="Contra Register"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
