import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import ExecutiveDashboardScreen from "./src/screens/ExecutiveDashboardScreen";

const Tab = createBottomTabNavigator();
const tabOpts = { tabBarStyle: { backgroundColor: "#0f172a", borderTopColor: "#1e293b" }, tabBarActiveTintColor: "#38bdf8", tabBarInactiveTintColor: "#475569", headerStyle: { backgroundColor: "#0f172a" }, headerTintColor: "#f8fafc" };

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={tabOpts}>
        <Tab.Screen name="Dashboard" component={ExecutiveDashboardScreen} options={{ title: "Executive KPIs", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
