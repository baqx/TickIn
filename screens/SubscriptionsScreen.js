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
import { Snackbar } from "react-native-paper";
import { Book, ChevronLeft, Trash2 } from "lucide-react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Colors } from "../styles/styles";
import Config from "../config/Config";
import { useNavigation } from "@react-navigation/native";

const SubscriptionsScreen = () => {
  const navigation = useNavigation();
  const [subscriptions, setSubscriptions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const fetchUserToken = async () => {
    try {
      return await SecureStore.getItemAsync("userToken");
    } catch (error) {
      console.error("Error fetching user token:", error);
      Alert.alert("Error", "Unable to fetch user token.");
      return null;
    }
  };

  // Fetch subscriptions with pagination
  const fetchSubscriptions = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      if (loading) return;

      try {
        setLoading(true);

        const userToken = await fetchUserToken();
        if (!userToken) return;

        const response = await axios.post(
          `${Config.BASE_URL}/user/subscriptions`,
          {
            user_id: userToken,
            page: pageNum,
            per_page: 10,
            action: "list_subscriptions",
          },
          {
            headers: {
              Authorization: `Bearer ${Config.PASS}`,
            },
          }
        );
        console.log(response);
        if (response.data.status === 1) {
          const newSubscriptions = response.data.subscriptions.map(
            (subscription) => ({
              id: subscription.id,
              book_name: subscription.book_name,
              subscription_date: new Date(
                subscription.subscription_date
              ).toLocaleDateString(),
            })
          );

          if (isRefresh) {
            // When refreshing, replace entire list
            setSubscriptions(newSubscriptions);
          } else {
            // When loading more, append unique subscriptions
            setSubscriptions((prev) => {
              const existingIds = new Set(prev.map((s) => s.id));
              const uniqueNewSubscriptions = newSubscriptions.filter(
                (subscription) => !existingIds.has(subscription.id)
              );
              return [...prev, ...uniqueNewSubscriptions];
            });
          }

          setPage(pageNum);
          setTotalPages(response.data.total_pages);
        } else {
          if (pageNum === 1) setSubscriptions([]);
        }
      } catch (error) {
        console.error("Failed to fetch subscriptions:", error);
        Alert.alert("Error", "Failed to load subscriptions. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loading]
  );

  // Delete subscription
  const deleteSubscription = async (subscriptionId) => {
    try {
      const userToken = await fetchUserToken();
      if (!userToken) return;

      const response = await axios.post(
        `${Config.BASE_URL}/user/subscriptions`,
        {
          action: "delete_subscription",
          subscription_id: subscriptionId,
        },
        {
          headers: {
            Authorization: `Bearer ${Config.PASS}`,
          },
        }
      );

      if (response.data.status === 1) {
        // Remove the deleted subscription from the list
        setSubscriptions((prev) =>
          prev.filter((subscription) => subscription.id !== subscriptionId)
        );

        // Show success snackbar
        setSnackbarMessage("Subscription deleted successfully");
        setSnackbarVisible(true);
      } else {
        // Show error alert
        Alert.alert(
          "Error",
          response.data.message || "Failed to delete subscription"
        );
      }
    } catch (error) {
      console.error("Error deleting subscription:", error);
      Alert.alert("Error", "Failed to delete subscription. Please try again.");
    }
  };

  // Confirm deletion with an alert
  const confirmDeleteSubscription = (subscriptionId, bookName) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete the subscription for "${bookName}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteSubscription(subscriptionId),
        },
      ]
    );
  };

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSubscriptions(1, true);
  }, [fetchSubscriptions]);

  // Pagination loader
  const loadMoreSubscriptions = useCallback(() => {
    // Check if we can load more pages and are not already loading
    if (page < totalPages && !loading && subscriptions.length > 0) {
      fetchSubscriptions(page + 1);
    }
  }, [fetchSubscriptions, page, totalPages, loading, subscriptions.length]);
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchSubscriptions(1);
    };
    loadInitialData();
  }, [fetchSubscriptions]);

  // Render individual subscription item
  const renderSubscriptionItem = ({ item }) => {
    return (
      <View style={styles.subscriptionItem}>
        <View style={styles.subscriptionIconContainer}>
          <Book color={Colors.primary} size={24} />
        </View>
        <View style={styles.subscriptionContentContainer}>
          <Text style={styles.subscriptionTitle} numberOfLines={1}>
            {item.book_name}
          </Text>
          <Text style={styles.subscriptionDate}>
            Subscribed on {item.subscription_date}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDeleteSubscription(item.id, item.book_name)}
        >
          <Trash2 color={Colors.error} size={20} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft color={Colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subscriptions</Text>
      </View>

      <FlatList
        data={subscriptions}
        renderItem={renderSubscriptionItem}
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
        onEndReached={loadMoreSubscriptions}
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
            <Book size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Subscriptions</Text>
            <Text style={styles.emptySubtitle}>
              You haven't subscribed to any attendance book yet. Start
              exploring!
            </Text>
          </View>
        )}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: "Dismiss",
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontFamily: "Quicksand-SemiBold",
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  subscriptionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionIconContainer: {
    marginRight: 15,
  },
  subscriptionContentContainer: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontFamily: "Quicksand-SemiBold",
    marginBottom: 5,
    color: Colors.textPrimary,
  },
  subscriptionDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Quicksand",
  },
  deleteButton: {
    padding: 10,
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

export default SubscriptionsScreen;
