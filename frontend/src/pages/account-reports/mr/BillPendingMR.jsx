import React from 'react';
import MRReportPage from './MRReportPage';

// Bill Pending MR — single-value search (no range), different filter set
const FILTER_OPTS = ['BILLINGPARTY', 'BILL NO', 'BILL DATE'];

const COLS = [
  'Bill No', 'Bill Date', 'Billing Party', 'LR No', 'LR Date',
  'From', 'To', 'Bill Amt', 'Paid Amt', 'Pending Amt',
];

export default function BillPendingMR() {
  return (
    <MRReportPage
      title="Bill Pending MR"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
