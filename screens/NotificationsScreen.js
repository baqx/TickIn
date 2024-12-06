import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import {
  BellRing,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Calendar,
  MessageCircle,
} from "lucide-react-native";
import { Colors } from "../styles/styles";

// Notification Type Icons
const NotificationIcons = {
  attendance: Calendar,
  success: CheckCircle,
  alert: AlertCircle,
  message: MessageCircle,
  academic: BookOpen,
  default: BellRing,
};

// Mock Notification Data (replace with actual API call)
const generateMockNotifications = (count, page = 1) => {
  const notificationTypes = [
    {
      type: "attendance",
      title: "Attendance Marked",
      description: "You were marked present for CSC 301 lecture",
    },
    {
      type: "success",
      title: "Assignment Submitted",
      description:
        "Your assignment for Mathematics has been submitted successfully",
    },
    {
      type: "alert",
      title: "Upcoming Deadline",
      description: "Research paper submission due in 3 days",
    },
    {
      type: "message",
      title: "New Message",
      description: "You have a new message from your project group",
    },
    {
      type: "academic",
      title: "Grade Update",
      description: "Your midterm exam results are now available",
    },
  ];

  return Array.from({ length: count }, (_, index) => {
    const notification = notificationTypes[index % notificationTypes.length];
    return {
      id: `notification_${page}_${index}`, // Include page number in ID
      ...notification,
      timestamp: new Date(Date.now() - index * 60000).toLocaleString(), // Mock timestamps
      isRead: Math.random() > 0.3, // Randomly mark some as read
    };
  });
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Fetch notifications with pagination
  const fetchNotifications = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        setLoading(true);

        // Simulate API call with mock data
        const newNotifications = generateMockNotifications(10, pageNum);

        if (isRefresh) {
          setNotifications(newNotifications);
          setRefreshing(false);
        } else {
          setNotifications((prev) => [...prev, ...newNotifications]);
        }

        setPage(pageNum);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(1, true);
  }, [fetchNotifications]);

  // Pagination loader
  const loadMoreNotifications = useCallback(() => {
    if (!loading) {
      fetchNotifications(page + 1);
    }
  }, [fetchNotifications, page, loading]);

  // Initial load
  useEffect(() => {
    fetchNotifications(1);
  }, []);

  // Render individual notification item
  const renderNotificationItem = ({ item }) => {
    const IconComponent =
      NotificationIcons[item.type] || NotificationIcons.default;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          item.isRead && styles.readNotification,
        ]}
        onPress={() => {
          console.log("Notification tapped:", item);
        }}
      >
        <View style={styles.notificationIconContainer}>
          <IconComponent
            color={!item.isRead ? Colors.primary : Colors.textSecondary}
            size={24}
          />
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.notificationContentContainer}>
          <Text
            style={[styles.notificationTitle, item.isRead && styles.readText]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.notificationDescription,
              item.isRead && styles.readText,
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
          <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        onEndReached={loadMoreNotifications}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() =>
          loading ? (
            <View style={styles.loadingFooter}>
              <Text style={styles.loadingText}>Loading more...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <BellRing size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.almostBg,
  },
  headerTitle: {
    fontSize: 24,
    color: Colors.textPrimary,
    fontFamily: "Quicksand-Bold",
  },
  listContent: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.almostBg,
  },
  readNotification: {
    backgroundColor: Colors.almostBg,
  },
  notificationIconContainer: {
    marginRight: 12,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: Colors.error,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  notificationContentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
    fontFamily: "Quicksand-SemiBold",
  },
  notificationDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontFamily: "Quicksand",
  },
  notificationTimestamp: {
    fontSize: 12,
    color: Colors.grey,
    fontFamily: "Quicksand",
  },
  readText: {
    color: Colors.textSecondary,
    fontFamily: "Quicksand",
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadingText: {
    color: Colors.textSecondary,
    fontFamily: "Quicksand",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginTop: 16,
    fontFamily: "Quicksand",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
    fontFamily: "Quicksand",
  },
});

export default NotificationsScreen;
