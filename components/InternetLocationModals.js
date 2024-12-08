import React, { useState, useEffect } from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import NetInfo from "@react-native-community/netinfo";
import { ActivityIndicator } from "react-native-paper";
import { Colors } from "../styles/styles";
// No Internet Modal Component
export const NoInternetModal = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const netInfoState = await NetInfo.fetch();
      setIsConnected(netInfoState.isConnected);
    } catch (error) {
      console.error("Retry check failed:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  if (isConnected) return null;

  return (
    <Modal transparent={true} animationType="slide" visible={!isConnected}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>No Internet Connection</Text>
          <Text style={styles.modalMessage}>
            Please check your internet connection and try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.retryButtonText}>Retry</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
export const LocationPermissionModal = () => {
  const [locationStatus, setLocationStatus] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        // Check if location services are enabled
        let enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          setIsModalVisible(true);
          setLocationStatus("disabled");
          return;
        }

        // Check permission status
        let { status } = await Location.getForegroundPermissionsAsync();

        if (status !== "granted") {
          setIsModalVisible(true);
          setLocationStatus("not-granted");
        } else {
          setIsModalVisible(false);
        }
      } catch (error) {
        console.error("Location permission check error:", error);
        setIsModalVisible(true);
        setLocationStatus("error");
      }
    };

    // Check location initially
    checkLocationPermission();

    // Set up a listener to check location status changes in real-time
    const watchLocation = async () => {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // Check every 5 seconds
          distanceInterval: 10, // Or every 10 meters
        },
        (location) => {
          console.log(location);
          // Handle location updates here if needed
        }
      );

      return subscription;
    };

    // Start watching location
    watchLocation();

    return () => {
      // Clean up the subscription
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const requestPermission = async () => {
    if (locationStatus === "disabled") {
      // Prompt user to enable location services
      await Location.enableLocationServicesAsync();
    } else {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        setIsModalVisible(false);
      }
    }
  };

  if (!isModalVisible) return null;

  return (
    <Modal transparent={true} animationType="slide" visible={isModalVisible}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {locationStatus === "disabled"
              ? "Location Services Disabled"
              : "Location Permission Required"}
          </Text>
          <Text style={styles.modalMessage}>
            {locationStatus === "disabled"
              ? "Please enable location services to use this app and restart it."
              : "This app requires location access to provide accurate features."}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={requestPermission}
          >
            <Text style={styles.retryButtonText}>
              {locationStatus === "disabled"
                ? "Enable Location Services"
                : "Grant Permission"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
// Shared Styles
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "Quicksand-Bold",
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "Quicksand",
  },
  retryButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  retryButtonText: {
    color: "white",
    fontFamily: "Quicksand-SemiBold",
  
  },
});

export default { NoInternetModal, LocationPermissionModal };
