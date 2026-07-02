import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import TodaysTripsScreen from '../screens/TodaysTripsScreen';
import PODScreen from '../screens/PODScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#f8fafc', contentStyle: { backgroundColor: '#0f172a' } }}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={TodaysTripsScreen} options={{ title: "Today's Trips" }} />
        <Stack.Screen name="POD" component={PODScreen} options={{ title: 'Proof of Delivery' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
