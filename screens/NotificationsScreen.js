import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from "react-native";
import {
  BellRing,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Calendar,
  MessageCircle,
} from "lucide-react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Colors } from "../styles/styles";
import Config from "../config/Config";
import { useNavigation } from "@react-navigation/native";

// Notification Type Icons
const NotificationIcons = {
  attendance: Calendar,
  success: CheckCircle,
  alert: AlertCircle,
  message: MessageCircle,
  academic: BookOpen,
  default: BellRing,
};

const NotificationsScreen = ({}) => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  const fetchUserToken = async () => {
    try {
      return await SecureStore.getItemAsync("userToken");
    } catch (error) {
      console.error("Error fetching user token:", error);
      Alert.alert("Error", "Unable to fetch user token.");
      return null;
    }
  };

  // Fetch notifications with pagination
  const fetchNotifications = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      if (loading) return; // Prevent multiple simultaneous requests

      try {
        setLoading(true);

        const userToken = await fetchUserToken();
        if (!userToken) return;

        const response = await axios.post(
          `${Config.BASE_URL}/user/notifications`,
          {
            user_id: userToken,
            page: pageNum,
            per_page: 10,
          },
          {
            headers: {
              Authorization: `Bearer ${Config.PASS}`,
            },
          }
        );

        if (response.data.status === 1) {
          const newNotifications = response.data.notifications.map(
            (notification) => ({
              id: notification.id,
              title: notification.title,
              description: notification.description,
              timestamp: new Date(notification.timestamp).toLocaleString(),
              type: notification.type,
              isRead: notification.is_read,
            })
          );

          if (isRefresh) {
            // When refreshing, replace entire list
            setNotifications(newNotifications);
          } else {
            // When loading more, append unique notifications
            setNotifications((prev) => {
              // Create a set of existing notification IDs to prevent duplicates
              const existingIds = new Set(prev.map((n) => n.id));
              const uniqueNewNotifications = newNotifications.filter(
                (notification) => !existingIds.has(notification.id)
              );
              return [...prev, ...uniqueNewNotifications];
            });
          }

          setPage(pageNum);
          setTotalPages(response.data.total_pages);

          // After notifications are loaded, mark as seen after a delay
          setTimeout(markAllAsSeen, 3000);
        } else {
          if (pageNum === 1) setNotifications([]); // No notifications
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        Alert.alert("Error", "Failed to load notifications. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loading]
  );

  // Mark all notifications as seen
  const markAllAsSeen = useCallback(async () => {
    try {
      const userToken = await fetchUserToken();
      if (!userToken) return;

      const response = await axios.post(
        `${Config.BASE_URL}/user/mark-read`,
        {
          user_id: userToken,
        },
        {
          headers: {
            Authorization: `Bearer ${Config.PASS}`,
          },
        }
      );

      if (response.data.status === 1) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, isRead: true }))
        );
      } else {
        console.error(
          "Failed to mark notifications as seen:",
          response.data.message
        );
      }
    } catch (error) {
      console.error("Error marking notifications as seen:", error);
    }
  }, []);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(1, true);
  }, [fetchNotifications]);

  // Pagination loader
  const loadMoreNotifications = useCallback(() => {
    // Check if we can load more pages and are not already loading
    if (page < totalPages && !loading) {
      fetchNotifications(page + 1);
    }
  }, [fetchNotifications, page, totalPages, loading]);

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchNotifications(1);
    };
    loadInitialData();
  }, [fetchNotifications]);

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
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          loading ? (
            <View style={styles.loadingFooter}>
              <Text style={styles.loadingText}></Text>
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
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Quicksand-Bold",
    color: Colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
    backgroundColor: Colors.background,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: Colors.almostBg,
  },
  readNotification: {
    backgroundColor: Colors.cardBackground,
  },
  notificationIconContainer: {
    marginRight: 15,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: Colors.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  notificationContentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: "Quicksand-Bold",
    marginBottom: 5,
    color: Colors.textPrimary,
  },
  notificationDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 5,
    fontFamily: "Quicksand",
  },
  readText: {
    color: Colors.textPrimary,
    fontFamily: "Quicksand-SemiBold",
  },
  notificationTimestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    color: Colors.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
    backgroundColor: Colors.background,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
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
    color: Colors.textPrimary,
    marginTop: 16,
    fontFamily: "Quicksand-SemiBold",
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
