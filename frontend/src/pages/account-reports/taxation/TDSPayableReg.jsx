import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['DATE', 'DEDUCTEE NAME', 'TDS ACCOUNT'];

const COLS = [
  'Voucher No', 'Date', 'Deductee Name', 'TDS Account',
  'Amount', 'TDS %', 'TDS Amount',
];

export default function TDSPayableReg() {
  return (
    <MRReportPage
      title="TDS Payable Reg."
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
