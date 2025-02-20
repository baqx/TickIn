import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  RefreshControl,
} from "react-native";
import {
  Card,
  Button,
  IconButton,
  DataTable,
  ActivityIndicator,
} from "react-native-paper";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  Edit,
  Trash2,
  Download,
  MapPin,
  Clock,
  Users,
  Calendar,
  ChevronLeft,
} from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import moment from "moment";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
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

// Configuration for API calls
const API_BASE_URL = Config.BASE_URL;
const ADMIN_PASS = Config.PASS; // Consider using a more secure method in production

const EventDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookColumnId } = route.params; // Assuming you pass bookColumnId when navigating

  const [eventDetails, setEventDetails] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const itemsPerPage = 5;

  // Fetch Event Details
  const fetchEventDetails = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/book/column-details`,
        {
          user_id: await SecureStore.getItemAsync("userToken"),
          book_column_id: bookColumnId,
        },
        {
          headers: {
            Authorization: `Bearer ${Config.PASS}`,
          },
        }
      );

      if (response.data.status === 1) {
        setEventDetails(response.data.columnDetails);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch event details"
        );
      }
    } catch (err) {
      setError(err.message);
      Alert.alert("Error", err.message);
    }
  };

  // Fetch Attendance List
  const fetchAttendanceList = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/book/attendance-list`,
        {
          book_column_id: bookColumnId,
        },
        {
          headers: {
            Authorization: `Bearer ${Config.PASS}`,
          },
        }
      );

      if (response.data.status === 1) {
        setAttendanceList(response.data.attendanceList);
      } else {
        //  console.log(response);
        throw new Error(
          response.data.message || "Failed to fetch attendance list"
        );
      }
    } catch (err) {
      // setError(err.message);
      //  Alert.alert("Error", err.message);
    }
  };

  // Combined refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchEventDetails(), fetchAttendanceList()]);
    } catch (err) {
      // Error handling is done in individual fetch functions
    } finally {
      setRefreshing(false);
    }
  }, [bookColumnId]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await onRefresh();
      setLoading(false);
    };
    loadData();
  }, [bookColumnId]);

  // Delete Event Confirmation
  const handleDeleteEvent = () => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event? This action cannot be undone.",
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
                `${Config.BASE_URL}/book/delete-column`,
                {
                  user_id: userToken,
                  book_column_id: bookColumnId,
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${Config.PASS}`,
                  },
                }
              );

              console.log("Delete Column Response:", response.data);

              if (response.data.status === 1) {
                navigation.goBack();
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

  // Download Attendance List
  const downloadAttendanceList = async () => {
    try {
      const fileUri =
        FileSystem.documentDirectory + `${eventDetails.name}_attendance.csv`;

      // Generate CSV content
      const csvContent = [
        "Name,Matric Number,Attendance Date",
        ...attendanceList.map(
          (student) =>
            `${student.user_name},${student.matric_number},${student.attendance_date}`
        ),
      ].join("\n");

      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to download attendance list");
    }
  };

  // Open Location in Maps
  const openLocationInMaps = () => {
    if (!eventDetails?.latitude || !eventDetails?.longitude) return;

    const { latitude, longitude } = eventDetails;
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
    });
    Linking.openURL(url);
  };

  // Repick Location
  const repickLocation = () => {
    // Navigate to location picker screen
    navigation.navigate("LocationPicker", {
      initialLocation: {
        latitude: eventDetails.latitude,
        longitude: eventDetails.longitude,
        name: eventDetails.location_name,
      },
      onLocationSelect: (newLocation) => {
        // Implement location update API call here
        // Update local state temporarily
        setEventDetails((prev) => ({
          ...prev,
          ...newLocation,
        }));
      },
    });
  };

  // Pagination for Attendance List
  const from = page * itemsPerPage;
  const to = (page + 1) * itemsPerPage;

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadMoreText}>Loading event details...</Text>
      </View>
    );
  }

  // Error state
  if (error || !eventDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || "Unable to load event details"}
        </Text>
        <Button mode="contained" onPress={onRefresh}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[primary]}
        />
      }
    >
      {/* Event Details Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTextContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft color={Colors.textPrimary} size={24} />
          </TouchableOpacity>
          <View style={styles.headerActionsContainer}>
            {/*  <IconButton
              icon={() => <Edit color={primary} size={24} />}
              onPress={() =>
                navigation.navigate("EditEvent", {
                  bookColumnId: eventDetails.id,
                })
              }
            />*/}
            <IconButton
              icon={() => <Trash2 color="red" size={24} />}
              onPress={handleDeleteEvent}
            />
          </View>
        </View>
      </View>
      <View style={styles.headerContainer}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.eventNameText}>{eventDetails.name}</Text>
          <View style={styles.eventTypeContainer}>
            <Text
              style={[
                styles.eventTypeText,
                eventDetails.event_type === "physical"
                  ? styles.physicalEventType
                  : styles.onlineEventType,
              ]}
            >
              {eventDetails.event_type.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Event Details Card */}
      <Card style={styles.detailsCard}>
        <View style={styles.detailsCardContent}>
          <View style={styles.detailItem}>
            <Clock color={textSecondary} size={20} />
            <Text style={styles.detailLabel}>
              {moment(eventDetails.date).format("MMMM D, YYYY")}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Calendar color={textSecondary} size={20} />
            <Text style={styles.detailLabel}>{eventDetails.time_range}</Text>
          </View>
          <View style={styles.detailItem}>
            <Users color={textSecondary} size={20} />
            <Text style={styles.detailLabel}>
              {eventDetails.attendance_count} Attendees
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin color={textSecondary} size={20} />
            <Text style={styles.detailLabel}>{eventDetails.location}</Text>
          </View>
        </View>

        {/* Short Code */}
        <View style={styles.shortCodeContainer}>
          <Text style={styles.shortCodeLabel}>Event Short Code</Text>
          <Text style={styles.shortCodeText}>{eventDetails.shortcode}</Text>
        </View>
      </Card>

      {/* Location Map */}
      <Card style={styles.mapCard}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: parseFloat(eventDetails.latitude),
            longitude: parseFloat(eventDetails.longitude),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          mapType="satellite"
        >
          <Marker
            coordinate={{
              latitude: parseFloat(eventDetails.latitude),
              longitude: parseFloat(eventDetails.longitude),
            }}
            title={eventDetails.location_name}
          />
        </MapView>
        <View style={styles.mapActions}>
          <Button
            mode="outlined"
            onPress={openLocationInMaps}
            style={styles.mapActionButton}
          >
            Open in Maps
          </Button>
          {/*   <Button
            mode="contained"
            onPress={repickLocation}
            style={styles.mapActionButton}
          >
            Repick Location
          </Button>*/}
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Button
          mode="contained"
          onPress={downloadAttendanceList}
          icon={() => <Download color={white} size={20} />}
          style={styles.actionButton}
        >
          Download Attendance
        </Button>
      </View>

      {/* Attendance List */}
      <DataTable style={styles.attendanceCard}>
        <DataTable.Header style={styles.dataTableHeader}>
          <DataTable.Title style={styles.dataTableTitle}>Name</DataTable.Title>
          <DataTable.Title style={styles.dataTableTitle}>
            Matric No
          </DataTable.Title>
          <DataTable.Title style={styles.dataTableTitle}>
            Time Marked
          </DataTable.Title>
        </DataTable.Header>

        {attendanceList.slice(from, to).map((student, index) => (
          <DataTable.Row key={index} style={styles.dataTableRow}>
            <DataTable.Cell style={styles.dataTableCell}>
              {student.user_name}
            </DataTable.Cell>
            <DataTable.Cell style={styles.dataTableCell}>
              {student.matric_number}
            </DataTable.Cell>
            <DataTable.Cell style={styles.dataTableCell}>
              {moment(student.attendance_date).format("h:mm A, MMM D")}
            </DataTable.Cell>
          </DataTable.Row>
        ))}

        <DataTable.Pagination
          page={page}
          numberOfPages={Math.ceil(attendanceList.length / itemsPerPage)}
          onPageChange={(page) => setPage(page)}
          label={`${from + 1}-${to} of ${attendanceList.length}`}
        />
      </DataTable>
    </ScrollView>
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
    backgroundColor: background,
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eventNameText: {
    fontFamily: "Quicksand-Bold",
    fontSize: 22,
    color: textPrimary,
  },
  headerActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventTypeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginLeft: 10,
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
  detailsCard: {
    marginBottom: 15,
    borderRadius: 10,
    padding: 15,
    backgroundColor: Colors.cardBackground,
  },
  detailsCardContent: {
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  detailLabel: {
    fontFamily: "Quicksand-Medium",
    marginLeft: 10,
    color: textPrimary,
  },
  shortCodeContainer: {
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: `${textSecondary}20`,
  },
  shortCodeLabel: {
    fontFamily: "Quicksand-Medium",
    color: textSecondary,
    marginBottom: 5,
  },
  shortCodeText: {
    fontFamily: "Quicksand-Bold",
    fontSize: 18,
    color: primary,
  },
  mapCard: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: Colors.cardBackground,
  },
  map: {
    height: 300,
    width: "100%",
  },
  mapActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  mapActionButton: {
    width: "48%",
  },
  actionsContainer: {
    marginBottom: 15,
  },
  actionButton: {
    width: "100%",
  },
  attendanceCard: {
    marginBottom: 15,
    borderRadius: 10,
    color: Colors.cardBackground,
  },
  loadMoreContainer: {
    alignItems: "center",
    padding: 10,
    justifyContent: "center",
    backgroundColor: Colors.background,
    flex: 1,
  },
  loadMoreText: {
    fontFamily: "Quicksand-Medium",
    color: textSecondary,
  },

  //data table
  dataTableHeader: {
    backgroundColor: Colors.primary, // Header background color
  },
  dataTableTitle: {
    color: Colors.white, // Header text color
    fontFamily: "Quicksand-Bold", // Font style for header
  },
  dataTableRow: {
    backgroundColor: Colors.cardBackground, // Row background color
  },
  dataTableCell: {
    paddingVertical: 10, // Vertical padding for cells
    paddingHorizontal: 5, // Horizontal padding for cells
    borderBottomWidth: 1, // Add border to separate rows
    borderBottomColor: Colors.textSecondary, // Border color
  },
});

export default EventDetailsScreen;
