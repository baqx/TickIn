import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Card, Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { Colors } from "../styles/styles";
import Config from "../config/Config";

const { primary, textPrimary, white, textSecondary } = Colors;

const AttendanceHistoryScreen = ({ navigation }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // API configuration
  const API_URL = Config.BASE_URL + "/attendance/full-attendance-history";
  const ADMIN_PASS = Config.PASS; // Consider using environment variables

  useEffect(() => {
    // Fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Fetch initial records
    fetchAttendanceRecords();
  }, []);

  const fetchAttendanceRecords = async (isRefresh = false) => {
    try {
      // Get user token from secure store
      const userToken = await SecureStore.getItemAsync("userToken");

      if (!userToken) {
        // Handle case where user token is not found
        console.error("User token not found");
        setLoading(false);
        return;
      }

      const requestPage = isRefresh ? 1 : page;

      const response = await axios.post(API_URL, {
        pass: ADMIN_PASS,
        user_id: userToken,
        page: requestPage,
        limit: 10, // Adjust as needed
      });

      if (response.data.status === 1) {
        // If refreshing, reset the records
        const newRecords = isRefresh
          ? response.data.data
          : [...attendanceRecords, ...response.data.data];

        setAttendanceRecords(newRecords);
        setTotalPages(response.data.pagination.total_pages);
        setHasMore(requestPage < response.data.pagination.total_pages);

        // If it's a refresh, reset to first page
        if (isRefresh) {
          setPage(1);
        }
      } else {
        // console.error("Failed to fetch records", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching attendance records", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendanceRecords(true);
  };

  const loadMoreRecords = () => {
    if (hasMore && !loading) {
      setPage((prevPage) => prevPage + 1);
      fetchAttendanceRecords();
    }
  };

  const renderRecordCard = (record) => (
    <Card key={record.attendance_id} style={styles.recordCard}>
      <View style={styles.recordContent}>
        <View style={styles.column}>
          <Ionicons name="book" size={24} color={textPrimary} />
          <Text style={styles.recordLecture}>{record.book_title}</Text>
        </View>
        <View style={styles.column}>
          <Ionicons name="calendar" size={24} color={textPrimary} />
          <Text style={styles.recordDate}>{record.attendance_time}</Text>
        </View>
        <View style={styles.column}>
          <Ionicons name="information-circle" size={24} color={textPrimary} />
          <Text style={styles.recordTime}>{record.column_name}</Text>
        </View>
      </View>
    </Card>
  );

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
        onEndReached={loadMoreRecords}
        onEndReachedThreshold={0.1}
      >
        {attendanceRecords.map(renderRecordCard)}

        {loading && (
          <ActivityIndicator
            size="large"
            color={primary}
            style={styles.loadingIndicator}
          />
        )}

        {!loading && attendanceRecords.length === 0 && (
          <Text style={styles.noRecordsText}>No attendance records found</Text>
        )}
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
  loadingIndicator: { marginVertical: 20 },
  noRecordsText: {
    textAlign: "center",
    marginTop: 20,
    color: "#fff",
  },
});

export default AttendanceHistoryScreen;
