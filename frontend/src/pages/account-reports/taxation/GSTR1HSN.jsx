import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['BILL DATE'];

const COLS = [
  'Bill No', 'Bill Date', 'HSN Code', 'Description',
  'UQC', 'Qty', 'Taxable Amt', 'IGST', 'CGST', 'SGST', 'Total Amt',
];

export default function GSTR1HSN() {
  return (
    <MRReportPage
      title="GSTR-1(HSN)"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={false}
    />
  );
}
