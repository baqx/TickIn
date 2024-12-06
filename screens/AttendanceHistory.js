import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from "react-native";
import { Card, Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../styles/styles"; // Assuming you have a Colors file for consistent styling
import { useFonts } from "expo-font"; // For loading custom fonts

const { primary, textPrimary, textSecondary, white } = Colors;

const AttendanceHistoryScreen = ({ navigation }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0)); // For fade-in animation
  const [refreshing, setRefreshing] = useState(false);

  // Load custom font
  const [fontsLoaded] = useFonts({
    Quicksand: require("../assets/fonts/Quicksand-Regular.ttf"), // Adjust the path as necessary
  });

  useEffect(() => {
    fetchAttendanceRecords();
    // Fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const fetchAttendanceRecords = () => {
    const records = [
      { id: 1, lecture: "Mathematics", date: "2023-10-01", time: "10:00 AM" },
      { id: 2, lecture: "Physics", date: "2023-10-02", time: "11:00 AM" },
      { id: 3, lecture: "Chemistry", date: "2023-10-03", time: "09:00 AM" },
      { id: 4, lecture: "Biology", date: "2023-10-04", time: "01:00 PM" },
      { id: 5, lecture: "History", date: "2023-10-05", time: "01:00 PM" },
    ];
    setAttendanceRecords(records);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate fetching new data
    setTimeout(() => {
      fetchAttendanceRecords();
      setRefreshing(false);
    }, 2000);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color={white} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Attendance History</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {attendanceRecords.map((record) => (
          <Card key={record.id} style={styles.recordCard}>
            <View style={styles.recordContent}>
              <View style={styles.column}>
                <Ionicons name="book" size={24} color={textPrimary} />
                <Text style={styles.recordLecture}>{record.lecture}</Text>
              </View>
              <View style={styles.column}>
                <Ionicons name="calendar" size={24} color={textPrimary} />
                <Text style={styles.recordDate}>{record.date}</Text>
              </View>
              <View style={styles.column}>
                <Ionicons name="time" size={24} color={textPrimary} />
                <Text style={styles.recordTime}>{record.time}</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Upgrade Button */}
      <Button
        mode="elevated"
        onPress={() => {
          /* Handle Upgrade */
        }}
        style={styles.upgradeButton}
      >
        Upgrade to Premium
      </Button>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: primary,
    padding: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButtonText: {
    fontFamily: "Quicksand",
    color: white,
    marginLeft: 10,
    fontSize: 16,
  },
  title: {
    fontFamily: "Quicksand-Bold",
    fontSize: 24,
    color: white,
    marginBottom: 20,
  },
  recordCard: {
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: white,
    padding: 15,
    elevation: 3, // Adding shadow for better aesthetics
  },
  recordContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  column: {
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  recordLecture: {
    fontFamily: "Quicksand",
    fontSize: 18,
    color: textPrimary,
    textAlign: "center",
  },
  recordDate: {
    fontFamily: "Quicksand",
    fontSize: 16,
    color: textSecondary,
    textAlign: "center",
  },
  recordTime: {
    fontFamily: "Quicksand",
    fontSize: 16,
    color: textSecondary,
    textAlign: "center",
  },
  recordStatus: {
    fontFamily: "Quicksand",
    fontSize: 16,
    color: textSecondary,
    textAlign: "center",
  },
  upgradeButton: {
    marginTop: 20,
    backgroundColor: white,
    fontFamily: "Quicksand",
  },
});

export default AttendanceHistoryScreen;
