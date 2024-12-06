import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { Card, Button, Snackbar } from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import { CheckCircle, MapPin } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "../styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const { primary, white, textPrimary, textSecondary, success, background } =
  Colors;

const AttendScreen = ({ currentTab }) => {
  const navigation = useNavigation();
  const [attendanceCode, setAttendanceCode] = useState("");
  const [lectureDetails, setLectureDetails] = useState(null);
  const [isCodeSubmitted, setIsCodeSubmitted] = useState(false);
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressTimerRef = useRef(null);

  // Mock function to validate attendance code
  const validateAttendanceCode = (code) => {
    // In a real app, this would be an API call
    if (code === "123456") {
      return {
        lectureName: "CHM 101",
        location: "JAO 3",
        checkedInStudents: 42,
        lectureTime: "4:00PM - 6:00 PM",
        coordinates: {
          latitude: 7.229908867558553,
          longitude: 3.4391506225427126,
        },
      };
    }
    return null;
  };

  const handleCodeSubmit = () => {
    const details = validateAttendanceCode(attendanceCode);
    if (details) {
      setLectureDetails(details);
      setIsCodeSubmitted(true);
    } else {
      setSnackbarVisible(true);
    }
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
          setIsAttendanceMarked(true);
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
            <View style={styles.lectureCardContent}>
              <Text style={styles.lectureName}>
                {lectureDetails.lectureName}
              </Text>
              <View style={styles.lectureInfoRow}>
                <MapPin color={primary} size={20} />
                <Text style={styles.lectureInfoText}>
                  {lectureDetails.location}
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
              >
                <Marker
                  coordinate={lectureDetails.coordinates}
                  title={lectureDetails.location}
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
          <CheckCircle color={success} size={100} />
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
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        Invalid Attendance Code
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
});

export default AttendScreen;
