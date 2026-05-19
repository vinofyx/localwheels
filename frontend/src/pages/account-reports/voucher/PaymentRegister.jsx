import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['ENTRY DATE', 'PAYMENT NO', 'PARTY', 'BRANCH'];

const COLS = [
  'Payment No', 'Payment Date', 'Paid To', 'Mode',
  'Bank / Cash', 'Amount', 'Narration',
];

export default function PaymentRegister() {
  return (
    <MRReportPage
      title="Payment Register"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
