import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['VCHDATE', 'BRANCH', 'PERTICULARS'];

const COLS = [
  'Voucher No', 'Voucher Date', 'Party', 'Particulars', 'Amount', 'Narration',
];

export default function DebitNoteRegister() {
  return (
    <MRReportPage
      title="DebitNote Register"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
