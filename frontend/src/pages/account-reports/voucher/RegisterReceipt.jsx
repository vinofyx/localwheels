import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['ENTRY DATE', 'RECEIPT NO', 'PARTY', 'BRANCH'];

const COLS = [
  'Receipt No', 'Receipt Date', 'Received From', 'Mode',
  'Ledger', 'Amount', 'Narration',
];

export default function RegisterReceipt() {
  return (
    <MRReportPage
      title="Register Receipt"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
