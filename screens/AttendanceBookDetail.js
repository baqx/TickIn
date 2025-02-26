import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Card, Button, IconButton } from "react-native-paper";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import {
  FileText,
  Edit,
  Trash2,
  Download,
  PlusCircle,
  ChevronLeft,
} from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as SecureStore from "expo-secure-store";
import axios from "axios"; // Import Axios

// Import color palette from your styles
import { Colors } from "../styles/styles";
import Config from "../config/Config";

const {
  mainThemeColor,
  primary,
  primaryLight,
  textPrimary,
  textSecondary,
  white,
  accent,
  success,
  background,
} = Colors;

const AttendanceBookDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [bookDetails, setBookDetails] = useState(null);
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  useFocusEffect(
    React.useCallback(() => {
      fetchBookDetails(true);
    }, [route.params.bookId])
  );
  // Fetch book details and events
  const fetchBookDetails = async (resetPage = false) => {
    try {
      // Get user token from secure store
      const userToken = await SecureStore.getItemAsync("userToken");

      // Determine page to fetch
      const currentPage = resetPage ? 1 : page;

      // Show loading indicator
      if (!resetPage) setLoading(true);
      setRefreshing(resetPage);

      // Prepare request body
      const requestBody = {
        user_id: userToken,
        book_id: route.params.bookId,
        page: currentPage,
      };

      // Make API call using Axios
      const response = await axios.post(
        `${Config.BASE_URL}/book/book-details`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Config.PASS}`,
          },
        }
      );

      console.log("API Response:", response.data);

      // Check response status
      if (response.data.status === 1) {
        // Update book details
        setBookDetails(response.data.bookDetails);

        // Update events (reset or append)
        setEvents((prevEvents) =>
          currentPage === 1
            ? response.data.events
            : [...prevEvents, ...response.data.events]
        );

        // Update pagination
        setHasMore(response.data.pagination.hasMore);
        setPage(currentPage);
      } else {
        // Handle API-level error
        console.error("API Error:", response.data.message);
        Alert.alert(
          "Error",
          response.data.message || "Failed to fetch book details"
        );
      }
    } catch (error) {
      // Handle network or other errors
      if (axios.isAxiosError(error)) {
        // Axios-specific error handling
        console.error("Axios Error:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });

        Alert.alert(
          "Network Error",
          error.response?.data?.message ||
            "Failed to fetch book details. Please check your connection."
        );
      } else {
        // Handle other types of errors
        console.error("Unexpected Error:", error);
        Alert.alert("Error", "An unexpected error occurred");
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchBookDetails(true);
  }, [route.params.bookId]);

  // Download Excel functionality
  // Download Excel functionality
  const downloadExcel = async () => {
    try {
      // Make API call to generate Excel file
      const response = await axios.post(
        Config.BASE_URL + "/book/download-book",
        {
          book_id: bookDetails.book_id,
        },
        {
          headers: {
            Authorization: `Bearer ${Config.PASS}`,
          },
        }
      );

      // Check if Excel file generation was successful
      if (response.data.status === 1) {
        // Decode base64 file contents
        const fileContents = response.data.file;
        const fileName = response.data.filename;

        // Get the Downloads directory
        const downloadsDir = FileSystem.documentDirectory + "Download/";

        // Ensure the Downloads directory exists
        await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });

        // Create file URI using Expo FileSystem
        const fileUri = downloadsDir + fileName;

        // Write file contents to local storage
        await FileSystem.writeAsStringAsync(fileUri, fileContents, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log("File downloaded to:", fileUri);

        // Show success alert
        Alert.alert(
          "Success",
          "Excel file downloaded successfully to " + fileUri
        );

        // Open the file using Sharing
        await Sharing.shareAsync(fileUri);

        return fileUri;
      } else {
        // Show error alert if file generation failed
        Alert.alert(
          "Error",
          response.data.message || "Failed to generate Excel file"
        );
        return null;
      }
    } catch (error) {
      console.error("Download Excel Error:", error);
      Alert.alert("Error", "Failed to download Excel");
      return null;
    }
  };

  // Delete Book Confirmation
  const handleDeleteBook = async () => {
    Alert.alert(
      "Delete Attendance Book",
      "Are you sure you want to delete this attendance book? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Actual delete API call with Axios
              const userToken = await SecureStore.getItemAsync("userToken");
              const response = await axios.post(
                `${Config.BASE_URL}/book/delete-book`,
                {
                  user_id: userToken,
                  book_id: bookDetails.book_id,
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${Config.PASS}`,
                  },
                }
              );

              console.log("Delete Book Response:", response.data);

              if (response.data.status === 1) {
                navigation.replace("BottomNav");
              } else {
                throw new Error(
                  response.data.message || "Failed to delete book"
                );
              }
            } catch (error) {
              //console.error('Delete Book Error:', error);
              Alert.alert(
                "Error",
                axios.isAxiosError(error)
                  ? error.response?.data?.message
                  : "Failed to delete attendance book"
              );
            }
          },
        },
      ]
    );
  };

  // Render Event Item
  const renderEventItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("EventDetails", { bookColumnId: item.id })
      }
    >
      <Card style={styles.eventCard}>
        <View style={styles.eventCardContent}>
          <View style={styles.eventCardHeader}>
            <Text style={styles.eventNameText}>{item.name}</Text>
            <View style={styles.eventTypeContainer}>
              <Text
                style={[
                  styles.eventTypeText,
                  item.type === "physical"
                    ? styles.physicalEventType
                    : styles.onlineEventType,
                ]}
              >
                {item.type.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.eventCardDetails}>
            <View style={styles.eventDetailItem}>
              <Text style={styles.eventDetailLabel}>Short Code:</Text>
              <Text style={styles.eventDetailValue}>{item.short_code}</Text>
            </View>
            <View style={styles.eventDetailItem}>
              <Text style={styles.eventDetailLabel}>Attendances:</Text>
              <Text style={styles.eventDetailValue}>
                {item.attendance_count}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Load More Events
  const loadMoreEvents = () => {
    if (hasMore && !loading) {
      setPage((prevPage) => prevPage + 1);
      fetchBookDetails();
    }
  };

  // If book details are not loaded yet
  if (!bookDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadMoreText}>Loading book details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Book Details Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft color={Colors.textPrimary} size={24} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.bookNameText}>{bookDetails.name}</Text>
          <Text style={styles.bookDetailsText}>
            Total Students: {bookDetails.total_students}
          </Text>
        </View>
        <View style={styles.headerActionsContainer}>
          {/*   <IconButton
            icon={() => <Edit color={primary} size={24} />}
            onPress={() =>
              navigation.navigate("EditAttendanceBook", {
                bookId: bookDetails.book_id,
              })
            }
          /> */}
          <IconButton
            icon={() => <Trash2 color="red" size={24} />}
            onPress={handleDeleteBook}
          />
        </View>
      </View>

      {/* Actions Container */}
      <View style={styles.actionsContainer}>
        <Button
          mode="contained"
          onPress={() =>
            navigation.navigate("CreateEvent", { bookId: bookDetails.book_id })
          }
          style={styles.actionButton}
          icon={() => <PlusCircle color={white} size={20} />}
        >
          Create Event
        </Button>
        <Button
          mode="outlined"
          onPress={downloadExcel}
          style={styles.actionButton}
          icon={() => <Download color={primary} size={20} />}
        >
          Download Excel
        </Button>
      </View>

      {/* Events List */}
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.eventsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchBookDetails(true)}
            colors={[primary]}
            tintColor={primary}
          />
        }
        onEndReached={loadMoreEvents}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadMoreContainer}>
              <Text style={styles.loadMoreText}>Loading more events...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <FileText color={textSecondary} size={50} />
            <Text style={styles.emptyListText}>No events found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: background,
    padding: 15,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  bookNameText: {
    fontFamily: "Quicksand-Bold",
    fontSize: 22,
    color: textPrimary,
  },
  bookDetailsText: {
    fontFamily: "Quicksand-Medium",
    color: textSecondary,
  },
  headerActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  actionButton: {
    width: "48%",
  },
  eventsList: {
    paddingBottom: 20,
  },
  eventCard: {
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: Colors.cardBackground,
  },
  eventCardContent: {
    padding: 15,
  },
  eventCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  eventNameText: {
    fontFamily: "Quicksand-Bold",
    fontSize: 16,
    color: textPrimary,
  },
  eventTypeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  eventTypeText: {
    fontFamily: "Quicksand-Medium",
    fontSize: 12,
  },
  physicalEventType: {
    color: success,
    backgroundColor: `${success}20`,
  },
  onlineEventType: {
    color: accent,
    backgroundColor: `${accent}20`,
  },
  eventCardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eventDetailItem: {
    flexDirection: "column",
  },
  eventDetailLabel: {
    fontFamily: "Quicksand-Medium",
    color: textSecondary,
    fontSize: 12,
  },
  eventDetailValue: {
    fontFamily: "Quicksand-Bold",
    color: textPrimary,
  },
  emptyListContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyListText: {
    fontFamily: "Quicksand-Medium",
    color: textSecondary,
    marginTop: 10,
  },
  loadMoreContainer: {
    alignItems: "center",
    padding: 10,
  },
  loadMoreText: {
    fontFamily: "Quicksand-Medium",
    color: Colors.textPrimary,
  },
});

export default AttendanceBookDetailScreen;
