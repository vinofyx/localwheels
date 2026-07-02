import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import BranchSelect from './pages/BranchSelect';
import Layout from './components/Layout';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Shipments = lazy(() => import('./pages/Shipments'));
const CreateShipment = lazy(() => import('./pages/CreateShipment'));
const ShipmentDetail = lazy(() => import('./pages/ShipmentDetail'));
const POD = lazy(() => import('./pages/POD'));
const Payments = lazy(() => import('./pages/Payments'));
const Users = lazy(() => import('./pages/Users'));
const Track = lazy(() => import('./pages/Track'));
const PartyCustomer = lazy(() => import('./pages/master/PartyCustomer'));
const VendorAgent = lazy(() => import('./pages/master/VendorAgent'));
const PackageType = lazy(() => import('./pages/master/PackageType'));
const MaterialDescription = lazy(() => import('./pages/master/MaterialDescription'));
const ReasonMaster = lazy(() => import('./pages/master/ReasonMaster'));
const LRMaster = lazy(() => import('./pages/master/LRMaster'));
const StationaryAllocation = lazy(() => import('./pages/master/StationaryAllocation'));
const PartyLinkToSuperParty = lazy(() => import('./pages/master/PartyLinkToSuperParty'));
const TransitMode = lazy(() => import('./pages/master/TransitMode'));
const AccountsCostCenter = lazy(() => import('./pages/accounts/CostCenter'));
const Ledger = lazy(() => import('./pages/accounts/Ledger'));
const Group = lazy(() => import('./pages/accounts/Group'));
const OpeningBills = lazy(() => import('./pages/accounts/OpeningBills'));
const BankRecoOpening = lazy(() => import('./pages/accounts/BankRecoOpening'));
const OpeningMemos = lazy(() => import('./pages/accounts/OpeningMemos'));
const CostCategory = lazy(() => import('./pages/accounts/CostCategory'));
const Division = lazy(() => import('./pages/master/location/Division'));
const Zone = lazy(() => import('./pages/master/location/Zone'));
const Region = lazy(() => import('./pages/master/location/Region'));
const Branch = lazy(() => import('./pages/master/location/Branch'));
const Location = lazy(() => import('./pages/master/location/Location'));
const StateMaster = lazy(() => import('./pages/master/location/StateMaster'));
const Vehicle = lazy(() => import('./pages/master/vehicle/Vehicle'));
const LoadType = lazy(() => import('./pages/master/vehicle/LoadType'));
const RTOInsurance = lazy(() => import('./pages/master/vehicle/RTOInsurance'));
const DocumentMaster = lazy(() => import('./pages/master/vehicle/DocumentMaster'));
const ExpenseCharges = lazy(() => import('./pages/master/charge/ExpenseCharges'));
const SalesCharges = lazy(() => import('./pages/master/charge/SalesCharges'));
const DriverMaster = lazy(() => import('./pages/master/driver/DriverMaster'));
const DriverMapping = lazy(() => import('./pages/master/driver/DriverMapping'));
const CustomerContract = lazy(() => import('./pages/master/contract/CustomerContract'));
const VendorContract = lazy(() => import('./pages/master/contract/VendorContract'));
const RouteMaster = lazy(() => import('./pages/master/route/RouteMaster'));
const RouteExpenses = lazy(() => import('./pages/master/RouteExpenses'));
const DieselRate = lazy(() => import('./pages/master/route/DieselRate'));
const TATMaster = lazy(() => import('./pages/master/tat/TATMaster'));
const TATCalculate = lazy(() => import('./pages/master/tat/TATCalculate'));
const LeaveHolidayMaster = lazy(() => import('./pages/master/tat/LeaveHolidayMaster'));
const ReBooking = lazy(() => import('./pages/entries/ReBooking'));
const Memo = lazy(() => import('./pages/entries/Memo'));
const LoadingSheet = lazy(() => import('./pages/entries/LoadingSheet'));
const LHS = lazy(() => import('./pages/entries/LHS'));
const TouchingLR = lazy(() => import('./pages/entries/TouchingLR'));
const LinkMemo = lazy(() => import('./pages/entries/LinkMemo'));
const LinkLDM = lazy(() => import('./pages/entries/LinkLDM'));
const LinkLCM = lazy(() => import('./pages/entries/LinkLCM'));
const VehicleInOut = lazy(() => import('./pages/entries/VehicleInOut'));
const ExtraAdvanceDiesel = lazy(() => import('./pages/entries/ExtraAdvanceDiesel'));
const TripSettlement = lazy(() => import('./pages/entries/TripSettlement'));
const MarketLoadMemo = lazy(() => import('./pages/entries/MarketLoadMemo'));
const MarketLoadBalance = lazy(() => import('./pages/entries/MarketLoadBalance'));
const FasTagImport = lazy(() => import('./pages/entries/FasTagImport'));
const DieselImport = lazy(() => import('./pages/entries/DieselImport'));
const SettledTrip = lazy(() => import('./pages/entries/SettledTrip'));
const NonSettledTrip = lazy(() => import('./pages/entries/NonSettledTrip'));
const TripNotLinkToDiesel = lazy(() => import('./pages/entries/TripNotLinkToDiesel'));
const TripsheetSummary = lazy(() => import('./pages/entries/TripsheetSummary'));
const MLOutstanding = lazy(() => import('./pages/entries/MLOutstanding'));
const MarketLoadRegister = lazy(() => import('./pages/entries/MarketLoadRegister'));
const FleetRouteExpenses = lazy(() => import('./pages/entries/RouteExpenses'));
const VehicleArrival = lazy(() => import('./pages/entries/VehicleArrival'));
const Delivery = lazy(() => import('./pages/entries/Delivery'));
const PODSubmit = lazy(() => import('./pages/entries/PODSubmit'));
const PODSendBranch = lazy(() => import('./pages/entries/PODSendBranch'));
const PODReceived = lazy(() => import('./pages/entries/PODReceived'));
const UploadPOD = lazy(() => import('./pages/entries/UploadPOD'));
const DownloadMultiPOD = lazy(() => import('./pages/entries/DownloadMultiPOD'));
const PODSendCustomer = lazy(() => import('./pages/entries/PODSendCustomer'));
const BillingAgainstLR = lazy(() => import('./pages/entries/BillingAgainstLR'));
const BillingWithoutLR = lazy(() => import('./pages/entries/BillingWithoutLR'));
const BillSubmission = lazy(() => import('./pages/entries/BillSubmission'));
const UnbilledChecklist = lazy(() => import('./pages/entries/UnbilledChecklist'));
const LCM = lazy(() => import('./pages/entries/LCM'));
const LDMDRS = lazy(() => import('./pages/entries/LDMDRS'));
const LDMDRSSettlement = lazy(() => import('./pages/entries/LDMDRSSettlement'));
const OrderPickupReq = lazy(() => import('./pages/entries/OrderPickupReq'));
const VerifyOrder = lazy(() => import('./pages/entries/VerifyOrder'));
const RoutePlanning = lazy(() => import('./pages/entries/RoutePlanning'));
const VehicleAssign = lazy(() => import('./pages/entries/VehicleAssign'));
const OrderRegister = lazy(() => import('./pages/entries/OrderRegister'));
const StickerThermal = lazy(() => import('./pages/entries/StickerThermal'));
const EwayExtendImport = lazy(() => import('./pages/entries/EwayExtendImport'));
const EwayUpdateSearch = lazy(() => import('./pages/entries/EwayUpdateSearch'));
const EwayLinkAgainstLR = lazy(() => import('./pages/entries/EwayLinkAgainstLR'));
const PendingPartBEWB = lazy(() => import('./pages/entries/PendingPartBEWB'));
const ExtendedEwayReport = lazy(() => import('./pages/entries/ExtendedEwayReport'));
const EwayBillReport = lazy(() => import('./pages/entries/EwayBillReport'));
const HoldLostDamage = lazy(() => import('./pages/entries/HoldLostDamage'));
const DownloadDamage = lazy(() => import('./pages/entries/DownloadDamage'));
const CNSettlement = lazy(() => import('./pages/entries/CNSettlement'));
const CNDelayRemark = lazy(() => import('./pages/entries/CNDelayRemark'));
const CancelDocument = lazy(() => import('./pages/entries/CancelDocument'));
const CustomerAppointment = lazy(() => import('./pages/entries/CustomerAppointment'));
const CustomerAppointmentReport = lazy(() => import('./pages/entries/CustomerAppointmentReport'));
const ModifyLR = lazy(() => import('./pages/modify/ModifyLR'));
const ModifyMemo = lazy(() => import('./pages/modify/ModifyMemo'));
const ModifyBillWithLR = lazy(() => import('./pages/modify/ModifyBillWithLR'));
const ModifyBillWithoutLR = lazy(() => import('./pages/modify/ModifyBillWithoutLR'));
const ModifyMR = lazy(() => import('./pages/modify/ModifyMR'));
const ModifyLDMDRS = lazy(() => import('./pages/modify/ModifyLDMDRS'));
const ModifyLRAnyBranch = lazy(() => import('./pages/modify/ModifyLRAnyBranch'));
const ModifyMRAnyBranch = lazy(() => import('./pages/modify/ModifyMRAnyBranch'));
const ModifyMemoAny = lazy(() => import('./pages/modify/ModifyMemoAny'));
const ModifyLCMLOCAny = lazy(() => import('./pages/modify/ModifyLCMLOCAny'));
const ModifyLDMDRSAny = lazy(() => import('./pages/modify/ModifyLDMDRSAny'));
const ModifyBillWithLRAny = lazy(() => import('./pages/modify/ModifyBillWithLRAny'));
const ModifyBillWithoutLRAny = lazy(() => import('./pages/modify/ModifyBillWithoutLRAny'));
const ModifyLHS = lazy(() => import('./pages/modify/ModifyLHS'));
const ModifyLHSAnyBranch = lazy(() => import('./pages/modify/ModifyLHSAnyBranch'));
const ModifyBranchVoucherAny = lazy(() => import('./pages/modify/ModifyBranchVoucherAny'));
const ModifyLRExpensesAny = lazy(() => import('./pages/modify/ModifyLRExpensesAny'));
const MissingDocument = lazy(() => import('./pages/reports/MissingDocument'));
const LocationMasterReport = lazy(() => import('./pages/reports/master/LocationMaster'));
const BranchMasterReport = lazy(() => import('./pages/reports/master/BranchMaster'));
const CustomerMasterReport = lazy(() => import('./pages/reports/master/CustomerMaster'));
const VendorMasterReport = lazy(() => import('./pages/reports/master/VendorMaster'));
const DriverMasterReport = lazy(() => import('./pages/reports/master/DriverMaster'));
const VehicleMasterReport = lazy(() => import('./pages/reports/master/VehicleMaster'));
const LoadTypeReport = lazy(() => import('./pages/reports/master/LoadType'));
const IncomeChargesReport = lazy(() => import('./pages/reports/master/IncomeCharges'));
const ExpenceChargesReport = lazy(() => import('./pages/reports/master/ExpenceCharges'));
const LedgerMasterReport = lazy(() => import('./pages/reports/master/LedgerMaster'));
const GroupMasterReport = lazy(() => import('./pages/reports/master/GroupMaster'));
const StationaryAllocationReport = lazy(() => import('./pages/reports/master/StationaryAllocation'));
const CustomerContractReport = lazy(() => import('./pages/reports/master/CustomerContract'));
const VendorContractReport = lazy(() => import('./pages/reports/master/VendorContract'));
const OpeningBillsReport = lazy(() => import('./pages/reports/master/OpeningBills'));
const BookingRegisterHO = lazy(() => import('./pages/reports/lr/BookingRegisterHO'));
const BookingRegisterBranch = lazy(() => import('./pages/reports/lr/BookingRegisterBranch'));
const CustomerMIS = lazy(() => import('./pages/reports/lr/CustomerMIS'));
const TrackingMIS = lazy(() => import('./pages/mis/TrackingMIS'));
const TransactionHistory = lazy(() => import('./pages/mis/TransactionHistory'));
const BranchPendency = lazy(() => import('./pages/mis/BranchPendency'));
const BillOS = lazy(() => import('./pages/mis/party-outstanding/BillOS'));
const BillUnbill = lazy(() => import('./pages/mis/party-outstanding/BillUnbill'));
const OverdueBills = lazy(() => import('./pages/mis/party-outstanding/OverdueBills'));
const ToPayOSGrid = lazy(() => import('./pages/mis/party-outstanding/ToPayOSGrid'));
const PaidOSGrid = lazy(() => import('./pages/mis/party-outstanding/PaidOSGrid'));
const MemoWiseOS = lazy(() => import('./pages/mis/hire-vehicle-os/MemoWiseOS'));
const VendorOutstanding = lazy(() => import('./pages/mis/hire-vehicle-os/VendorOutstanding'));
const LRProfitability = lazy(() => import('./pages/mis/profitability/LRProfitability'));
const TripWiseProfit = lazy(() => import('./pages/mis/profitability/TripWiseProfit'));
const VehicleProfitability = lazy(() => import('./pages/mis/profitability/VehicleProfitability'));
const MISDashboard = lazy(() => import('./pages/mis/dashboard/MISDashboard'));
const TATAnalysis = lazy(() => import('./pages/mis/dashboard/TATAnalysis'));
const BranchPerformance = lazy(() => import('./pages/mis/BranchPerformance'));
const BranchSaleMonthly = lazy(() => import('./pages/mis/BranchSaleMonthly'));
const PartySaleMonthly = lazy(() => import('./pages/mis/PartySaleMonthly'));
const LRTransitSummary = lazy(() => import('./pages/mis/LRTransitSummary'));
const AccountAnalysis = lazy(() => import('./pages/mis/AccountAnalysis'));
const BranchVoucher = lazy(() => import('./pages/account-entries/BranchVoucher'));
const HireVehiclePayment = lazy(() => import('./pages/account-entries/HireVehiclePayment'));
const MoneyReceiptMR = lazy(() => import('./pages/account-entries/MoneyReceiptMR'));
const CustomerCrDrNote = lazy(() => import('./pages/account-entries/CustomerCrDrNote'));
const MemoExpenses = lazy(() => import('./pages/account-entries/MemoExpenses'));
const LRExpenses = lazy(() => import('./pages/account-entries/LRExpenses'));
const VendorSupplierBill = lazy(() => import('./pages/account-entries/VendorSupplierBill'));
const VendorBillPayment = lazy(() => import('./pages/account-entries/VendorBillPayment'));
const VendorCrDrNote = lazy(() => import('./pages/account-entries/VendorCrDrNote'));
const UnbillMemo = lazy(() => import('./pages/account-entries/UnbillMemo'));
const VoucherEntry = lazy(() => import('./pages/account-entries/VoucherEntry'));
const BankReconciliation = lazy(() => import('./pages/account-entries/BankReconciliation'));
const AccountStatement = lazy(() => import('./pages/account-reports/AccountStatement'));
const BrCashBankBook = lazy(() => import('./pages/account-reports/BrCashBankBook'));
const MRSummary = lazy(() => import('./pages/account-reports/mr/MRSummary'));
const BillCollection = lazy(() => import('./pages/account-reports/mr/BillCollection'));
const PaidCollection = lazy(() => import('./pages/account-reports/mr/PaidCollection'));
const TopayCollection = lazy(() => import('./pages/account-reports/mr/TopayCollection'));
const BillPendingMR = lazy(() => import('./pages/account-reports/mr/BillPendingMR'));
const PaymentSummary = lazy(() => import('./pages/account-reports/hire-veh/PaymentSummary'));
const PaymentDetails = lazy(() => import('./pages/account-reports/hire-veh/PaymentDetails'));
const CustCrDrNoteReg = lazy(() => import('./pages/account-reports/CustCrDrNoteReg'));
const OpeningReference = lazy(() => import('./pages/account-reports/OpeningReference'));
const MemoExpensesReg = lazy(() => import('./pages/account-reports/MemoExpensesReg'));
const SalesRegister = lazy(() => import('./pages/account-reports/voucher/SalesRegister'));
const RegisterReceipt = lazy(() => import('./pages/account-reports/voucher/RegisterReceipt'));
const PaymentRegister = lazy(() => import('./pages/account-reports/voucher/PaymentRegister'));
const PurchaseRegister = lazy(() => import('./pages/account-reports/voucher/PurchaseRegister'));
const JournalRegister = lazy(() => import('./pages/account-reports/voucher/JournalRegister'));
const ContraRegister = lazy(() => import('./pages/account-reports/voucher/ContraRegister'));
const CreditNoteRegister = lazy(() => import('./pages/account-reports/voucher/CreditNoteRegister'));
const DebitNoteRegister = lazy(() => import('./pages/account-reports/voucher/DebitNoteRegister'));
const Daybook = lazy(() => import('./pages/account-reports/Daybook'));
const IncomeRegister = lazy(() => import('./pages/account-reports/auditors/IncomeRegister'));
const ExpensesRegister = lazy(() => import('./pages/account-reports/auditors/ExpensesRegister'));
const OSReport = lazy(() => import('./pages/account-reports/OSReport'));
const TrailBalance = lazy(() => import('./pages/account-reports/final-books/TrailBalance'));
const ProfitAndLoss = lazy(() => import('./pages/account-reports/final-books/ProfitAndLoss'));
const BalanceSheet = lazy(() => import('./pages/account-reports/final-books/BalanceSheet'));
const TDSReceivableReg = lazy(() => import('./pages/account-reports/taxation/TDSReceivableReg'));
const TDSRegBillwise = lazy(() => import('./pages/account-reports/taxation/TDSRegBillwise'));
const TDSPayableReg = lazy(() => import('./pages/account-reports/taxation/TDSPayableReg'));
const GSTR1 = lazy(() => import('./pages/account-reports/taxation/GSTR1'));
const GSTR2 = lazy(() => import('./pages/account-reports/taxation/GSTR2'));
const GSTR1Return = lazy(() => import('./pages/account-reports/taxation/GSTR1Return'));
const GSTR1B2B = lazy(() => import('./pages/account-reports/taxation/GSTR1B2B'));
const GSTR1HSN = lazy(() => import('./pages/account-reports/taxation/GSTR1HSN'));
const CustomerOnAccount = lazy(() => import('./pages/account-reports/CustomerOnAccount'));
const VendorAdjOnAccount = lazy(() => import('./pages/account-reports/VendorAdjOnAccount'));
const LRTracking = lazy(() => import('./pages/tracking/LRTracking'));
const MultiLRTracking = lazy(() => import('./pages/tracking/MultiLRTracking'));
const LREnquiry = lazy(() => import('./pages/tracking/LREnquiry'));
const MemoEnquiry = lazy(() => import('./pages/tracking/MemoEnquiry'));
const UserActivity = lazy(() => import('./pages/tracking/UserActivity'));
const LRCostAnalysis = lazy(() => import('./pages/tracking/LRCostAnalysis'));
const ReferenceTrack = lazy(() => import('./pages/tracking/ReferenceTrack'));
const VehCurrentStatus = lazy(() => import('./pages/tracking/VehCurrentStatus'));
const SelectFinYear = lazy(() => import('./pages/switch/SelectFinYear'));
const UserCreation = lazy(() => import('./pages/config/UserCreation'));
const LevelMaster = lazy(() => import('./pages/config/LevelMaster'));
const UserInterface = lazy(() => import('./pages/config/UserInterface'));
const DocumentDeletion = lazy(() => import('./pages/config/DocumentDeletion'));
const UploadDocument = lazy(() => import('./pages/config/UploadDocument'));
const Backup = lazy(() => import('./pages/config/Backup'));
const VoucherMismatch = lazy(() => import('./pages/config/VoucherMismatch'));
const MobileCRMLogin = lazy(() => import('./pages/config/MobileCRMLogin'));
const UserRemoteAccess = lazy(() => import('./pages/config/UserRemoteAccess'));
const DayEnd = lazy(() => import('./pages/config/DayEnd'));
const ImportUtility = lazy(() => import('./pages/config/ImportUtility'));
const CustomerConfig = lazy(() => import('./pages/config/CustomerConfig'));
const AutoMailSetting = lazy(() => import('./pages/config/AutoMailSetting'));
const ComplaintRegister = lazy(() => import('./pages/config/ComplaintRegister'));
const DailyBranchInwardOutward = lazy(() => import('./pages/reports/lr/DailyBranchInwardOutward'));
const LRCancelRegister = lazy(() => import('./pages/reports/lr/LRCancelRegister'));
const ZeroFreightLRs = lazy(() => import('./pages/reports/lr/ZeroFreightLRs'));
const PaidRegister = lazy(() => import('./pages/reports/lr/PaidRegister'));
const TopayRegister = lazy(() => import('./pages/reports/lr/TopayRegister'));
const CNCurrentStatus = lazy(() => import('./pages/reports/lr/CNCurrentStatus'));
const MemoPendingLR = lazy(() => import('./pages/reports/memo/MemoPendingLR'));
const MemoSummary = lazy(() => import('./pages/reports/memo/MemoSummary'));
const MemoRegister = lazy(() => import('./pages/reports/memo/MemoRegister'));
const ZeroFreightMemo = lazy(() => import('./pages/reports/memo/ZeroFreightMemo'));
const DieselStatement = lazy(() => import('./pages/reports/DieselStatement'));
const FasTagStatement = lazy(() => import('./pages/reports/FasTagStatement'));
const LHSSummary = lazy(() => import('./pages/reports/lhs/LHSSummary'));
const LHSPending = lazy(() => import('./pages/reports/lhs/LHSPending'));
const LHSRegister = lazy(() => import('./pages/reports/lhs/LHSRegister'));
const StockDashboard = lazy(() => import('./pages/reports/stock/StockDashboard'));
const ShortExcessReg = lazy(() => import('./pages/reports/stock/ShortExcessReg'));
const GodownStock = lazy(() => import('./pages/reports/stock/GodownStock'));
const GodownStockGrid = lazy(() => import('./pages/reports/stock/GodownStockGrid'));
const PartialDispatchStock = lazy(() => import('./pages/reports/stock/PartialDispatchStock'));
const NonSubmitPOD = lazy(() => import('./pages/reports/pod/NonSubmitPOD'));
import UnbilledParty     from './pages/reports/bill/UnbilledParty';
import Unbilled          from './pages/reports/bill/Unbilled';
import BillSummary       from './pages/reports/bill/Summary';
import BillLrRegister    from './pages/reports/bill/LrRegister';
const ReportBillSubmission = lazy(() => import('./pages/reports/bill/Submission'));
const SubmissionPending = lazy(() => import('./pages/reports/bill/SubmissionPending'));
import BillLrDetails     from './pages/reports/bill/LrDetails';
import DeliveryAck       from './pages/reports/DeliveryAck';
import LcmSummary        from './pages/reports/lcm/Summary';
import LcmRegister       from './pages/reports/lcm/Register';
import LcmPendingLR      from './pages/reports/lcm/PendingLR';
import LcmZeroFreight    from './pages/reports/lcm/ZeroFreight';
import LdmDrsSummary     from './pages/reports/ldm-drs/Summary';
import LdmDrsRegister    from './pages/reports/ldm-drs/Register';
import LdmDrsPendingLR   from './pages/reports/ldm-drs/PendingLR';
const LdmDrsZeroFreight = lazy(() => import('./pages/reports/ldm-drs/ZeroFreight'));
import DeliveryPending   from './pages/reports/ldm-drs/DeliveryPending';
import NonSendPOD        from './pages/reports/pod/NonSendPOD';
import NonReceivedPOD    from './pages/reports/pod/NonReceivedPOD';
import VendorWisePOD     from './pages/reports/pod/VendorWise';
import PodSendRegister   from './pages/reports/pod/SendRegister';
const PodReceivedRegister = lazy(() => import('./pages/reports/pod/ReceivedRegister'));
import PodRegister       from './pages/reports/pod/Register';
import NonUploadedPOD    from './pages/reports/pod/NonUploaded';
import VarInwardPending  from './pages/reports/var/InwardPending';
const VarInwardRegister = lazy(() => import('./pages/reports/var/InwardRegister'));
import VarInwardSummary  from './pages/reports/var/InwardSummary';
const BillwiseDeductReg = lazy(() => import('./pages/account-reports/BillwiseDeductReg'));
import LrExpensesReg     from './pages/account-reports/LrExpensesReg';
import LrwiseDeductReg   from './pages/account-reports/LrwiseDeductReg';
import SupplierBillReg   from './pages/account-reports/SupplierBillReg';
import BillEnquiry       from './pages/tracking/BillEnquiry';
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));
const SupportAdmin = lazy(() => import('./pages/SupportAdmin'));
const DispatcherView = lazy(() => import('./pages/DispatcherView'));
const RouteOptimizer = lazy(() => import('./pages/RouteOptimizer'));
const FleetDashboard = lazy(() => import('./pages/FleetDashboard'));
const DispatchCenter = lazy(() => import('./pages/DispatchCenter'));
const ComplaintCenter = lazy(() => import('./pages/ComplaintCenter'));
const CustomerComplaintPortal = lazy(() => import('./pages/CustomerComplaintPortal'));
const QuoteGenerator = lazy(() => import('./pages/QuoteGenerator'));
const QuoteAdmin = lazy(() => import('./pages/QuoteAdmin'));
const VoiceAssistant = lazy(() => import('./pages/VoiceAssistant'));
const VoiceHistory = lazy(() => import('./pages/VoiceHistory'));
const VoiceAnalytics = lazy(() => import('./pages/VoiceAnalytics'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const SalesDashboard = lazy(() => import('./pages/SalesDashboard'));
const LeadManagement = lazy(() => import('./pages/LeadManagement'));
const SalesPipeline = lazy(() => import('./pages/SalesPipeline'));
const SalesAnalyticsPage = lazy(() => import('./pages/SalesAnalyticsPage'));
const AISalesCopilot = lazy(() => import('./pages/AISalesCopilot'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
const DriverTrips = lazy(() => import('./pages/DriverTrips'));
const TripDetails = lazy(() => import('./pages/TripDetails'));
const DigitalPOD = lazy(() => import('./pages/DigitalPOD'));
const DriverPerformance = lazy(() => import('./pages/DriverPerformance'));
const DriverDocuments = lazy(() => import('./pages/DriverDocuments'));
const IncidentReporting = lazy(() => import('./pages/IncidentReporting'));
const VoiceDriver = lazy(() => import('./pages/VoiceDriver'));
const ExecutiveDashboardPage = lazy(() => import('./pages/bi/ExecutiveDashboard'));
const BusinessIntelligence = lazy(() => import('./pages/bi/BusinessIntelligence'));
const ForecastDashboard = lazy(() => import('./pages/bi/ForecastDashboard'));
const AlertsCenter = lazy(() => import('./pages/bi/AlertsCenter'));
const ExecutiveReports = lazy(() => import('./pages/bi/ExecutiveReports'));
const BranchAnalytics = lazy(() => import('./pages/bi/BranchAnalytics'));
const FinancialDashboard = lazy(() => import('./pages/bi/FinancialDashboard'));
const CustomerAnalytics = lazy(() => import('./pages/bi/CustomerAnalytics'));
const OperationsDashboard = lazy(() => import('./pages/bi/OperationsDashboard'));
const AIExecutiveCopilot = lazy(() => import('./pages/bi/AIExecutiveCopilot'));
// Phase 13 — AI Predictive Maintenance & IoT Fleet Intelligence (lazy-loaded)
const FleetIntelligenceDashboard = lazy(() => import('./pages/maintenance/FleetIntelligenceDashboard'));
const LiveTelemetry              = lazy(() => import('./pages/maintenance/LiveTelemetry'));
const VehicleHealthPage          = lazy(() => import('./pages/maintenance/VehicleHealthPage'));
const MaintenanceCenter          = lazy(() => import('./pages/maintenance/MaintenanceCenter'));
const WorkOrders                 = lazy(() => import('./pages/maintenance/WorkOrders'));
const WorkshopManagement         = lazy(() => import('./pages/maintenance/WorkshopManagement'));
const FuelIntelligencePage       = lazy(() => import('./pages/maintenance/FuelIntelligence'));
const DriverBehaviourPage        = lazy(() => import('./pages/maintenance/DriverBehaviourPage'));
const BatteryAnalytics           = lazy(() => import('./pages/maintenance/BatteryAnalytics'));
const EngineAnalytics            = lazy(() => import('./pages/maintenance/EngineAnalytics'));
const TyreAnalytics              = lazy(() => import('./pages/maintenance/TyreAnalytics'));
// Phase 14 – AI Warehouse Management System (WMS) (lazy-loaded)
const WarehouseDashboard  = lazy(() => import('./pages/warehouse/WarehouseDashboard'));
const WarehouseMaster     = lazy(() => import('./pages/warehouse/WarehouseMaster'));
const InventoryPage       = lazy(() => import('./pages/warehouse/InventoryPage'));
const InboundCenter       = lazy(() => import('./pages/warehouse/InboundCenter'));
const OutboundCenter      = lazy(() => import('./pages/warehouse/OutboundCenter'));
const WarehouseTasks      = lazy(() => import('./pages/warehouse/WarehouseTasks'));
const WarehouseAI         = lazy(() => import('./pages/warehouse/WarehouseAI'));
const DockManagement      = lazy(() => import('./pages/warehouse/DockManagement'));
const BarcodeCenter       = lazy(() => import('./pages/warehouse/BarcodeCenter'));
const WarehouseAnalytics  = lazy(() => import('./pages/warehouse/WarehouseAnalytics'));
const WarehouseForecast   = lazy(() => import('./pages/warehouse/WarehouseForecast'));
// Phase 15 – AI Supply Chain Control Tower & Enterprise Visibility (lazy-loaded)
const ControlTower          = lazy(() => import('./pages/enterprise/ControlTower'));
const GlobalOperations      = lazy(() => import('./pages/enterprise/GlobalOperations'));
const SupplierManagement    = lazy(() => import('./pages/enterprise/SupplierManagement'));
const VendorManagement      = lazy(() => import('./pages/enterprise/VendorManagement'));
const PurchaseOrders        = lazy(() => import('./pages/enterprise/PurchaseOrders'));
const SalesOrders           = lazy(() => import('./pages/enterprise/SalesOrders'));
const EnterpriseIncidents   = lazy(() => import('./pages/enterprise/EnterpriseIncidents'));
const CollaborationCenter   = lazy(() => import('./pages/enterprise/CollaborationCenter'));
const RiskCenter            = lazy(() => import('./pages/enterprise/RiskCenter'));
const AIDecisionCenter      = lazy(() => import('./pages/enterprise/AIDecisionCenter'));
const ExecutiveCockpit      = lazy(() => import('./pages/enterprise/ExecutiveCockpit'));
const CustomerPortal2       = lazy(() => import('./pages/enterprise/CustomerPortal2'));
const EnterpriseAnalytics   = lazy(() => import('./pages/enterprise/EnterpriseAnalytics'));
const DocumentDashboard     = lazy(() => import('./pages/documents/DocumentDashboard'));
const DocumentRepository    = lazy(() => import('./pages/documents/DocumentRepository'));
const UploadCenter          = lazy(() => import('./pages/documents/UploadCenter'));
const OCRViewer             = lazy(() => import('./pages/documents/OCRViewer'));
const ValidationDashboard   = lazy(() => import('./pages/documents/ValidationDashboard'));
const ApprovalDashboard     = lazy(() => import('./pages/documents/ApprovalDashboard'));
const DocumentSearch        = lazy(() => import('./pages/documents/DocumentSearch'));
const DocumentAnalytics     = lazy(() => import('./pages/documents/DocumentAnalytics'));
const VersionHistory        = lazy(() => import('./pages/documents/VersionHistory'));
const RecycleBin            = lazy(() => import('./pages/documents/RecycleBin'));
// Phase 16 – AI Enterprise Automation & Hyper Automation Platform (lazy-loaded)
const AutomationDashboard  = lazy(() => import('./pages/automation/AutomationDashboard'));
const WorkflowBuilder      = lazy(() => import('./pages/automation/WorkflowBuilder'));
const WorkflowTemplates    = lazy(() => import('./pages/automation/WorkflowTemplates'));
const AutomationJobs       = lazy(() => import('./pages/automation/AutomationJobs'));
const DigitalWorkers       = lazy(() => import('./pages/automation/DigitalWorkers'));
const ApprovalCenter       = lazy(() => import('./pages/automation/ApprovalCenter'));
const EnterpriseScheduler  = lazy(() => import('./pages/automation/EnterpriseScheduler'));
const AutomationAnalytics  = lazy(() => import('./pages/automation/AutomationAnalytics'));
const WorkflowMonitoring   = lazy(() => import('./pages/automation/WorkflowMonitoring'));
const ExecutionHistory     = lazy(() => import('./pages/automation/ExecutionHistory'));
const WorkflowDesigner     = lazy(() => import('./pages/automation/WorkflowDesigner'));
const AutomationSettings   = lazy(() => import('./pages/automation/AutomationSettings'));

// Phase 19 – Enterprise Financial Management (lazy-loaded)
const FinanceDashboard       = lazy(() => import('./pages/finance/FinanceDashboard'));
const InvoiceCenter          = lazy(() => import('./pages/finance/InvoiceCenter'));
const InvoiceBuilder         = lazy(() => import('./pages/finance/InvoiceBuilder'));
const AccountsReceivable     = lazy(() => import('./pages/finance/AccountsReceivable'));
const AccountsPayable        = lazy(() => import('./pages/finance/AccountsPayable'));
const ExpenseCenter          = lazy(() => import('./pages/finance/ExpenseCenter'));
const FinBankReconciliation  = lazy(() => import('./pages/finance/BankReconciliation'));
const CashFlowDashboard      = lazy(() => import('./pages/finance/CashFlowDashboard'));
const BudgetPlanner          = lazy(() => import('./pages/finance/BudgetPlanner'));
const CostCenterManagement   = lazy(() => import('./pages/finance/CostCenterManagement'));
const FinancialForecast      = lazy(() => import('./pages/finance/FinancialForecast'));
const GeneralLedgerPage      = lazy(() => import('./pages/finance/GeneralLedgerPage'));
const JournalEntries         = lazy(() => import('./pages/finance/JournalEntries'));
const TrialBalancePage       = lazy(() => import('./pages/finance/TrialBalancePage'));
const FinProfitAndLoss       = lazy(() => import('./pages/finance/ProfitAndLoss'));
const BalanceSheetPage       = lazy(() => import('./pages/finance/BalanceSheetPage'));
const GSTDashboard           = lazy(() => import('./pages/finance/GSTDashboard'));
const TaxManagement          = lazy(() => import('./pages/finance/TaxManagement'));
const FinanceAnalytics       = lazy(() => import('./pages/finance/FinanceAnalytics'));
const AIFinanceCopilot       = lazy(() => import('./pages/finance/AIFinanceCopilot'));

// Phase 18 – AI Digital Twin, Simulation & Autonomous Operations (lazy-loaded)
const DigitalTwinDashboard   = lazy(() => import('./pages/simulation/DigitalTwinDashboard'));
const SimulationCenter       = lazy(() => import('./pages/simulation/SimulationCenter'));
const ScenarioBuilder        = lazy(() => import('./pages/simulation/ScenarioBuilder'));
const ScenarioLibrary        = lazy(() => import('./pages/simulation/ScenarioLibrary'));
const AutonomousDecisions    = lazy(() => import('./pages/simulation/AutonomousDecisions'));
const CapacityPlanning       = lazy(() => import('./pages/simulation/CapacityPlanning'));
const DemandPlanning         = lazy(() => import('./pages/simulation/DemandPlanning'));
const CarbonDashboard        = lazy(() => import('./pages/simulation/CarbonDashboard'));
const SustainabilityDashboard = lazy(() => import('./pages/simulation/SustainabilityDashboard'));
const RiskSimulation         = lazy(() => import('./pages/simulation/RiskSimulation'));
const BusinessContinuity     = lazy(() => import('./pages/simulation/BusinessContinuity'));
const RecoveryCenter         = lazy(() => import('./pages/simulation/RecoveryCenter'));
const SimulationAnalytics    = lazy(() => import('./pages/simulation/SimulationAnalytics'));
const ExecutiveSimulation    = lazy(() => import('./pages/simulation/ExecutiveSimulation'));
const AIRecommendations      = lazy(() => import('./pages/simulation/AIRecommendations'));

// Phase 17 – AI Enterprise Integration Platform (lazy-loaded)
const IntegrationDashboard   = lazy(() => import('./pages/integration/IntegrationDashboard'));
const APIGateway             = lazy(() => import('./pages/integration/APIGateway'));
const WebhookManager         = lazy(() => import('./pages/integration/WebhookManager'));
const APIKeys                = lazy(() => import('./pages/integration/APIKeys'));
const ConnectorMarketplace   = lazy(() => import('./pages/integration/ConnectorMarketplace'));
const ERPIntegrations        = lazy(() => import('./pages/integration/ERPIntegrations'));
const CRMIntegrations        = lazy(() => import('./pages/integration/CRMIntegrations'));
const AccountingIntegrations = lazy(() => import('./pages/integration/AccountingIntegrations'));
const MarketplaceIntegrations = lazy(() => import('./pages/integration/MarketplaceIntegrations'));
const EventBusMonitor        = lazy(() => import('./pages/integration/EventBusMonitor'));
const SyncDashboard          = lazy(() => import('./pages/integration/SyncDashboard'));
const OAuthManager           = lazy(() => import('./pages/integration/OAuthManager'));
const APIDocs                = lazy(() => import('./pages/integration/APIDocs'));
const APIAnalytics           = lazy(() => import('./pages/integration/APIAnalytics'));
const IntegrationLogs        = lazy(() => import('./pages/integration/IntegrationLogs'));
const DeveloperPortal        = lazy(() => import('./pages/integration/DeveloperPortal'));

const SetupWizard = lazy(() => import('./pages/setup/SetupWizard'));

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireBranch({ children }) {
  const { user, branch } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!branch) return <Navigate to="/select-branch" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/track" element={<Track />} />
        <Route path="/quote" element={<QuoteGenerator />} />
        <Route path="/quote/:number" element={<QuoteGenerator />} />
        <Route path="/my-complaints" element={<CustomerComplaintPortal />} />
        <Route path="/select-branch" element={
          <RequireAuth><BranchSelect /></RequireAuth>
        } />
        <Route path="/setup" element={
          <RequireAuth><Suspense fallback={null}><SetupWizard /></Suspense></RequireAuth>
        } />
        <Route path="/" element={
          <RequireBranch><Layout /></RequireBranch>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="shipments/new" element={<CreateShipment />} />
          <Route path="shipments/:id" element={<ShipmentDetail />} />
          <Route path="pod" element={<POD />} />
          <Route path="payments" element={<Payments />} />
          <Route path="users" element={<Users />} />
          <Route path="support/agent" element={<AgentDashboard />} />
          <Route path="support/admin" element={<SupportAdmin />} />
          <Route path="master/customer" element={<PartyCustomer />} />
          <Route path="master/vendor" element={<VendorAgent />} />
          <Route path="master/package-type" element={<PackageType />} />
          <Route path="master/material" element={<MaterialDescription />} />
          <Route path="master/reason" element={<ReasonMaster />} />
          <Route path="master/lr" element={<LRMaster />} />
          <Route path="master/stationary" element={<StationaryAllocation />} />
          <Route path="master/party-link" element={<PartyLinkToSuperParty />} />
          <Route path="master/transit-mode" element={<TransitMode />} />
          <Route path="accounts/cost-center" element={<AccountsCostCenter />} />
          <Route path="accounts/ledger" element={<Ledger />} />
          <Route path="accounts/group" element={<Group />} />
          <Route path="accounts/opening-bills" element={<OpeningBills />} />
          <Route path="accounts/bank-reco-opening" element={<BankRecoOpening />} />
          <Route path="accounts/opening-memos" element={<OpeningMemos />} />
          <Route path="accounts/cost-category" element={<CostCategory />} />
          <Route path="master/location/division" element={<Division />} />
          <Route path="master/location/zone" element={<Zone />} />
          <Route path="master/location/region" element={<Region />} />
          <Route path="master/location/branch" element={<Branch />} />
          <Route path="master/location/location" element={<Location />} />
          <Route path="master/location/state-master" element={<StateMaster />} />
          <Route path="master/vehicle/vehicle" element={<Vehicle />} />
          <Route path="master/vehicle/load-type" element={<LoadType />} />
          <Route path="master/vehicle/rto-insurance" element={<RTOInsurance />} />
          <Route path="master/vehicle/document-master" element={<DocumentMaster />} />
          <Route path="master/charge/expense" element={<ExpenseCharges />} />
          <Route path="master/charge/sales" element={<SalesCharges />} />
          <Route path="master/driver/master" element={<DriverMaster />} />
          <Route path="master/driver/mapping" element={<DriverMapping />} />
          <Route path="master/contract/customer" element={<CustomerContract />} />
          <Route path="master/contract/vendor" element={<VendorContract />} />
          <Route path="master/route/master" element={<RouteMaster />} />
          <Route path="master/route/expenses" element={<RouteExpenses />} />
          <Route path="master/route/diesel-rate" element={<DieselRate />} />
          <Route path="master/tat/master" element={<TATMaster />} />
          <Route path="master/tat/calculate" element={<TATCalculate />} />
          <Route path="master/tat/leave-holiday" element={<LeaveHolidayMaster />} />
          <Route path="entries/lr/rebooking" element={<ReBooking />} />
          <Route path="entries/memo" element={<Memo />} />
          <Route path="entries/loading-sheet" element={<LoadingSheet />} />
          <Route path="entries/lhs" element={<LHS />} />
          <Route path="entries/touching-lr" element={<TouchingLR />} />
          <Route path="entries/link-memo" element={<LinkMemo />} />
          <Route path="entries/link-ldm" element={<LinkLDM />} />
          <Route path="entries/link-lcm" element={<LinkLCM />} />
          <Route path="entries/vehicle-in-out" element={<VehicleInOut />} />
          <Route path="entries/extra-advance-diesel" element={<ExtraAdvanceDiesel />} />
          <Route path="entries/trip-settlement" element={<TripSettlement />} />
          <Route path="entries/market-load-memo" element={<MarketLoadMemo />} />
          <Route path="entries/market-load-balance" element={<MarketLoadBalance />} />
          <Route path="entries/fastag-import" element={<FasTagImport />} />
          <Route path="entries/diesel-import" element={<DieselImport />} />
          <Route path="entries/fleet-settled-trip" element={<SettledTrip />} />
          <Route path="entries/fleet-non-settled-trip" element={<NonSettledTrip />} />
          <Route path="entries/fleet-trip-not-link-diesel" element={<TripNotLinkToDiesel />} />
          <Route path="entries/fleet-tripsheet-summary" element={<TripsheetSummary />} />
          <Route path="entries/fleet-ml-outstanding" element={<MLOutstanding />} />
          <Route path="entries/fleet-ml-register" element={<MarketLoadRegister />} />
          <Route path="entries/fleet-route-expenses" element={<FleetRouteExpenses />} />
          <Route path="entries/vehicle-arrival" element={<VehicleArrival />} />
          <Route path="entries/var" element={<VehicleArrival />} />
          <Route path="entries/delivery" element={<Delivery />} />
          <Route path="entries/pod-submit" element={<PODSubmit />} />
          <Route path="entries/pod-send-branch" element={<PODSendBranch />} />
          <Route path="entries/pod-received" element={<PODReceived />} />
          <Route path="entries/pod-upload" element={<UploadPOD />} />
          <Route path="entries/pod-download-multi" element={<DownloadMultiPOD />} />
          <Route path="entries/pod-send-customer" element={<PODSendCustomer />} />
          <Route path="entries/billing-against-lr" element={<BillingAgainstLR />} />
          <Route path="entries/billing-without-lr" element={<BillingWithoutLR />} />
          <Route path="entries/bill-submission" element={<BillSubmission />} />
          <Route path="entries/unbilled-checklist" element={<UnbilledChecklist />} />
          <Route path="entries/lcm" element={<LCM />} />
          <Route path="entries/ldm-drs" element={<LDMDRS />} />
          <Route path="entries/ldm-drs-settlement" element={<LDMDRSSettlement />} />
          <Route path="entries/pickup" element={<OrderPickupReq />} />
          <Route path="entries/verify-order" element={<VerifyOrder />} />
          <Route path="entries/route-planning" element={<RoutePlanning />} />
          <Route path="entries/vehicle-assign" element={<VehicleAssign />} />
          <Route path="entries/order-register" element={<OrderRegister />} />
          <Route path="entries/sticker-thermal" element={<StickerThermal />} />
          <Route path="entries/eway-extend-import" element={<EwayExtendImport />} />
          <Route path="entries/eway-update-search" element={<EwayUpdateSearch />} />
          <Route path="entries/eway-link-against-lr" element={<EwayLinkAgainstLR />} />
          <Route path="entries/eway-pending-part-b" element={<PendingPartBEWB />} />
          <Route path="entries/eway-extended-report" element={<ExtendedEwayReport />} />
          <Route path="entries/eway-report" element={<EwayBillReport />} />
          <Route path="entries/hold-lost-damage" element={<HoldLostDamage />} />
          <Route path="entries/download-damage" element={<DownloadDamage />} />
          <Route path="entries/settlement" element={<CNSettlement />} />
          <Route path="entries/delay" element={<CNDelayRemark />} />
          <Route path="entries/cancel" element={<CancelDocument />} />
          <Route path="entries/appointment" element={<CustomerAppointment />} />
          <Route path="entries/appointment-report" element={<CustomerAppointmentReport />} />
          <Route path="modify/lr" element={<ModifyLR />} />
          <Route path="modify/memo" element={<ModifyMemo />} />
          <Route path="modify/bill-with-lr" element={<ModifyBillWithLR />} />
          <Route path="modify/bill-without-lr" element={<ModifyBillWithoutLR />} />
          <Route path="modify/mr" element={<ModifyMR />} />
          <Route path="modify/ldm-drs" element={<ModifyLDMDRS />} />
          <Route path="modify/lr-any-branch" element={<ModifyLRAnyBranch />} />
          <Route path="modify/mr-any-branch" element={<ModifyMRAnyBranch />} />
          <Route path="modify/memo-any" element={<ModifyMemoAny />} />
          <Route path="modify/lcm-loc-any" element={<ModifyLCMLOCAny />} />
          <Route path="modify/ldm-drs-any" element={<ModifyLDMDRSAny />} />
          <Route path="modify/bill-with-lr-any" element={<ModifyBillWithLRAny />} />
          <Route path="modify/bill-without-lr-any" element={<ModifyBillWithoutLRAny />} />
          <Route path="modify/lhs" element={<ModifyLHS />} />
          <Route path="modify/lhs-any-branch" element={<ModifyLHSAnyBranch />} />
          <Route path="modify/branch-voucher-any" element={<ModifyBranchVoucherAny />} />
          <Route path="modify/lr-expenses-any" element={<ModifyLRExpensesAny />} />
          <Route path="reports/master/location" element={<LocationMasterReport />} />
          <Route path="reports/master/branch" element={<BranchMasterReport />} />
          <Route path="reports/master/customer" element={<CustomerMasterReport />} />
          <Route path="reports/master/vendor" element={<VendorMasterReport />} />
          <Route path="reports/master/driver" element={<DriverMasterReport />} />
          <Route path="reports/master/vehicle" element={<VehicleMasterReport />} />
          <Route path="reports/master/load-type" element={<LoadTypeReport />} />
          <Route path="reports/master/income-charges" element={<IncomeChargesReport />} />
          <Route path="reports/master/expense-charges" element={<ExpenceChargesReport />} />
          <Route path="reports/master/ledger" element={<LedgerMasterReport />} />
          <Route path="reports/master/group" element={<GroupMasterReport />} />
          <Route path="reports/master/stationary" element={<StationaryAllocationReport />} />
          <Route path="reports/master/customer-contract" element={<CustomerContractReport />} />
          <Route path="reports/master/vendor-contract" element={<VendorContractReport />} />
          <Route path="reports/master/opening-bills" element={<OpeningBillsReport />} />
          <Route path="reports/lr/booking-ho" element={<BookingRegisterHO />} />
          <Route path="reports/lr/booking-branch" element={<BookingRegisterBranch />} />
          <Route path="reports/lr/customer-mis" element={<CustomerMIS />} />
          <Route path="reports/lr/daily-inward-outward" element={<DailyBranchInwardOutward />} />
          <Route path="reports/lr/cancel-register" element={<LRCancelRegister />} />
          <Route path="reports/lr/zero-freight" element={<ZeroFreightLRs />} />
          <Route path="reports/lr/paid-register" element={<PaidRegister />} />
          <Route path="reports/lr/topay-register" element={<TopayRegister />} />
          <Route path="reports/lr/cn-status" element={<CNCurrentStatus />} />
          <Route path="reports/memo/pending-lr" element={<MemoPendingLR />} />
          <Route path="reports/memo/summary" element={<MemoSummary />} />
          <Route path="reports/memo/register" element={<MemoRegister />} />
          <Route path="reports/memo/zero-freight" element={<ZeroFreightMemo />} />
          <Route path="reports/lhs/summary"  element={<LHSSummary />} />
          <Route path="reports/lhs/pending"  element={<LHSPending />} />
          <Route path="reports/lhs/register" element={<LHSRegister />} />
          <Route path="reports/stock/dashboard"        element={<StockDashboard />} />
          <Route path="reports/stock/short-excess"     element={<ShortExcessReg />} />
          <Route path="reports/stock/godown"           element={<GodownStock />} />
          <Route path="reports/stock/godown-grid"      element={<GodownStockGrid />} />
          <Route path="reports/stock/partial-dispatch" element={<PartialDispatchStock />} />
          <Route path="reports/pod/non-submit"         element={<NonSubmitPOD />} />
          <Route path="reports/pod/non-send"            element={<NonSendPOD />} />
          <Route path="reports/pod/non-received"        element={<NonReceivedPOD />} />
          <Route path="reports/pod/vendor-wise"         element={<VendorWisePOD />} />
          <Route path="reports/pod/send-register"       element={<PodSendRegister />} />
          <Route path="reports/pod/received-register"   element={<PodReceivedRegister />} />
          <Route path="reports/pod/register"            element={<PodRegister />} />
          <Route path="reports/pod/non-uploaded"        element={<NonUploadedPOD />} />
          <Route path="reports/bill/unbilled-party"     element={<UnbilledParty />} />
          <Route path="reports/bill/unbilled"           element={<Unbilled />} />
          <Route path="reports/bill/summary"            element={<BillSummary />} />
          <Route path="reports/bill/lr-register"        element={<BillLrRegister />} />
          <Route path="reports/bill/submission"         element={<ReportBillSubmission />} />
          <Route path="reports/bill/submission-pending" element={<SubmissionPending />} />
          <Route path="reports/bill/lr-details"         element={<BillLrDetails />} />
          <Route path="reports/lcm/summary"             element={<LcmSummary />} />
          <Route path="reports/lcm/register"            element={<LcmRegister />} />
          <Route path="reports/lcm/pending-lr"          element={<LcmPendingLR />} />
          <Route path="reports/lcm/zero-freight"        element={<LcmZeroFreight />} />
          <Route path="reports/ldm-drs/summary"         element={<LdmDrsSummary />} />
          <Route path="reports/ldm-drs/register"        element={<LdmDrsRegister />} />
          <Route path="reports/ldm-drs/pending-lr"      element={<LdmDrsPendingLR />} />
          <Route path="reports/ldm-drs/zero-freight"    element={<LdmDrsZeroFreight />} />
          <Route path="reports/ldm-drs/delivery-pending" element={<DeliveryPending />} />
          <Route path="reports/var/inward-pending"      element={<VarInwardPending />} />
          <Route path="reports/var/inward-register"     element={<VarInwardRegister />} />
          <Route path="reports/var/inward-summary"      element={<VarInwardSummary />} />
          <Route path="reports/delivery-ack"            element={<DeliveryAck />} />
          <Route path="reports/missing-document" element={<MissingDocument />} />
          <Route path="reports/diesel-statement" element={<DieselStatement />} />
          <Route path="reports/fastag-statement" element={<FasTagStatement />} />
          <Route path="mis/tracking-mis"        element={<TrackingMIS />} />
          <Route path="mis/transaction-history" element={<TransactionHistory />} />
          <Route path="mis/branch-pendency"     element={<BranchPendency />} />
          {/* MIS – Party Outstanding */}
          <Route path="mis/party-outstanding/bill-os" element={<BillOS />} />
          <Route path="mis/party-outstanding/bill-unbill" element={<BillUnbill />} />
          <Route path="mis/party-outstanding/overdue-bills" element={<OverdueBills />} />
          <Route path="mis/party-outstanding/to-pay-os-grid" element={<ToPayOSGrid />} />
          <Route path="mis/party-outstanding/paid-os-grid" element={<PaidOSGrid />} />
          {/* MIS – Hire Vehicle O/S */}
          <Route path="mis/hire-vehicle-os/memo-wise-os" element={<MemoWiseOS />} />
          <Route path="mis/hire-vehicle-os/vendor-outstanding" element={<VendorOutstanding />} />
          {/* MIS – Profitability */}
          <Route path="mis/profitability/lr-profitability" element={<LRProfitability />} />
          <Route path="mis/profitability/trip-wise-profit" element={<TripWiseProfit />} />
          <Route path="mis/profitability/vehicle-profitability" element={<VehicleProfitability />} />
          {/* MIS – Dashboard */}
          <Route path="mis/dashboard/mis-dashboard" element={<MISDashboard />} />
          <Route path="mis/dashboard/tat-analysis" element={<TATAnalysis />} />
          <Route path="mis/branch-performance" element={<BranchPerformance />} />
          <Route path="mis/branch-sale-monthly" element={<BranchSaleMonthly />} />
          <Route path="mis/party-sale-monthly" element={<PartySaleMonthly />} />
          <Route path="mis/lr-transit-summary" element={<LRTransitSummary />} />
          <Route path="mis/account-analysis" element={<AccountAnalysis />} />
          <Route path="account-entries/branch-voucher" element={<BranchVoucher />} />
          <Route path="account-entries/hire-vehicle-payment" element={<HireVehiclePayment />} />
          <Route path="account-entries/money-receipt-mr" element={<MoneyReceiptMR />} />
          <Route path="account-entries/customer-cr-dr-note" element={<CustomerCrDrNote />} />
          <Route path="account-entries/memo-expenses" element={<MemoExpenses />} />
          <Route path="account-entries/lr-expenses" element={<LRExpenses />} />
          <Route path="account-entries/vendor-bill"         element={<VendorSupplierBill />} />
          <Route path="account-entries/vendor-bill-payment" element={<VendorBillPayment />} />
          <Route path="account-entries/vendor-cr-dr-note"   element={<VendorCrDrNote />} />
          <Route path="account-entries/unbill-memo"         element={<UnbillMemo />} />
          <Route path="account-entries/voucher-entry" element={<VoucherEntry />} />
          <Route path="account-entries/bank-reconciliation" element={<BankReconciliation />} />
          <Route path="account-reports/account-statement" element={<AccountStatement />} />
          <Route path="account-reports/br-cash-bank-book" element={<BrCashBankBook />} />
          <Route path="account-reports/mr/summary" element={<MRSummary />} />
          <Route path="account-reports/mr/bill-collection"  element={<BillCollection />} />
          <Route path="account-reports/mr/paid-collection"  element={<PaidCollection />} />
          <Route path="account-reports/mr/topay-collection" element={<TopayCollection />} />
          <Route path="account-reports/mr/bill-pending-mr"  element={<BillPendingMR />} />
          <Route path="account-reports/hire-veh/payment-summary" element={<PaymentSummary />} />
          <Route path="account-reports/hire-veh/payment-details" element={<PaymentDetails />} />
          <Route path="account-reports/cust-cr-dr-note-reg"      element={<CustCrDrNoteReg />} />
          <Route path="account-reports/opening-reference"         element={<OpeningReference />} />
          <Route path="account-reports/memo-expenses-reg"         element={<MemoExpensesReg />} />
          <Route path="account-reports/voucher/sales-register"       element={<SalesRegister />} />
          <Route path="account-reports/voucher/register-receipt"    element={<RegisterReceipt />} />
          <Route path="account-reports/voucher/payment-register"    element={<PaymentRegister />} />
          <Route path="account-reports/voucher/purchase-register"   element={<PurchaseRegister />} />
          <Route path="account-reports/voucher/journal-register"    element={<JournalRegister />} />
          <Route path="account-reports/voucher/contra-register"     element={<ContraRegister />} />
          <Route path="account-reports/voucher/credit-note-register" element={<CreditNoteRegister />} />
          <Route path="account-reports/voucher/debit-note-register"  element={<DebitNoteRegister />} />
          <Route path="account-reports/daybook"                       element={<Daybook />} />
          <Route path="account-reports/auditors/income-register"    element={<IncomeRegister />} />
          <Route path="account-reports/auditors/expenses-register"  element={<ExpensesRegister />} />
          <Route path="account-reports/os-report"                       element={<OSReport />} />
          <Route path="account-reports/final-books/trail-balance"    element={<TrailBalance />} />
          <Route path="account-reports/final-books/profit-and-loss"  element={<ProfitAndLoss />} />
          <Route path="account-reports/final-books/balance-sheet"       element={<BalanceSheet />} />
          <Route path="account-reports/taxation/tds-receivable-reg"   element={<TDSReceivableReg />} />
          <Route path="account-reports/taxation/tds-reg-billwise"     element={<TDSRegBillwise />} />
          <Route path="account-reports/taxation/tds-payable-reg"   element={<TDSPayableReg />} />
          <Route path="account-reports/taxation/gstr-1"           element={<GSTR1 />} />
          <Route path="account-reports/taxation/gstr-2"           element={<GSTR2 />} />
          <Route path="account-reports/taxation/gstr1-return"      element={<GSTR1Return />} />
          <Route path="account-reports/taxation/gstr-1-b2b"       element={<GSTR1B2B />} />
          <Route path="account-reports/taxation/gstr-1-hsn"       element={<GSTR1HSN />} />
          <Route path="account-reports/customer-on-account"       element={<CustomerOnAccount />} />
          <Route path="account-reports/vendor-adj-on-account"     element={<VendorAdjOnAccount />} />
          <Route path="account-reports/billwise-deduct-reg"     element={<BillwiseDeductReg />} />
          <Route path="account-reports/lr-expenses-reg"         element={<LrExpensesReg />} />
          <Route path="account-reports/lrwise-deduct-reg"       element={<LrwiseDeductReg />} />
          <Route path="account-reports/supplier-bill-reg"       element={<SupplierBillReg />} />
          <Route path="tracking/lr-tracking"                    element={<LRTracking />} />
          <Route path="tracking/multi-lr-tracking"              element={<MultiLRTracking />} />
          <Route path="tracking/lr-enquiry"                     element={<LREnquiry />} />
          <Route path="tracking/memo-enquiry"                   element={<MemoEnquiry />} />
          <Route path="tracking/user-activity"                  element={<UserActivity />} />
          <Route path="tracking/lr-cost-analysis"              element={<LRCostAnalysis />} />
          <Route path="tracking/reference-track"               element={<ReferenceTrack />} />
          <Route path="tracking/veh-current-status"            element={<VehCurrentStatus />} />
          <Route path="tracking/bill-enquiry"               element={<BillEnquiry />} />
          <Route path="tracking/dispatcher"                  element={<DispatcherView />} />
          <Route path="routes/optimizer"                     element={<RouteOptimizer />} />
          <Route path="fleet/dashboard"                      element={<FleetDashboard />} />
          <Route path="dispatch/center"                     element={<DispatchCenter />} />
          <Route path="complaints/center"                    element={<ComplaintCenter />} />
          <Route path="voice/assistant"                      element={<VoiceAssistant />} />
          <Route path="voice/history"                        element={<VoiceHistory />} />
          <Route path="voice/analytics"                      element={<VoiceAnalytics />} />
          <Route path="knowledge-base"                       element={<KnowledgeBase />} />
          <Route path="sales/dashboard"                      element={<SalesDashboard />} />
          <Route path="sales/leads"                          element={<LeadManagement />} />
          <Route path="sales/pipeline"                       element={<SalesPipeline />} />
          <Route path="sales/analytics"                      element={<SalesAnalyticsPage />} />
          <Route path="sales/copilot"                        element={<AISalesCopilot />} />
          <Route path="driver/dashboard"                     element={<DriverDashboard />} />
          <Route path="driver/trips"                         element={<DriverTrips />} />
          <Route path="driver/trips/:id"                     element={<TripDetails />} />
          <Route path="driver/pod"                           element={<DigitalPOD />} />
          <Route path="driver/performance"                   element={<DriverPerformance />} />
          <Route path="driver/documents"                     element={<DriverDocuments />} />
          <Route path="driver/incidents"                     element={<IncidentReporting />} />
          <Route path="driver/voice"                         element={<VoiceDriver />} />
          <Route path="quotes"                               element={<QuoteAdmin />} />
          <Route path="bi/executive"                         element={<ExecutiveDashboardPage />} />
          <Route path="bi/intelligence"                     element={<BusinessIntelligence />} />
          <Route path="bi/forecast"                         element={<ForecastDashboard />} />
          <Route path="bi/alerts"                           element={<AlertsCenter />} />
          <Route path="bi/reports"                          element={<ExecutiveReports />} />
          <Route path="bi/branches"                         element={<BranchAnalytics />} />
          <Route path="bi/financial"                        element={<FinancialDashboard />} />
          <Route path="bi/customers"                        element={<CustomerAnalytics />} />
          <Route path="bi/operations"                       element={<OperationsDashboard />} />
          <Route path="bi/copilot"                          element={<AIExecutiveCopilot />} />
          {/* Phase 13 – AI Predictive Maintenance & IoT Fleet Intelligence */}
          <Route path="maintenance"                 element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><FleetIntelligenceDashboard /></Suspense>} />
          <Route path="maintenance/telemetry"       element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><LiveTelemetry /></Suspense>} />
          <Route path="maintenance/vehicle-health"  element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><VehicleHealthPage /></Suspense>} />
          <Route path="maintenance/center"          element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><MaintenanceCenter /></Suspense>} />
          <Route path="maintenance/workorders"      element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><WorkOrders /></Suspense>} />
          <Route path="maintenance/workshops"       element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><WorkshopManagement /></Suspense>} />
          <Route path="maintenance/fuel"            element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><FuelIntelligencePage /></Suspense>} />
          <Route path="maintenance/driver-behaviour" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><DriverBehaviourPage /></Suspense>} />
          <Route path="maintenance/battery"         element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><BatteryAnalytics /></Suspense>} />
          <Route path="maintenance/engine"          element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><EngineAnalytics /></Suspense>} />
          <Route path="maintenance/tyres"           element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><TyreAnalytics /></Suspense>} />
          <Route path="documents"                   element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><DocumentDashboard /></Suspense>} />
          <Route path="documents/repository"        element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><DocumentRepository /></Suspense>} />
          <Route path="documents/upload"            element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><UploadCenter /></Suspense>} />
          <Route path="documents/ocr/:id"           element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><OCRViewer /></Suspense>} />
          <Route path="documents/validation"        element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><ValidationDashboard /></Suspense>} />
          <Route path="documents/approval"          element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><ApprovalDashboard /></Suspense>} />
          <Route path="documents/search"            element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><DocumentSearch /></Suspense>} />
          <Route path="documents/analytics"         element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><DocumentAnalytics /></Suspense>} />
          <Route path="documents/versions/:id"      element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><VersionHistory /></Suspense>} />
          <Route path="documents/recycle-bin"       element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><RecycleBin /></Suspense>} />
          {/* Phase 14 – AI Warehouse Management System (WMS) */}
          <Route path="warehouse"              element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><WarehouseDashboard /></Suspense>} />
          <Route path="warehouse/master"       element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><WarehouseMaster /></Suspense>} />
          <Route path="warehouse/inventory"    element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><InventoryPage /></Suspense>} />
          <Route path="warehouse/inbound"      element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><InboundCenter /></Suspense>} />
          <Route path="warehouse/outbound"     element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><OutboundCenter /></Suspense>} />
          <Route path="warehouse/tasks"        element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><WarehouseTasks /></Suspense>} />
          <Route path="warehouse/ai"           element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><WarehouseAI /></Suspense>} />
          <Route path="warehouse/docks"        element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><DockManagement /></Suspense>} />
          <Route path="warehouse/barcode"      element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><BarcodeCenter /></Suspense>} />
          <Route path="warehouse/analytics"    element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><WarehouseAnalytics /></Suspense>} />
          <Route path="warehouse/forecast"     element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><WarehouseForecast /></Suspense>} />
          {/* Phase 15 – AI Supply Chain Control Tower & Enterprise Visibility */}
          <Route path="enterprise/control-tower"   element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><ControlTower /></Suspense>} />
          <Route path="enterprise/operations"      element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><GlobalOperations /></Suspense>} />
          <Route path="enterprise/suppliers"       element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><SupplierManagement /></Suspense>} />
          <Route path="enterprise/vendors"         element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><VendorManagement /></Suspense>} />
          <Route path="enterprise/purchase-orders" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><PurchaseOrders /></Suspense>} />
          <Route path="enterprise/sales-orders"    element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><SalesOrders /></Suspense>} />
          <Route path="enterprise/incidents"       element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><EnterpriseIncidents /></Suspense>} />
          <Route path="enterprise/collaboration"   element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><CollaborationCenter /></Suspense>} />
          <Route path="enterprise/risk"            element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><RiskCenter /></Suspense>} />
          <Route path="enterprise/ai-decisions"    element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><AIDecisionCenter /></Suspense>} />
          <Route path="enterprise/cockpit"         element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><ExecutiveCockpit /></Suspense>} />
          <Route path="enterprise/customer-portal" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><CustomerPortal2 /></Suspense>} />
          <Route path="enterprise/analytics"       element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><EnterpriseAnalytics /></Suspense>} />
          {/* Switch routes */}
          <Route path="switch/branch"  element={<Navigate to="/select-branch" replace />} />
          <Route path="switch/fin-year"     element={<SelectFinYear />} />
          <Route path="config/user-creation"  element={<UserCreation />} />
          <Route path="config/level-master"      element={<LevelMaster />} />
          <Route path="config/user-interface"   element={<UserInterface />} />
          <Route path="config/document-deletion"  element={<DocumentDeletion />} />
          <Route path="config/upload-document"    element={<UploadDocument />} />
          <Route path="config/backup"             element={<Backup />} />
          <Route path="config/voucher-mismatch"   element={<VoucherMismatch />} />
          <Route path="config/mobile-crm-login"   element={<MobileCRMLogin />} />
          <Route path="config/user-remote-access" element={<UserRemoteAccess />} />
          <Route path="config/dayend"             element={<DayEnd />} />
          <Route path="config/import-utility"     element={<ImportUtility />} />
          <Route path="config/customer"              element={<CustomerConfig />} />
          <Route path="config/auto-mail-setting"   element={<AutoMailSetting />} />
          <Route path="config/complaint-register"  element={<ComplaintRegister />} />
          {/* Phase 16 – Automation */}
          <Route path="automation"            element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><AutomationDashboard /></Suspense>} />
          <Route path="automation/builder"    element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><WorkflowBuilder /></Suspense>} />
          <Route path="automation/templates"  element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><WorkflowTemplates /></Suspense>} />
          <Route path="automation/jobs"       element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><AutomationJobs /></Suspense>} />
          <Route path="automation/workers"    element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><DigitalWorkers /></Suspense>} />
          <Route path="automation/approvals"  element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><ApprovalCenter /></Suspense>} />
          <Route path="automation/scheduler"  element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><EnterpriseScheduler /></Suspense>} />
          <Route path="automation/analytics"  element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><AutomationAnalytics /></Suspense>} />
          <Route path="automation/monitoring" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><WorkflowMonitoring /></Suspense>} />
          <Route path="automation/history"    element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><ExecutionHistory /></Suspense>} />
          <Route path="automation/designer"   element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><WorkflowDesigner /></Suspense>} />
          <Route path="automation/settings"   element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><AutomationSettings /></Suspense>} />

          {/* Phase 19 – Enterprise Financial Management */}
          <Route path="finance" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><FinanceDashboard /></Suspense>} />
          <Route path="finance/invoices" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><InvoiceCenter /></Suspense>} />
          <Route path="finance/invoices/new" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><InvoiceBuilder /></Suspense>} />
          <Route path="finance/ar" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><AccountsReceivable /></Suspense>} />
          <Route path="finance/ap" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><AccountsPayable /></Suspense>} />
          <Route path="finance/expenses" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><ExpenseCenter /></Suspense>} />
          <Route path="finance/bank-recon" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><FinBankReconciliation /></Suspense>} />
          <Route path="finance/cashflow" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><CashFlowDashboard /></Suspense>} />
          <Route path="finance/budget" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><BudgetPlanner /></Suspense>} />
          <Route path="finance/cost-centers" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><CostCenterManagement /></Suspense>} />
          <Route path="finance/forecast" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><FinancialForecast /></Suspense>} />
          <Route path="finance/ledger" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><GeneralLedgerPage /></Suspense>} />
          <Route path="finance/journal" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><JournalEntries /></Suspense>} />
          <Route path="finance/trial-balance" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><TrialBalancePage /></Suspense>} />
          <Route path="finance/pnl" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><FinProfitAndLoss /></Suspense>} />
          <Route path="finance/balance-sheet" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><BalanceSheetPage /></Suspense>} />
          <Route path="finance/gst" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><GSTDashboard /></Suspense>} />
          <Route path="finance/tax" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><TaxManagement /></Suspense>} />
          <Route path="finance/analytics" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><FinanceAnalytics /></Suspense>} />
          <Route path="finance/copilot" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><AIFinanceCopilot /></Suspense>} />

          {/* Phase 18 – AI Digital Twin, Simulation & Autonomous Operations */}
          <Route path="simulation" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><DigitalTwinDashboard /></Suspense>} />
          <Route path="simulation/center" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><SimulationCenter /></Suspense>} />
          <Route path="simulation/scenario-builder" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><ScenarioBuilder /></Suspense>} />
          <Route path="simulation/scenario-library" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><ScenarioLibrary /></Suspense>} />
          <Route path="simulation/autonomous" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><AutonomousDecisions /></Suspense>} />
          <Route path="simulation/capacity" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><CapacityPlanning /></Suspense>} />
          <Route path="simulation/demand" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><DemandPlanning /></Suspense>} />
          <Route path="simulation/carbon" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><CarbonDashboard /></Suspense>} />
          <Route path="simulation/sustainability" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><SustainabilityDashboard /></Suspense>} />
          <Route path="simulation/risk" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><RiskSimulation /></Suspense>} />
          <Route path="simulation/bcp" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><BusinessContinuity /></Suspense>} />
          <Route path="simulation/recovery" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><RecoveryCenter /></Suspense>} />
          <Route path="simulation/analytics" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><SimulationAnalytics /></Suspense>} />
          <Route path="simulation/executive" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><ExecutiveSimulation /></Suspense>} />
          <Route path="simulation/recommendations" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><AIRecommendations /></Suspense>} />

          {/* Phase 17 – AI Enterprise Integration Platform */}
          <Route path="integration" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><IntegrationDashboard /></Suspense>} />
          <Route path="integration/gateway" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><APIGateway /></Suspense>} />
          <Route path="integration/webhooks" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><WebhookManager /></Suspense>} />
          <Route path="integration/api-keys" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><APIKeys /></Suspense>} />
          <Route path="integration/connectors" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><ConnectorMarketplace /></Suspense>} />
          <Route path="integration/erp" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><ERPIntegrations /></Suspense>} />
          <Route path="integration/crm" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><CRMIntegrations /></Suspense>} />
          <Route path="integration/accounting" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><AccountingIntegrations /></Suspense>} />
          <Route path="integration/marketplace" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><MarketplaceIntegrations /></Suspense>} />
          <Route path="integration/events" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><EventBusMonitor /></Suspense>} />
          <Route path="integration/sync" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><SyncDashboard /></Suspense>} />
          <Route path="integration/oauth" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><OAuthManager /></Suspense>} />
          <Route path="integration/api-docs" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><APIDocs /></Suspense>} />
          <Route path="integration/analytics" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><APIAnalytics /></Suspense>} />
          <Route path="integration/logs" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><IntegrationLogs /></Suspense>} />
          <Route path="integration/developer" element={<Suspense fallback={<div style={{padding:32,color:'#64748b'}}>Loading…</div>}><DeveloperPortal /></Suspense>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
