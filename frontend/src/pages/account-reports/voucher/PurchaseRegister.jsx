import React from 'react';
import MRReportPage from '../mr/MRReportPage';

const FILTER_OPTS = ['ENTRY DATE', 'VOUCHER NO', 'VENDOR', 'BRANCH'];

const COLS = [
  'Voucher No', 'Voucher Date', 'Vendor', 'Bill No', 'Bill Date',
  'Amount', 'IGST', 'CGST', 'SGST', 'Net Amount',
];

export default function PurchaseRegister() {
  return (
    <MRReportPage
      title="Purchase Register"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
