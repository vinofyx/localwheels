import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatWidget from './ChatWidget';

// ─── Exact nav structure from JSON config ─────────────────────────────────────
const NAV_MENUS = [
  {
    name: 'Master',
    children: [
      {
        name: 'Operational',
        children: [
          {
                name: 'Location',
                children: [
                  { name: 'Division', path: '/master/location/division' },
                  { name: 'Zone', path: '/master/location/zone' },
                  { name: 'Region', path: '/master/location/region' },
                  { name: 'Branch', path: '/master/location/branch' },
                  { name: 'Location', path: '/master/location/location' },
                  { name: 'State Master', path: '/master/location/state-master' },
                ],
              },
          { name: 'Party (customer)',         path: '/master/customer' },
          { name: 'Vendor/agent',            path: '/master/vendor' },
          {
                name: 'Vehicle Master',
                children: [
                  { name: 'Vehicle', path: '/master/vehicle/vehicle' },
                  { name: 'Load Type', path: '/master/vehicle/load-type' },
                  { name: 'RTO/Insurance Document', path: '/master/vehicle/rto-insurance' },
                  { name: 'Document Master', path: '/master/vehicle/document-master' },
                ],
              },
          { name: 'Package Type',            path: '/master/package-type' },
          { name: 'MaterialDescription',     path: '/master/material' },
          {
                name: 'Charge Master',
                children: [
                  { name: 'Expense Charges', path: '/master/charge/expense' },
                  { name: 'Sales Charges', path: '/master/charge/sales' },
                ],
              },
          {
                name: 'Driver',
                children: [
                  { name: 'Driver Master', path: '/master/driver/master' },
                  { name: 'Driver Mapping', path: '/master/driver/mapping' },
                ],
              },
          { name: 'Reason Master',           path: '/master/reason' },
          { name: 'LR Master',              path: '/master/lr' },
          {
                name: 'Contract',
                children: [
                  { name: 'Customer Contract', path: '/master/contract/customer' },
                  { name: 'Vendor Contract', path: '/master/contract/vendor' },
                ],
              },
          {
                name: 'Route',
                children: [
                  { name: 'Route Master', path: '/master/route/master' },
                  { name: 'Route Expenses', path: '/master/route/expenses' },
                  { name: 'Diesel Rate', path: '/master/route/diesel-rate' },
                ],
              },
          { name: 'StationaryAllocation',   path: '/master/stationary' },
          { name: 'Partylinktosuperparty',  path: '/master/party-link' },
          { name: 'Transit Mode',           path: '/master/transit-mode' },
          {
                name: 'TAT',
                children: [
                  { name: 'TAT Master', path: '/master/tat/master' },
                  { name: 'TAT Calculate', path: '/master/tat/calculate' },
                  { name: 'Leave/Holiday', path: '/master/tat/leave-holiday' },
                ],
              },
        ],
      },
      {
        name: 'Account',
        children: [
          { name: 'Group',           path: '/accounts/group' },
          { name: 'Ledger',          path: '/accounts/ledger' },
          { name: 'Opening Bills',   path: '/accounts/opening-bills' },
          { name: 'BankRecoOpening', path: '/accounts/bank-reco-opening' },
          { name: 'Opening Memos',   path: '/accounts/opening-memos' },
          { name: 'Cost Center',     path: '/accounts/cost-center' },
          { name: 'Cost Category',   path: '/accounts/cost-category' },
        ],
      },
    ],
  },
  {
    name: 'Daily Entries',
    children: [
      {
        name: 'Lorry Receipt(LR)',
        children: [
          { name: 'ReBooking', path: '/entries/lr/rebooking' },
        ],
      },
      {
        name: 'Memo(Manifest)',
        children: [
          { name: 'Memo(Manifest)',    path: '/entries/memo' },
          { name: 'Loading Sheet',     path: '/entries/loading-sheet' },
          { name: 'LHS',              path: '/entries/lhs' },
          { name: 'Touching LR',      path: '/entries/touching-lr' },
          {
            name: 'Link LoadingSheet',
            children: [
              { name: 'Link MEMO', path: '/entries/link-memo' },
              { name: 'Link LDM',  path: '/entries/link-ldm' },
              { name: 'Link LCM',  path: '/entries/link-lcm' },
            ],
          },
          { name: 'Vehicle In/Out',   path: '/entries/vehicle-in-out' },
        ],
      },
      {
        name: 'Company Fleet',
        children: [
          { name: 'ExtraAdvance/Diesel',  path: '/entries/extra-advance-diesel' },
          { name: 'Trip Settlement',      path: '/entries/trip-settlement' },
          { name: 'MarketLoad(Memo)',     path: '/entries/market-load-memo' },
          { name: 'MarketLoad(Balance)',  path: '/entries/market-load-balance' },
          { name: 'FasTag Import',        path: '/entries/fastag-import' },
          { name: 'Diesel Import',        path: '/entries/diesel-import' },
          {
            name: 'Reports',
            children: [
              { name: 'Settled-Trip',         path: '/entries/fleet-settled-trip' },
              { name: 'Non-Settled Trip',      path: '/entries/fleet-non-settled-trip' },
              { name: 'TripNotLinkToDiesel',   path: '/entries/fleet-trip-not-link-diesel' },
              { name: 'Tripsheet Summary',     path: '/entries/fleet-tripsheet-summary' },
              { name: 'ML_Oustanding',         path: '/entries/fleet-ml-outstanding' },
              { name: 'MarketLoad Register',   path: '/entries/fleet-ml-register' },
              { name: 'Route Expenses',        path: '/entries/fleet-route-expenses' },
            ],
          },
        ],
      },
      { name: 'VehicleArrival(VAR)', path: '/entries/var' },
      { name: 'Delivery', path: '/entries/delivery' },
      { name: 'POD', children: [
          { name: 'POD Submit',        path: '/entries/pod-submit' },
          { name: 'POD Send(Branch)',  path: '/entries/pod-send-branch' },
          { name: 'POD Received',      path: '/entries/pod-received' },
          { name: 'Upload POD',        path: '/entries/pod-upload' },
          { name: 'Download_Multi_POD',path: '/entries/pod-download-multi' },
          { name: 'PODSend(Customer)', path: '/entries/pod-send-customer' },
        ] },
      { name: 'Billing', children: [
          { name: 'Billing(against LR)',  path: '/entries/billing-against-lr' },
          { name: 'Billing(without LR)', path: '/entries/billing-without-lr' },
          { name: 'Bill Submission',      path: '/entries/bill-submission' },
          { name: 'Unbilled CheckList',   path: '/entries/unbilled-checklist' },
        ] },
      { name: 'LCM', path: '/entries/lcm' },
      { name: 'LDM/DRS', children: [
          { name: 'LDM/DRS',             path: '/entries/ldm-drs' },
          { name: 'LDM/DRS Settlement',  path: '/entries/ldm-drs-settlement' },
        ] },
      { name: 'Order/Pickup Req.', children: [
          { name: 'Order/Pickup Req.', path: '/entries/pickup' },
          { name: 'Verify Order',      path: '/entries/verify-order' },
          { name: 'Route Planning',    path: '/entries/route-planning' },
          { name: 'Vehicle Assign',    path: '/entries/vehicle-assign' },
          { name: 'Report', children: [
              { name: 'Order Register', path: '/entries/order-register' },
            ] },
        ] },
      { name: 'Printing', children: [
          { name: 'Sticker(Thermal)', path: '/entries/sticker-thermal' },
        ] },
      { name: 'E-Way Bill', children: [
          { name: 'Extend/Import E-waybill',    path: '/entries/eway-extend-import' },
          { name: 'Update/Search E-waybill',    path: '/entries/eway-update-search' },
          { name: 'Link E-WayBill AgainstLR',   path: '/entries/eway-link-against-lr' },
          { name: 'Pending Part-B EWB',         path: '/entries/eway-pending-part-b' },
          { name: 'ExtendedEwayReport',         path: '/entries/eway-extended-report' },
          { name: 'E-Way Bill Report',          path: '/entries/eway-report' },
        ] },
      { name: 'Hold/Lost/Dmage', children: [
          { name: 'Hold/Lost/Damage', path: '/entries/hold-lost-damage' },
          { name: 'DownloadDamage',   path: '/entries/download-damage' },
        ] },
      { name: 'CN Settlement', path: '/entries/settlement' },
      { name: 'CN Delay Remark', path: '/entries/delay' },
      { name: 'Cancel Document', path: '/entries/cancel' },
      { name: 'Customer Appointment', children: [
          { name: 'Customer Appointment',        path: '/entries/appointment' },
          { name: 'Customer Appointment Report', path: '/entries/appointment-report' },
        ] },
    ],
  },
  {
    name: 'Modify/Print',
    children: [
      { name: 'LR', path: '/modify/lr' },
      { name: 'Memo(Manifest)', path: '/modify/memo' },
      { name: 'Bill With LR', path: '/modify/bill-with-lr' },
      { name: 'Bill Without LR', path: '/modify/bill-without-lr' },
      { name: 'MR', path: '/modify/mr' },
      { name: 'LDM/DRS', path: '/modify/ldm-drs' },
      { name: 'LR (Any Branch)', path: '/modify/lr-any-branch' },
      { name: 'MR (Any Branch)', path: '/modify/mr-any-branch' },
      { name: 'MEMO(Any)', path: '/modify/memo-any' },
      { name: 'LCM/LOC(Any)', path: '/modify/lcm-loc-any' },
      { name: 'LDM/DRS(Any)', path: '/modify/ldm-drs-any' },
      { name: 'BillWithLR(Any)', path: '/modify/bill-with-lr-any' },
      { name: 'BillWithoutLR(Any)', path: '/modify/bill-without-lr-any' },
      { name: 'LHS', path: '/modify/lhs' },
      { name: 'LHS(Any Branch)', path: '/modify/lhs-any-branch' },
      { name: 'BranchVoucher(ANY)', path: '/modify/branch-voucher-any' },
      { name: 'LR Expenses(Any)', path: '/modify/lr-expenses-any' },
    ],
  },
  {
    name: 'Reports',
    children: [
      { name: 'Master Reports', children: [
          { name: 'Location Master',       path: '/reports/master/location' },
          { name: 'Branch Master',         path: '/reports/master/branch' },
          { name: 'Customer Master',       path: '/reports/master/customer' },
          { name: 'Vendor Master',         path: '/reports/master/vendor' },
          { name: 'Driver Master',         path: '/reports/master/driver' },
          { name: 'Vehicle Master',        path: '/reports/master/vehicle' },
          { name: 'Load Type',             path: '/reports/master/load-type' },
          { name: 'Income Charges',        path: '/reports/master/income-charges' },
          { name: 'Expences Charges',      path: '/reports/master/expense-charges' },
          { name: 'Ledger Master',         path: '/reports/master/ledger' },
          { name: 'Group Master',          path: '/reports/master/group' },
          { name: 'Stationary Allocation', path: '/reports/master/stationary' },
          { name: 'Customer Contract',     path: '/reports/master/customer-contract' },
          { name: 'Vendor Contract',       path: '/reports/master/vendor-contract' },
          { name: 'Opening Bills',         path: '/reports/master/opening-bills' },
        ] },
      { name: 'LR Reports', children: [
          { name: 'Booking Register(HO)',           path: '/reports/lr/booking-ho' },
          { name: 'Booking Register(Branch)',        path: '/reports/lr/booking-branch' },
          { name: 'Customer MIS',                   path: '/reports/lr/customer-mis' },
          { name: 'Daily Branch Inward/Outward',    path: '/reports/lr/daily-inward-outward' },
          { name: 'LR Cancel Register',             path: '/reports/lr/cancel-register' },
          { name: 'Zero Freight LRs',               path: '/reports/lr/zero-freight' },
          { name: 'Paid Register',                  path: '/reports/lr/paid-register' },
          { name: 'Topay Register',                 path: '/reports/lr/topay-register' },
          { name: 'CN Current Status',              path: '/reports/lr/cn-status' },
        ] },
      { name: 'Memo Reports', children: [
          { name: 'Memo Pending LR',   path: '/reports/memo/pending-lr' },
          { name: 'Memo Summary',      path: '/reports/memo/summary' },
          { name: 'Memo Register',     path: '/reports/memo/register' },
          { name: 'Zero_Freight MEMO', path: '/reports/memo/zero-freight' },
        ] },
      { name: 'LHS Report', children: [
          { name: 'LHS Summary',  path: '/reports/lhs/summary' },
          { name: 'LHS Pending',  path: '/reports/lhs/pending' },
          { name: 'LHS Register', path: '/reports/lhs/register' },
        ] },
      { name: 'Delivery/Ack Report', path: '/reports/delivery-ack' },
      { name: 'Stock Report', children: [
          { name: 'Stock Dashborad',        path: '/reports/stock/dashboard' },
          { name: 'Short/Excess Reg',       path: '/reports/stock/short-excess' },
          { name: 'Godown Stock',           path: '/reports/stock/godown' },
          { name: 'Godown Stock(Grid)',      path: '/reports/stock/godown-grid' },
          { name: 'Partially Dispach Stock', path: '/reports/stock/partial-dispatch' },
        ] },
      { name: 'POD Reports', children: [
          { name: 'Non Submit POD',    path: '/reports/pod/non-submit' },
          { name: 'Non Send POD',      path: '/reports/pod/non-send' },
          { name: 'Non Received POD',  path: '/reports/pod/non-received' },
          { name: 'VendorWisePOD',     path: '/reports/pod/vendor-wise' },
          { name: 'POD Send Register', path: '/reports/pod/send-register' },
          { name: 'POD Received Reg.', path: '/reports/pod/received-register' },
          { name: 'POD Register',      path: '/reports/pod/register' },
          { name: 'Non Uploaded POD',  path: '/reports/pod/non-uploaded' },
        ] },
      { name: 'VAR Reports', children: [
          { name: 'Inward Pending',  path: '/reports/var/inward-pending' },
          { name: 'Inward Register', path: '/reports/var/inward-register' },
          { name: 'Inward Summary',  path: '/reports/var/inward-summary' },
        ] },
      { name: 'Bill Reports', children: [
          { name: 'Unbilled_LR(PartyWise)', path: '/reports/bill/unbilled-party' },
          { name: 'Unbilled_LR',            path: '/reports/bill/unbilled' },
          { name: 'Bill Summary',           path: '/reports/bill/summary' },
          { name: 'BillLR Register',        path: '/reports/bill/lr-register' },
          { name: 'Bill Submission',        path: '/reports/bill/submission' },
          { name: 'Submission Pending',     path: '/reports/bill/submission-pending' },
          { name: 'Billing LR Details',     path: '/reports/bill/lr-details' },
        ] },
      { name: 'LCM Reports', children: [
          { name: 'LCM Summary',     path: '/reports/lcm/summary' },
          { name: 'LCM Register',    path: '/reports/lcm/register' },
          { name: 'LCM Pending LR',  path: '/reports/lcm/pending-lr' },
          { name: 'Zero_Freight LCM', path: '/reports/lcm/zero-freight' },
        ] },
      { name: 'LDM/DRS Reports', children: [
          { name: 'LDM/DRS Summary',         path: '/reports/ldm-drs/summary' },
          { name: 'LDM/DRS Register',        path: '/reports/ldm-drs/register' },
          { name: 'LDM/DRS Pending LR',      path: '/reports/ldm-drs/pending-lr' },
          { name: 'Zero_Freight LDM',         path: '/reports/ldm-drs/zero-freight' },
          { name: 'Delivery Pending LDM/DRS', path: '/reports/ldm-drs/delivery-pending' },
        ] },
      { name: 'Missing Document',    path: '/reports/missing-document' },
      { name: 'Diesel Statement',    path: '/reports/diesel-statement' },
      { name: 'FasTag Statement',    path: '/reports/fastag-statement' },
    ],
  },
  {
    name: 'MIS',
    children: [
      { name: 'Party Outstanding', children: [
          { name: 'Bill O/S',           path: '/mis/party-outstanding/bill-os' },
          { name: 'Bill/Unbill',        path: '/mis/party-outstanding/bill-unbill' },
          { name: 'Overduebills',       path: '/mis/party-outstanding/overdue-bills' },
          { name: 'ToPay O/S(Grid)',    path: '/mis/party-outstanding/to-pay-os-grid' },
          { name: 'Paid O/S(Grid)',     path: '/mis/party-outstanding/paid-os-grid' },
        ] },
      { name: 'Hire Vehicle O/S', children: [
          { name: 'Memo Wise O/S',      path: '/mis/hire-vehicle-os/memo-wise-os' },
          { name: 'Vendor Outstanding', path: '/mis/hire-vehicle-os/vendor-outstanding' },
        ] },
      { name: 'Profitability', children: [
          { name: 'LR Profitability',    path: '/mis/profitability/lr-profitability' },
          { name: 'Trip wise Profit',    path: '/mis/profitability/trip-wise-profit' },
          { name: 'Vehicle Profitablity', path: '/mis/profitability/vehicle-profitability' },
        ] },
      { name: 'Tracking MIS',        path: '/mis/tracking-mis' },
      { name: 'Dashboard', children: [
          { name: 'MIS Dashboard',                 path: '/mis/dashboard/mis-dashboard' },
          { name: 'TAT Analysis (Transit Shipment)', path: '/mis/dashboard/tat-analysis' },
        ] },
      { name: 'Transaction History', path: '/mis/transaction-history' },
      { name: 'Branch Pendency',     path: '/mis/branch-pendency' },
      { name: 'BranchPerformance',   path: '/mis/branch-performance' },
      { name: 'BranchSale(Monthly)', path: '/mis/branch-sale-monthly' },
      { name: 'PartySale(Monthly)',  path: '/mis/party-sale-monthly' },
      { name: 'LR_Transit(Summary)', path: '/mis/lr-transit-summary' },
      { name: 'Account Analysis',    path: '/mis/account-analysis' },
    ],
  },
  {
    name: 'Account Entries',
    children: [
      { name: 'Branch Voucher', path: '/account-entries/branch-voucher' },
      { name: 'HireVehiclePayment', path: '/account-entries/hire-vehicle-payment' },
      { name: 'MoneyReceipt(MR)', path: '/account-entries/money-receipt-mr' },
      { name: 'CustomerCr/DrNote', path: '/account-entries/customer-cr-dr-note' },
      { name: 'MEMO Expences', path: '/account-entries/memo-expenses' },
      { name: 'LR Expences', path: '/account-entries/lr-expenses' },
      { name: 'Vendor Bill', children: [
          { name: 'Vendor/SupplierBill',  path: '/account-entries/vendor-bill' },
          { name: 'VendorBill Payment',   path: '/account-entries/vendor-bill-payment' },
          { name: 'VendorCR/DRNote',      path: '/account-entries/vendor-cr-dr-note' },
          { name: 'Unbill Memo',          path: '/account-entries/unbill-memo' },
        ] },
      { name: 'Voucher Entry', path: '/account-entries/voucher-entry' },
      { name: 'BankReconciliation', path: '/account-entries/bank-reconciliation' },
    ],
  },
  {
    name: 'Account Reports',
    children: [
      { name: 'Account Statement', path: '/account-reports/account-statement' },
      { name: 'Br.Cash/BankBook', path: '/account-reports/br-cash-bank-book' },
      { name: 'Register', children: [
          { name: 'MR Reports', children: [
              { name: 'MR Summary',      path: '/account-reports/mr/summary' },
              { name: 'Bill Collection', path: '/account-reports/mr/bill-collection' },
              { name: 'Paid Collection', path: '/account-reports/mr/paid-collection' },
              { name: 'Topay Collection',path: '/account-reports/mr/topay-collection' },
              { name: 'Bill Pending MR', path: '/account-reports/mr/bill-pending-mr' },
            ] },
          { name: 'HireVeh_Pay_Reports', children: [
              { name: 'Payment Summary', path: '/account-reports/hire-veh/payment-summary' },
              { name: 'Payment Details', path: '/account-reports/hire-veh/payment-details' },
            ] },
          { name: 'Cust_Cr/Dr_Note_Reg',  path: '/account-reports/cust-cr-dr-note-reg' },
          { name: 'Opening_Reference',     path: '/account-reports/opening-reference' },
          { name: 'Memo_Expenses_Reg',     path: '/account-reports/memo-expenses-reg' },
          { name: 'LR_Expenses_Reg',       path: '/account-reports/lr-expenses-reg' },
          { name: 'Supplier_Bill_Reg',     path: '/account-reports/supplier-bill-reg' },
          { name: 'Billwise_Deduct_Reg',   path: '/account-reports/billwise-deduct-reg' },
          { name: 'LRwise_Deduct_Reg',     path: '/account-reports/lrwise-deduct-reg' },
        ] },
      { name: 'Voucher Register', children: [
          { name: 'Sales Register',      path: '/account-reports/voucher/sales-register' },
          { name: 'Register Receipt',    path: '/account-reports/voucher/register-receipt' },
          { name: 'Payment Register',    path: '/account-reports/voucher/payment-register' },
          { name: 'Purchase Register',   path: '/account-reports/voucher/purchase-register' },
          { name: 'Journal Register',    path: '/account-reports/voucher/journal-register' },
          { name: 'Contra Register',     path: '/account-reports/voucher/contra-register' },
          { name: 'CreditNote Register', path: '/account-reports/voucher/credit-note-register' },
          { name: 'DebitNote Register',  path: '/account-reports/voucher/debit-note-register' },
        ] },
      { name: 'Daybook', path: '/account-reports/daybook' },
      { name: 'Auditors Report', children: [
          { name: 'Income Register',   path: '/account-reports/auditors/income-register' },
          { name: 'Expenses Register', path: '/account-reports/auditors/expenses-register' },
        ] },
      { name: 'O/S Report', path: '/account-reports/os-report' },
      { name: 'Final Books', children: [
          { name: 'Trail Balance',   path: '/account-reports/final-books/trail-balance' },
          { name: 'Profit And Loss', path: '/account-reports/final-books/profit-and-loss' },
          { name: 'Balance Sheet',   path: '/account-reports/final-books/balance-sheet' },
        ] },
      { name: 'Taxation Report', children: [
          { name: 'TDS Receivable', children: [
              { name: 'TDS Receivable Reg.', path: '/account-reports/taxation/tds-receivable-reg' },
              { name: 'TDS Reg.(Billwise)',  path: '/account-reports/taxation/tds-reg-billwise' },
            ] },
          { name: 'TDS Payable', children: [
              { name: 'TDS Payable Reg.', path: '/account-reports/taxation/tds-payable-reg' },
            ] },
          { name: 'GSTR-1',       path: '/account-reports/taxation/gstr-1' },
          { name: 'GSTR-2',       path: '/account-reports/taxation/gstr-2' },
          { name: 'GSTR1 Return', path: '/account-reports/taxation/gstr1-return' },
          { name: 'GSTR-1(B2B)', path: '/account-reports/taxation/gstr-1-b2b' },
          { name: 'GSTR-1(HSN)', path: '/account-reports/taxation/gstr-1-hsn' },
        ] },
      { name: 'Customer OnAccount', path: '/account-reports/customer-on-account' },
      { name: 'Vendor AdjOnAccount', path: '/account-reports/vendor-adj-on-account' },
    ],
  },
  {
    name: 'Tracking',
    children: [
      { name: 'LR Tracking', children: [
          { name: 'LR Tracking',       path: '/tracking/lr-tracking' },
          { name: 'Multi-LR Tracking', path: '/tracking/multi-lr-tracking' },
        ] },
      { name: 'LR Enquiry', path: '/tracking/lr-enquiry' },
      { name: 'Memo Enquiry', path: '/tracking/memo-enquiry' },
      { name: 'Bill Enquiry', path: '/tracking/bill-enquiry' },
      { name: 'User Activity', path: '/tracking/user-activity' },
      { name: 'LR Cost Analysis', path: '/tracking/lr-cost-analysis' },
      { name: 'Reference Track', path: '/tracking/reference-track' },
      { name: 'Veh.Current Status', path: '/tracking/veh-current-status' },
    ],
  },
  {
    name: 'Switch',
    children: [
      { name: 'Branch', path: '/switch/branch' },
      { name: 'Fin.year', path: '/switch/fin-year' },
    ],
  },
  {
    name: 'Config',
    children: [
      { name: 'User Creation', path: '/config/user-creation' },
      { name: 'Level Master', path: '/config/level-master' },
      { name: 'User Interface', path: '/config/user-interface' },
      { name: 'Document Deletion', path: '/config/document-deletion' },
      { name: 'Upload Document', path: '/config/upload-document' },
      { name: 'Backup', path: '/config/backup' },
      { name: 'Voucher Mismatch', path: '/config/voucher-mismatch' },
      { name: 'Mobile/CRM Login', path: '/config/mobile-crm-login' },
      { name: 'User Remote Access', path: '/config/user-remote-access' },
      { name: 'DayEnd', path: '/config/dayend' },
      { name: 'Import Utility', path: '/config/import-utility' },
      { name: 'Customer', children: [
          { name: 'Customer Configuration', path: '/config/customer' },
          { name: 'Auto Mail Setting',      path: '/config/auto-mail-setting' },
          { name: 'Complaint Register',     path: '/config/complaint-register' },
        ] },
    ],
  },
];

// ─── Financial year helper ────────────────────────────────────────────────────
function getFinancialYear() {
  const d = new Date();
  const y = d.getFullYear();
  return d.getMonth() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

// ─── Desktop: leaf / flyout menu item ────────────────────────────────────────
function MenuItem({ item, depth = 0 }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!item.children) {
    return (
      <button
        className="w-full text-left px-4 py-1.5 text-sm text-white hover:bg-white/20 whitespace-nowrap block"
        onClick={() => { if (item.path && item.path !== '#') navigate(item.path); }}
      >
        {item.name}
      </button>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="w-full text-left flex items-center justify-between px-4 py-1.5 text-sm text-white hover:bg-white/20 whitespace-nowrap gap-6">
        <span>{item.name}</span>
        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-full top-0 z-[999] bg-[#0b8fd3] shadow-2xl min-w-[220px]">
          {item.children.map(child => (
            <MenuItem key={child.name} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Desktop: top-level nav item ─────────────────────────────────────────────
function TopNavItem({ menu }) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setAlignRight(rect.left > window.innerWidth * 0.55);
  }, []);

  return (
    <div
      ref={ref}
      className="relative flex-shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => {
          if (!menu.children && menu.path) navigate(menu.path);
          else setOpen(!open);
        }}
        className={`flex items-center gap-0.5 px-2 py-[9px] text-white text-[13px] font-medium transition-colors whitespace-nowrap ${open ? 'bg-white/25' : 'hover:bg-white/20'}`}
      >
        {menu.name}
        {menu.children && (
          <svg className="w-3 h-3 ml-0.5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && menu.children && (
        <div className={`absolute top-full z-[999] bg-[#0b8fd3] shadow-2xl min-w-[160px] ${alignRight ? 'right-0' : 'left-0'}`}>
          {menu.children.map(item => (
            <MenuItem key={item.name} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mobile: accordion menu item (used in drawer) ────────────────────────────
function MobileMenuItem({ item, depth = 0, onClose }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pl = 16 + depth * 14;

  if (!item.children) {
    return (
      <button
        className="w-full text-left py-3 pr-4 text-[14px] text-white hover:bg-white/20 active:bg-white/30 border-b border-white/10 flex items-center"
        style={{ paddingLeft: `${pl}px` }}
        onClick={() => { if (item.path) { navigate(item.path); onClose(); } }}
      >
        {item.name}
      </button>
    );
  }

  return (
    <div>
      <button
        className="w-full text-left py-3 pr-4 text-[14px] text-white hover:bg-white/20 active:bg-white/30 border-b border-white/10 flex items-center justify-between"
        style={{ paddingLeft: `${pl}px` }}
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-medium">{item.name}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="bg-black/10">
          {item.children.map(child => (
            <MobileMenuItem key={child.name} item={child} depth={depth + 1} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout() {
  const { user, branch, logout } = useAuth();
  const navigate = useNavigate();
  const [trackType, setTrackType] = useState('LR NO');
  const [trackVal, setTrackVal] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fy = getFinancialYear();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [navigate]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  function handleTrack(e) {
    e.preventDefault();
    if (trackVal.trim()) navigate(`/track?lr=${encodeURIComponent(trackVal.trim())}`);
  }

  return (
    <div className="min-h-screen w-full bg-[#eaf0fb] flex flex-col text-[13px]">

      {/* ═══ HEADER ══════════════════════════════════════════════════════ */}
      <header className="bg-white border-b border-gray-200 px-3 py-1.5">
        <div className="flex items-center justify-between gap-2">

          {/* Left: Logo + Company */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            <div className="flex-shrink-0 w-12 h-12">
              <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
                <rect width="48" height="48" rx="4" fill="#fff8f0"/>
                <text x="4" y="30" fontSize="11" fontWeight="bold" fill="#e65c00" fontFamily="Arial">LOCAL</text>
                <text x="4" y="42" fontSize="11" fontWeight="bold" fill="#e65c00" fontFamily="Arial">WHEELS</text>
                <path d="M36 18 L44 30 L28 30 Z" fill="#f97316" opacity="0.9"/>
                <circle cx="33" cy="34" r="3" fill="#374151"/>
                <circle cx="41" cy="34" r="3" fill="#374151"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#1a237e] text-[13px] sm:text-[15px] leading-tight uppercase tracking-wide truncate">
                Local Wheels Pvt Ltd
              </p>
              <p className="text-gray-500 text-[10px] sm:text-[11px] font-medium leading-tight">
                Division : Transport Division
              </p>
            </div>
          </div>

          {/* Center: Branch (hidden on mobile) */}
          <div className="text-center flex-shrink-0 hidden sm:block">
            <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest">Branch :</p>
            <p className="text-[#0b6fcc] font-bold text-[13px] uppercase leading-tight">
              {branch?.branch_name || 'Select Branch'}
            </p>
          </div>

          {/* Right: Track By + User + Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Track By — desktop only */}
            <form onSubmit={handleTrack} className="hidden lg:block">
              <p className="text-[10px] font-semibold text-gray-500 text-center mb-0.5">Track By</p>
              <div className="flex gap-1">
                <select
                  value={trackType}
                  onChange={e => setTrackType(e.target.value)}
                  className="border border-gray-300 rounded px-1.5 py-1 text-xs bg-white"
                >
                  <option>LR NO</option>
                  <option>PHONE</option>
                  <option>VEHICLE</option>
                </select>
                <input
                  className="border border-gray-300 rounded px-2 py-1 text-xs w-24"
                  placeholder="Search…"
                  value={trackVal}
                  onChange={e => setTrackVal(e.target.value)}
                />
              </div>
            </form>

            <div className="hidden lg:block w-px h-10 bg-gray-200" />

            {/* User info — hidden on small mobile */}
            <div className="text-right leading-tight hidden sm:block">
              <p className="font-bold text-gray-800 text-[12px] sm:text-[13px]">
                Welcome {(user?.full_name || user?.username || '').split(' ')[0].toUpperCase()}
              </p>
              <p className="text-gray-400 text-[10px]">FY {fy}</p>
            </div>

            {/* User menu button */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded shadow-xl border border-gray-200 min-w-[160px]">
                  {/* Branch info on mobile */}
                  <div className="sm:hidden px-4 py-2 border-b border-gray-100">
                    <p className="text-[11px] text-gray-500">Branch</p>
                    <p className="text-[13px] font-bold text-[#0b6fcc] uppercase">{branch?.branch_name || '—'}</p>
                  </div>
                  <div className="sm:hidden px-4 py-2 border-b border-gray-100">
                    <p className="text-[11px] text-gray-500">Signed in as</p>
                    <p className="text-[13px] font-semibold text-gray-800">{(user?.full_name || user?.username || '').toUpperCase()}</p>
                  </div>
                  <Link to="/users" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Users</Link>
                  <Link to="/select-branch" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Switch Branch</Link>
                  <button onClick={logout} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                </div>
              )}
            </div>

            {/* Hamburger — mobile nav trigger (hidden on md+) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg bg-[#0b8fd3] flex items-center justify-center text-white hover:bg-[#0a7fc0] active:bg-[#0971ab]"
              aria-label="Open navigation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ═══ DESKTOP NAVIGATION BAR (hidden on mobile) ═══════════════════ */}
      <nav className="bg-[#0b8fd3] hidden md:flex items-stretch overflow-visible flex-shrink-0">
        {NAV_MENUS.map(menu => (
          <TopNavItem key={menu.name} menu={menu} />
        ))}
        <div className="ml-auto flex-shrink-0 flex items-center">
          <button className="flex items-center gap-0.5 px-3 py-2 text-white hover:bg-white/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ═══ MOBILE NAV DRAWER ═══════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[1000] md:hidden flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-[#0b8fd3] h-full overflow-hidden shadow-2xl">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0971ab] flex-shrink-0">
              <div>
                <p className="text-white font-bold text-[15px]">LocalWheels</p>
                <p className="text-white/70 text-[11px]">{branch?.branch_name || 'No branch selected'}</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile track search */}
            <div className="px-4 py-2 bg-[#0971ab] flex-shrink-0 border-t border-white/10">
              <form onSubmit={e => { handleTrack(e); setMobileMenuOpen(false); }} className="flex gap-2">
                <select
                  value={trackType}
                  onChange={e => setTrackType(e.target.value)}
                  className="border-0 rounded px-2 py-1.5 text-xs bg-white/20 text-white flex-shrink-0"
                >
                  <option className="text-gray-800">LR NO</option>
                  <option className="text-gray-800">PHONE</option>
                  <option className="text-gray-800">VEHICLE</option>
                </select>
                <input
                  className="flex-1 min-w-0 rounded px-2 py-1.5 text-xs bg-white/20 text-white placeholder-white/60 border-0 focus:outline-none focus:bg-white/30"
                  placeholder="Track shipment…"
                  value={trackVal}
                  onChange={e => setTrackVal(e.target.value)}
                />
                <button type="submit" className="bg-white/20 hover:bg-white/30 text-white px-2 py-1.5 rounded text-xs flex-shrink-0">
                  Go
                </button>
              </form>
            </div>

            {/* Nav items — scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {NAV_MENUS.map(menu => (
                <MobileMenuItem
                  key={menu.name}
                  item={menu}
                  onClose={() => setMobileMenuOpen(false)}
                />
              ))}
            </div>

            {/* Footer actions */}
            <div className="flex-shrink-0 border-t border-white/20 bg-[#0971ab]">
              <Link
                to="/select-branch"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 text-[14px] border-b border-white/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Switch Branch
              </Link>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-white/10 w-full text-[14px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PAGE CONTENT ════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* ═══ AI CHAT WIDGET ══════════════════════════════════════════════ */}
      <ChatWidget />
    </div>
  );
}
