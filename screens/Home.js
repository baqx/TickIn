import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  FlatList,
  ImageBackground,
} from "react-native";
import { Avatar, Card, Button, Surface, Chip } from "react-native-paper";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import {
  Clock,
  CheckCircle,
  BookOpen,
  Users,
  FileText,
  Calendar,
  PlusCircle,
  Book,
} from "lucide-react-native";
import moment from "moment";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import * as Application from "expo-application";
import { Colors } from "../styles/styles";
import Config from "../config/Config";
import { useNavigation } from "@react-navigation/native";
const { width: windowWidth } = Dimensions.get("window");
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
// Memoized Ad Item Component
const AdItem = React.memo(({ item }) => (
  <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
    <View style={styles.slide}>
      <Card style={styles.adCard}>
        <ImageBackground
          source={{ uri: item.image }}
          style={styles.adBackground}
          imageStyle={styles.adBackgroundImage}
        >
          <View style={styles.adChip}>
            <Text style={{ color: "white" }}>AD</Text>
          </View>
          <View style={styles.adContent}>
            <Text style={styles.adTitle}>{item.title}</Text>
            <Text style={styles.adSubtitle}>{item.subtitle}</Text>
          </View>
        </ImageBackground>
      </Card>
    </View>
  </TouchableOpacity>
));

// Memoized Pagination Component
const Pagination = React.memo(({ data, currentIndex }) => (
  <View style={styles.pagination}>
    {data.map((_, index) => (
      <View
        key={index}
        style={[styles.dot, currentIndex === index && styles.activeDot]}
      />
    ))}
  </View>
));
const HomeScreen = ({}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userProfile, setUserProfile] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const [adsData, setAdsData] = useState([]); // New state for ads data

  // Modified fetchAdsData function
  const fetchAdsData = async () => {
    try {
      const response = await axios.post(
        Config.BASE_URL + "/user/adverts",
        {},
        {
          headers: {
            Authorization: `Bearer ${Config.PASS}`,
          },
        }
      );

      if (response.data.status === 1 && response.data.adverts) {
        const ads = response.data.adverts.map((ad) => ({
          id: ad.id,
          title: ad.title,
          subtitle: ad.description,
          image: ad.image_url,
          url: ad.url,
        }));
        setAdsData(ads);
      } else {
        // If no ads, set empty array without throwing error
        setAdsData([]);
      }
    } catch (err) {
      console.error("Ads fetch error:", err);
      setAdsData([]); // Set empty array on error
    }
  };

  // Fetch user profile

  const fetchUserProfile = async () => {
    try {
      // Retrieve user token from secure store
      const userToken = await SecureStore.getItemAsync("userToken");

      if (!userToken) {
        throw new Error("No user token found");
      }

      // Fetch user profile
      const profileResponse = await axios.post(
        Config.BASE_URL + "/user/user",
        {
          user_id: userToken,
        },
        {
          headers: {
            Authorization: `Bearer ${Config.PASS}`,
          },
        }
      );

      // Fetch attendance history
      const historyResponse = await axios.post(
        Config.BASE_URL + "/attendance/attendance-history",
        {
          user_id: userToken,
        },
        {
          headers: {
            Authorization: `Bearer ${Config.PASS}`,
          },
        }
      );

      if (profileResponse.data.status === 1) {
        setUserProfile({
          name: `${profileResponse.data.data.fullname}`,
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
  useEffect(() => {
    fetchUserProfile();
    fetchAdsData(); // Call fetchAdsData in useEffect

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Only set up scroll interval if there are ads
    let scrollInterval;
    if (adsData.length > 0) {
      scrollInterval = setInterval(() => {
        if (flatListRef.current) {
          const nextIndex = (currentIndex + 1) % adsData.length;
          flatListRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          setCurrentIndex(nextIndex);
        }
      }, 3000);
    }

    return () => {
      clearInterval(timeInterval);
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, [currentIndex, adsData.length]);
  // Handle scroll end
  const handleScrollEnd = (e) => {
    const newIndex = Math.round(
      e.nativeEvent.contentOffset.x / (windowWidth - 32)
    );
    setCurrentIndex(newIndex);
  };

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
        <Text style={styles.errorText}>
          Check your internet connection and try again
        </Text>
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
        <TouchableOpacity onPress={() => navigation.navigate("EditProfile")}>
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
            <Ionicons name="school" size={24} color={primary} />
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
        <Text style={styles.sectionTitle}>Recent Activities</Text>
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
      <View style={styles.quickActionsContainer}>
        <QuickActionButton
          icon={<Calendar color={primary} size={24} />}
          title="My Attendance Subscriptions"
          onPress={() => {
            navigation.navigate("Subscriptions");
          }}
        />
      </View>

      {/* Admin & Moderator Actions */}
      {/* Admin & Moderator Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Admin Actions</Text>
      </View>
      <View style={styles.adminActionsContainer}>
        <QuickActionButton
          icon={<PlusCircle color={primary} size={20} />}
          title="Create Attendance"
          onPress={() => {
            navigation.navigate("CreateAttendance");
          }}
        />
        <QuickActionButton
          icon={<Book color={accent} size={20} />}
          title="Attendance Books"
          onPress={() => {
            navigation.navigate("BooksList");
          }}
        />
      </View>

      {/* Ads Section 
      <Card style={styles.adsCard}>
        <View style={styles.adsContent}>
          <Text style={styles.adsTitle}>Special Offer!</Text>
          <Text style={styles.adsSubtitle}>Get Premium Features Now</Text>
          <Button
            mode="outlined"
            onPress={() => {}}
            style={styles.adsButton}
            labelStyle={{ fontFamily: "Quicksand" }}
          >
            Upgrade
          </Button>
        </View>
      </Card>
      */}
      {adsData.length > 0 && (
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={adsData}
            renderItem={({ item }) => <AdItem item={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            snapToInterval={windowWidth - 32}
            snapToAlignment="center"
            decelerationRate="fast"
            contentContainerStyle={styles.flatListContent}
          />
          <Pagination data={adsData} currentIndex={currentIndex} />
        </View>
      )}

      <View style={{ height: 30 }}></View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
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
  activityLogSubtitle: {
    color: textPrimary,
    fontFamily: "Quicksand-Medium",
  },
  activityLogTimestamp: {
    fontFamily: "Quicksand",
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
  carouselContainer: {
    marginVertical: 10,
  },
  flatListContent: {
    paddingHorizontal: 16,
  },
  slide: {
    width: windowWidth - 32,
  },
  adCard: {
    height: 180,
    overflow: "hidden",
  },
  adBackground: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  adBackgroundImage: {
    resizeMode: "cover",
  },
  adContent: {
    padding: 15,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  adTitle: {
    color: white,
    fontSize: 20,
    fontWeight: "bold",
  },
  adSubtitle: {
    color: white,
    fontSize: 16,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  adChip: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: primary,
    color: white,
    padding:3,
    borderRadius: 5,
  },
});

export default HomeScreen;
