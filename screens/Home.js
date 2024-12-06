import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Avatar, Card, Button, Surface, Chip } from "react-native-paper";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import {
  Clock,
  CheckCircle,
  BookOpen,
  Users,
  FileText,
} from "lucide-react-native";
import moment from "moment";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

import { Colors } from "../styles/styles";
import Config from "../config/Config";
import { useNavigation } from "@react-navigation/native";

// Color Palette
const {
  mainThemeColor,
  primary,
  primaryLight,
  textPrimary,
  textSecondary,
  white,
  accent,
  success,
} = Colors;

const HomeScreen = ({}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userProfile, setUserProfile] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      // Retrieve user token from secure store
      const userToken = await SecureStore.getItemAsync("userToken");

      if (!userToken) {
        throw new Error("No user token found");
      }

      // Fetch user profile
      const profileResponse = await axios.post(Config.BASE_URL + "/user/user", {
        user_id: userToken,
        pass: Config.PASS,
      });

      // Fetch attendance history
      const historyResponse = await axios.post(
        Config.BASE_URL + "/attendance/attendance-history",
        {
          user_id: userToken,
          pass: Config.PASS,
        }
      );

      if (profileResponse.data.status === 1) {
        setUserProfile({
          name: `${profileResponse.data.data.username}`,
          university: profileResponse.data.data.university_name,
          faculty: profileResponse.data.data.faculty_name,
          department: profileResponse.data.data.department_name,
          level: `${profileResponse.data.data.level} Level`,
          avatarUrl: "https://www.pngrepo.com/png/170303/180/avatar.png",
        });
      } else {
        throw new Error(
          profileResponse.data.message || "Failed to fetch user profile"
        );
      }

      if (historyResponse.data.status === 1) {
        // Sort attendance history and take the most recent 2 entries
        const sortedHistory = historyResponse.data.data
          .sort(
            (a, b) => new Date(b.attendance_time) - new Date(a.attendance_time)
          )
          .slice(0, 2);

        setAttendanceHistory(sortedHistory);
      }
    } catch (err) {
      setError(err.message);
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Time update effect
  useEffect(() => {
    // Fetch user profile on component mount
    fetchUserProfile();

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Quick Action Button Component
  const QuickActionButton = ({ icon, title, onPress }) => (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
      {icon}
      <Text style={styles.quickActionButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  // Activity Log Item Component
  const ActivityLogItem = ({ icon, title, timestamp, bookTitle }) => (
    <View style={styles.activityLogItem}>
      {icon}
      <View style={styles.activityLogContent}>
        <Text style={styles.activityLogTitle}>{title}</Text>
        <Text style={styles.activityLogSubtitle}>{bookTitle}</Text>
        <Text style={styles.activityLogTimestamp}>
          {moment(timestamp).fromNow()}
        </Text>
      </View>
    </View>
  );

  // Loading Spinner
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primary} />
        <Text style={styles.loadingText}>Let it cook...</Text>
      </View>
    );
  }

  // Error Handling
  if (error || !userProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <Button
          mode="contained"
          onPress={fetchUserProfile}
          style={styles.retryButton}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userNameText}>{userProfile.name}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("ProfileEdit")}>
          <Avatar.Text size={40} label={userProfile.name.charAt(0)} />
        </TouchableOpacity>
      </View>

      {/* Date and Time Card */}
      <Card style={styles.dateTimeCard}>
        <View style={styles.dateTimeContainer}>
          <View>
            <Text style={styles.dateText}>
              {moment(currentTime).format("dddd, MMMM D, YYYY")}
            </Text>
            <View style={styles.timeContainer}>
              <Clock color={primary} size={24} />
              <Text style={styles.timeText}>
                {moment(currentTime).format("h:mm:ss A")}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* User Details Card */}
      <Card style={styles.userDetailsCard}>
        <View style={styles.userDetailsContainer}>
          <View style={styles.userDetailItem}>
            <MaterialIcons name="school" size={24} color={primary} />
            <Text style={styles.userDetailText}>{userProfile.university}</Text>
          </View>
          <View style={styles.userDetailItem}>
            <Ionicons name="book" size={24} color={primary} />
            <Text style={styles.userDetailText}>
              {userProfile.faculty} - {userProfile.department}
            </Text>
          </View>
          <View style={styles.userDetailItem}>
            <Feather name="layers" size={24} color={primary} />
            <Text style={styles.userDetailText}>{userProfile.level}</Text>
          </View>
        </View>
      </Card>

      {/* Activity Log */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("AttendanceHistory")}
        >
          <Text style={styles.showAllText}>Show All</Text>
        </TouchableOpacity>
      </View>
      <Card style={styles.activityLogCard}>
        {attendanceHistory.length > 0 ? (
          attendanceHistory.map((activity, index) => (
            <ActivityLogItem
              key={activity.attendance_id}
              icon={<CheckCircle color={primary} size={24} />}
              title={`Attendance Marked - ${activity.column_name}`}
              bookTitle={activity.book_title}
              timestamp={activity.attendance_time}
            />
          ))
        ) : (
          <Text style={styles.noActivityText}>No recent activities</Text>
        )}
      </Card>

      {/* Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={styles.quickActionsContainer}>
        <QuickActionButton
          icon={<CheckCircle color={primary} size={24} />}
          title="Mark Attendance"
          onPress={() => {
            navigation.navigate("Attend");
          }}
        />
        <QuickActionButton
          icon={<FileText color={accent} size={24} />}
          title="Attendance History"
          onPress={() => {
            navigation.navigate("AttendanceHistory");
          }}
        />
      </View>

      {/* Admin & Moderator Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Admin Actions</Text>
      </View>
      <View style={styles.adminActionsContainer}>
        <Chip
          icon={() => <Users color={primary} size={20} />}
          onPress={() => {
            navigation.navigate("CreateAttendance");
          }}
          style={styles.adminActionChip}
        >
          Create Attendance
        </Chip>
        <Chip
          icon={() => <FileText color={accent} size={20} />}
          onPress={() => {
            navigation.navigate("BooksList");
          }}
          style={styles.adminActionChip}
        >
          <Text style={{ fontFamily: "Sandbook" }}>Attendance Books</Text>
        </Chip>
      </View>

      {/* Ads Section */}
      <Card style={styles.adsCard}>
        <View style={styles.adsContent}>
          <Text style={styles.adsTitle}>Special Offer!</Text>
          <Text style={styles.adsSubtitle}>Get Premium Features Now</Text>
          <Button
            mode="outlined"
            onPress={() => {
              /* Handle Upgrade */
            }}
            style={styles.adsButton}
            labelStyle={{ fontFamily: "Quicksand" }}
          >
            Upgrade
          </Button>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: white,
  },
  loadingText: {
    marginTop: 10,
    color: textSecondary,
    fontFamily: "Quicksand",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: white,
  },
  errorText: {
    color: "red",
    marginBottom: 20,
    fontFamily: "Quicksand",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: primary,
  },

  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeText: {
    fontFamily: "Quicksand",
    fontSize: 16,
    color: textSecondary,
  },
  userNameText: {
    fontFamily: "Quicksand-Bold",
    fontSize: 22,
    color: textPrimary,
  },
  noActivityText: {
    textAlign: "center",
    fontFamily: "Quicksand-Medium",
    color: textSecondary,
    padding: 15,
  },
  avatar: {
    backgroundColor: primaryLight,
  },
  dateTimeCard: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    backgroundColor: Colors.cardBackground,
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    fontFamily: "Quicksand-SemiBold",
    fontSize: 16,
    color: textPrimary,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  timeText: {
    fontFamily: "Quicksand-Medium",
    fontSize: 14,
    marginLeft: 10,
    color: textSecondary,
  },
  userDetailsCard: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    backgroundColor: Colors.cardBackground,
  },
  userDetailsContainer: {
    flexDirection: "column",
  },
  userDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  userDetailText: {
    fontFamily: "Quicksand-Medium",
    marginLeft: 10,
    color: textPrimary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  sectionTitle: {
    fontFamily: "Quicksand-Bold",
    fontSize: 18,
    color: textPrimary,
  },
  showAllText: {
    fontFamily: "Quicksand-Medium",
    color: primary,
  },
  activityLogCard: {
    marginBottom: 15,
    borderRadius: 10,
    padding: 10,
    backgroundColor: Colors.cardBackground,
  },
  activityLogItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    padding: 10,
  },
  activityLogContent: {
    marginLeft: 10,
  },
  activityLogTitle: {
    fontFamily: "Quicksand-SemiBold",
    color: textPrimary,
  },
  activityLogTimestamp: {
    fontFamily: "Quicksand-Regular",
    color: textSecondary,
    fontSize: 12,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  quickActionButton: {
    backgroundColor: white,
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    width: "48%",
    elevation: 3,
    backgroundColor: Colors.cardBackground,
  },
  quickActionButtonText: {
    fontFamily: "Quicksand-Medium",
    marginTop: 5,
    color: textPrimary,
  },
  adminActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  adminActionChip: {
    backgroundColor: white,
    elevation: 2,
    fontFamily: "Sandbook",
    backgroundColor: Colors.cardBackground,
    color: Colors.textPrimary,
  },
  fullWidthCard: {
    marginBottom: 15,
    borderRadius: 10,
  },
  fullWidthCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: Colors.cardBackground,
  },
  fullWidthCardText: {
    fontFamily: "Quicksand-SemiBold",
    marginLeft: 10,
    color: textPrimary,
  },
  adsCard: {
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: primaryLight,
  },
  adsContent: {
    padding: 20,
    alignItems: "center",
  },
  adsTitle: {
    fontFamily: "Quicksand-Bold",
    fontSize: 20,
    color: white,
  },
  adsSubtitle: {
    fontFamily: "Quicksand-Medium",
    color: white,
    marginVertical: 10,
  },
  adsButton: {
    backgroundColor: white,
  },
});

export default HomeScreen;
