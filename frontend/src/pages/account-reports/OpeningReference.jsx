import React from 'react';
import MRReportPage from './mr/MRReportPage';

// Filter: LEDGER NAME, LID, REFERENCE DATE  (single input — no To range)
const FILTER_OPTS = ['LEDGER NAME', 'LID', 'REFERENCE DATE'];

const COLS = [
  'Ledger Name', 'LID', 'Reference Date', 'Reference Type',
  'Reference No', 'Debit', 'Credit', 'Balance',
];

export default function OpeningReference() {
  return (
    <MRReportPage
      title="Opening_Reference"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
