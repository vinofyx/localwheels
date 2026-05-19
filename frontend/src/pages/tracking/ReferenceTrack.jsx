import React from 'react';
import MRReportPage from '../account-reports/mr/MRReportPage';

const FILTER_OPTS = ['REFERENCE', 'LEDGER', 'VCH DATE', 'VHC NO', 'BRANCH'];

const COLS = [
  'Reference', 'Ledger', 'Vch Date', 'Vch No', 'Branch',
  'Debit', 'Credit', 'Narration',
];

export default function ReferenceTrack() {
  return (
    <MRReportPage
      title="Reference Track"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
