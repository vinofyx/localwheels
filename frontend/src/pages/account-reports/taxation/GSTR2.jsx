import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['BILL DATE', 'SUPPLIER NAME'];

const COLS = [
  'Bill No', 'Bill Date', 'Supplier Name', 'GSTIN',
  'Taxable Amt', 'IGST', 'CGST', 'SGST', 'Total Amt',
];

export default function GSTR2() {
  return (
    <MRReportPage
      title="GSTR-2"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={false}
    />
  );
}
