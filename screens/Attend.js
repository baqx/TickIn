import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { Card, Button, Snackbar, Switch } from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import { CheckCircle, MapPin, ReceiptText } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import axios from "axios";
import { Colors } from "../styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Config from "../config/Config";
import * as SecureStore from "expo-secure-store";
const { width, height } = Dimensions.get("window");
const { primary, white, textPrimary, textSecondary, success, background } =
  Colors;

const API_URL = Config.BASE_URL + "/attendance/attendance";
const ADMIN_PASS = Config.PASS; // Replace with actual admin pass

const AttendScreen = ({ currentTab, userId }) => {
  const navigation = useNavigation();
  const [attendanceCode, setAttendanceCode] = useState("");
  const [lectureDetails, setLectureDetails] = useState(null);
  const [isCodeSubmitted, setIsCodeSubmitted] = useState(false);
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible1, setSnackbarVisible1] = useState(false);
  const [snackbarMessage1, setSnackbarMessage1] = useState("");
 
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressTimerRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);

  const handleSubscriptionToggle = async () => {
    try {
      const response = await axios.post(
        Config.BASE_URL + "/attendance/subscribe",
        {
          pass: ADMIN_PASS,
          action: isEnabled ? "unsubscribe" : "subscribe",
          book_column_id: lectureDetails.book_column_id,
          user_id: await SecureStore.getItemAsync("userToken"),
        }
      );

      if (response.data.status === 1) {
        setIsEnabled(!isEnabled); // Toggle the subscription status
        setSnackbarMessage1(
          isEnabled ? "Unsubscribed successfully! You will no longer receive notifications from this attendance book" : "Subscribed successfully! We will notify you when a new attendance drops for this book"
        );
        setSnackbarVisible1(true);
      } else {
        setSnackbarMessage(
          response.data.message || "Failed to update subscription"
        );
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage("Error updating subscription");
      setSnackbarVisible(true);
    }
  };
 
  useEffect(() => {
    // Request location permissions
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Location permission is required to mark attendance."
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const toggleSubscription = () => {
    handleSubscriptionToggle(); // Call the subscription handler
  };
  const fetchEventDetails = async () => {
    try {
      const response = await axios.post(API_URL, {
        pass: ADMIN_PASS,
        action: "get_event_details",
        identifier_type: "shortcode",
        identifier: attendanceCode,
        user_id: await SecureStore.getItemAsync("userToken"),
      });

      if (response.data.status === 1) {
        const eventData = response.data.data;

        if (eventData.hasMarkedAttendance) {
          setSnackbarMessage(
            "You have already marked attendance for this event."
          );
          setSnackbarVisible(true);
          return;
        }

        setLectureDetails({
          lectureName: eventData.book_title,
          location: eventData.column_name,
          location_name: eventData.location_name,
          checkedInStudents: eventData.total_attendance,
          coordinates: {
            latitude: parseFloat(eventData.latitude),
            longitude: parseFloat(eventData.longitude),
          },
          book_column_id: eventData.column_id,
        });
        setIsEnabled(eventData.isSubscribed)
        setIsCodeSubmitted(true);
      } else {
        setSnackbarMessage(response.data.message || "Invalid attendance code");
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage("Error fetching event details");
      setSnackbarVisible(true);
    }
  };

  const handleCodeSubmit = () => {
    if (attendanceCode.length !== 6) {
      setSnackbarMessage("Please enter a 6-digit code");
      setSnackbarVisible(true);
      return;
    }
    fetchEventDetails();
  };

  const startLongPress = () => {
    // Haptic feedback
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Start progress
    setLongPressProgress(0);

    longPressTimerRef.current = setInterval(() => {
      setLongPressProgress((prevProgress) => {
        const newProgress = prevProgress + 10;
        if (newProgress >= 100) {
          clearInterval(longPressTimerRef.current);
          markAttendance();
          return 100;
        }
        return newProgress;
      });
    }, 20); // 20ms * 50 = 1000ms (1 second)
  };

  const stopLongPress = () => {
    if (longPressTimerRef.current) {
      clearInterval(longPressTimerRef.current);
      setLongPressProgress(0);
    }
  };

  const markAttendance = async () => {
    if (!userLocation) {
      setSnackbarMessage(
        "Location not available. Please enable location services."
      );
      setSnackbarVisible(true);
      return;
    }

    try {
      const response = await axios.post(API_URL, {
        pass: ADMIN_PASS,
        action: "mark_attendance",
        book_column_id: lectureDetails.book_column_id,
        user_id: await SecureStore.getItemAsync("userToken"),
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });

      if (response.data.status === 1) {
        setIsAttendanceMarked(true);
      } else {
        setSnackbarMessage(
          response.data.message || "Failed to mark attendance"
        );
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage("Error marking attendance");
      setSnackbarVisible(true);
    }
  };

  const resetScreen = () => {
    setIsCodeSubmitted(false);
    setIsAttendanceMarked(false);
    setAttendanceCode("");
    setLectureDetails(null);
    setLongPressProgress(0);
  };

  return (
    <View style={styles.container}>
      {/* Attendance Code Input */}
      {/* Render back button only if not coming from another tab */}
      {currentTab !== "mark-attendance" ? (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="chevron-back-circle-outline"
            size={30}
            style={{ marginHorizontal: 20, marginVertical: 20 }}
          />
        </TouchableOpacity>
      ) : (
        <></>
      )}
      {!isCodeSubmitted && (
        <View style={styles.codeInputContainer}>
          <Text style={styles.title}>Enter Attendance Code</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="Enter 6-digit code"
            placeholderTextColor={textSecondary}
            keyboardType="numeric"
            maxLength={6}
            value={attendanceCode}
            onChangeText={setAttendanceCode}
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCodeSubmit}
          >
            <Text style={styles.submitButtonText}>Submit Code</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lecture Details Card */}
      {isCodeSubmitted && !isAttendanceMarked && lectureDetails && (
        <View style={styles.lectureDetailsContainer}>
          <Card style={styles.lectureCard}>
            <TouchableOpacity onPress={toggleSubscription}>
              <Ionicons
                name={
                  isEnabled ? "notifications-sharp" : "notifications-outline"
                }
                size={30}
                style={{
                  alignSelf: "flex-end",
                }}
                color={isEnabled ? Colors.primary : Colors.textSecondary}
              />
            </TouchableOpacity>
            <View style={styles.lectureCardContent}>
              <Text style={styles.lectureName}>
                {lectureDetails.lectureName}
              </Text>
              <Text style={styles.subscriptionStatus}>
                {isEnabled ? "Subscribed" : ""}
              </Text>

              <View style={styles.lectureInfoRow}>
                <ReceiptText color={primary} size={20} />
                <Text style={styles.lectureInfoText}>
                  {lectureDetails.location}
                </Text>
              </View>
              <View style={styles.lectureInfoRow}>
                <MapPin color={primary} size={20} />
                <Text style={styles.lectureInfoText}>
                  {lectureDetails.location_name}
                </Text>
              </View>
              <View style={styles.lectureInfoRow}>
                <CheckCircle color={success} size={20} />
                <Text style={styles.lectureInfoText}>
                  {lectureDetails.checkedInStudents} Students Checked In
                </Text>
              </View>
              <Text style={styles.lectureTime}>
                {lectureDetails.lectureTime}
              </Text>

              {/* Map View */}
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: lectureDetails.coordinates.latitude,
                  longitude: lectureDetails.coordinates.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUser
                Location={true}
                mapType="satellite"
              >
                <Marker
                  coordinate={lectureDetails.coordinates}
                  title={lectureDetails.location_name}
                />
              </MapView>
            </View>
          </Card>

          {/* Long Press Attendance Button */}
          <TouchableOpacity
            style={[
              styles.longPressButton,
              {
                borderColor: longPressProgress === 100 ? success : primary,
                borderWidth: 3,
              },
            ]}
            onPressIn={startLongPress}
            onPressOut={stopLongPress}
          >
            <View
              style={[
                styles.longPressProgress,
                {
                  width: `${longPressProgress}%`,
                  backgroundColor: primary, // Change progress color
                },
              ]}
            />
            <Text
              style={[
                styles.longPressButtonText,
                {
                  color: longPressProgress === 100 ? success : textPrimary,
                },
              ]}
            >
              Long Press to Mark Attendance
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Attendance Marked Confirmation */}
      {isAttendanceMarked && (
        <View style={styles.attendanceMarkedContainer}>
          <CheckCircle color={Colors.primary} size={100} />
          <Text style={styles.attendanceMarkedText}>
            You Have Successfully Marked Your Attendance!
          </Text>
          <Button
            mode="contained"
            onPress={() => {
              // Reset the screen
              setIsCodeSubmitted(false);
              setIsAttendanceMarked(false);
              setAttendanceCode("");
              setLectureDetails(null);
              setLongPressProgress(0);
            }}
          >
            Done
          </Button>
        </View>
      )}

      {/* Error Snackbar */}
      <Snackbar
        visible={snackbarVisible1}
        onDismiss={() => setSnackbarVisible1(false)}
        duration={3000}
        style={styles.snackbar1}
      >
          {snackbarMessage1}
      </Snackbar>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: background,
    padding: 15,
    justifyContent: "center",
  },
  codeInputContainer: {
    alignItems: "center",
  },
  title: {
    fontFamily: "Quicksand-Bold",
    fontSize: 22,
    color: textPrimary,
    marginBottom: 20,
  },
  subscriptionStatus: {
    fontFamily: "Quicksand-Medium",
    color: textSecondary,
    marginTop: 5,
  },
  codeInput: {
    width: width * 0.8,
    height: 60,
    borderWidth: 2,
    borderColor: primary,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 24,
    textAlign: "center",
    fontFamily: "Quicksand-Medium",
    color: textPrimary,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  submitButtonText: {
    color: white,
    fontFamily: "Quicksand-Bold",
    fontSize: 18,
  },
  lectureDetailsContainer: {
    alignItems: "center",
  },
  lectureCard: {
    width: width * 0.9,
    padding: 15,
    marginBottom: 20,
    borderRadius: 15,
  },
  lectureCardContent: {
    alignItems: "center",
  },
  lectureName: {
    fontFamily: "Quicksand-Bold",
    fontSize: 20,
    color: textPrimary,
    marginBottom: 10,
  },
  lectureInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  lectureInfoText: {
    fontFamily: "Quicksand-Medium",
    marginLeft: 10,
    color: textSecondary,
  },
  lectureTime: {
    fontFamily: "Quicksand-SemiBold",
    color: primary,
    marginTop: 10,
  },
  map: {
    width: width * 0.8,
    height: 200,
    marginTop: 15,
    borderRadius: 10,
  },
  longPressButton: {
    width: 250,
    height: 250,
    borderRadius: 125,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginTop: 20,
    backgroundColor: white, // Background color of the button
    borderWidth: 3, // Optional: add a border for more definition
    borderColor: textSecondary, // Border color when not activated
  },
  longPressProgress: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    opacity: 1,
  },
  longPressButtonText: {
    fontFamily: "Quicksand-Bold",
    color: textPrimary,
    textAlign: "center",
  },
  attendanceMarkedContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  attendanceMarkedText: {
    fontFamily: "Quicksand-Bold",
    fontSize: 22,
    color: textPrimary,
    textAlign: "center",
    marginVertical: 20,
  },
  snackbar: {
    backgroundColor: Colors.error,
  },
  snackbar1: {
    backgroundColor: Colors.success,
  },
});

export default AttendScreen;
