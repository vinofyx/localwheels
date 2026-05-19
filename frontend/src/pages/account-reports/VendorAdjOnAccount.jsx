import React from 'react';
import MRReportPage from './mr/MRReportPage';

const FILTER_OPTS = ['Vendor Name'];

const COLS = [
  'Entry No', 'Entry Date', 'Vendor Name', 'Branch',
  'Amount', 'Adj Amount', 'Balance',
];

export default function VendorAdjOnAccount() {
  return (
    <MRReportPage
      title="Vendor AdjOnAccount"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
