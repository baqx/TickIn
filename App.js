import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, StatusBar, Platform, Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PaperProvider } from "react-native-paper";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";

// Import custom components and modals
import {
  NoInternetModal,
  LocationPermissionModal,
} from "./components/InternetLocationModals";

// Import screens
import { Colors } from "./styles/styles";

//Import Configs
import { TickInContexts } from "./Contexts/TickInContexts";
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
import CreateEventScreen from "./screens/CreateEvent";
import SubscriptionsScreen from "./screens/SubscriptionsScreen";
import * as Device from "expo-device";
import Constants from 'expo-constants';
import * as Notifications from "expo-notifications";
const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
export default function App() {
  const [isConnected, setIsConnected] = useState(true);
  const [locationStatus, setLocationStatus] = useState(null);
  const [initialRoute, setInitialRoute] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef();
  const responseListener = useRef();
  const [notification, setNotification] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Quicksand: require("./assets/fonts/Quicksand-Regular.ttf"),
    "Quicksand-Bold": require("./assets/fonts/Quicksand-Bold.ttf"),
    "Quicksand-Light": require("./assets/fonts/Quicksand-Light.ttf"),
    "Quicksand-SemiBold": require("./assets/fonts/Quicksand-SemiBold.ttf"),
    "Quicksand-Medium": require("./assets/fonts/Quicksand-Medium.ttf"),
  });
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const url = response.notification.request.content.data.url;
        if (url) {
          //nothing
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig.extra.eas.projectId,
        })
      ).data;

      console.log(token);
    } else {
      alert("Must use physical device for Push Notifications");
    }

    return token;
  }
  // Check internet connection
  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribeNetInfo();
    };
  }, []);

  // Check location status
  useEffect(() => {
    const checkLocationStatus = async () => {
      try {
        // Check if location services are enabled
        let enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          setLocationStatus("disabled");
          return;
        }

        // Check permission status
        let { status } = await Location.getForegroundPermissionsAsync();

        if (status !== "granted") {
          setLocationStatus("not-granted");
        } else {
          setLocationStatus("granted");
        }
      } catch (error) {
        console.error("Location permission check error:", error);
        setLocationStatus("error");
      }
    };

    checkLocationStatus();

    // Set up a listener to check location status changes in real-time
    const locationInterval = setInterval(checkLocationStatus, 5000);

    return () => {
      clearInterval(locationInterval);
    };
  }, []);

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
                  name="CreateEvent"
                  component={CreateEventScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ProfileEdit"
                  component={ProfileEditScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Subscriptions"
                  component={SubscriptionsScreen}
                  options={{ headerShown: false }}
                />
              </Stack.Navigator>
            )}
          </NavigationContainer>
        </PaperProvider>

        {/* Internet and Location Modals */}
        <NoInternetModal />
        <LocationPermissionModal />
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
