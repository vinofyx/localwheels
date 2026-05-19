import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['MR DATE', 'PARTY NAME', 'BILL DATE'];

const COLS = [
  'MR No', 'MR Date', 'Party Name', 'Bill No', 'Bill Date',
  'Amount', 'TDS %', 'TDS Amount',
];

export default function TDSRegBillwise() {
  return (
    <MRReportPage
      title="TDS Reg.(Billwise)"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
