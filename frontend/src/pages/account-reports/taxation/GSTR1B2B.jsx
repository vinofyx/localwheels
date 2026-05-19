import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['BILL DATE', 'PARTY NAME'];

const COLS = [
  'Bill No', 'Bill Date', 'Party Name', 'GSTIN',
  'Taxable Amt', 'IGST', 'CGST', 'SGST', 'Total Amt',
];

export default function GSTR1B2B() {
  return (
    <MRReportPage
      title="GSTR-1(B2B)"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={false}
    />
  );
}
