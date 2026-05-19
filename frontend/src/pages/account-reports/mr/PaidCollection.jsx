import React from 'react';
import MRReportPage from './MRReportPage';

const FILTER_OPTS = [
  'MR DATE', 'MR NO', 'PAYMENT MODE', 'PARTYNAME',
  'TRN NO', 'TRN DATE', 'MR BRANCH', 'LR NO', 'LR DATE', 'LR BRANCH',
];

const COLS = [
  'MR No', 'MR Date', 'Party Name', 'LR No', 'LR Date',
  'Payment Mode', 'TRN No', 'TRN Date', 'MR Branch', 'LR Branch',
  'Bill Amt', 'Paid Amt', 'TDS', 'Net Amt',
];

export default function PaidCollection() {
  return <MRReportPage title="Paid Collection" filterOpts={FILTER_OPTS} cols={COLS} />;
}
