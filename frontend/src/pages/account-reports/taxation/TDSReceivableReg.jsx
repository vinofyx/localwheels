import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['VOUCHER DATE', 'PARTY LEDGER', 'TDS LEDGER'];

const COLS = [
  'Voucher No', 'Voucher Date', 'Party Ledger', 'TDS Ledger',
  'Amount', 'TDS %', 'TDS Amount',
];

export default function TDSReceivableReg() {
  return (
    <MRReportPage
      title="TDS Receivable Reg."
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
