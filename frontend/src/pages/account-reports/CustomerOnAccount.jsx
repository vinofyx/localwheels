import React from 'react';
import MRReportPage from './mr/MRReportPage';

const FILTER_OPTS = ['Mr No', 'Mr DATE', 'Billing Party'];

const COLS = [
  'MR No', 'MR Date', 'Billing Party', 'Branch',
  'Amount', 'Adj Amount', 'Balance',
];

export default function CustomerOnAccount() {
  return (
    <MRReportPage
      title="Customer OnAccount"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
