import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import BranchSelect from './pages/BranchSelect';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Shipments from './pages/Shipments';
import CreateShipment from './pages/CreateShipment';
import ShipmentDetail from './pages/ShipmentDetail';
import POD from './pages/POD';
import Payments from './pages/Payments';
import Users from './pages/Users';
import Track from './pages/Track';
import PartyCustomer from './pages/master/PartyCustomer';
import VendorAgent from './pages/master/VendorAgent';
import PackageType from './pages/master/PackageType';
import MaterialDescription from './pages/master/MaterialDescription';
import ReasonMaster from './pages/master/ReasonMaster';
import LRMaster from './pages/master/LRMaster';
import StationaryAllocation from './pages/master/StationaryAllocation';
import PartyLinkToSuperParty from './pages/master/PartyLinkToSuperParty';
import TransitMode from './pages/master/TransitMode';
import AccountsCostCenter from './pages/accounts/CostCenter';
import Ledger from './pages/accounts/Ledger';
import Group from './pages/accounts/Group';
import OpeningBills from './pages/accounts/OpeningBills';
import BankRecoOpening from './pages/accounts/BankRecoOpening';
import OpeningMemos from './pages/accounts/OpeningMemos';
import CostCategory from './pages/accounts/CostCategory';
import Division from './pages/master/location/Division';
import Zone from './pages/master/location/Zone';
import Region from './pages/master/location/Region';
import Branch from './pages/master/location/Branch';
import Location from './pages/master/location/Location';
import StateMaster from './pages/master/location/StateMaster';
import Vehicle from './pages/master/vehicle/Vehicle';
import LoadType from './pages/master/vehicle/LoadType';
import RTOInsurance from './pages/master/vehicle/RTOInsurance';
import DocumentMaster from './pages/master/vehicle/DocumentMaster';
import ExpenseCharges from './pages/master/charge/ExpenseCharges';
import SalesCharges from './pages/master/charge/SalesCharges';
import DriverMaster from './pages/master/driver/DriverMaster';
import DriverMapping from './pages/master/driver/DriverMapping';
import CustomerContract from './pages/master/contract/CustomerContract';
import VendorContract from './pages/master/contract/VendorContract';
import RouteMaster from './pages/master/route/RouteMaster';
import RouteExpenses from './pages/master/RouteExpenses';
import DieselRate from './pages/master/route/DieselRate';
import TATMaster from './pages/master/tat/TATMaster';
import TATCalculate from './pages/master/tat/TATCalculate';
import LeaveHolidayMaster from './pages/master/tat/LeaveHolidayMaster';
import ReBooking from './pages/entries/ReBooking';
import Memo from './pages/entries/Memo';
import LoadingSheet from './pages/entries/LoadingSheet';
import LHS from './pages/entries/LHS';
import TouchingLR from './pages/entries/TouchingLR';
import LinkMemo from './pages/entries/LinkMemo';
import LinkLDM from './pages/entries/LinkLDM';
import LinkLCM from './pages/entries/LinkLCM';
import VehicleInOut from './pages/entries/VehicleInOut';
import ExtraAdvanceDiesel from './pages/entries/ExtraAdvanceDiesel';
import TripSettlement from './pages/entries/TripSettlement';
import MarketLoadMemo from './pages/entries/MarketLoadMemo';
import MarketLoadBalance from './pages/entries/MarketLoadBalance';
import FasTagImport from './pages/entries/FasTagImport';
import DieselImport from './pages/entries/DieselImport';
import SettledTrip from './pages/entries/SettledTrip';
import NonSettledTrip from './pages/entries/NonSettledTrip';
import TripNotLinkToDiesel from './pages/entries/TripNotLinkToDiesel';
import TripsheetSummary from './pages/entries/TripsheetSummary';
import MLOutstanding from './pages/entries/MLOutstanding';
import MarketLoadRegister from './pages/entries/MarketLoadRegister';
import FleetRouteExpenses from './pages/entries/RouteExpenses';
import VehicleArrival from './pages/entries/VehicleArrival';
import Delivery from './pages/entries/Delivery';
import PODSubmit from './pages/entries/PODSubmit';
import PODSendBranch from './pages/entries/PODSendBranch';
import PODReceived from './pages/entries/PODReceived';
import UploadPOD from './pages/entries/UploadPOD';
import DownloadMultiPOD from './pages/entries/DownloadMultiPOD';
import PODSendCustomer from './pages/entries/PODSendCustomer';
import BillingAgainstLR from './pages/entries/BillingAgainstLR';
import BillingWithoutLR from './pages/entries/BillingWithoutLR';
import BillSubmission from './pages/entries/BillSubmission';
import UnbilledChecklist from './pages/entries/UnbilledChecklist';
import LCM from './pages/entries/LCM';
import LDMDRS from './pages/entries/LDMDRS';
import LDMDRSSettlement from './pages/entries/LDMDRSSettlement';
import OrderPickupReq from './pages/entries/OrderPickupReq';
import VerifyOrder from './pages/entries/VerifyOrder';
import RoutePlanning from './pages/entries/RoutePlanning';
import VehicleAssign from './pages/entries/VehicleAssign';
import OrderRegister from './pages/entries/OrderRegister';
import StickerThermal from './pages/entries/StickerThermal';
import EwayExtendImport from './pages/entries/EwayExtendImport';
import EwayUpdateSearch from './pages/entries/EwayUpdateSearch';
import EwayLinkAgainstLR from './pages/entries/EwayLinkAgainstLR';
import PendingPartBEWB from './pages/entries/PendingPartBEWB';
import ExtendedEwayReport from './pages/entries/ExtendedEwayReport';
import EwayBillReport from './pages/entries/EwayBillReport';
import HoldLostDamage from './pages/entries/HoldLostDamage';
import DownloadDamage from './pages/entries/DownloadDamage';
import CNSettlement from './pages/entries/CNSettlement';
import CNDelayRemark from './pages/entries/CNDelayRemark';
import CancelDocument from './pages/entries/CancelDocument';
import CustomerAppointment from './pages/entries/CustomerAppointment';
import CustomerAppointmentReport from './pages/entries/CustomerAppointmentReport';
import ModifyLR from './pages/modify/ModifyLR';
import ModifyMemo from './pages/modify/ModifyMemo';
import ModifyBillWithLR from './pages/modify/ModifyBillWithLR';
import ModifyBillWithoutLR from './pages/modify/ModifyBillWithoutLR';
import ModifyMR from './pages/modify/ModifyMR';
import ModifyLDMDRS from './pages/modify/ModifyLDMDRS';
import ModifyLRAnyBranch from './pages/modify/ModifyLRAnyBranch';
import ModifyMRAnyBranch from './pages/modify/ModifyMRAnyBranch';
import ModifyMemoAny from './pages/modify/ModifyMemoAny';
import ModifyLCMLOCAny from './pages/modify/ModifyLCMLOCAny';
import ModifyLDMDRSAny from './pages/modify/ModifyLDMDRSAny';
import ModifyBillWithLRAny from './pages/modify/ModifyBillWithLRAny';
import ModifyBillWithoutLRAny from './pages/modify/ModifyBillWithoutLRAny';
import ModifyLHS from './pages/modify/ModifyLHS';
import ModifyLHSAnyBranch from './pages/modify/ModifyLHSAnyBranch';
import ModifyBranchVoucherAny from './pages/modify/ModifyBranchVoucherAny';
import ModifyLRExpensesAny from './pages/modify/ModifyLRExpensesAny';
import MissingDocument from './pages/reports/MissingDocument';
import LocationMasterReport from './pages/reports/master/LocationMaster';
import BranchMasterReport from './pages/reports/master/BranchMaster';
import CustomerMasterReport from './pages/reports/master/CustomerMaster';
import VendorMasterReport from './pages/reports/master/VendorMaster';
import DriverMasterReport from './pages/reports/master/DriverMaster';
import VehicleMasterReport from './pages/reports/master/VehicleMaster';
import LoadTypeReport from './pages/reports/master/LoadType';
import IncomeChargesReport from './pages/reports/master/IncomeCharges';
import ExpenceChargesReport from './pages/reports/master/ExpenceCharges';
import LedgerMasterReport from './pages/reports/master/LedgerMaster';
import GroupMasterReport from './pages/reports/master/GroupMaster';
import StationaryAllocationReport from './pages/reports/master/StationaryAllocation';
import CustomerContractReport from './pages/reports/master/CustomerContract';
import VendorContractReport from './pages/reports/master/VendorContract';
import OpeningBillsReport from './pages/reports/master/OpeningBills';
import BookingRegisterHO from './pages/reports/lr/BookingRegisterHO';
import BookingRegisterBranch from './pages/reports/lr/BookingRegisterBranch';
import CustomerMIS from './pages/reports/lr/CustomerMIS';
import TrackingMIS from './pages/mis/TrackingMIS';
import TransactionHistory from './pages/mis/TransactionHistory';
import BranchPendency from './pages/mis/BranchPendency';
import BillOS from './pages/mis/party-outstanding/BillOS';
import BillUnbill from './pages/mis/party-outstanding/BillUnbill';
import OverdueBills from './pages/mis/party-outstanding/OverdueBills';
import ToPayOSGrid from './pages/mis/party-outstanding/ToPayOSGrid';
import PaidOSGrid from './pages/mis/party-outstanding/PaidOSGrid';
import MemoWiseOS from './pages/mis/hire-vehicle-os/MemoWiseOS';
import VendorOutstanding from './pages/mis/hire-vehicle-os/VendorOutstanding';
import LRProfitability from './pages/mis/profitability/LRProfitability';
import TripWiseProfit from './pages/mis/profitability/TripWiseProfit';
import VehicleProfitability from './pages/mis/profitability/VehicleProfitability';
import MISDashboard from './pages/mis/dashboard/MISDashboard';
import TATAnalysis from './pages/mis/dashboard/TATAnalysis';
import BranchPerformance from './pages/mis/BranchPerformance';
import BranchSaleMonthly from './pages/mis/BranchSaleMonthly';
import PartySaleMonthly from './pages/mis/PartySaleMonthly';
import LRTransitSummary from './pages/mis/LRTransitSummary';
import AccountAnalysis from './pages/mis/AccountAnalysis';
import BranchVoucher from './pages/account-entries/BranchVoucher';
import HireVehiclePayment from './pages/account-entries/HireVehiclePayment';
import MoneyReceiptMR from './pages/account-entries/MoneyReceiptMR';
import CustomerCrDrNote from './pages/account-entries/CustomerCrDrNote';
import MemoExpenses from './pages/account-entries/MemoExpenses';
import LRExpenses from './pages/account-entries/LRExpenses';
import VendorSupplierBill from './pages/account-entries/VendorSupplierBill';
import VendorBillPayment from './pages/account-entries/VendorBillPayment';
import VendorCrDrNote from './pages/account-entries/VendorCrDrNote';
import UnbillMemo from './pages/account-entries/UnbillMemo';
import VoucherEntry from './pages/account-entries/VoucherEntry';
import BankReconciliation from './pages/account-entries/BankReconciliation';
import AccountStatement from './pages/account-reports/AccountStatement';
import BrCashBankBook from './pages/account-reports/BrCashBankBook';
import MRSummary from './pages/account-reports/mr/MRSummary';
import BillCollection from './pages/account-reports/mr/BillCollection';
import PaidCollection from './pages/account-reports/mr/PaidCollection';
import TopayCollection from './pages/account-reports/mr/TopayCollection';
import BillPendingMR from './pages/account-reports/mr/BillPendingMR';
import PaymentSummary from './pages/account-reports/hire-veh/PaymentSummary';
import PaymentDetails from './pages/account-reports/hire-veh/PaymentDetails';
import CustCrDrNoteReg from './pages/account-reports/CustCrDrNoteReg';
import OpeningReference from './pages/account-reports/OpeningReference';
import MemoExpensesReg from './pages/account-reports/MemoExpensesReg';
import SalesRegister from './pages/account-reports/voucher/SalesRegister';
import RegisterReceipt from './pages/account-reports/voucher/RegisterReceipt';
import PaymentRegister from './pages/account-reports/voucher/PaymentRegister';
import PurchaseRegister from './pages/account-reports/voucher/PurchaseRegister';
import JournalRegister from './pages/account-reports/voucher/JournalRegister';
import ContraRegister from './pages/account-reports/voucher/ContraRegister';
import CreditNoteRegister from './pages/account-reports/voucher/CreditNoteRegister';
import DebitNoteRegister from './pages/account-reports/voucher/DebitNoteRegister';
import Daybook from './pages/account-reports/Daybook';
import IncomeRegister from './pages/account-reports/auditors/IncomeRegister';
import ExpensesRegister from './pages/account-reports/auditors/ExpensesRegister';
import OSReport from './pages/account-reports/OSReport';
import TrailBalance from './pages/account-reports/final-books/TrailBalance';
import ProfitAndLoss from './pages/account-reports/final-books/ProfitAndLoss';
import BalanceSheet from './pages/account-reports/final-books/BalanceSheet';
import TDSReceivableReg from './pages/account-reports/taxation/TDSReceivableReg';
import TDSRegBillwise from './pages/account-reports/taxation/TDSRegBillwise';
import TDSPayableReg from './pages/account-reports/taxation/TDSPayableReg';
import GSTR1 from './pages/account-reports/taxation/GSTR1';
import GSTR2 from './pages/account-reports/taxation/GSTR2';
import GSTR1Return from './pages/account-reports/taxation/GSTR1Return';
import GSTR1B2B from './pages/account-reports/taxation/GSTR1B2B';
import GSTR1HSN from './pages/account-reports/taxation/GSTR1HSN';
import CustomerOnAccount from './pages/account-reports/CustomerOnAccount';
import VendorAdjOnAccount from './pages/account-reports/VendorAdjOnAccount';
import LRTracking from './pages/tracking/LRTracking';
import MultiLRTracking from './pages/tracking/MultiLRTracking';
import LREnquiry from './pages/tracking/LREnquiry';
import MemoEnquiry from './pages/tracking/MemoEnquiry';
import UserActivity from './pages/tracking/UserActivity';
import LRCostAnalysis from './pages/tracking/LRCostAnalysis';
import ReferenceTrack from './pages/tracking/ReferenceTrack';
import VehCurrentStatus from './pages/tracking/VehCurrentStatus';
import SelectFinYear from './pages/switch/SelectFinYear';
import UserCreation from './pages/config/UserCreation';
import LevelMaster from './pages/config/LevelMaster';
import UserInterface from './pages/config/UserInterface';
import DocumentDeletion from './pages/config/DocumentDeletion';
import UploadDocument from './pages/config/UploadDocument';
import Backup from './pages/config/Backup';
import VoucherMismatch from './pages/config/VoucherMismatch';
import MobileCRMLogin from './pages/config/MobileCRMLogin';
import UserRemoteAccess from './pages/config/UserRemoteAccess';
import DayEnd from './pages/config/DayEnd';
import ImportUtility from './pages/config/ImportUtility';
import CustomerConfig from './pages/config/CustomerConfig';
import AutoMailSetting from './pages/config/AutoMailSetting';
import ComplaintRegister from './pages/config/ComplaintRegister';
import DailyBranchInwardOutward from './pages/reports/lr/DailyBranchInwardOutward';
import LRCancelRegister from './pages/reports/lr/LRCancelRegister';
import ZeroFreightLRs from './pages/reports/lr/ZeroFreightLRs';
import PaidRegister from './pages/reports/lr/PaidRegister';
import TopayRegister from './pages/reports/lr/TopayRegister';
import CNCurrentStatus from './pages/reports/lr/CNCurrentStatus';
import MemoPendingLR from './pages/reports/memo/MemoPendingLR';
import MemoSummary from './pages/reports/memo/MemoSummary';
import MemoRegister from './pages/reports/memo/MemoRegister';
import ZeroFreightMemo from './pages/reports/memo/ZeroFreightMemo';
import DieselStatement from './pages/reports/DieselStatement';
import FasTagStatement from './pages/reports/FasTagStatement';
import LHSSummary from './pages/reports/lhs/LHSSummary';
import LHSPending from './pages/reports/lhs/LHSPending';
import LHSRegister from './pages/reports/lhs/LHSRegister';
import StockDashboard from './pages/reports/stock/StockDashboard';
import ShortExcessReg from './pages/reports/stock/ShortExcessReg';
import GodownStock from './pages/reports/stock/GodownStock';
import GodownStockGrid from './pages/reports/stock/GodownStockGrid';
import PartialDispatchStock from './pages/reports/stock/PartialDispatchStock';
import NonSubmitPOD from './pages/reports/pod/NonSubmitPOD';
import AgentDashboard from './pages/AgentDashboard';
import SupportAdmin from './pages/SupportAdmin';
import DispatcherView from './pages/DispatcherView';
import RouteOptimizer from './pages/RouteOptimizer';
import FleetDashboard from './pages/FleetDashboard';
import DispatchCenter from './pages/DispatchCenter';
import ComplaintCenter from './pages/ComplaintCenter';
import CustomerComplaintPortal from './pages/CustomerComplaintPortal';
import QuoteGenerator from './pages/QuoteGenerator';
import QuoteAdmin from './pages/QuoteAdmin';
import VoiceAssistant from './pages/VoiceAssistant';
import VoiceHistory from './pages/VoiceHistory';
import VoiceAnalytics from './pages/VoiceAnalytics';
import KnowledgeBase from './pages/KnowledgeBase';
import SalesDashboard from './pages/SalesDashboard';
import LeadManagement from './pages/LeadManagement';
import SalesPipeline from './pages/SalesPipeline';
import SalesAnalyticsPage from './pages/SalesAnalyticsPage';
import AISalesCopilot from './pages/AISalesCopilot';
import DriverDashboard from './pages/DriverDashboard';
import DriverTrips from './pages/DriverTrips';
import TripDetails from './pages/TripDetails';
import DigitalPOD from './pages/DigitalPOD';
import DriverPerformance from './pages/DriverPerformance';
import DriverDocuments from './pages/DriverDocuments';
import IncidentReporting from './pages/IncidentReporting';
import VoiceDriver from './pages/VoiceDriver';
import ExecutiveDashboardPage from './pages/bi/ExecutiveDashboard';
import BusinessIntelligence from './pages/bi/BusinessIntelligence';
import ForecastDashboard from './pages/bi/ForecastDashboard';
import AlertsCenter from './pages/bi/AlertsCenter';
import ExecutiveReports from './pages/bi/ExecutiveReports';
import BranchAnalytics from './pages/bi/BranchAnalytics';
import FinancialDashboard from './pages/bi/FinancialDashboard';
import CustomerAnalytics from './pages/bi/CustomerAnalytics';
import OperationsDashboard from './pages/bi/OperationsDashboard';
import AIExecutiveCopilot from './pages/bi/AIExecutiveCopilot';
// Phase 13 — AI Predictive Maintenance & IoT Fleet Intelligence
import FleetIntelligenceDashboard from './pages/maintenance/FleetIntelligenceDashboard';
import LiveTelemetry from './pages/maintenance/LiveTelemetry';
import VehicleHealthPage from './pages/maintenance/VehicleHealthPage';
import MaintenanceCenter from './pages/maintenance/MaintenanceCenter';
import WorkOrders from './pages/maintenance/WorkOrders';
import WorkshopManagement from './pages/maintenance/WorkshopManagement';
import FuelIntelligencePage from './pages/maintenance/FuelIntelligence';
import DriverBehaviourPage from './pages/maintenance/DriverBehaviourPage';
import BatteryAnalytics from './pages/maintenance/BatteryAnalytics';
import EngineAnalytics from './pages/maintenance/EngineAnalytics';
import TyreAnalytics from './pages/maintenance/TyreAnalytics';
// Phase 14 – AI Warehouse Management System (WMS)
import WarehouseDashboard from './pages/warehouse/WarehouseDashboard';
import WarehouseMaster from './pages/warehouse/WarehouseMaster';
import InventoryPage from './pages/warehouse/InventoryPage';
import InboundCenter from './pages/warehouse/InboundCenter';
import OutboundCenter from './pages/warehouse/OutboundCenter';
import WarehouseTasks from './pages/warehouse/WarehouseTasks';
import WarehouseAI from './pages/warehouse/WarehouseAI';
import DockManagement from './pages/warehouse/DockManagement';
import BarcodeCenter from './pages/warehouse/BarcodeCenter';
import WarehouseAnalytics from './pages/warehouse/WarehouseAnalytics';
import WarehouseForecast from './pages/warehouse/WarehouseForecast';
// Phase 15 – AI Supply Chain Control Tower & Enterprise Visibility
import ControlTower from './pages/enterprise/ControlTower';
import GlobalOperations from './pages/enterprise/GlobalOperations';
import SupplierManagement from './pages/enterprise/SupplierManagement';
import VendorManagement from './pages/enterprise/VendorManagement';
import PurchaseOrders from './pages/enterprise/PurchaseOrders';
import SalesOrders from './pages/enterprise/SalesOrders';
import EnterpriseIncidents from './pages/enterprise/EnterpriseIncidents';
import CollaborationCenter from './pages/enterprise/CollaborationCenter';
import RiskCenter from './pages/enterprise/RiskCenter';
import AIDecisionCenter from './pages/enterprise/AIDecisionCenter';
import ExecutiveCockpit from './pages/enterprise/ExecutiveCockpit';
import CustomerPortal2 from './pages/enterprise/CustomerPortal2';
import EnterpriseAnalytics from './pages/enterprise/EnterpriseAnalytics';
import DocumentDashboard from './pages/documents/DocumentDashboard';
import DocumentRepository from './pages/documents/DocumentRepository';
import UploadCenter from './pages/documents/UploadCenter';
import OCRViewer from './pages/documents/OCRViewer';
import ValidationDashboard from './pages/documents/ValidationDashboard';
import ApprovalDashboard from './pages/documents/ApprovalDashboard';
import DocumentSearch from './pages/documents/DocumentSearch';
import DocumentAnalytics from './pages/documents/DocumentAnalytics';
import VersionHistory from './pages/documents/VersionHistory';
import RecycleBin from './pages/documents/RecycleBin';
// Phase 16 – AI Enterprise Automation & Hyper Automation Platform
import AutomationDashboard from './pages/automation/AutomationDashboard';
import WorkflowBuilder from './pages/automation/WorkflowBuilder';
import WorkflowTemplates from './pages/automation/WorkflowTemplates';
import AutomationJobs from './pages/automation/AutomationJobs';
import DigitalWorkers from './pages/automation/DigitalWorkers';
import ApprovalCenter from './pages/automation/ApprovalCenter';
import EnterpriseScheduler from './pages/automation/EnterpriseScheduler';
import AutomationAnalytics from './pages/automation/AutomationAnalytics';
import WorkflowMonitoring from './pages/automation/WorkflowMonitoring';
import ExecutionHistory from './pages/automation/ExecutionHistory';
import WorkflowDesigner from './pages/automation/WorkflowDesigner';
import AutomationSettings from './pages/automation/AutomationSettings';

// Phase 18 – AI Digital Twin, Simulation & Autonomous Operations
import DigitalTwinDashboard  from './pages/simulation/DigitalTwinDashboard';
import SimulationCenter      from './pages/simulation/SimulationCenter';
import ScenarioBuilder       from './pages/simulation/ScenarioBuilder';
import ScenarioLibrary       from './pages/simulation/ScenarioLibrary';
import AutonomousDecisions   from './pages/simulation/AutonomousDecisions';
import CapacityPlanning      from './pages/simulation/CapacityPlanning';
import DemandPlanning        from './pages/simulation/DemandPlanning';
import CarbonDashboard       from './pages/simulation/CarbonDashboard';
import SustainabilityDashboard from './pages/simulation/SustainabilityDashboard';
import RiskSimulation        from './pages/simulation/RiskSimulation';
import BusinessContinuity    from './pages/simulation/BusinessContinuity';
import RecoveryCenter        from './pages/simulation/RecoveryCenter';
import SimulationAnalytics   from './pages/simulation/SimulationAnalytics';
import ExecutiveSimulation   from './pages/simulation/ExecutiveSimulation';
import AIRecommendations     from './pages/simulation/AIRecommendations';

// Phase 17 – AI Enterprise Integration Platform
import IntegrationDashboard  from './pages/integration/IntegrationDashboard';
import APIGateway            from './pages/integration/APIGateway';
import WebhookManager        from './pages/integration/WebhookManager';
import APIKeys               from './pages/integration/APIKeys';
import ConnectorMarketplace  from './pages/integration/ConnectorMarketplace';
import ERPIntegrations       from './pages/integration/ERPIntegrations';
import CRMIntegrations       from './pages/integration/CRMIntegrations';
import AccountingIntegrations from './pages/integration/AccountingIntegrations';
import MarketplaceIntegrations from './pages/integration/MarketplaceIntegrations';
import EventBusMonitor       from './pages/integration/EventBusMonitor';
import SyncDashboard         from './pages/integration/SyncDashboard';
import OAuthManager          from './pages/integration/OAuthManager';
import APIDocs               from './pages/integration/APIDocs';
import APIAnalytics          from './pages/integration/APIAnalytics';
import IntegrationLogs       from './pages/integration/IntegrationLogs';
import DeveloperPortal       from './pages/integration/DeveloperPortal';

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
          <Route path="tracking/lr-tracking"                    element={<LRTracking />} />
          <Route path="tracking/multi-lr-tracking"              element={<MultiLRTracking />} />
          <Route path="tracking/lr-enquiry"                     element={<LREnquiry />} />
          <Route path="tracking/memo-enquiry"                   element={<MemoEnquiry />} />
          <Route path="tracking/user-activity"                  element={<UserActivity />} />
          <Route path="tracking/lr-cost-analysis"              element={<LRCostAnalysis />} />
          <Route path="tracking/reference-track"               element={<ReferenceTrack />} />
          <Route path="tracking/veh-current-status"            element={<VehCurrentStatus />} />
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
          <Route path="maintenance"                          element={<FleetIntelligenceDashboard />} />
          <Route path="maintenance/telemetry"               element={<LiveTelemetry />} />
          <Route path="maintenance/vehicle-health"          element={<VehicleHealthPage />} />
          <Route path="maintenance/center"                  element={<MaintenanceCenter />} />
          <Route path="maintenance/workorders"              element={<WorkOrders />} />
          <Route path="maintenance/workshops"               element={<WorkshopManagement />} />
          <Route path="maintenance/fuel"                    element={<FuelIntelligencePage />} />
          <Route path="maintenance/driver-behaviour"        element={<DriverBehaviourPage />} />
          <Route path="maintenance/battery"                 element={<BatteryAnalytics />} />
          <Route path="maintenance/engine"                  element={<EngineAnalytics />} />
          <Route path="maintenance/tyres"                   element={<TyreAnalytics />} />
          <Route path="documents"                            element={<DocumentDashboard />} />
          <Route path="documents/repository"                 element={<DocumentRepository />} />
          <Route path="documents/upload"                     element={<UploadCenter />} />
          <Route path="documents/ocr/:id"                    element={<OCRViewer />} />
          <Route path="documents/validation"                 element={<ValidationDashboard />} />
          <Route path="documents/approval"                   element={<ApprovalDashboard />} />
          <Route path="documents/search"                     element={<DocumentSearch />} />
          <Route path="documents/analytics"                  element={<DocumentAnalytics />} />
          <Route path="documents/versions/:id"               element={<VersionHistory />} />
          <Route path="documents/recycle-bin"                element={<RecycleBin />} />
          {/* Phase 14 – AI Warehouse Management System (WMS) */}
          <Route path="warehouse"                           element={<WarehouseDashboard />} />
          <Route path="warehouse/master"                   element={<WarehouseMaster />} />
          <Route path="warehouse/inventory"                element={<InventoryPage />} />
          <Route path="warehouse/inbound"                  element={<InboundCenter />} />
          <Route path="warehouse/outbound"                 element={<OutboundCenter />} />
          <Route path="warehouse/tasks"                    element={<WarehouseTasks />} />
          <Route path="warehouse/ai"                       element={<WarehouseAI />} />
          <Route path="warehouse/docks"                    element={<DockManagement />} />
          <Route path="warehouse/barcode"                  element={<BarcodeCenter />} />
          <Route path="warehouse/analytics"               element={<WarehouseAnalytics />} />
          <Route path="warehouse/forecast"                 element={<WarehouseForecast />} />
          {/* Phase 15 – AI Supply Chain Control Tower & Enterprise Visibility */}
          <Route path="enterprise/control-tower"   element={<ControlTower />} />
          <Route path="enterprise/operations"      element={<GlobalOperations />} />
          <Route path="enterprise/suppliers"       element={<SupplierManagement />} />
          <Route path="enterprise/vendors"         element={<VendorManagement />} />
          <Route path="enterprise/purchase-orders" element={<PurchaseOrders />} />
          <Route path="enterprise/sales-orders"    element={<SalesOrders />} />
          <Route path="enterprise/incidents"       element={<EnterpriseIncidents />} />
          <Route path="enterprise/collaboration"   element={<CollaborationCenter />} />
          <Route path="enterprise/risk"            element={<RiskCenter />} />
          <Route path="enterprise/ai-decisions"    element={<AIDecisionCenter />} />
          <Route path="enterprise/cockpit"         element={<ExecutiveCockpit />} />
          <Route path="enterprise/customer-portal" element={<CustomerPortal2 />} />
          <Route path="enterprise/analytics"       element={<EnterpriseAnalytics />} />
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
          <Route path="automation"                element={<AutomationDashboard />} />
          <Route path="automation/builder"        element={<WorkflowBuilder />} />
          <Route path="automation/templates"      element={<WorkflowTemplates />} />
          <Route path="automation/jobs"           element={<AutomationJobs />} />
          <Route path="automation/workers"        element={<DigitalWorkers />} />
          <Route path="automation/approvals"      element={<ApprovalCenter />} />
          <Route path="automation/scheduler"      element={<EnterpriseScheduler />} />
          <Route path="automation/analytics"      element={<AutomationAnalytics />} />
          <Route path="automation/monitoring"     element={<WorkflowMonitoring />} />
          <Route path="automation/history"        element={<ExecutionHistory />} />
          <Route path="automation/designer"       element={<WorkflowDesigner />} />
          <Route path="automation/settings"       element={<AutomationSettings />} />

          {/* Phase 18 – AI Digital Twin, Simulation & Autonomous Operations */}
          <Route path="simulation"                   element={<DigitalTwinDashboard />} />
          <Route path="simulation/center"            element={<SimulationCenter />} />
          <Route path="simulation/scenario-builder"  element={<ScenarioBuilder />} />
          <Route path="simulation/scenario-library"  element={<ScenarioLibrary />} />
          <Route path="simulation/autonomous"        element={<AutonomousDecisions />} />
          <Route path="simulation/capacity"          element={<CapacityPlanning />} />
          <Route path="simulation/demand"            element={<DemandPlanning />} />
          <Route path="simulation/carbon"            element={<CarbonDashboard />} />
          <Route path="simulation/sustainability"    element={<SustainabilityDashboard />} />
          <Route path="simulation/risk"              element={<RiskSimulation />} />
          <Route path="simulation/bcp"               element={<BusinessContinuity />} />
          <Route path="simulation/recovery"          element={<RecoveryCenter />} />
          <Route path="simulation/analytics"         element={<SimulationAnalytics />} />
          <Route path="simulation/executive"         element={<ExecutiveSimulation />} />
          <Route path="simulation/recommendations"   element={<AIRecommendations />} />

          {/* Phase 17 – AI Enterprise Integration Platform */}
          <Route path="integration"              element={<IntegrationDashboard />} />
          <Route path="integration/gateway"      element={<APIGateway />} />
          <Route path="integration/webhooks"     element={<WebhookManager />} />
          <Route path="integration/api-keys"     element={<APIKeys />} />
          <Route path="integration/connectors"   element={<ConnectorMarketplace />} />
          <Route path="integration/erp"          element={<ERPIntegrations />} />
          <Route path="integration/crm"          element={<CRMIntegrations />} />
          <Route path="integration/accounting"   element={<AccountingIntegrations />} />
          <Route path="integration/marketplace"  element={<MarketplaceIntegrations />} />
          <Route path="integration/events"       element={<EventBusMonitor />} />
          <Route path="integration/sync"         element={<SyncDashboard />} />
          <Route path="integration/oauth"        element={<OAuthManager />} />
          <Route path="integration/api-docs"     element={<APIDocs />} />
          <Route path="integration/analytics"    element={<APIAnalytics />} />
          <Route path="integration/logs"         element={<IntegrationLogs />} />
          <Route path="integration/developer"    element={<DeveloperPortal />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
