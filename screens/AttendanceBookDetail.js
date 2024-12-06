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
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  FileText,
  Edit,
  Trash2,
  Download,
  PlusCircle,
  CheckCircle,
  ChevronLeft,
} from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// Import color palette from your styles
import { Colors } from "../styles/styles";
import { Ionicons } from "@expo/vector-icons";

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

// Mock data - replace with actual API calls
const mockBookDetails = {
  id: "AB001",
  name: "Computer Science 101 Attendance",
  totalStudents: 150,
  events: [
    {
      id: "EVT001",
      name: "Lecture 1",
      shortCode: "123456",
      type: "physical",
      attendanceCount: 120,
    },
    {
      id: "EVT002",
      name: "Online Tutorial",
      shortCode: "789012",
      type: "online",
      attendanceCount: 95,
    },
    // More events...
  ],
};

const AttendanceBookDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [bookDetails, setBookDetails] = useState(mockBookDetails);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState(mockBookDetails.events);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5; // Pagination threshold

  // Fetch book details (simulated)
  const fetchBookDetails = async () => {
    setRefreshing(true);
    try {
      // Simulate API call
      // const response = await fetchBookDetailsFromAPI(route.params.bookId);
      // setBookDetails(response);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      Alert.alert("Error", "Failed to refresh book details");
    }
    setRefreshing(false);
  };

  // Download Excel functionality
  const downloadExcel = async () => {
    try {
      // Simulate Excel generation
      const fileUri =
        FileSystem.documentDirectory + `${bookDetails.name}_attendance.xlsx`;

      // In a real app, generate actual Excel file
      await FileSystem.writeAsStringAsync(fileUri, "Simulated Excel Content");

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to download Excel");
    }
  };

  // Delete Book Confirmation
  const handleDeleteBook = () => {
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
              // Actual delete API call here
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to delete attendance book");
            }
          },
        },
      ]
    );
  };

  // Render Event Item
  const renderEventItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate("EventDetails")}>
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
              <Text style={styles.eventDetailValue}>{item.shortCode}</Text>
            </View>
            <View style={styles.eventDetailItem}>
              <Text style={styles.eventDetailLabel}>Attendances:</Text>
              <Text style={styles.eventDetailValue}>
                {item.attendanceCount}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Pagination Logic
  const paginatedEvents = events.slice(0, page * itemsPerPage);

  // Load More Events
  const loadMoreEvents = () => {
    if (page * itemsPerPage < events.length) {
      setPage(page + 1);
    }
  };

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
            Total Students: {bookDetails.totalStudents}
          </Text>
        </View>
        <View style={styles.headerActionsContainer}>
          <IconButton
            icon={() => <Edit color={primary} size={24} />}
            onPress={() =>
              navigation.navigate("EditAttendanceBook", {
                bookId: bookDetails.id,
              })
            }
          />
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
            navigation.navigate("CreateEvent", { bookId: bookDetails.id })
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
        data={paginatedEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.eventsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchBookDetails}
            colors={[primary]}
            tintColor={primary}
          />
        }
        onEndReached={loadMoreEvents}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          page * itemsPerPage < events.length ? (
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
    color: textSecondary,
  },
});

export default AttendanceBookDetailScreen;
