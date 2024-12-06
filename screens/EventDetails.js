import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from "react-native";
import {
  Card,
  Button,
  IconButton,
  DataTable,
  Dialog,
  Portal,
} from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
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

// Import color palette from your styles
import { Colors } from "../styles/styles";

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

// Mock Event Details
const mockEventDetails = {
  id: "EVT001",
  name: "Computer Science Intro Lecture",
  shortCode: "123456",
  eventType: "physical",
  location: {
    name: "Main Lecture Hall A",
    latitude: 7.2906,
    longitude: 3.441,
  },
  timeCreated: "2024-02-15T10:00:00Z",
  timeRange: {
    start: "2024-02-15T10:00:00Z",
    end: "2024-02-15T12:00:00Z",
  },
  attendanceCount: 120,
  attendanceList: [
    {
      id: "ST001",
      fullName: "Adegbola Abdulbaqee",
      matricNo: "CSC/2022/001",
      faculty: "Physical Sciences",
      department: "Computer Science",
      timeMarked: "2024-02-15T10:05:23Z",
    },
    {
      id: "ST002",
      fullName: "John Doe",
      matricNo: "CSC/2022/002",
      faculty: "Physical Sciences",
      department: "Computer Science",
      timeMarked: "2024-02-15T10:07:45Z",
    },
    // More students...
  ],
};

const EventDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [eventDetails, setEventDetails] = useState(mockEventDetails);
  const [page, setPage] = useState(0);
  const [dialogVisible, setDialogVisible] = useState(false);
  const itemsPerPage = 5;

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
              // Actual delete API call here
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to delete event");
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
        "Full Name,Matric No,Faculty,Department,Time Marked",
        ...eventDetails.attendanceList.map(
          (student) =>
            `${student.fullName},${student.matricNo},${student.faculty},${student.department},${student.timeMarked}`
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
    const { latitude, longitude } = eventDetails.location;
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
      initialLocation: eventDetails.location,
      onLocationSelect: (newLocation) => {
        // Update location in backend
        setEventDetails((prev) => ({
          ...prev,
          location: newLocation,
        }));
      },
    });
  };

  // Pagination for Attendance List
  const from = page * itemsPerPage;
  const to = (page + 1) * itemsPerPage;

  return (
    <ScrollView style={styles.container}>
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
            <IconButton
              icon={() => <Edit color={primary} size={24} />}
              onPress={() =>
                navigation.navigate("EditEvent", { eventId: eventDetails.id })
              }
            />
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
                eventDetails.eventType === "physical"
                  ? styles.physicalEventType
                  : styles.onlineEventType,
              ]}
            >
              {eventDetails.eventType.toUpperCase()}
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
              {moment(eventDetails.timeRange.start).format("MMMM D, YYYY")}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Calendar color={textSecondary} size={20} />
            <Text style={styles.detailLabel}>
              {moment(eventDetails.timeRange.start).format("h:mm A")} -
              {moment(eventDetails.timeRange.end).format("h:mm A")}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Users color={textSecondary} size={20} />
            <Text style={styles.detailLabel}>
              {eventDetails.attendanceCount} Attendees
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin color={textSecondary} size={20} />
            <Text style={styles.detailLabel}>{eventDetails.location.name}</Text>
          </View>
        </View>

        {/* Short Code */}
        <View style={styles.shortCodeContainer}>
          <Text style={styles.shortCodeLabel}>Event Short Code</Text>
          <Text style={styles.shortCodeText}>{eventDetails.shortCode}</Text>
        </View>
      </Card>

      {/* Location Map */}
      <Card style={styles.mapCard}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: eventDetails.location.latitude,
            longitude: eventDetails.location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: eventDetails.location.latitude,
              longitude: eventDetails.location.longitude,
            }}
            title={eventDetails.location.name}
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
          <Button
            mode="contained"
            onPress={repickLocation}
            style={styles.mapActionButton}
          >
            Repick Location
          </Button>
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
      <Card style={styles.attendanceCard}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Name</DataTable.Title>
            <DataTable.Title>Matric No</DataTable.Title>
            <DataTable.Title>Time Marked</DataTable.Title>
          </DataTable.Header>

          {eventDetails.attendanceList.slice(from, to).map((student) => (
            <DataTable.Row key={student.id}>
              <DataTable.Cell>{student.fullName}</DataTable.Cell>
              <DataTable.Cell>{student.matricNo}</DataTable.Cell>
              <DataTable.Cell>
                {moment(student.timeMarked).format("h:mm A, MMM D")}
              </DataTable.Cell>
            </DataTable.Row>
          ))}

          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(
              eventDetails.attendanceList.length / itemsPerPage
            )}
            onPageChange={(page) => setPage(page)}
            label={`${from + 1}-${to} of ${eventDetails.attendanceList.length}`}
          />
        </DataTable>
      </Card>
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
  },
  map: {
    height: 250,
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
  },
});

export default EventDetailsScreen;
