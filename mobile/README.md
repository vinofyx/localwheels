# LocalWheels Mobile Applications

Four React Native apps for field operations:

| App | Users | Key Features |
|-----|-------|--------------|
| driver-app | Truck drivers | Trips, POD, Fuel, Incidents |
| warehouse-app | Warehouse staff | Inbound/Outbound, Barcode, Inventory |
| customer-app | Customers | Tracking, Invoices, Payments, AI Chat |
| executive-app | C-suite | KPIs, BI, AI Insights, Approvals |

## Prerequisites
- Node.js 20+
- React Native CLI: `npm install -g react-native-cli`
- Android Studio (for Android builds)
- Xcode (for iOS builds — macOS only)

## Setup (each app)
```bash
cd mobile/<app-name>
npm install
# Android
npx react-native run-android
# iOS
cd ios && pod install && cd ..
npx react-native run-ios
```

## API Base URL
Set `API_BASE_URL` in `src/config.js` to point to the backend.
