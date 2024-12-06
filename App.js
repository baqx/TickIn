import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, StatusBar, Platform, Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PaperProvider } from "react-native-paper";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import NetInfo from "@react-native-community/netinfo";
import NoInternetModal from "./components/NoInternetModal";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Import screens
import { Colors } from "./styles/styles";

//Import Configs
import { TickInContexts } from "./Contexts/TickInContexts";
import Config from "./config/Config";
import OnboardingScreen from "./screens/Onboarding";
import LoginScreen from "./screens/Login";
import SignupScreen from "./screens/Signup";
import BottomNav from "./components/BottomNav";
import HomeScreen from "./screens/Home";
import AttendScreen from "./screens/Attend";
import AttendanceHistoryScreen from "./screens/AttendanceHistory";
import CreateAttendanceScreen from "./screens/CreateAttendance";
import BooksListScreen from "./screens/BooksList";
import AttendanceBookDetailScreen from "./screens/AttendanceBookDetail";
import EventDetailsScreen from "./screens/EventDetails";
import ProfileEditScreen from "./screens/ProfileEdit";

const Stack = createNativeStackNavigator();

export default function App() {
  const [btmcolor, setbtmcolor] = useState("#000");
  const [btmbgcolor, setbtmbgcolor] = useState("#000");
  const [isConnected, setIsConnected] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [initialRoute, setInitialRoute] = useState(null);

  const [fontsLoaded, fontError] = useFonts({
    Quicksand: require("./assets/fonts/Quicksand-Regular.ttf"),
    "Quicksand-Bold": require("./assets/fonts/Quicksand-Bold.ttf"),
    "Quicksand-Light": require("./assets/fonts/Quicksand-Light.ttf"),
    "Quicksand-SemiBold": require("./assets/fonts/Quicksand-SemiBold.ttf"),
    "Quicksand-Medium": require("./assets/fonts/Quicksand-Medium.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check for userToken
        const userToken = await SecureStore.getItemAsync("userToken");

        // Set the initial route based on the existence of userToken
        setInitialRoute(userToken ? "BottomNav" : "Onboarding");

        // Ensure fonts are loaded before hiding the splash screen
        if (fontsLoaded || fontError) {
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error("Error retrieving userToken from SecureStore:", error);
      }
    };

    initializeApp();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <TickInContexts.Provider value={{}}>
      <View onLayout={onLayoutRootView} style={styles.container}>
        <PaperProvider>
          <NavigationContainer>
            <StatusBar
              barStyle="dark-content"
              backgroundColor={Colors.background}
            />
            {initialRoute && (
              <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{
                  headerStyle: {
                    marginTop:
                      Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
                  },
                }}
              >
                <Stack.Screen
                  name="BottomNav"
                  component={BottomNav}
                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="Onboarding"
                  component={OnboardingScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Signup"
                  component={SignupScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Attend"
                  component={AttendScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="AttendanceHistory"
                  component={AttendanceHistoryScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="CreateAttendance"
                  component={CreateAttendanceScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="BooksList"
                  component={BooksListScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="AttendanceBookDetail"
                  component={AttendanceBookDetailScreen}
                  options={{ headerShown: false }}
                />
                  <Stack.Screen
                  name="EventDetails"
                  component={EventDetailsScreen}
                  options={{ headerShown: false }}
                />
                  <Stack.Screen
                  name="ProfileEdit"
                  component={ProfileEditScreen}
                  options={{ headerShown: false }}
                />
              </Stack.Navigator>
            )}
          </NavigationContainer>
        </PaperProvider>
        {!isConnected && <NoInternetModal />}
      </View>
    </TickInContexts.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
