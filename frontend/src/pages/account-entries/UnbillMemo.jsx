import React from 'react';
import MRReportPage from '../account-reports/mr/MRReportPage';

// Single-value search — DOC DATE is a date filter, rest are text lookups
const FILTER_OPTS = ['DOC NO', 'DOC DATE', 'VENDOR NAME', 'VEHICLE NO', 'DOC TYPE'];

const COLS = [
  'Doc No', 'Doc Date', 'Doc Type', 'Vendor Name',
  'Vehicle No', 'From', 'To', 'Memo No', 'Memo Date',
  'Freight Amt', 'Extra Charges', 'Total Amt',
];

export default function UnbillMemo() {
  return (
    <MRReportPage
      title="Unbill Memo"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
