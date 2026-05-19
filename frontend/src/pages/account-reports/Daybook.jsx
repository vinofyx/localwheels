import React from 'react';
import MRReportPage from './mr/MRReportPage';

const FILTER_OPTS = ['VOUCHERDATE', 'VOUCHERTYPE', 'REMARK', 'LEDGERNAME', 'TRN NO', 'BRANCH'];

const COLS = [
  'Voucher No', 'Voucher Date', 'Voucher Type', 'Ledger',
  'Debit', 'Credit', 'TRN No', 'Branch', 'Remark',
];

export default function Daybook() {
  return (
    <MRReportPage
      title="Daybook"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
