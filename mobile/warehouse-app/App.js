import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import ScannerScreen from "./src/screens/ScannerScreen";
import InboundScreen from "./src/screens/InboundScreen";

const Tab = createBottomTabNavigator();
const tabOpts = { tabBarStyle: { backgroundColor: "#0f172a", borderTopColor: "#1e293b" }, tabBarActiveTintColor: "#38bdf8", tabBarInactiveTintColor: "#475569", headerStyle: { backgroundColor: "#0f172a" }, headerTintColor: "#f8fafc" };

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={tabOpts}>
        <Tab.Screen name="Scanner" component={ScannerScreen} options={{ tabBarLabel: "Scan", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📷</Text> }} />
        <Tab.Screen name="Inbound" component={InboundScreen} options={{ tabBarLabel: "Inbound", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📦</Text> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
